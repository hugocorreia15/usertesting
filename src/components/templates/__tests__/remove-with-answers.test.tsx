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
    expect(screen.queryByText(/Remove it from the protocol\?/)).toBeNull();
  });
});

describe("removing something participants have answered", () => {
  it("does not remove on the first click", () => {
    const onRemove = vi.fn();
    render(<RemoveWithAnswers label="How easy was it?" noun="answer" count={7} onRemove={onRemove} />);

    fireEvent.click(removeButton());
    expect(onRemove).not.toHaveBeenCalled();
  });

  it("names it, counts what it holds, and says the answers are kept", () => {
    render(<RemoveWithAnswers label="How easy was it?" noun="answer" count={7} onRemove={vi.fn()} />);
    fireEvent.click(removeButton());

    expect(screen.getByText(/Remove it from the protocol\?/)).toBeTruthy();
    expect(screen.getByText(/"How easy was it\?" has 7 answers/)).toBeTruthy();
    // The point of archiving: nothing is destroyed.
    expect(screen.getByText(/Those answers are kept/)).toBeTruthy();
    expect(screen.getByText(/reports and exports still include them/)).toBeTruthy();
    expect(screen.queryByText(/cannot be recovered/)).toBeNull();
  });

  it("removes once confirmed", () => {
    const onRemove = vi.fn();
    render(<RemoveWithAnswers label="How easy was it?" noun="answer" count={7} onRemove={onRemove} />);

    fireEvent.click(removeButton());
    fireEvent.click(screen.getByRole("button", { name: /remove from the protocol/i }));
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it("counts one record without writing 1 answers", () => {
    render(<RemoveWithAnswers label="Q" noun="answer" count={1} onRemove={vi.fn()} />);
    fireEvent.click(removeButton());
    expect(screen.getByText(/has 1 answer recorded/)).toBeTruthy();
    expect(screen.getByText(/That answer is kept/)).toBeTruthy();
  });

  it("uses the noun it was given, so an error log does not read as an answer", () => {
    render(<RemoveWithAnswers label="Wrong button" noun="logged error" count={3} onRemove={vi.fn()} />);
    fireEvent.click(removeButton());
    expect(screen.getByText(/has 3 logged errors/)).toBeTruthy();
  });

  it("says something sensible when the item has no label yet", () => {
    render(<RemoveWithAnswers label="   " noun="answer" count={2} onRemove={vi.fn()} />);
    fireEvent.click(removeButton());
    expect(screen.getByText(/this item has 2 answers/)).toBeTruthy();
  });
});
