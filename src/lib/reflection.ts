/**
 * Reflection after a session.
 *
 * Cognitive apprenticeship (Collins, Brown and Newman, 1989) ends in
 * reflection: the learner compares their own performance with what happened
 * and with how an expert would have done it. The paper cites that framing, and
 * until now the platform observed everything and asked the student nothing.
 * Oleson et al. (CHI 2020) report the matching difficulty directly, "how do I
 * interpret this feedback" (SYNTH), alongside "how can I avoid biasing my
 * design" (BIAS).
 *
 * Two design choices follow from that literature rather than from taste.
 *
 * The questions are fixed, not configurable. A course comparing cohorts needs
 * the same prompt everywhere, and a student cannot answer a question away by
 * editing the template.
 *
 * The prompt is grounded in what the session recorded. Memory of a session is
 * reconstructive, and a student asked "did you lead the participant?" from
 * memory mostly answers no. Shown the tasks that failed, the tasks where the
 * participant hesitated, and what a teammate noted while watching, they
 * reflect on evidence instead.
 */

import type { ObserverNote, TaskResult } from "@/types";

export interface ReflectionPrompt {
  key: "surprised" | "protocol_change" | "may_have_led";
  question: string;
  /** Shown under the question: what a useful answer looks like. */
  guidance: string;
}

export const REFLECTION_PROMPTS: readonly ReflectionPrompt[] = [
  {
    key: "surprised",
    question: "What happened that you did not expect?",
    guidance:
      "Name a moment, not a mood. Which task, and what did the participant do that you had not predicted when you wrote it?",
  },
  {
    key: "protocol_change",
    question: "What would you change in the protocol before the next session?",
    guidance:
      "A task's wording, its success criterion, its order, or a question. Say what the change would fix.",
  },
  {
    key: "may_have_led",
    question: "What did you say or do that may have led the participant?",
    guidance:
      "Hints, confirmations, a glance at the right button, reading a label aloud. If you think nothing, check the moments listed beside this.",
  },
] as const;

export type ReflectionAnswers = Record<ReflectionPrompt["key"], string>;

/** Below this many characters an answer is a placeholder, not a reflection. */
export const MIN_ANSWER_LENGTH = 20;

export function reflectionComplete(a: Partial<ReflectionAnswers>): boolean {
  return REFLECTION_PROMPTS.every(
    (p) => (a[p.key] ?? "").trim().length >= MIN_ANSWER_LENGTH,
  );
}

export interface TaskMoment {
  taskId: string;
  taskName: string;
  reason: string;
}

export interface ReflectionEvidence {
  /** Tasks worth looking back at, most notable first. */
  moments: TaskMoment[];
  /** What other people wrote while watching, excluding the reflecting user. */
  peerNotes: ObserverNote[];
  /** True when nothing notable was recorded, which is itself worth saying. */
  quiet: boolean;
}

/**
 * Pick out what a reflecting student should look at. Deliberately a short
 * list: a wall of every task is read as "everything was fine".
 */
export function reflectionEvidence(input: {
  results: readonly Pick<
    TaskResult,
    | "task_id"
    | "completion_status"
    | "time_seconds"
    | "error_count"
    | "hesitation_count"
    | "seq_rating"
  >[];
  tasks: readonly { id: string; name: string; optimal_time_seconds: number | null; is_practice?: boolean }[];
  notes: readonly ObserverNote[];
  viewerId: string | undefined;
}): ReflectionEvidence {
  const taskById = new Map(input.tasks.map((t) => [t.id, t]));
  const scored: (TaskMoment & { weight: number })[] = [];

  for (const r of input.results) {
    const task = taskById.get(r.task_id);
    if (!task || task.is_practice) continue;
    const reasons: string[] = [];
    let weight = 0;

    if (r.completion_status === "failure") {
      reasons.push("not completed");
      weight += 3;
    } else if (r.completion_status === "partial") {
      reasons.push("only partly completed");
      weight += 2;
    } else if (r.completion_status === "skipped") {
      reasons.push("skipped");
      weight += 2;
    }

    if (r.hesitation_count > 0) {
      reasons.push(
        `${r.hesitation_count} ${r.hesitation_count === 1 ? "hesitation" : "hesitations"}`,
      );
      weight += Math.min(r.hesitation_count, 3);
    }

    if (r.error_count > 0) {
      reasons.push(`${r.error_count} ${r.error_count === 1 ? "error" : "errors"}`);
      weight += Math.min(r.error_count, 3);
    }

    if (
      task.optimal_time_seconds &&
      r.time_seconds !== null &&
      r.time_seconds >= task.optimal_time_seconds * 2
    ) {
      const ratio = Math.round((r.time_seconds / task.optimal_time_seconds) * 10) / 10;
      reasons.push(`${ratio} times the expected time`);
      weight += 1;
    }

    // Easy rating on a task that went badly is the classic sign of a
    // participant being polite to the moderator.
    if (
      r.seq_rating !== null &&
      r.seq_rating >= 6 &&
      (r.completion_status === "failure" || r.completion_status === "partial")
    ) {
      reasons.push(`rated easy (${r.seq_rating} of 7) despite the outcome`);
      weight += 2;
    }

    if (reasons.length > 0) {
      scored.push({
        taskId: r.task_id,
        taskName: task.name,
        reason: reasons.join(", "),
        weight,
      });
    }
  }

  const moments = scored
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 5)
    .map(({ weight: _w, ...m }) => m);

  const peerNotes = input.notes.filter((n) => n.author_id !== input.viewerId);

  return { moments, peerNotes, quiet: moments.length === 0 && peerNotes.length === 0 };
}
