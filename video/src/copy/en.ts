/**
 * Every on-screen string, in one file.
 * A Portuguese cut is a sibling file plus a swapped import, not a rewrite.
 */
export const copy = {
  brand: {
    name: "Avalux",
    domain: "avalux.pt",
    tagline: "One platform for moderated usability testing.",
    closing: "Open source. Self-hostable.",
  },

  marketing: {
    coldOpen: {
      first: "A stopwatch. A spreadsheet. A questionnaire tool.",
      second: "Three tools. One session. Nothing connected.",
    },
    protocols: {
      title: "Reusable test protocols",
      sub: "Tasks, optimal-path baselines, and your own error taxonomy.",
      tasks: [
        { n: 1, title: "Open the cloud study list", optimal: "45s", actions: 3 },
        { n: 2, title: "Upload and ingest a study", optimal: "60s", actions: 4 },
        { n: 3, title: "Export a session report", optimal: "30s", actions: 2 },
      ],
      groups: ["Setup", "Analysis"],
      errors: [
        { code: "E1", label: "Navigation error" },
        { code: "E2", label: "Wrong study selected" },
        { code: "E3", label: "Upload / ingestion" },
        { code: "E4", label: "Could not interpret" },
      ],
    },
    cockpit: {
      title: "A cockpit built for one hand",
      sub: "One tap logs an error. One key undoes it. The timer survives a crash.",
    },
    participant: {
      title: "On the participant's own device",
      sub: "Realtime sync, two-way gating, English and Portuguese.",
    },
    instruments: {
      title: "Standardized instruments, scored for you",
      sub: "System Usability Scale with 95% confidence intervals.",
      chips: ["SUS", "NASA-TLX", "UEQ-S"],
    },
    analysis: {
      title: "From session to findings",
      sub: "Event timelines, dashboards, and data you can take elsewhere.",
      exports: ["PDF report", "CSV bundle", "JSON"],
    },
    classrooms: {
      title: "One class, many projects",
      sub: "Organizations, sub-teams, and per-project student access.",
      roles: [
        { role: "Owner", note: "the professor, sees everything" },
        { role: "Member", note: "collaborates across projects" },
        { role: "Student", note: "sees only their assigned project" },
      ],
    },
  },

  tutorial: {
    intro: {
      title: "The complete walkthrough",
      sub: "Every feature, in the order you will use them.",
    },
    outro: {
      title: "All of this is documented in the app",
      sub: "Open Help from the sidebar for the written version of this video.",
    },
    chapters: {
      templates: {
        n: 1,
        title: "Templates",
        lead: "A template is a reusable test protocol you run with many participants.",
        beats: [
          {
            heading: "Tasks with an optimal path",
            body: "Each task carries a target time and an expected action count, so the cockpit can score efficiency against a baseline.",
          },
          {
            heading: "Groups and practice tasks",
            body: "Organize tasks into your own groups. Practice tasks always run first and are excluded from every metric.",
          },
          {
            heading: "A typed error taxonomy",
            body: "Define the errors this study cares about. During the session they become one-tap buttons, E1 through E9.",
          },
          {
            heading: "Questions, media, and interviews",
            body: "Attach per-task questions, capture audio, video, or photos from the participant's device, and script a semi-structured interview.",
          },
          {
            heading: "Study-specific participant fields",
            body: "Collect the attributes this study needs at session creation, without touching the global participant record.",
          },
        ],
      },
      sessions: {
        n: 2,
        title: "Sessions",
        lead: "A session is one participant running one template, once.",
        beats: [
          {
            heading: "Create and invite",
            body: "Pick the template and the participant, fill the template's custom fields, and the session is ready to run.",
          },
          {
            heading: "Personal invitations or a shared link",
            body: "Send a one-time personal link, or publish a shared join code with a response cap for unmoderated recruitment.",
          },
          {
            heading: "Task order strategy",
            body: "Choose fixed order, a shuffle, or a Latin-square position to counterbalance learning effects across participants.",
          },
        ],
      },
      live: {
        n: 3,
        title: "Running a live session",
        lead: "The evaluator cockpit is built to be driven with one hand while you watch the participant.",
        beats: [
          {
            heading: "A timer that survives a crash",
            body: "Timer state persists per session and task. Reload the tab mid-task and it rehydrates, still running.",
          },
          {
            heading: "Actions against the optimal path",
            body: "Count each action the participant takes. The cockpit shows the live distance from the task's optimal count.",
          },
          {
            heading: "One-tap errors and hesitations",
            body: "Your typed errors are buttons. Hesitations are a single tap. Every entry is timestamped for the event timeline.",
          },
          {
            heading: "Outcome and perceived difficulty",
            body: "Close each task as success, partial, or failure, skip it, and record the Single Ease Question rating.",
          },
          {
            heading: "Keyboard shortcuts and undo",
            body: "A logs an action, 1 to 9 log typed errors, H logs a hesitation, Z undoes the last entry. Every tap is undoable.",
          },
          {
            heading: "Two-way gating",
            body: "The session cannot advance while the participant is still answering, so the two devices never fall out of step.",
          },
        ],
      },
      participant: {
        n: 4,
        title: "The participant experience",
        lead: "Participants join on their own phone or laptop. Nothing to install.",
        beats: [
          {
            heading: "Join by link or code",
            body: "A personal invitation or a shared join code opens the client, in English or Portuguese.",
          },
          {
            heading: "Tasks and questions",
            body: "The participant sees the current task and answers its questions, including audio, video, and photo capture.",
          },
          {
            heading: "Post-session instruments",
            body: "SUS, NASA-TLX, and UEQ-S are presented on the participant's device and scored automatically.",
          },
        ],
      },
      results: {
        n: 5,
        title: "Results and analytics",
        lead: "Every logged event turns into a metric the moment the session ends.",
        beats: [
          {
            heading: "Per-task results",
            body: "Time on task, actions against optimal, outcome, errors, hesitations, and the SEQ rating, task by task.",
          },
          {
            heading: "Event timelines",
            body: "Errors and hesitations plotted at their real offsets within each task, in the app and in the PDF.",
          },
          {
            heading: "Scored instruments",
            body: "SUS with a 95% confidence interval, so a small sample reports its own uncertainty.",
          },
          {
            heading: "Cross-session dashboards",
            body: "Completion, time on task, efficiency, and questionnaire scores aggregated across a template's sessions.",
          },
          {
            heading: "Inter-rater agreement",
            body: "A second rater scores the same session independently. Avalux reports Cohen's kappa and per-count agreement.",
          },
        ],
      },
      exports: {
        n: 6,
        title: "Exports and reporting",
        lead: "Nothing is locked in.",
        beats: [
          {
            heading: "Self-contained PDF report",
            body: "Session or template level, with task tables, charts, timelines, and instrument scores.",
          },
          {
            heading: "Raw data export",
            body: "Sessions, task results, error and hesitation logs, answers, instrument items, and codes as flat CSVs or one JSON.",
          },
          {
            heading: "Figure-ready charts",
            body: "Every titled chart exports as a 3x PNG or an SVG, sized for a paper figure.",
          },
        ],
      },
      coding: {
        n: 7,
        title: "Participants and coding",
        lead: "The qualitative half of a usability study lives here.",
        beats: [
          {
            heading: "Participant records",
            body: "Demographics, session history, and study-specific fields, with retroactive anonymization on request.",
          },
          {
            heading: "A code book per template",
            body: "Define codes with colors and definitions, then tag open answers and interview responses.",
          },
          {
            heading: "Frequency matrix",
            body: "Codes against sessions, so a pattern across participants becomes visible and exportable.",
          },
        ],
      },
      orgs: {
        n: 8,
        title: "Organizations and classrooms",
        lead: "Built for a research team, or for a class running parallel projects.",
        beats: [
          {
            heading: "Roles",
            body: "Owners run the organization, members collaborate across projects, students see only the projects assigned to them.",
          },
          {
            heading: "Groups and projects",
            body: "Group members into sub-teams, each holding its own project templates and sessions.",
          },
          {
            heading: "Observers",
            body: "Anyone with read access can watch a running session and take timestamped observer notes.",
          },
        ],
      },
      inspection: {
        n: 9,
        title: "Heuristic inspection",
        lead: "Predict the problems before testing, then find out which ones were real.",
        beats: [
          {
            heading: "Everyone evaluates alone",
            body: "Each evaluator records findings against a heuristic set without seeing anyone else's. Nobody can read another pass until every pass is submitted, because an inspection read early is one evaluator's opinion repeated.",
          },
          {
            heading: "Then the findings merge",
            body: "The same problem arrives in four different sentences. Merging them into one problem list is the slow step, and the agreement figure tells a team whether their passes were really independent.",
          },
          {
            heading: "Testing decides",
            body: "After the sessions, each prediction is marked hit or not observed, and problems only testing found are added. Not observed never means wrong: a few sessions can miss a real problem.",
          },
        ],
      },
      review: {
        n: 10,
        title: "Instructor review and consent",
        lead: "A protocol is reviewed before it runs, and participants are told what will happen.",
        beats: [
          {
            heading: "Draft, submitted, approved",
            body: "An owner can require approval before join links exist. Editing an approved protocol sends it back to draft, so what was approved is what runs, and rehearsal sessions are marked as pilots and left out of the results.",
          },
          {
            heading: "Consent from a checklist",
            body: "Most of a consent text is the same in every study. Tick the standard clauses, write what your study is about, and read the result as a participant would. The field warns when the right to stop is missing.",
          },
          {
            heading: "A record, not a claim",
            body: "Acceptance is timestamped on the session, and every review decision is kept with the protocol exactly as it was submitted, so two submissions show what a team changed in between.",
          },
        ],
      },
      observing: {
        n: 11,
        title: "Observing, co-rating and reflection",
        lead: "Three ways of finding out that what you recorded is not simply what you expected.",
        beats: [
          {
            heading: "A second pair of eyes",
            body: "An observer takes timestamped notes while somebody else moderates, and the moderator's own corrections, an undo or a restarted task, are recorded as they happen.",
          },
          {
            heading: "Two raters, one session",
            body: "A second evaluator scores the same session without seeing the first scores. The agreement that comes back is a measurement of the instrument, not a mark for the student.",
          },
          {
            heading: "Reflection while it is fresh",
            body: "Three questions after each session, answered alone and visible to teammates only once they have written their own. The last one asks where you might have led the participant.",
          },
        ],
      },
      classAndModel: {
        n: 12,
        title: "Class overview and model assistance",
        lead: "Seeing a whole class at once, and where a model is allowed to help.",
        beats: [
          {
            heading: "One row per team",
            body: "Every column is the evidence a learning objective asks for: the inspection, protocol warnings, review, sessions, consent, co-rating, reflection. Teams waiting on you come first.",
          },
          {
            heading: "A model may propose",
            body: "It groups findings across evaluators, or observations across sessions, into candidate problems. It is off by default and refused until the team has written a problem of its own, so it helps with what you might have missed and never with looking.",
          },
          {
            heading: "And a person decides",
            body: "Nothing is applied automatically. Accepting writes the problem you would have written by hand, marked assisted, so a report can say which work was your own. Participant answers are sent only where the consent text said so.",
          },
        ],
      },
    },
  },
} as const;
