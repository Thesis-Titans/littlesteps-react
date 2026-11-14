// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as aiApi from "./api";
import { PlayAssistantDrawer } from "./PlayAssistantDrawer";
import type { ChatResponse } from "./types";

vi.mock("../../services/firebase", () => ({ auth: {} }));

const mockChatSuccess: ChatResponse = {
  reply: "You can make an exciting peek-a-boo tunnel using the cardboard box!",
  suggestedActivity: {
    title: "Cardboard Peek Tunnel",
    domain: "cognitive",
    durationMinutes: 10,
    instructions: "Open both ends of the box to create a mini tunnel. Roll a soft ball through for your toddler.",
    materials: ["Cardboard box", "Soft ball"],
    safetyNotice: "Ensure there are no sharp staples or tape on the box edges.",
  },
  provenance: {
    tier: 1,
    source: "gemini-2.0-flash",
    badge: "Suggested by AI",
    disclaimer: "Observational play suggestion only. Not developmental assessment.",
  },
};

describe("PlayAssistantDrawer", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
  });

  afterEach(cleanup);

  it("renders the closed drawer header with title and expand button", () => {
    render(<PlayAssistantDrawer ageBand="12-23m" childNickname="Maya" />);

    expect(screen.getByRole("heading", { name: /Play Assistant/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Ask for a play adaptation/i })).toBeTruthy();
    expect(screen.queryByRole("log")).toBeNull();
  });

  it("expands and collapses when toggle button is clicked", async () => {
    const user = userEvent.setup();
    render(<PlayAssistantDrawer ageBand="12-23m" childNickname="Maya" />);

    const toggleBtn = screen.getByRole("button", { name: /Ask for a play adaptation/i });
    await user.click(toggleBtn);

    expect(screen.getByRole("button", { name: /Hide conversation/i })).toBeTruthy();
    expect(screen.getByRole("log")).toBeTruthy();
    expect(screen.getByText(/Hello! I'm your LittleSteps Play Companion/i)).toBeTruthy();
    expect(screen.getByText(/Observational play suggestions only/i)).toBeTruthy();

    await user.click(screen.getByRole("button", { name: /Hide conversation/i }));
    expect(screen.queryByRole("log")).toBeNull();
  });

  it("sends chat message when a prompt starter is clicked and displays reply", async () => {
    const user = userEvent.setup();
    const chatSpy = vi.spyOn(aiApi, "sendAiChat").mockResolvedValueOnce(mockChatSuccess);

    render(<PlayAssistantDrawer ageBand="12-23m" childNickname="Maya" />);
    await user.click(screen.getByRole("button", { name: /Ask for a play adaptation/i }));

    const starterBtn = screen.getByRole("button", {
      name: /What can we play with an empty cardboard box\?/i,
    });
    await user.click(starterBtn);

    expect(chatSpy).toHaveBeenCalledWith({
      message: "What can we play with an empty cardboard box?",
      ageBand: "12-23m",
      childNickname: "Maya",
    });

    await waitFor(() => {
      expect(screen.getByText("You can make an exciting peek-a-boo tunnel using the cardboard box!")).toBeTruthy();
      expect(screen.getByText("Cardboard Peek Tunnel")).toBeTruthy();
    });
  });

  it("allows entering a custom query and calls onPlan when 'Add to today's plan' is clicked", async () => {
    const user = userEvent.setup();
    const onPlanMock = vi.fn();
    vi.spyOn(aiApi, "sendAiChat").mockResolvedValueOnce(mockChatSuccess);

    render(
      <PlayAssistantDrawer
        ageBand="12-23m"
        childNickname="Maya"
        onPlan={onPlanMock}
      />
    );
    await user.click(screen.getByRole("button", { name: /Ask for a play adaptation/i }));

    const input = screen.getByPlaceholderText(/Ask for a play idea with Maya/i);
    await user.type(input, "Indoor game with cups");
    await user.click(screen.getByRole("button", { name: /Send/i }));

    await waitFor(() => {
      expect(screen.getByText("Cardboard Peek Tunnel")).toBeTruthy();
    });

    const addPlanBtn = screen.getByRole("button", { name: /Add to today's plan/i });
    await user.click(addPlanBtn);

    expect(onPlanMock).toHaveBeenCalledTimes(1);
    const plannedActivity = onPlanMock.mock.calls[0][0];
    expect(plannedActivity.title).toBe("Cardboard Peek Tunnel");
    expect(plannedActivity.domain).toBe("cognitive");
    expect(plannedActivity.durationMinutes).toBe(10);
    expect(plannedActivity.provenanceSource).toBe("Suggested by LittleSteps Play Assistant");
  });

  it("displays friendly error message when AI request fails", async () => {
    const user = userEvent.setup();
    vi.spyOn(aiApi, "sendAiChat").mockRejectedValueOnce(new Error("Network disconnected"));

    render(<PlayAssistantDrawer ageBand="12-23m" childNickname="Maya" />);
    await user.click(screen.getByRole("button", { name: /Ask for a play adaptation/i }));

    const starterBtn = screen.getByRole("button", {
      name: /10-minute quiet indoor play ideas/i,
    });
    await user.click(starterBtn);

    await waitFor(() => {
      expect(screen.getByText(/I couldn't reach the assistant right now/i)).toBeTruthy();
    });
  });

  it("strictly enforces child privacy by sending zero child PII", async () => {
    const user = userEvent.setup();
    const chatSpy = vi.spyOn(aiApi, "sendAiChat").mockResolvedValueOnce(mockChatSuccess);

    render(<PlayAssistantDrawer ageBand="24-35m" childNickname="Leo" />);
    await user.click(screen.getByRole("button", { name: /Ask for a play adaptation/i }));

    const input = screen.getByPlaceholderText(/Ask for a play idea with Leo/i);
    await user.type(input, "Balancing games");
    await user.click(screen.getByRole("button", { name: /Send/i }));

    expect(chatSpy).toHaveBeenCalledWith({
      message: "Balancing games",
      ageBand: "24-35m",
      childNickname: "Leo",
    });

    // Verify no childId, surname, birthdate, or journal content in payload
    const calledPayload = chatSpy.mock.calls[0][0] as unknown as Record<string, unknown>;
    expect(calledPayload).not.toHaveProperty("childId");
    expect(calledPayload).not.toHaveProperty("surname");
    expect(calledPayload).not.toHaveProperty("birthDate");
    expect(calledPayload).not.toHaveProperty("journal");
  });

  it("uses default fallback placeholder when childNickname is omitted", async () => {
    const user = userEvent.setup();
    render(<PlayAssistantDrawer ageBand="12-23m" />);
    await user.click(screen.getByRole("button", { name: /Ask for a play adaptation/i }));

    expect(screen.getByPlaceholderText(/Ask for a play idea with your child/i)).toBeTruthy();
  });
});
