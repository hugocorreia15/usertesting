/**
 * Fictional demo data for help screenshots. Every name, study and finding here
 * is invented. None of it exists in any database.
 *
 * One class, one study, seen by different people:
 *   Ana Silva      instructor, owner of the organization
 *   Bruno Costa    student who owns the study and moderated session S1
 *   Carla Mendes   student who observed S1 and co-rated it
 *   Diogo Rocha, Eva Martins   students who joined the inspection
 *
 * Where the real app would hide rows from the viewer, the fixtures leave them
 * out, so a screenshot never shows something row-level security would refuse.
 * Bruno's unsubmitted pass in inspection I2 is stored without anyone else's
 * findings, and his reflection on S1 without anyone else's draft.
 */

import type {
  HeuristicSet,
  Heuristic,
  Inspection,
  InspectionEvaluator,
  InspectionFinding,
  InspectionProblem,
  ObserverNote,
  OrganizationWithRelations,
  ProblemEvidence,
  Participant,
  RaterScore,
  SessionReflection,
  TaskResultWithRelations,
  TemplateMember,
  TemplateWithRelations,
  TestSessionWithRelations,
} from "@/types";

const T0 = "2026-09-08T09:00:00Z";
const at = (hours: number) =>
  new Date(Date.parse(T0) + hours * 3600_000).toISOString();

export const USERS = {
  ana: { id: "u-ana", email: "ana.silva@example.edu", first_name: "Ana", last_name: "Silva" },
  bruno: { id: "u-bruno", email: "bruno.costa@example.edu", first_name: "Bruno", last_name: "Costa" },
  carla: { id: "u-carla", email: "carla.mendes@example.edu", first_name: "Carla", last_name: "Mendes" },
  diogo: { id: "u-diogo", email: "diogo.rocha@example.edu", first_name: "Diogo", last_name: "Rocha" },
  eva: { id: "u-eva", email: "eva.martins@example.edu", first_name: "Eva", last_name: "Martins" },
} as const;

export function userFor(as: string | null) {
  const u = USERS[(as as keyof typeof USERS) ?? "ana"] ?? USERS.ana;
  return {
    id: u.id,
    email: u.email,
    aud: "authenticated",
    role: "authenticated",
    created_at: T0,
    app_metadata: {},
    user_metadata: { first_name: u.first_name, last_name: u.last_name },
  };
}

// ── organization ──────────────────────────────────────────────

const ORG_ID = "org-hci";
const organizations: OrganizationWithRelations[] = [
  {
    id: ORG_ID,
    name: "HCI 2026 · Class A",
    created_by: USERS.ana.id,
    default_review_mode: "required",
    default_consent_text: null,
    default_instruments: ["sus"],
    created_at: T0,
    organization_invites: [],
    organization_members: [
      { org_id: ORG_ID, user_id: USERS.ana.id, role: "owner", member_email: USERS.ana.email, created_at: T0 },
      { org_id: ORG_ID, user_id: USERS.bruno.id, role: "student", member_email: USERS.bruno.email, created_at: T0 },
      { org_id: ORG_ID, user_id: USERS.carla.id, role: "student", member_email: USERS.carla.email, created_at: T0 },
      { org_id: ORG_ID, user_id: USERS.diogo.id, role: "student", member_email: USERS.diogo.email, created_at: T0 },
      { org_id: ORG_ID, user_id: USERS.eva.id, role: "student", member_email: USERS.eva.email, created_at: T0 },
    ],
  },
];

// ── the study ─────────────────────────────────────────────────

