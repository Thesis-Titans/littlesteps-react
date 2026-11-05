// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, UnauthorizedError } from "../../services/api";
import * as api from "./api";
import { IdeaHelper } from "./components/IdeaHelper";
import type { RecommendationResponse } from "./types";

vi.mock("../../services/firebase", () => ({ auth: {} }));

const aiSuccessResponse: RecommendationResponse = {
  suggestions: [
    {
      activityId: "act-stack-cups",
      title: "Stack the cups",
      whyPicked: "Matches Maya's age band and the cups you have at home.",
      activity: {
        id: "act-stack-cups",
        title: "Stack the cups",
        type: "activity",
        language: "en",
        setting: "indoor",
        ageBand: "12-23m",
        domain: "cognitive",
        durationMinutes: 15,
        durationEstimate: "10–15 mins",
        materials: ["plastic cups", "wooden spoons"],
        instructions: [
          "Set two or three sturdy plastic cups on the floor.",
          "Show how one cup sits inside another or stacks on top.",
          "Let your toddler explore knocking the tower down and rebuilding.",
        ],
        provenanceSource: "Source: early learning guide · still being checked",
        status: "reviewed_approved",
        limitations: "Observational play prompt only. Not developmental assessment.",
      },
    },
  ],
  source: "ai",
  tier: 1,
  provenance: {
    badge: "Suggested by AI",
    label: null,
    disclaimer: "Observational play suggestion only. Not developmental assessment.",
    guidance: "You know your child best. Change it as you like, and stay close while you play.",
    model: "gemini-2.0-flash",
    reviewed: true,
  },
};

