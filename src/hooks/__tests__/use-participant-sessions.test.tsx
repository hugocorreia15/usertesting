import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

const upsert = vi.fn();

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: () => ({ upsert }),
    channel: () => ({ on: () => ({ on: () => ({ subscribe: () => ({}) }) }) }),
    removeChannel: () => {},
  },
}));

import { useSubmitParticipantAnswers } from "../use-participant-sessions";

afterEach(() => {
  cleanup();
  upsert.mockReset();
});

const wrapper = ({ children }: { children: ReactNode }) => {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
};

const answers = [
  { question_id: "q1", answer_text: "one" },
  { question_id: "q2", rating_value: 4 },
  { question_id: "q3", selected_options: ["a", "b"] },
  { question_id: "q4", media_url: "u/s/t/q4.webm" },
  { question_id: "q5", answer_text: "five" },
];

describe("useSubmitParticipantAnswers", () => {
  it("writes a whole task in one request, not one per question", async () => {
    // Five sequential round trips on a phone was the delay participants hit,
    // and each write also woke the realtime subscription.
    upsert.mockResolvedValue({ error: null });
    const { result } = renderHook(() => useSubmitParticipantAnswers(), {
      wrapper,
    });

    await result.current.mutateAsync({ task_result_id: "tr1", answers });

    expect(upsert).toHaveBeenCalledTimes(1);
    const [rows, options] = upsert.mock.calls[0];
    expect(rows).toHaveLength(5);
    expect(options).toEqual({ onConflict: "task_result_id,question_id" });
  });

  it("sends every column for every question, nulling what was left blank", async () => {
    upsert.mockResolvedValue({ error: null });
    const { result } = renderHook(() => useSubmitParticipantAnswers(), {
      wrapper,
    });

    await result.current.mutateAsync({ task_result_id: "tr1", answers });

    const rows = upsert.mock.calls[0][0] as Record<string, unknown>[];
    expect(rows[0]).toEqual({
      task_result_id: "tr1",
      question_id: "q1",
      answer_text: "one",
      selected_options: null,
      rating_value: null,
      media_url: null,
    });
    expect(rows[1].rating_value).toBe(4);
    expect(rows[2].selected_options).toEqual(["a", "b"]);
    expect(rows[3].media_url).toBe("u/s/t/q4.webm");
  });

  it("rejects when the write fails, so the caller can tell the participant", async () => {
    // The rejection used to be unhandled: the form sat there and the button
    // appeared to do nothing.
    upsert.mockResolvedValue({ error: new Error("permission denied") });
    const { result } = renderHook(() => useSubmitParticipantAnswers(), {
      wrapper,
    });

    await expect(
      result.current.mutateAsync({ task_result_id: "tr1", answers }),
    ).rejects.toThrow("permission denied");
  });

  it("retries once before giving up on a dropped request", async () => {
    upsert
      .mockResolvedValueOnce({ error: new Error("network") })
      .mockResolvedValueOnce({ error: null });
    const { result } = renderHook(() => useSubmitParticipantAnswers(), {
      wrapper,
    });

    // The hook's own retry: 1 wins over the wrapper's default, so a single
    // dropped request recovers instead of surfacing as a dead button.
    await result.current.mutateAsync({ task_result_id: "tr1", answers });

    await waitFor(() => expect(upsert).toHaveBeenCalledTimes(2));
  });
});