const TPL = "tpl-thermo";
const tasks = [
  { id: "k1", name: "Set the living room to 21 °C", optimal_time_seconds: 25, optimal_actions: 3, description: "Done when the living room shows 21 °C as its target." },
  { id: "k2", name: "Create a weekday heating schedule", optimal_time_seconds: 60, optimal_actions: 8, description: "Done when a Monday to Friday schedule is saved." },
  { id: "k3", name: "Turn on away mode", optimal_time_seconds: 20, optimal_actions: 2, description: "Done when the home is shown as away." },
  { id: "k4", name: "Find last week's energy use", optimal_time_seconds: 30, optimal_actions: 4, description: "Done when last week's total is on screen." },
  { id: "k5", name: "Delete the weekend schedule", optimal_time_seconds: 20, optimal_actions: 3, description: "Done when only the weekday schedule remains." },
].map((t, i) => ({
  ...t,
  template_id: TPL,
  group_id: null,
  sort_order: i,
  is_practice: false,
  created_at: T0,
  from_problem_id: i === 1 ? "p1" : null,
  task_questions: [
    {
      id: `q-${t.id}`,
      task_id: t.id,
      sort_order: 0,
      question_text: "How confident are you that you finished the task?",
      question_type: "rating" as const,
      options: null,
      rating_min: 1,
      rating_max: 5,
      created_at: T0,
    },
  ],
}));

const template: TemplateWithRelations = {
  id: TPL,
  name: "SmartHome thermostat app",
  description: "Moderated test of the heating schedule and away mode flows, iteration 1.",
  user_id: USERS.bruno.id,
  org_id: ORG_ID,
  org_group_id: "grp-delta",
  repo_url: null,
  is_public: false,
  instruments: ["sus"],
  review_mode: "required",
  review_status: "submitted",
  review_note: null,
  review_submitted_at: at(30),
  reviewed_at: null,
  reviewed_by: null,
  approval_invalidated_at: null,
  consent_text:
    "This study records how you use a thermostat app. No video of your face is taken. You can stop at any time.",
  require_inspection: true,
  created_at: T0,
  updated_at: at(30),
  task_groups: [],
  template_tasks: tasks,
  template_error_types: [
    { id: "et1", template_id: TPL, code: "WB", label: "Wrong button", created_at: T0 },
    { id: "et2", template_id: TPL, code: "NAV", label: "Lost in navigation", created_at: T0 },
    { id: "et3", template_id: TPL, code: "MIS", label: "Misread a label", created_at: T0 },
  ],
  template_questions: [
    { id: "iq1", template_id: TPL, sort_order: 0, question_text: "What was the hardest part?", created_at: T0 },
    { id: "iq2", template_id: TPL, sort_order: 1, question_text: "What did you expect away mode to do?", created_at: T0 },
  ],
  template_participant_fields: [],
  template_codes: [],
};

const templateMembers: TemplateMember[] = [
  { template_id: TPL, user_id: USERS.bruno.id, created_at: T0 },
  { template_id: TPL, user_id: USERS.carla.id, created_at: T0 },
];

// ── session S1 ────────────────────────────────────────────────

const participant: Participant = {
  id: "part-1",
  name: "Rita Fernandes",
  email: "rita.f@example.com",
  age: 34,
  gender: "Female",
  occupation: "Architect",
  tech_proficiency: "medium",
  notes: "Owns a different smart thermostat.",
  user_id: USERS.bruno.id,
  auth_user_id: null,
  is_anonymous: false,
  created_at: at(40),
};

const outcomes: {
  status: "success" | "partial" | "failure";
  time: number;
  actions: number;
  errors: number;
  hesitations: number;
  seq: number;
}[] = [
  { status: "success", time: 22, actions: 3, errors: 0, hesitations: 0, seq: 7 },
  { status: "failure", time: 151, actions: 17, errors: 3, hesitations: 2, seq: 3 },
  { status: "partial", time: 48, actions: 6, errors: 1, hesitations: 1, seq: 7 },
  { status: "success", time: 35, actions: 5, errors: 0, hesitations: 0, seq: 6 },
  { status: "success", time: 29, actions: 4, errors: 1, hesitations: 0, seq: 5 },
];

