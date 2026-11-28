// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SegmentedTabs } from "../SegmentedTabs";

const TABS = [
  { id: "activities", label: "Activities" },
  { id: "books", label: "Storybooks" },
  { id: "shelf", label: "Our Bookshelf", count: 3 },
] as const;

describe("SegmentedTabs", () => {
  afterEach(cleanup);

  it("marks active tab selected and displays optional item count", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <SegmentedTabs
        ariaLabel="Explore sections"
        tabs={TABS}
        activeId="activities"
        onChange={onChange}
      />
    );

    expect(screen.getByRole("tab", { name: "Activities" }).getAttribute("aria-selected")).toBe("true");
    expect(screen.getByRole("tab", { name: "Our Bookshelf (3)" }).getAttribute("aria-selected")).toBe("false");

    await user.click(screen.getByRole("tab", { name: "Storybooks" }));
    expect(onChange).toHaveBeenCalledWith("books");
  });
});
