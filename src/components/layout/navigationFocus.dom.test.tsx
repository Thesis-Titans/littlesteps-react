// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Link, MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";
import { useFocusHeadingOnNavigate } from "./useFocusHeadingOnNavigate";

function Shell({ title }: { title: string }) {
  useFocusHeadingOnNavigate();
  return (
    <>
      <nav><Link to="/today">Today</Link> <Link to="/explore">Explore</Link></nav>
      <main><h1 tabIndex={-1}>{title}</h1></main>
    </>
  );
}

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/today" element={<Shell title="Today" />} />
        <Route path="/explore" element={<Shell title="Explore" />} />
      </Routes>
    </MemoryRouter>
  );

afterEach(cleanup);

describe("focus after navigation (WCAG 2.4.3, 4.1.3)", () => {
  it("leaves focus alone on first load", () => {
    renderAt("/today");
    expect(document.activeElement).toBe(document.body);
  });

  it("moves focus to the new screen's heading after a navigation", async () => {
    const user = userEvent.setup();
    renderAt("/today");
    await user.click(screen.getByRole("link", { name: "Explore" }));
    expect(document.activeElement).toBe(screen.getByRole("heading", { level: 1, name: "Explore" }));
  });
});
