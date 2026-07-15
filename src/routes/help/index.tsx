import { createFileRoute, Link } from "@tanstack/react-router";
import { PageWrapper } from "@/components/layout/page-wrapper";
import { HelpSection } from "@/components/help/help-section";
import { HelpScreenshot } from "@/components/help/help-screenshot";
import { HelpToc, type TocEntry } from "@/components/help/help-toc";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  ClipboardList,
  Play,
  Smartphone,
  BarChart3,
  FileDown,
  Users,
} from "lucide-react";

export const Route = createFileRoute("/help/")({
  component: HelpPage,
});

const TOC: TocEntry[] = [
  { id: "templates", label: "1. Creating Templates" },
  { id: "sessions", label: "2. Creating Sessions" },
  { id: "live", label: "3. Running a Live Session" },
  { id: "participant", label: "4. Participant Experience" },
  { id: "analytics", label: "5. Analytics & Results" },
  { id: "exports", label: "6. PDF Exports" },
  { id: "participants-mgmt", label: "7. Managing Participants" },
];

function HelpPage() {
  return (
    <PageWrapper
      title="Help & Tutorials"
      description="Step-by-step guide to every feature — from building a test template to exporting the final report."
    >
      <div className="grid gap-6 lg:grid-cols-[230px_1fr] lg:items-start">
        <HelpToc entries={TOC} />

        <div className="min-w-0 space-y-6">
          {/* ── 1. Templates ─────────────────────────────────────── */}
          <HelpSection
            id="templates"
            title="1. Creating Templates"
            icon={<FileText className="h-5 w-5 text-primary" />}
          >
            <p>
              A <strong>template</strong> defines everything a usability test
              contains: the tasks participants perform, the error types you
              want to log, follow-up questions per task, the final interview
              script, and any extra participant fields. Create one at{" "}
              <Link to="/templates/new" className="text-primary hover:underline">
                Templates → New Template
              </Link>
              .
            </p>
            <HelpScreenshot
              src="/help/02-template-basics.png"
              alt="Template editor showing basic info and task groups"
              caption="The template editor: basic info, task groups and tasks."
            />
            <div>
              <p className="font-medium">Tasks & task groups</p>
              <ol>
                <li>Type a group name (e.g. “Simple”, “Areas of Interest”) and press <em>Add Group</em>. Groups organize tasks into tabs.</li>
                <li>Inside a group, press <em>Add Task</em> and fill in the task name and the instructions the participant will see.</li>
                <li>Optionally set an <strong>optimal time</strong> (seconds) and <strong>optimal actions</strong> — live metrics and reports compare actual performance against these baselines.</li>
              </ol>
            </div>
            <div>
              <p className="font-medium">Per-task questions</p>
              <ol>
                <li>Open a task’s <em>Questions</em> area and add questions the participant answers right after finishing that task.</li>
                <li>
                  Types: <Badge variant="secondary">Open text</Badge>{" "}
                  <Badge variant="secondary">Single choice</Badge>{" "}
                  <Badge variant="secondary">Multiple choice</Badge>{" "}
                  <Badge variant="secondary">Rating</Badge>{" "}
                  <Badge variant="secondary">Audio</Badge>{" "}
                  <Badge variant="secondary">Video</Badge>{" "}
                  <Badge variant="secondary">Photo</Badge>
                </li>
                <li>Media types let the participant record or capture directly in the browser — useful for think-aloud reactions or evidence screenshots.</li>
                <li>New tasks automatically include an open “Notes” question so participants can always leave free-form comments; remove it if you don’t want it.</li>
              </ol>
              <HelpScreenshot
                src="/help/03-task-editor.png"
                alt="Task editor with a question being configured"
                caption="Editing a task with per-task questions."
              />
            </div>
            <div>
              <p className="font-medium">Error types</p>
              <p>
                Define a code + label taxonomy (e.g. <em>WB — Wrong button</em>,{" "}
                <em>OV — Overshoot</em>). During a live session the evaluator
                logs errors with one tap per type, and reports break errors
                down by category.
              </p>
            </div>
            <div>
              <p className="font-medium">Interview questions & participant fields</p>
              <p>
                <strong>Interview questions</strong> are asked once at the end
                of the session. <strong>Participant fields</strong> are extra
                labels (text, number, long text or dropdown) collected for each
                participant of this template — e.g. Handedness, Device,
                Condition/Group — shown on the join form and the participant’s
                detail page.
              </p>
              <HelpScreenshot
                src="/help/04-error-types-fields.png"
                alt="Error type and participant field editors"
                caption="Custom error taxonomy and template-specific participant fields."
              />
            </div>
          </HelpSection>

          {/* ── 2. Sessions ──────────────────────────────────────── */}
          <HelpSection
            id="sessions"
            title="2. Creating Sessions"
            icon={<ClipboardList className="h-5 w-5 text-primary" />}
          >
            <p>
              A <strong>session</strong> is one participant running one
              template. Start at{" "}
              <Link to="/sessions/new" className="text-primary hover:underline">
                Sessions → New Session
              </Link>
              , pick the template, then choose which tasks to include and their
              order. There are three ways to attach a participant:
            </p>
            <HelpScreenshot
              src="/help/05-session-new.png"
              alt="New session page with the three link modes"
              caption="Direct, Personal Link and Shared Link modes."
            />
            <ul>
              <li>
                <strong>Direct</strong> — pick an existing participant and
                start immediately (classic moderated lab setup, evaluator
                drives everything).
              </li>
              <li>
                <strong>Personal Link</strong> — generate a one-time link for a
                single participant. When they open it, a session is created for
                them and they fill in their own details.
              </li>
              <li>
                <strong>Shared Link</strong> — one link many participants can
                use; each person who joins gets their own session. Ideal for
                distributing a study.
              </li>
            </ul>
            <p>
              For link modes you choose which participant fields to collect
              (name, email, age…). Unchecking <em>Name</em> makes responses
              anonymous. Every joined session also gets a{" "}
              <strong>join code</strong> the participant can use to resume.
            </p>
            <p>
              <strong>Task order</strong> can be <em>fixed</em> (template
              order), <em>shuffled</em> (independent random order per
              participant), or <em>Latin square</em>. Latin square rotates the
              starting task by one position for each successive participant:
              with tasks A-B-C, participant 1 runs A-B-C, participant 2 runs
              B-C-A, participant 3 runs C-A-B. Across a multiple of N
              participants every task appears in every position equally often,
              which cancels learning and fatigue effects out of position
              averages instead of merely randomizing them. Tasks marked as{" "}
              <em>practice</em> are pinned before the rotation and excluded
              from all metrics.
            </p>
          </HelpSection>

          {/* ── 3. Live Session ──────────────────────────────────── */}
          <HelpSection
            id="live"
            title="3. Running a Live Session"
            icon={<Play className="h-5 w-5 text-primary" />}
          >
            <p>
              Live mode is the evaluator’s cockpit. Opening it auto-starts the
              session; the participant’s device follows along in realtime.
            </p>
            <HelpScreenshot
              src="/help/08-live-evaluator.png"
              alt="Live evaluator view with timer, actions, errors and hesitations"
              caption="The live evaluator view."
            />
            <ol>
              <li><strong>Timer</strong> — start/pause/reset per task; elapsed time is saved with the task result.</li>
              <li><strong>Actions</strong> — count the participant’s actions with +/−; compared against the task’s optimal count.</li>
              <li><strong>Errors</strong> — one tap per error type logs a timestamped error of that category.</li>
              <li><strong>Hesitations</strong> — log each moment of visible doubt; timestamped.</li>
              <li>
                Finish the task with <Badge className="bg-green-600">Success</Badge>{" "}
                <Badge className="bg-yellow-600">Partial</Badge>{" "}
                <Badge variant="destructive">Failure</Badge> or <em>Skip</em> —
                then rate perceived difficulty (SEQ 1–7).
              </li>
              <li>
                <strong>Previous / Reset Task</strong> — go back one task
                (saved results and answers are preserved) or reset the current
                task entirely (clears metrics, answers and logs after a
                confirmation).
              </li>
            </ol>
            <p>
              When the participant is on their own device, the Success /
              Partial / Failure / Skip buttons stay disabled while they are
              still answering the previous task’s questions — you’ll see a
              notice and get a toast when they’re ready.
            </p>
          </HelpSection>

          {/* ── 4. Participant Experience ────────────────────────── */}
          <HelpSection
            id="participant"
            title="4. Participant Experience"
            icon={<Smartphone className="h-5 w-5 text-primary" />}
          >
            <p>
              Participants open the invite link (any device — the flow is
              mobile-friendly), fill in the requested fields, and land in a
              waiting room synced to the evaluator.
            </p>
            <HelpScreenshot
              src="/help/15-participant-questions-mobile.png"
              alt="Participant answering task questions on mobile"
              caption="Participant view on a phone: task questions after the evaluator completes a task."
            />
            <ol>
              <li>While a task is running, the participant sees its title and instructions — no need for the evaluator to read them aloud.</li>
              <li>When the evaluator marks the task complete, its questions appear (text, choices, ratings, or in-browser audio/video/photo capture).</li>
              <li>After the last task, the <strong>interview questions</strong> appear, then the 10-item <strong>SUS questionnaire</strong>.</li>
              <li>Everything submits directly to the study — the evaluator watches answers arrive live.</li>
            </ol>
          </HelpSection>

          {/* ── 5. Analytics ─────────────────────────────────────── */}
          <HelpSection
            id="analytics"
            title="5. Analytics & Results"
            icon={<BarChart3 className="h-5 w-5 text-primary" />}
          >
            <p>
              Each session’s detail page has six tabs: <em>Task Results</em>{" "}
              (table + charts), <em>Questions</em>, <em>Error Log</em>,{" "}
              <em>Hesitations</em>, <em>Interview</em> and <em>SUS</em>. The{" "}
              <Link to="/analytics" className="text-primary hover:underline">
                Analytics
              </Link>{" "}
              page aggregates all completed sessions of a template.
            </p>
            <HelpScreenshot
              src="/help/06-session-detail.png"
              alt="Session detail with task results table and charts"
              caption="Session detail: results table, completion, time/actions vs optimal."
            />
            <div>
              <p className="font-medium">Reading the metrics</p>
              <ul>
                <li><strong>SEQ</strong> (1–7, per task): 7 = very easy. Values ≥ 5 are good; ≤ 3 signal friction.</li>
                <li><strong>SUS</strong> (0–100, per session): 68 is the industry average; ≥ 80.3 is “Excellent”, ≤ 51 “Poor”. Computed from the 10 standard items.</li>
                <li><strong>Time / Action efficiency</strong>: actual vs the optimal you set in the template. Skipped tasks are excluded so they can’t distort averages.</li>
                <li>Hover any truncated task name on a chart axis to see the full name.</li>
              </ul>
            </div>
            <HelpScreenshot
              src="/help/09-analytics-completion.png"
              alt="Analytics page with task completion chart"
              caption="Template-wide analytics across sessions."
            />
          </HelpSection>

          {/* ── 6. Exports ───────────────────────────────────────── */}
          <HelpSection
            id="exports"
            title="6. PDF Exports"
            icon={<FileDown className="h-5 w-5 text-primary" />}
          >
            <ul>
              <li>
                <strong>Usability Test Report</strong> (template → Sessions
                tab): a full PDF with per-session demographics, task results,
                question answers, charts, error/hesitation logs, interview
                answers, SUS scores, plus an overall cross-session analysis.
              </li>
              <li>
                <strong>Observation Sheets</strong> (template detail): blank,
                printable sheets for running a session on paper — participant
                info, per-task tables, error log and SUS form.
              </li>
            </ul>
            <HelpScreenshot
              src="/help/13-export.png"
              alt="Export controls on the template sessions tab"
              caption="Generating the PDF report."
            />
          </HelpSection>

          {/* ── 7. Participant management ────────────────────────── */}
          <HelpSection
            id="participants-mgmt"
            title="7. Managing Participants"
            icon={<Users className="h-5 w-5 text-primary" />}
          >
            <HelpScreenshot
              src="/help/12-participant-detail.png"
              alt="Participant detail with custom fields and portal invite"
              caption="Participant detail: profile, template-specific extra info, session history."
            />
            <ul>
              <li>
                <strong>Profiles</strong> — name, contact, demographics, tech
                proficiency and notes, editable at any time from{" "}
                <Link to="/participants" className="text-primary hover:underline">
                  Participants
                </Link>
                .
              </li>
              <li>
                <strong>Extra info per template</strong> — participant fields
                defined in a template appear on the participant’s page under
                that template’s name.
              </li>
              <li>
                <strong>Portal invite</strong> — participants with an email can
                be invited to the portal: they get credentials to log in and
                see their own sessions under <em>My Sessions</em>. An email can
                only be linked to one account.
              </li>
              <li>
                <strong>Anonymous participants</strong> — join-link sessions
                that don’t collect a name create anonymous participants that
                stay out of your participants list.
              </li>
            </ul>
          </HelpSection>
        </div>
      </div>
    </PageWrapper>
  );
}
