// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FilterChips } from "../FilterChips";

const OPTIONS = [
  { id: "all", label: "All" },
  { id: "cognitive", label: "Thinking" },
  { id: "motor", label: "Moving" },
] as const;

describe("FilterChips", () => {
  afterEach(cleanup);

  it("renders group label and reflects single selection state", async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();

    render(
      <FilterChips
        label="Kind of play"
        ariaLabel="Kind of play"
        options={OPTIONS}
        selected="cognitive"
        onToggle={onToggle}
      />
    );

    expect(screen.getByText("Kind of play")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Thinking" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("button", { name: "All" }).getAttribute("aria-pressed")).toBe("false");

    await user.click(screen.getByRole("button", { name: "Moving" }));
    expect(onToggle).toHaveBeenCalledWith("motor");
  });

  it("supports multiple active selections", () => {
    render(
      <FilterChips
        ariaLabel="Quick filters"
        options={OPTIONS}
        selected={["cognitive", "motor"]}
        multiple
        onToggle={vi.fn()}
      />
    );

    expect(screen.getByRole("button", { name: "Thinking" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("button", { name: "Moving" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("button", { name: "All" }).getAttribute("aria-pressed")).toBe("false");
  });
});
