import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { RemoveWithAnswers } from "../remove-with-answers";

// No setup file in this project, so cleanup is explicit.
afterEach(cleanup);

const removeButton = () => screen.getByRole("button", { name: /remove/i });

describe("removing something nothing has been recorded against", () => {
  it("removes immediately, without asking", () => {
    const onRemove = vi.fn();
    render(<RemoveWithAnswers label="How easy was it?" noun="answer" count={0} onRemove={onRemove} />);

    fireEvent.click(removeButton());
    expect(onRemove).toHaveBeenCalledTimes(1);
    // Asking about nothing trains people to dismiss the dialog that matters.
    expect(screen.queryByText(/cannot be recovered/i)).toBeNull();
  });
});

describe("removing something participants have answered", () => {
  it("does not remove on the first click", () => {
    const onRemove = vi.fn();
    render(<RemoveWithAnswers label="How easy was it?" noun="answer" count={7} onRemove={onRemove} />);

    fireEvent.click(removeButton());
    expect(onRemove).not.toHaveBeenCalled();
  });

  it("says how many records it would destroy, and names them", () => {
    render(<RemoveWithAnswers label="How easy was it?" noun="answer" count={7} onRemove={vi.fn()} />);
    fireEvent.click(removeButton());

    expect(screen.getByText(/Delete 7 answers\?/)).toBeTruthy();
    expect(screen.getByText(/"How easy was it\?" already has 7 answers/)).toBeTruthy();
    expect(screen.getByText(/cannot be recovered/)).toBeTruthy();
    // The way out that keeps the data.
    expect(screen.getByText(/stop using it instead/)).toBeTruthy();
  });

  it("removes once confirmed", () => {
    const onRemove = vi.fn();
    render(<RemoveWithAnswers label="How easy was it?" noun="answer" count={7} onRemove={onRemove} />);

    fireEvent.click(removeButton());
    fireEvent.click(screen.getByRole("button", { name: /remove and delete 7 answers/i }));
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it("counts one record without writing 1 answers", () => {
    render(<RemoveWithAnswers label="Q" noun="answer" count={1} onRemove={vi.fn()} />);
    fireEvent.click(removeButton());
    expect(screen.getByText(/Delete 1 answer\?/)).toBeTruthy();
    expect(screen.getByText(/that record/)).toBeTruthy();
  });

  it("uses the noun it was given, so an error log does not read as an answer", () => {
    render(<RemoveWithAnswers label="Wrong button" noun="logged error" count={3} onRemove={vi.fn()} />);
    fireEvent.click(removeButton());
    expect(screen.getByText(/Delete 3 logged errors\?/)).toBeTruthy();
  });

  it("says something sensible when the item has no label yet", () => {
    render(<RemoveWithAnswers label="   " noun="answer" count={2} onRemove={vi.fn()} />);
    fireEvent.click(removeButton());
    expect(screen.getByText(/this item already has 2 answers/)).toBeTruthy();
  });
});
