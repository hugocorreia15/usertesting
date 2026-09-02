import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

// The Help page is behind auth, so the embed is verified here instead of in a
// browser. Only the "is it configured" flag is faked; the URL building is real.
vi.mock("@/lib/tutorial-video", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/lib/tutorial-video")>();
  actual.TUTORIAL_VIDEO.source = "https://youtu.be/dQw4w9WgXcQ";
  return { ...actual, hasTutorialVideo: true };
});

import { HelpVideo } from "../help-video";

// This project has no vitest setup file, so testing-library's automatic
// cleanup does not run and renders would stack up across tests.
afterEach(cleanup);

const iframe = () => document.querySelector("iframe");

describe("HelpVideo", () => {
  it("embeds the configured video on the no-cookie host", () => {
    render(<HelpVideo />);
    expect(iframe()?.getAttribute("src")).toContain(
      "youtube-nocookie.com/embed/dQw4w9WgXcQ",
    );
    expect(iframe()?.getAttribute("src")).not.toContain("start=");
  });

  it("offers a jump link per chapter", () => {
    render(<HelpVideo />);
    expect(screen.getByRole("button", { name: "Templates" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Organizations" })).toBeTruthy();
  });

  it("re-points the player when a chapter is picked", () => {
    render(<HelpVideo />);
    fireEvent.click(screen.getByRole("button", { name: "Results" }));
    expect(iframe()?.getAttribute("src")).toContain("start=187");
  });

  it("links out to the canonical watch page", () => {
    render(<HelpVideo />);
    const link = screen.getByRole("link", { name: /Watch on YouTube/ });
    expect(link.getAttribute("href")).toBe(
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    );
  });
});