const taskResults: TaskResultWithRelations[] = tasks.map((t, i) => {
  const o = outcomes[i];
  const trId = `tr${i + 1}`;
  return {
    id: trId,
    session_id: "s1",
    task_id: t.id,
    completion_status: o.status,
    time_seconds: o.time,
    action_count: o.actions,
    error_count: o.errors,
    hesitation_count: o.hesitations,
    seq_rating: o.seq,
    sort_order: i,
    notes: null,
    created_at: at(41),
    template_tasks: t,
    error_logs: Array.from({ length: o.errors }, (_, e) => ({
      id: `${trId}-e${e}`,
      task_result_id: trId,
      error_type_id: e % 2 ? "et2" : "et1",
      timestamp_seconds: 12 + e * 20,
      description: null,
      created_at: at(41),
    })),
    hesitation_logs: Array.from({ length: o.hesitations }, (_, h) => ({
      id: `${trId}-h${h}`,
      task_result_id: trId,
      timestamp_seconds: 30 + h * 25,
      note: h === 0 ? "Scrolled up and down the schedule screen" : null,
      created_at: at(41),
    })),
    task_question_answers: [
      {
        id: `${trId}-a`,
        task_result_id: trId,
        question_id: `q-${t.id}`,
        answer_text: null,
        selected_options: null,
        rating_value: o.status === "success" ? 5 : 3,
        media_url: null,
        created_at: at(41),
      },
    ],
  };
});

const session: TestSessionWithRelations = {
  id: "s1",
  template_id: TPL,
  participant_id: participant.id,
  evaluator_name: "Bruno Costa",
  status: "completed",
  started_at: at(41),
  completed_at: at(41.8),
  notes: null,
  user_id: USERS.bruno.id,
  org_id: ORG_ID,
  join_code: null,
  current_task_index: 4,
  task_order_strategy: "latin_square",
  is_pilot: true,
  consent_accepted_at: at(40.9),
  consent_method: "join_form",
  created_at: at(40),
  templates: template,
  participants: participant,
  task_results: taskResults,
  interview_answers: [
    { id: "ia1", session_id: "s1", question_id: "iq1", answer_text: "Saving the schedule. I never knew if it had worked.", created_at: at(41.8) },
    { id: "ia2", session_id: "s1", question_id: "iq2", answer_text: "Turn the heating down while I'm out, not off.", created_at: at(41.8) },
  ],
  sus_answers: [4, 2, 4, 2, 3, 3, 4, 2, 3, 3].map((score, n) => ({
    id: `sus${n}`,
    session_id: "s1",
    question_number: n + 1,
    score,
    created_at: at(41.8),
  })),
  instrument_answers: [],
};

const observerNotes: ObserverNote[] = [
  { id: "on1", session_id: "s1", author_id: USERS.carla.id, author_email: USERS.carla.email, note: "Participant asked whether 21 was Celsius; Bruno said yes before she found the setting.", task_index: 0, created_at: at(41.1) },
  { id: "on2", session_id: "s1", author_id: USERS.carla.id, author_email: USERS.carla.email, note: "Stalled on the schedule screen for a minute; Bruno pointed at the Save icon.", task_index: 1, created_at: at(41.3) },
  { id: "on3", session_id: "s1", author_id: USERS.carla.id, author_email: USERS.carla.email, note: "Said away mode was easy, but only half turned it on.", task_index: 2, created_at: at(41.5) },
];

// Carla has co-rated three of the five tasks so far.
const raterScores: RaterScore[] = [
  { task: "k1", status: "success", actions: 3, errors: 0, hes: 0, seq: 7 },
  { task: "k2", status: "failure", actions: 19, errors: 4, hes: 3, seq: 3 },
  { task: "k3", status: "failure", actions: 6, errors: 1, hes: 1, seq: 7 },
].map((r, i) => ({
  id: `rs${i}`,
  session_id: "s1",
  task_id: r.task,
  rater_id: USERS.carla.id,
  rater_email: USERS.carla.email,
  completion_status: r.status as RaterScore["completion_status"],
  action_count: r.actions,
  error_count: r.errors,
  hesitation_count: r.hes,
  seq_rating: r.seq,
  created_at: at(44),
  updated_at: at(44),
}));

const reflections: SessionReflection[] = [
  {
    id: "rf1",
    session_id: "s1",
    user_id: USERS.bruno.id,
    surprised:
      "On the schedule task she never looked at the Save icon. She kept scrolling, expecting a button at the bottom of the screen.",
    protocol_change:
      "",
    may_have_led: "",
    submitted_at: null,
    created_at: at(42),
    updated_at: at(42),
  },
];