describe("IdeaHelper DOM tests", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(cleanup);

  it("renders the initial question form in strict sentence case", () => {
    render(<IdeaHelper ageBand="12-23m" childNickname="Maya" />);

    expect(screen.getByRole("heading", { name: "Idea helper" })).toBeTruthy();
    expect(screen.getByText("How much time do you have?")).toBeTruthy();
    expect(screen.getByLabelText("Where will you play?")).toBeTruthy();
    expect(screen.getByLabelText("Kind of play")).toBeTruthy();
    expect(screen.getByLabelText("What do you have at home?")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Find ideas" })).toBeTruthy();
  });

  it("shows loading state when submitting request", async () => {
    const user = userEvent.setup();
    let resolvePromise: (value: RecommendationResponse) => void;
    const pendingPromise = new Promise<RecommendationResponse>((resolve) => {
      resolvePromise = resolve;
    });

    vi.spyOn(api, "getAiRecommendations").mockReturnValue(pendingPromise);

    render(<IdeaHelper ageBand="12-23m" childNickname="Maya" />);

    const submitBtn = screen.getByRole("button", { name: "Find ideas" });
    await user.click(submitBtn);

    expect(
      screen.getByText("Finding ideas for Maya… This usually takes a few seconds.")
    ).toBeTruthy();

    // Resolve promise to clean up
    resolvePromise!(aiSuccessResponse);
  });

  it("renders AI recommendation with mandatory AI badge, disclaimer, and guidance", async () => {
    const user = userEvent.setup();
    vi.spyOn(api, "getAiRecommendations").mockResolvedValue(aiSuccessResponse);

    render(<IdeaHelper ageBand="12-23m" childNickname="Maya" />);

    await user.click(screen.getByRole("button", { name: "Find ideas" }));

    await waitFor(() => {
      expect(screen.getByText("Stack the cups")).toBeTruthy();
    });

    // Mandatory AI badge (NFR-AI-04)
    expect(screen.getByText("Suggested by AI")).toBeTruthy();

    // Why picked explanation
    expect(
      screen.getByText(/Matches Maya's age band and the cups you have at home/)
    ).toBeTruthy();

    // Instructions
    expect(
      screen.getByText("Set two or three sturdy plastic cups on the floor.")
    ).toBeTruthy();

    // Non-diagnostic disclaimer
    expect(
      screen.getByText(
        "Observational play suggestion only. Not developmental assessment."
      )
    ).toBeTruthy();

    // Tier 1 guidance
    expect(
      screen.getByText(
        "You know your child best. Change it as you like, and stay close while you play."
      )
    ).toBeTruthy();
  });

  it("handles 429 rate limit with calm notice and deterministic fallback picks with NO AI badge", async () => {
    const user = userEvent.setup();
    vi.spyOn(api, "getAiRecommendations").mockRejectedValue(
      new ApiError(429, "RATE_LIMITED", "Too many requests.")
    );

    render(<IdeaHelper ageBand="12-23m" childNickname="Maya" />);

    await user.click(screen.getByRole("button", { name: "Find ideas" }));

    await waitFor(() => {
      expect(
        screen.getByText(
          "Let's take a short break. You've asked for many ideas in a row. Please wait a minute, then try again."
        )
      ).toBeTruthy();
    });

    // Fallback picks are displayed
    expect(screen.getByText("Stack the cups")).toBeTruthy();

    // MUST NOT have AI badge on fallback picks
    expect(screen.queryByText("Suggested by AI")).toBeNull();

    // Must still have non-diagnostic disclaimer
    expect(
      screen.getByText(
        "Observational play suggestion only. Not developmental assessment."
      )
    ).toBeTruthy();
  });

  it("handles server or network failure with calm fallback notice and NO AI badge", async () => {
    const user = userEvent.setup();
    vi.spyOn(api, "getAiRecommendations").mockRejectedValue(
      new ApiError(500, "INTERNAL_ERROR", "Internal server error")
    );

    render(<IdeaHelper ageBand="12-23m" childNickname="Maya" />);

    await user.click(screen.getByRole("button", { name: "Find ideas" }));

    await waitFor(() => {
      expect(
        screen.getByText(
          "The idea helper isn't working right now. Here are a few favorites for Maya's age from our activity list."
        )
      ).toBeTruthy();
    });

    // Fallback activity picks displayed
    expect(screen.getByText("Stack the cups")).toBeTruthy();

    // MUST NOT have AI badge on fallback picks
    expect(screen.queryByText("Suggested by AI")).toBeNull();

    // Non-diagnostic disclaimer
    expect(
      screen.getByText(
        "Observational play suggestion only. Not developmental assessment."
      )
    ).toBeTruthy();
  });

  it("allows switching back to form with Change answers", async () => {
    const user = userEvent.setup();
    vi.spyOn(api, "getAiRecommendations").mockResolvedValue(aiSuccessResponse);

    render(<IdeaHelper ageBand="12-23m" childNickname="Maya" />);

    await user.click(screen.getByRole("button", { name: "Find ideas" }));

    await waitFor(() => {
      expect(screen.getByText("Stack the cups")).toBeTruthy();
    });

    const changeBtn = screen.getByRole("button", { name: "Change answers" });
    await user.click(changeBtn);

    expect(screen.getByRole("button", { name: "Find ideas" })).toBeTruthy();
  });

  it("shows Please sign in again to continue with no Retry when unauthorized", async () => {
    const user = userEvent.setup();
    vi.spyOn(api, "getAiRecommendations").mockRejectedValue(new UnauthorizedError());

    render(<IdeaHelper ageBand="12-23m" childNickname="Maya" />);
    await user.click(screen.getByRole("button", { name: "Find ideas" }));

    expect(await screen.findByText("Please sign in again to continue")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Retry" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Another idea" })).toBeNull();
  });

  it("strictly enforces zero AI buzzwords across UI text and fallbacks", async () => {
    const user = userEvent.setup();
    vi.spyOn(api, "getAiRecommendations").mockResolvedValue(aiSuccessResponse);

    const { container } = render(<IdeaHelper ageBand="12-23m" childNickname="Maya" />);
    await user.click(screen.getByRole("button", { name: "Find ideas" }));

    await waitFor(() => {
      expect(screen.getByText("Stack the cups")).toBeTruthy();
    });

    const renderedText = container.textContent?.toLowerCase() ?? "";
    const bannedBuzzwords = ["delve", "supercharge", "seamless", "smart", "magic"];
    for (const word of bannedBuzzwords) {
      expect(renderedText.includes(word)).toBe(false);
    }
  });
});
