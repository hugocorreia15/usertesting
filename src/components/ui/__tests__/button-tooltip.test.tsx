import { beforeAll, describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { Trash2 } from "lucide-react";
import { Button } from "../button";
import { TooltipProvider } from "../tooltip";

// jsdom has no ResizeObserver; the tooltip's positioning uses one.
beforeAll(() => {
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});

const renderWithProvider = (ui: React.ReactElement) =>
  render(<TooltipProvider>{ui}</TooltipProvider>);

describe("Button tooltip", () => {
  it("renders a plain button when no tooltip is given", () => {
    const { container } = render(<Button>Save</Button>);
    expect(container.firstElementChild?.tagName).toBe("BUTTON");
    expect(screen.getByRole("button").hasAttribute("aria-label")).toBe(false);
  });

  it("names an icon-only button after its tooltip", () => {
    renderWithProvider(
      <Button size="icon" tooltip="Delete session">
        <Trash2 />
      </Button>,
    );
    expect(screen.getByRole("button", { name: "Delete session" })).toBeTruthy();
  });

  it("keeps an explicit aria-label over the tooltip", () => {
    renderWithProvider(
      <Button size="icon" tooltip="Delete note" aria-label="Delete this observer note">
        <Trash2 />
      </Button>,
    );
    expect(
      screen.getByRole("button", { name: "Delete this observer note" }),
    ).toBeTruthy();
  });

  it("does not replace the visible label of a labelled button", () => {
    renderWithProvider(
      <Button tooltip="Remove this participant's identity from all their sessions">
        Anonymize
      </Button>,
    );
    expect(screen.getByRole("button", { name: "Anonymize" })).toBeTruthy();
  });

  it("shows the tooltip on keyboard focus", async () => {
    renderWithProvider(<Button tooltip="Watch this session live">Observe</Button>);
    fireEvent.focus(screen.getByRole("button", { name: "Observe" }));
    expect((await screen.findByRole("tooltip")).textContent).toContain(
      "Watch this session live",
    );
  });

  it("can still explain a disabled button", async () => {
    renderWithProvider(
      <Button disabled tooltip="Add at least one finding first">
        Submit my pass
      </Button>,
    );
    const button = screen.getByRole("button", { name: "Submit my pass" });
    expect((button as HTMLButtonElement).disabled).toBe(true);
    // The disabled button gets no pointer events, so a focusable wrapper
    // carries the tooltip instead.
    const wrapper = button.parentElement!;
    expect(wrapper.tagName).toBe("SPAN");
    expect(wrapper.getAttribute("tabindex")).toBe("0");
    fireEvent.focus(wrapper);
    expect((await screen.findByRole("tooltip")).textContent).toContain(
      "Add at least one finding first",
    );
  });

  it("does not crash outside a TooltipProvider", async () => {
    // Radix throws without a provider; the wrapper supplies one.
    render(
      <Button size="icon" tooltip="Remove this option">
        <Trash2 />
      </Button>,
    );
    const button = screen.getByRole("button", { name: "Remove this option" });
    fireEvent.focus(button);
    expect((await screen.findByRole("tooltip")).textContent).toContain(
      "Remove this option",
    );
  });
});