// ── heuristic inspection ──────────────────────────────────────

const NIELSEN = "11111111-1111-1111-1111-111111111111";
const heuristicNames = [
  "Visibility of system status",
  "Match between the system and the real world",
  "User control and freedom",
  "Consistency and standards",
  "Error prevention",
  "Recognition rather than recall",
  "Flexibility and efficiency of use",
  "Aesthetic and minimalist design",
  "Help users recognise, diagnose, and recover from errors",
  "Help and documentation",
];
const heuristicSets: HeuristicSet[] = [
  { id: NIELSEN, name: "Nielsen's 10 usability heuristics", description: null, org_id: null, user_id: null, is_builtin: true, created_at: T0 },
];
const heuristics: Heuristic[] = heuristicNames.map((name, i) => ({
  id: `h${i + 1}`,
  set_id: NIELSEN,
  sort_order: i + 1,
  code: `H${i + 1}`,
  name,
  description: null,
}));

const inspections: Inspection[] = [
  { id: "i1", template_id: TPL, heuristic_set_id: NIELSEN, subject_kind: "own", subject_name: "Thermostat prototype v1", subject_url: null, status: "consolidating", created_by: USERS.bruno.id, created_at: at(10), collection_closed_at: at(26), closed_at: null },
  { id: "i2", template_id: TPL, heuristic_set_id: NIELSEN, subject_kind: "comparator", subject_name: "EcoTherm (competitor app)", subject_url: "https://example.com/ecotherm", status: "collecting", created_by: USERS.bruno.id, created_at: at(46), collection_closed_at: null, closed_at: null },
];

const ev = (id: string, ins: string, user: string, submitted: string | null): InspectionEvaluator => ({
  id, inspection_id: ins, user_id: user, submitted_at: submitted, created_at: at(10),
});
const evaluators: InspectionEvaluator[] = [
  ev("e-b", "i1", USERS.bruno.id, at(20)),
  ev("e-c", "i1", USERS.carla.id, at(22)),
  ev("e-d", "i1", USERS.diogo.id, at(24)),
  ev("e-e", "i1", USERS.eva.id, at(26)),
  ev("e2-b", "i2", USERS.bruno.id, null),
  ev("e2-c", "i2", USERS.carla.id, at(47)),
  ev("e2-d", "i2", USERS.diogo.id, null),
];

const problems: InspectionProblem[] = [
  ["p1", "No feedback after saving a schedule", "h1", 3],
  ["p2", "Temperature unit is not shown", "h2", 2],
  ["p3", "A deleted schedule cannot be restored", "h3", 3],
  ["p4", "Bottom bar icons have no labels", "h6", 2],
  ["p5", "Sync error shows only a code, ERR_SYNC_402", "h9", 3],
  ["p6", "Away mode is two menus deep", "h7", 2],
  ["p7", "Save is top right on one screen, bottom on another", "h4", 2],
  ["p8", "Onboarding cannot be skipped", "h3", 1],
  ["p9", "Disabled controls are hard to tell apart", "h8", 1],
].map(([id, title, h, sev], i) => ({
  id: id as string,
  inspection_id: "i1",
  title: title as string,
  notes: null,
  heuristic_id: h as string,
  agreed_severity: sev as number,
  sort_order: i,
  // After testing: participants hit most of the severe predictions, not all.
  // Four of five tested predictions were hit (80%), but testing also showed three
  // problems nobody predicted, so predictions covered only four of seven (57%).
  test_outcome: (["confirmed", "not_observed", "confirmed", "untested", "confirmed", "untested", "confirmed", "untested", "untested"] as const)[i],
  outcome_note: null,
  created_at: at(27),
}));

