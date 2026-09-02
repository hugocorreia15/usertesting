import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { TemplateForm } from "../template-form";

// No vitest setup file in this project, so cleanup is explicit.
afterEach(cleanup);

// jsdom has no ResizeObserver; Radix measures its checkbox indicator with one.
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof ResizeObserver;

const renderForm = (onSubmit = vi.fn().mockResolvedValue(undefined)) => {
  render(<TemplateForm onSubmit={onSubmit} submitLabel="Save Template" />);
  return onSubmit;
};

// Radix tabs activate on focus and pointer events, not on a bare click, so a
// plain fireEvent.click leaves the panel unchanged in jsdom.
const selectTab = (name: RegExp | string) => {
  const trigger = screen.getByRole("tab", { name });
  fireEvent.focus(trigger);
  fireEvent.mouseDown(trigger);
  fireEvent.click(trigger);
  return trigger;
};

describe("TemplateForm sections", () => {
  it("opens on Basics with the other sections closed", () => {
    renderForm();
    expect(screen.getByLabelText("Template Name")).toBeTruthy();
    // "Error Types" is also a tab label, so identify the panel by its control.
    expect(screen.queryByRole("button", { name: /Add Error Type/i })).toBeNull();
  });

  it("shows one section at a time", () => {
    renderForm();
    selectTab(/Error Types/);
    expect(screen.queryByLabelText("Template Name")).toBeNull();
    expect(screen.getByRole("button", { name: /Add Error Type/i })).toBeTruthy();
  });

  it("keeps edits when moving between sections", () => {
    // The whole point of splitting the form: switching sections unmounts the
    // previous one, so the values have to live above it.
    renderForm();
    fireEvent.change(screen.getByLabelText("Template Name"), {
      target: { value: "Checkout study" },
    });

    selectTab(/Tasks/);
    selectTab(/Basics/);

    expect(
      (screen.getByLabelText("Template Name") as HTMLInputElement).value,
    ).toBe("Checkout study");
  });

  it("reports unsaved changes once something is edited", () => {
    renderForm();
    expect(screen.getByText("All changes saved")).toBeTruthy();

    fireEvent.change(screen.getByLabelText("Template Name"), {
      target: { value: "Checkout study" },
    });

    expect(screen.getByText("Unsaved changes")).toBeTruthy();
  });

  it("returns to Basics when saving without a name", () => {
    // The required field is on Basics, which may not be the open section.
    const onSubmit = renderForm();
    selectTab(/Error Types/);
    expect(screen.queryByLabelText("Template Name")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Save Template" }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Template Name")).toBeTruthy();
  });

  it("submits the whole form, not just the open section", async () => {
    const onSubmit = renderForm();
    fireEvent.change(screen.getByLabelText("Template Name"), {
      target: { value: "Checkout study" },
    });
    selectTab(/Questionnaires/);
    fireEvent.click(screen.getByRole("button", { name: "Save Template" }));

    await vi.waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][0]).toMatchObject({ name: "Checkout study" });
  });
});
