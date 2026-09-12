import { describe, expect, it } from "vitest";
import {
  leadingSignals,
  leadingTerms,
  reviewTemplate,
  summarizeReview,
} from "../protocol-review";
import type { TemplateTask, TemplateWithRelations } from "@/types";

let seq = 0;
const task = (over: Partial<TemplateTask> = {}): TemplateTask => ({
  id: `t${++seq}`,
  template_id: "tpl",
  group_id: null,
  sort_order: seq,
  name: "Find yesterday's energy usage",
  description: "Done when the daily total for yesterday is on screen.",
  optimal_time_seconds: 45,
  optimal_actions: 3,
  is_practice: false,
  created_at: "",
  from_problem_id: null,
  ...over,
});

const template = (over: Partial<TemplateWithRelations> = {}): TemplateWithRelations =>
  ({
    id: "tpl",
    name: "Panel",
    description: null,
    user_id: "u",
    is_public: false,
    instruments: ["sus"],
    task_groups: [],
    template_tasks: [task(), task(), task()],
    template_error_types: [{ id: "e1", template_id: "tpl", code: "E1", label: "Nav", created_at: "" }],
    template_questions: [],
    template_participant_fields: [],
    ...over,
  }) as TemplateWithRelations;

const ids = (t: TemplateWithRelations) => reviewTemplate(t).map((f) => f.id);

describe("a well-formed template", () => {
  it("passes clean", () => {
    expect(ids(template())).toEqual([]);
  });
});

describe("leadingTerms", () => {
  it("flags interface nouns and procedural verbs", () => {
    expect(leadingTerms({ name: "Click the Settings tab", description: null }))
      .toEqual(expect.arrayContaining(["click", "tab"]));
  });

  it("flags quoted labels", () => {
    expect(leadingTerms({ name: "Open the 'Cloud Studies' page", description: null }))
      .toContain('"Cloud Studies"');
  });

  it("leaves goal-oriented wording alone", () => {
    // "open", "select", "choose" are ordinary goal verbs and are not flagged.
    expect(leadingTerms({ name: "Select a study to work on", description: "Open yesterday's recording." }))
      .toEqual([]);
  });

  it("separates procedure from mere mention", () => {
    // A hardware study legitimately says "panel"; only the verb makes it a walkthrough.
    expect(leadingSignals({ name: "Wake up the panel", description: null }))
      .toEqual({ strong: [], weak: ["panel"] });
    expect(leadingSignals({ name: "Tap the panel to wake it", description: null }).strong)
      .toEqual(["tap"]);
  });

  it("matches whole words only", () => {
    expect(leadingTerms({ name: "Establish a link between two recordings", description: null }))
      .toContain("link");
    expect(leadingTerms({ name: "Set the tablet up", description: null })).toEqual([]);
  });
});

describe("reviewTemplate", () => {
  it("stops at 'no tasks' rather than piling on", () => {
    expect(ids(template({ template_tasks: [] }))).toEqual(["no-tasks"]);
  });

  it("counts only measured tasks when judging study size", () => {
    const t = template({
      template_tasks: [task({ is_practice: true }), task(), task()],
    });
    expect(ids(t)).toContain("few-tasks");
  });

  it("names the tasks that lead the participant", () => {
    const t = template({
      template_tasks: [
        task({ name: "Tap the Export button" }),
        task(),
        task(),
      ],
    });
    const f = reviewTemplate(t).find((x) => x.id === "leading-task");
    expect(f?.severity).toBe("warn");
    expect(f?.taskIds).toHaveLength(1);
    expect(f?.detail).toContain("Tap the Export button");
    expect(f?.detail).toMatch(/tap|button/);
  });

  it("downgrades noun-only mentions to a note", () => {
    const t = template({
      template_tasks: [task({ name: "Wake up the panel" }), task(), task()],
    });
    const found = reviewTemplate(t);
    expect(found.map((f) => f.id)).toContain("interface-nouns");
    expect(found.map((f) => f.id)).not.toContain("leading-task");
    expect(found.find((f) => f.id === "interface-nouns")?.severity).toBe("info");
  });

  it("treats an empty description as a missing success criterion", () => {
    const t = template({
      template_tasks: [task({ description: "   " }), task(), task()],
    });
    expect(ids(t)).toContain("no-success-criterion");
  });

  it("does not require a criterion of a practice task", () => {
    const t = template({
      template_tasks: [task({ is_practice: true, description: null }), task(), task(), task()],
    });
    expect(ids(t)).not.toContain("no-success-criterion");
  });

  it("accepts either baseline as an optimal path", () => {
    const onlyTime = template({
      template_tasks: [task({ optimal_actions: null }), task(), task()],
    });
    const neither = template({
      template_tasks: [task({ optimal_actions: null, optimal_time_seconds: null }), task(), task()],
    });
    expect(ids(onlyTime)).not.toContain("no-baseline");
    expect(ids(neither)).toContain("no-baseline");
  });

  it("flags a missing error taxonomy as a warning", () => {
    const f = reviewTemplate(template({ template_error_types: [] })).find(
      (x) => x.id === "no-error-taxonomy",
    );
    expect(f?.severity).toBe("warn");
  });

  it("suggests a practice task once there is something to warm up for", () => {
    expect(ids(template())).not.toContain("no-practice-task");
    const four = template({ template_tasks: [task(), task(), task(), task()] });
    expect(ids(four)).toContain("no-practice-task");
    expect(ids(template({ template_tasks: [task(), task()] }))).not.toContain("no-practice-task");
  });

  it("notes when no questionnaire is administered", () => {
    expect(ids(template({ instruments: [] }))).toContain("no-instrument");
  });

  it("advises counterbalancing from four measured tasks", () => {
    expect(ids(template())).not.toContain("counterbalance");
    const four = template({ template_tasks: [task(), task(), task(), task()] });
    const f = reviewTemplate(four).find((x) => x.id === "counterbalance");
    expect(f?.severity).toBe("info");
    expect(f?.help).toBe("sessions");
  });

  it("flags long task text", () => {
    const long = Array(70).fill("word").join(" ");
    const t = template({ template_tasks: [task({ description: long }), task(), task()] });
    expect(ids(t)).toContain("long-task-text");
  });

  it("suggests groups for a long flat task list", () => {
    const six = template({ template_tasks: Array.from({ length: 6 }, () => task()) });
    expect(ids(six)).toContain("no-groups");
    const grouped = template({
      template_tasks: Array.from({ length: 6 }, () => task()),
      task_groups: [{ id: "g", template_id: "tpl", name: "Setup", sort_order: 0, created_at: "" }],
    });
    expect(ids(grouped)).not.toContain("no-groups");
  });

  it("links every finding to a help anchor and explains why", () => {
    const messy = template({
      template_tasks: [task({ name: "Click the menu", description: null, optimal_actions: null, optimal_time_seconds: null })],
      template_error_types: [],
      instruments: [],
    });
    for (const f of reviewTemplate(messy)) {
      expect(f.why.length).toBeGreaterThan(40);
      expect(["templates", "sessions", "live", "analytics"]).toContain(f.help);
    }
  });
});

describe("summarizeReview", () => {
  it("splits warnings from notes", () => {
    const messy = template({ template_error_types: [], instruments: [] });
    expect(summarizeReview(reviewTemplate(messy))).toEqual({ warnings: 1, notes: 1 });
  });
});