// Who found what, in their own words. Coverage gives any-two agreement of
// about 27%, inside the range Hertzum and Jacobsen report, with four problems
// that only one evaluator saw.
const found: [string, string, string, string, number][] = [
  // evaluator, problem, heuristic, description, severity
  ["e-b", "p1", "h1", "Saving a schedule gives no confirmation", 3],
  ["e-c", "p1", "h1", "Can't tell whether the schedule was saved", 4],
  ["e-d", "p1", "h1", "No success message on save", 3],
  ["e-e", "p1", "h1", "Save has no visible result", 2],
  ["e-b", "p2", "h2", "Temperatures have no °C or °F", 2],
  ["e-c", "p2", "h2", "Unit of temperature unclear", 1],
  ["e-c", "p3", "h3", "Deleting a schedule has no undo", 3],
  ["e-d", "p3", "h5", "Delete is permanent and unconfirmed", 3],
  ["e-b", "p4", "h6", "Icons in the bottom bar are unlabeled", 2],
  ["e-d", "p5", "h9", "Error message is just a code", 2],
  ["e-e", "p5", "h9", "ERR_SYNC_402 means nothing to a user", 3],
  ["e-e", "p6", "h7", "Away mode buried in Settings > Home", 2],
  ["e-b", "p7", "h4", "Save button moves between screens", 1],
  ["e-d", "p7", "h4", "Inconsistent position of Save", 2],
  ["e-c", "p8", "h3", "Forced through five onboarding screens", 1],
  ["e-e", "p9", "h8", "Greyed-out controls look active", 1],
];
const findings: InspectionFinding[] = [
  ...found.map(([evaluator, problem, h, description, severity], i) => ({
    id: `f${i}`,
    inspection_id: "i1",
    evaluator_id: evaluator,
    heuristic_id: h,
    location: null,
    description,
    severity,
    evidence_path: null,
    problem_id: problem,
    created_at: at(12 + i),
  })),
  // Inspection I2, Bruno's open pass only: nobody else's is readable to him yet.
  { id: "g1", inspection_id: "i2", evaluator_id: "e2-b", heuristic_id: "h1", location: "Home screen", description: "Current temperature and target look identical", severity: 3, evidence_path: null, problem_id: null, created_at: at(47) },
  { id: "g2", inspection_id: "i2", evaluator_id: "e2-b", heuristic_id: "h4", location: "Schedule editor", description: "Days of the week start on Sunday, unlike the phone's calendar", severity: 1, evidence_path: null, problem_id: null, created_at: at(47.2) },
  { id: "g3", inspection_id: "i2", evaluator_id: "e2-b", heuristic_id: "h5", location: "Away mode", description: "Nothing stops you setting the away temperature above the home one", severity: 2, evidence_path: null, problem_id: null, created_at: at(47.4) },
];


// ── more teams, for the class overview ────────────────────────
// Three further projects in contrasting states, so one screenshot shows the
// view doing its job: a review waiting on the instructor, warnings, missing
// consent, an order never counterbalanced, and a team with nothing to chase.

const groups = [
  ["grp-aurora", "Team Aurora", [USERS.carla, USERS.eva]],
  ["grp-boreal", "Team Boreal", [USERS.diogo]],
  ["grp-cirrus", "Team Cirrus", [USERS.eva, USERS.carla]],
  ["grp-delta", "Team Delta", [USERS.bruno, USERS.carla]],
].map(([id, name, members]) => ({
  id: id as string,
  org_id: ORG_ID,
  name: name as string,
  created_at: T0,
  org_group_members: (members as { id: string; email: string }[]).map((m) => ({
    group_id: id as string,
    user_id: m.id,
    member_email: m.email,
    created_at: T0,
  })),
}));

const simpleTasks = (prefix: string, names: string[], over: Partial<(typeof tasks)[number]> = {}) =>
  names.map((name, i) => ({
    id: `${prefix}${i}`,
    template_id: prefix,
    group_id: null,
    sort_order: i,
    name,
    description: `Done when ${name.toLowerCase()} is confirmed on screen.`,
    optimal_time_seconds: 40,
    optimal_actions: 4,
    is_practice: false,
    created_at: T0,
    from_problem_id: null,
    task_questions: [],
    ...over,
  }));

const otherTemplate = (
  id: string,
  name: string,
  group: string,
  taskList: ReturnType<typeof simpleTasks>,
  over: Partial<TemplateWithRelations>,
): TemplateWithRelations => ({
  ...template,
  id,
  name,
  description: null,
  user_id: USERS.carla.id,
  org_group_id: group,
  review_mode: "off",
  review_status: "draft",
  review_submitted_at: null,
  require_inspection: false,
  consent_text: null,
  template_tasks: taskList,
  template_error_types: [{ id: `${id}-et`, template_id: id, code: "WB", label: "Wrong button", created_at: T0 }],
  template_questions: [],
  ...over,
});

const library = otherTemplate(
  "tpl-library",
  "Campus library kiosk",
  "grp-aurora",
  simpleTasks("tpl-library", ["Renew a borrowed book", "Reserve a study room", "Find a journal article", "Pay a late fee"]),
  { review_mode: "required", review_status: "approved", reviewed_at: at(20) },
);
const bike = otherTemplate(
  "tpl-bike",
  "Bike-share app",
  "grp-boreal",
  simpleTasks("tpl-bike", ["Tap the 'Unlock' button to start a ride", "End a ride at a full station", "Report a broken bike"]),
  { review_mode: "required", review_status: "changes_requested", review_note: "The first task tells the participant which button to press." },
);
const museum = otherTemplate(
  "tpl-museum",
  "Museum audio guide",
  "grp-cirrus",
  simpleTasks("tpl-museum", ["Play the guide for room 3", "Switch the language to Portuguese", "Save a favourite exhibit"]),
  {},
);

type LightSession = {
  id: string; template_id: string; org_id: string; status: "completed" | "planned";
  is_pilot: boolean; consent_accepted_at: string | null; consent_method: string | null;
  task_order_strategy: "fixed" | "shuffled" | "latin_square"; completed_at: string | null;
};
const light = (id: string, tpl: string, over: Partial<LightSession> = {}): LightSession => ({
  id, template_id: tpl, org_id: ORG_ID, status: "completed", is_pilot: false,
  consent_accepted_at: at(50), consent_method: "join_form", task_order_strategy: "fixed",
  completed_at: at(52), ...over,
});
const otherSessions: (LightSession & { participants?: { name: string } })[] = [
  { ...light("th2", "tpl-thermo", { task_order_strategy: "latin_square", completed_at: at(20) }), participants: { name: "Hugo Pires" } },
  { ...light("th3", "tpl-thermo", { task_order_strategy: "latin_square", completed_at: at(22) }), participants: { name: "Inês Lobo" } },
  light("lib1", "tpl-library"),
  light("lib2", "tpl-library", { consent_accepted_at: null, consent_method: null }),
  light("lib3", "tpl-library", { completed_at: at(60) }),
  light("mus1", "tpl-museum", { task_order_strategy: "shuffled" }),
  light("mus2", "tpl-museum", { task_order_strategy: "shuffled", completed_at: at(58) }),
];

// Museum's two sessions were co-rated with matching completion judgements.
const museumResults = ["tpl-museum0", "tpl-museum1", "tpl-museum2"].flatMap((task_id, i) =>
  ["mus1", "mus2"].map((session_id) => ({
    session_id, task_id, completion_status: i === 1 ? "partial" : "success",
    action_count: 4, error_count: 0, hesitation_count: 0, seq_rating: 6,
  })),
);
const museumScores = museumResults.map((r, i) => ({
  ...r, id: `mrs${i}`, rater_id: USERS.carla.id, rater_email: USERS.carla.email,
  created_at: at(59), updated_at: at(59),
}));

const bikeInspection = {
  id: "i3", template_id: "tpl-bike", heuristic_set_id: NIELSEN, subject_kind: "comparator" as const,
  subject_name: "CityBike Lisbon", subject_url: null, status: "collecting" as const,
  created_by: USERS.diogo.id, created_at: at(30), collection_closed_at: null, closed_at: null,
};
const bikeEvaluators = [
  ev("e3-d", "i3", USERS.diogo.id, at(33)),
  ev("e3-b", "i3", USERS.bruno.id, at(34)),
  ev("e3-e", "i3", USERS.eva.id, null),
];

// ── the table store the mock reads ────────────────────────────

export const DB: Record<string, unknown[]> = {
  organizations,
  org_groups: groups,
  // The organization page also reads each project's members and a session count.
  templates: [template, library, bike, museum].map((t) => ({
    ...t,
    template_members: templateMembers.filter((m) => m.template_id === t.id),
    test_sessions: [
      { count: [session, ...otherSessions].filter((x) => x.template_id === t.id).length },
    ],
  })),
  template_members: templateMembers,
  test_sessions: [session, ...otherSessions],
  // Flat copy for queries that read task results directly rather than nested.
  task_results: [
    ...taskResults.map(({ template_tasks: _t, error_logs: _e, hesitation_logs: _h, task_question_answers: _a, ...r }) => r),
    ...museumResults,
  ],
  participants: [participant],
  observer_notes: [
    ...observerNotes,
    { id: "on-m", session_id: "mus1", author_id: USERS.carla.id, author_email: USERS.carla.email, note: "Found the language switch without help.", task_index: 1, created_at: at(52) },
    { id: "on-m2", session_id: "mus2", author_id: USERS.eva.id, author_email: USERS.eva.email, note: "No prompting.", task_index: 0, created_at: at(58) },
  ],
  rater_scores: [...raterScores, ...museumScores],
  session_reflections: [
    ...reflections,
    { id: "rf-l1", session_id: "lib1", user_id: USERS.carla.id, surprised: "x", protocol_change: "x", may_have_led: "x", submitted_at: at(53), created_at: at(53), updated_at: at(53) },
    { id: "rf-m1", session_id: "mus1", user_id: USERS.eva.id, surprised: "x", protocol_change: "x", may_have_led: "x", submitted_at: at(53), created_at: at(53), updated_at: at(53) },
    { id: "rf-m2", session_id: "mus2", user_id: USERS.carla.id, surprised: "x", protocol_change: "x", may_have_led: "x", submitted_at: at(59), created_at: at(59), updated_at: at(59) },
  ],
  heuristic_sets: heuristicSets,
  heuristics,
  inspections: [...inspections, bikeInspection],
  inspection_evaluators: [...evaluators, ...bikeEvaluators],
  inspection_findings: findings,
  inspection_problems: problems,
  // After testing: what only the sessions showed, and which sessions show what.
  test_problems: [
    { id: "tp1", template_id: "tpl-thermo", title: "Participants expected the schedule to repeat weekly without asking", severity: 3, heuristic_id: null, note: null, created_by: USERS.bruno.id, created_at: at(45) },
    { id: "tp2", template_id: "tpl-thermo", title: "The away temperature was mistaken for the current temperature", severity: 2, heuristic_id: null, note: null, created_by: USERS.bruno.id, created_at: at(45) },
    { id: "tp3", template_id: "tpl-thermo", title: "Nobody noticed the schedule could be copied to other days", severity: 1, heuristic_id: null, note: null, created_by: USERS.bruno.id, created_at: at(45) },
  ],
  problem_evidence: (
    [
      ["predicted", "p1", "th2"], ["predicted", "p1", "th3"], ["predicted", "p3", "th2"],
      ["predicted", "p5", "th3"], ["predicted", "p7", "th2"],
      ["test_only", "tp1", "th2"], ["test_only", "tp1", "th3"], ["test_only", "tp2", "th3"],
      ["test_only", "tp3", "th2"],
    ] as const
  ).map(([kind, problem, sessionId], i): ProblemEvidence => ({
    id: `pe${i}`,
    template_id: "tpl-thermo",
    inspection_problem_id: kind === "predicted" ? problem : null,
    test_problem_id: kind === "test_only" ? problem : null,
    session_id: sessionId,
    created_by: USERS.bruno.id,
    created_at: at(46),
  })),
  moderation_events: [
    { seq: 1, session_id: "s1", task_id: null, task_index: null, kind: "logging_started", timer_seconds: null, occurred_at: at(41) },
    { seq: 2, session_id: "s1", task_id: "k2", task_index: 1, kind: "undo_error", timer_seconds: 64.2, occurred_at: at(41.3) },
    { seq: 3, session_id: "s1", task_id: "k3", task_index: 2, kind: "task_reset", timer_seconds: 18.4, occurred_at: at(41.5) },
  ],
  template_codes: [],
  answer_codes: [],
  auto_events: [],
};
