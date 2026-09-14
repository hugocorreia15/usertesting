import { createFileRoute, Link } from "@tanstack/react-router";
import { PageWrapper } from "@/components/layout/page-wrapper";
import { HelpSection } from "@/components/help/help-section";
import { HelpScreenshot } from "@/components/help/help-screenshot";
import { HelpToc, type TocEntry } from "@/components/help/help-toc";
import { HelpVideo } from "@/components/help/help-video";
import { hasTutorialVideo } from "@/lib/tutorial-video";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  ClipboardList,
  Play,
  Smartphone,
  BarChart3,
  FileDown,
  Users,
  Building2,
  PlayCircle,
  ScanSearch,
  ClipboardCheck,
  Scale,
  MessageSquareQuote,
  ShieldOff,
  LayoutList,
} from "lucide-react";
import { HELP_SECTIONS, type HelpAnchor } from "@/lib/help-anchors";

export const Route = createFileRoute("/help/")({
  component: HelpPage,
});

const TOC: TocEntry[] = [
  ...(hasTutorialVideo
    ? [{ id: "video", label: "Video walkthrough" }]
    : []),
  ...(Object.keys(HELP_SECTIONS) as HelpAnchor[]).map((id) => ({
    id,
    label: HELP_SECTIONS[id],
  })),
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
          {/* ── Video walkthrough ────────────────────────────────── */}
          {hasTutorialVideo && (
            <HelpSection
              id="video"
              title="Video walkthrough"
              icon={<PlayCircle className="h-5 w-5 text-primary" />}
            >
              <p>
                A five-minute tour of every feature, in the same order as the
                sections below. Use the jump links to go straight to a chapter.
              </p>
              <HelpVideo />
            </HelpSection>
          )}

          {/* ── 1. Templates ─────────────────────────────────────── */}
          <HelpSection
            id="templates"
            title={HELP_SECTIONS.templates}
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
            title={HELP_SECTIONS.sessions}
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
            title={HELP_SECTIONS.live}
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
            title={HELP_SECTIONS.participant}
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
            title={HELP_SECTIONS.analytics}
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
            title={HELP_SECTIONS.exports}
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
            title={HELP_SECTIONS["participants-mgmt"]}
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

          {/* ── 8. Organizations & classrooms ────────────────────── */}
          <HelpSection
            id="organizations"
            title={HELP_SECTIONS.organizations}
            icon={<Building2 className="h-5 w-5 text-primary" />}
          >
            <p>
              An <strong>organization</strong> lets several evaluators work on
              the same study. Create one at{" "}
              <Link to="/organizations" className="text-primary hover:underline">
                Organization
              </Link>
              , then generate <strong>invite codes</strong> others use to join
              (each code works once). Members join with one of three roles:
            </p>
            <ul>
              <li>
                <strong>Owner</strong> — manages membership and invites,
                assigns projects, can delete the organization. The creator is
                the first owner.
              </li>
              <li>
                <strong>Member</strong> — sees and edits every template shared
                with the organization and reads all of its sessions
                (co-supervisors, colleagues).
              </li>
              <li>
                <strong>Student</strong> — sees <em>only</em> the projects an
                owner assigns to them, with full editing there; everything
                else in the organization stays invisible. Made for classroom
                use: one organization per class, one invite code per role.
              </li>
            </ul>
            <p>
              <strong>Sharing a project</strong>: on a template's detail page
              the creator picks the organization from the sharing dropdown;
              existing and future sessions of that template follow
              automatically. Owners then use{" "}
              <em>Project members</em> (same page) to tick which students work
              on that project — a pair or trio per template is the typical
              classroom setup. Each template can also carry a{" "}
              <strong>repository URL</strong> (set in the template form),
              shown as a Repository button on its detail page.
            </p>
            <p>
              A typical class: the professor creates the organization and one
              template per student group, shares each template, hands out
              student invite codes, and assigns each group to its project.
              Students edit their protocol and run their own sessions; the
              professor sees every project, session, and analysis from one
              account. Note that participant-captured media (photos,
              recordings) stays visible only to whoever ran the session.
            </p>
          </HelpSection>

          {/* ── 9. Heuristic inspection ───────────────────────────── */}
          <HelpSection
            id="inspection"
            title={HELP_SECTIONS.inspection}
            icon={<ScanSearch className="h-5 w-5 text-primary" />}
          >
            <p>
              An <strong>inspection</strong> comes before a usability test.
              Several evaluators check an interface against a list of
              heuristics, by default Nielsen's ten, and write down every
              problem they find with a severity from 0 (not a problem) to 4
              (catastrophe). It needs no participants and no ethical approval,
              and the problems it finds are what a test's tasks are then
              written to confirm.
            </p>
            <p>
              Start one from a template's overview with{" "}
              <em>Start an inspection</em>. Inspect <strong>your own design</strong>,
              or, before a prototype exists, a <strong>comparable product</strong>.
            </p>
            <HelpScreenshot
              src="/help/17-inspection-pass.png"
              alt="An evaluator's own pass on an inspection, with the notice that other passes stay hidden until submission"
              caption="Your pass. Other evaluators' findings stay hidden until you submit."
            />
            <ol>
              <li>
                <strong>Work alone.</strong> Until you submit, nobody can see
                your findings and you cannot see theirs. This is enforced, not
                requested: reading a teammate's list first anchors you to it.
              </li>
              <li>
                <strong>Submit your pass.</strong> Submitting freezes it. You
                can then read the passes of anyone who has also submitted.
                When the last evaluator submits, collection closes. A template
                owner can close it early if someone will not finish; their pass
                is frozen as it stands.
              </li>
              <li>
                <strong>Merge.</strong> Tick the findings that describe the
                same problem and give them one agreed wording. Only merged
                problems count in the statistics.
              </li>
              <li>
                <strong>Read the statistics.</strong> <em>Any-two agreement</em>{" "}
                is the share of problems two evaluators found in common, averaged
                over every pair; published studies report 5% to 65%. The curve
                shows how many problems a group of each size would find, which is
                where the usual advice to use three to five evaluators comes
                from.
              </li>
              <li>
                <strong>Test it.</strong> <em>Test this in a session</em> turns
                a merged problem into a task on the template, remembering which
                problem it came from.
              </li>
            </ol>
            <HelpScreenshot
              src="/help/18-inspection-results.png"
              alt="Inspection statistics: any-two agreement, problems found by one person only, and problems found by groups of each size"
              caption="After merging: how much the evaluators overlapped, and how many evaluators the study needed."
            />
            <p>
              <strong>After testing</strong>, the same page compares the
              inspection with what participants actually did. Mark each predicted
              problem as hit or not observed, tick the sessions that show it, and
              add problems testing found that nobody predicted. Two figures come
              out: how many predicted problems participants hit, and how many of
              the problems testing showed had been predicted. An inspection is
              usually better at one than the other. <em>Not observed</em> never
              means wrong: a few sessions can miss a real problem.
            </p>
            <HelpScreenshot
              src="/help/25-after-testing.png"
              alt="The After testing card, with predicted problems marked as hit or not observed and problems found only in testing"
              caption="Closing the loop: which predictions participants hit, and what testing found that the inspection missed."
            />
            <p>
              An organization owner can tick{" "}
              <em>Require a merged inspection before review</em> on a template,
              so the protocol cannot be sent for review until one exists.
            </p>
          </HelpSection>

          {/* ── 10. Instructor review and consent ─────────────────── */}
          <HelpSection
            id="review"
            title={HELP_SECTIONS.review}
            icon={<ClipboardCheck className="h-5 w-5 text-primary" />}
          >
            <p>
              On an organization template, an owner can put the protocol under
              <strong> instructor review</strong>, from the template's overview.
              It is off by default and chosen per template.
            </p>
            <ul>
              <li>
                <strong>Off</strong>: no review workflow.
              </li>
              <li>
                <strong>Advisory</strong>: students request review and see the
                decision, but nothing is blocked.
              </li>
              <li>
                <strong>Required</strong>: join links cannot be created until an
                owner approves. Sessions can still be run to rehearse the
                protocol; they are marked <em>Pilot</em> and left out of the
                template's analytics and report.
              </li>
            </ul>
            <p>
              Editing the protocol after it is approved or submitted sends it
              back to draft, so what was approved is what runs. A reviewer who
              asks for changes must say what to change.
            </p>
            <p>
              Every step is kept under <em>History</em> on the review card:
              each submission, each decision with its note, and each return to
              draft. A submission also records the protocol exactly as it was
              sent, so two submissions show what a team changed in between. The
              data export includes all of it.
            </p>
            <HelpScreenshot
              src="/help/19-instructor-review.png"
              alt="A template awaiting instructor review, with Approve and Request changes, below its heuristic inspections"
              caption="An organization owner reviewing a protocol that requires review and a merged inspection."
            />
            <p>
              <strong>Consent.</strong> A template can carry consent text.
              Participants who join by link see it first and must accept it;
              the time is recorded on the session. For a session you ran in
              person, where consent was given on paper or out loud, use{" "}
              <em>Record consent obtained</em> on the session page.
            </p>
          </HelpSection>

          {/* ── 11. Observing and co-rating ────────────────────────── */}
          <HelpSection
            id="co-rating"
            title={HELP_SECTIONS["co-rating"]}
            icon={<Scale className="h-5 w-5 text-primary" />}
          >
            <p>
              <strong>Observe</strong> opens a read-only view of a session that
              is in progress. It follows the moderator's current task and lets
              you add timestamped notes, such as a hint the moderator gave. It
              never changes the session's data. Anyone who can open the session
              can observe it.
            </p>
            <p>
              <strong>Co-rate</strong> lets a second person score a completed
              session's tasks on their own: completion, actions, errors,
              hesitations, and ease rating. It does not change the primary
              evaluator's data. The session then shows how far the two of you
              agreed, including Cohen's kappa on completion. Two careful people
              rarely log a session identically, and the number shows how much
              the scores depend on who logged them.
            </p>
            <HelpScreenshot
              src="/help/20-corate.png"
              alt="The co-rate page, scoring each task independently of the primary evaluator"
              caption="Co-rating a completed session. Your scores never overwrite the primary evaluator's."
            />
          </HelpSection>

          {/* ── 12. Reflection ─────────────────────────────────────── */}
          <HelpSection
            id="reflection"
            title={HELP_SECTIONS.reflection}
            icon={<MessageSquareQuote className="h-5 w-5 text-primary" />}
          >
            <p>
              When a session is completed, everyone who took part answers three
              questions at the top of the session page: what happened that you
              did not expect, what you would change in the protocol, and what
              you said or did that may have led the participant.
            </p>
            <p>
              Beside the questions is what the session recorded: tasks that
              failed or took twice the expected time, hesitations and errors, a
              task rated easy that went badly, and notes teammates took while
              observing. Answer from that, not from memory.
            </p>
            <p>
              Below it, <strong>How the session was run</strong> lists the
              corrections made while logging: entries undone, tasks reset or
              revisited, the timer reset, and tasks marked successful with
              nothing counted. A reset task was attempted twice, so its recorded
              time and errors describe only the second attempt. Corrections are
              recorded from the live cockpit; a session run before that shows
              as not recorded, rather than as clean.
            </p>
            <HelpScreenshot
              src="/help/24-session-run.png"
              alt="The How the session was run card, listing an undone error and a task that was reset"
              caption="A reset task was attempted twice; the card says so, because the results table cannot."
            />
            <HelpScreenshot
              src="/help/21-reflection.png"
              alt="A reflection draft on a completed session, beside what the session recorded and notes from an observer"
              caption="A reflection in progress, with the session's recorded evidence beside the questions."
            />
            <ul>
              <li>
                Your reflection is a <strong>private draft</strong> until you
                submit it. Each answer needs at least a sentence.
              </li>
              <li>
                <strong>Submitting is final.</strong> After that you can read
                what teammates wrote about the same session, once they have
                submitted theirs too.
              </li>
              <li>
                Organization owners read submitted reflections, never drafts.
                Submitted reflections are included in the data export.
              </li>
            </ul>
          </HelpSection>

          {/* ── 13. Anonymizing ────────────────────────────────────── */}
          <HelpSection
            id="data-protection"
            title={HELP_SECTIONS["data-protection"]}
            icon={<ShieldOff className="h-5 w-5 text-primary" />}
          >
            <p>
              <strong>Anonymize</strong>, on a completed session you ran,
              replaces the participant's name with a random identifier and
              removes their email, notes, and custom field values. Their age,
              gender, occupation, tech proficiency, and every metric are kept,
              so the analysis is unaffected.
            </p>
            <HelpScreenshot
              src="/help/22-anonymize.png"
              alt="The confirmation dialog for anonymizing a participant"
              caption="Anonymizing asks for confirmation, because it applies to every session of that participant and cannot be undone."
            />
            <p>
              Identity belongs to the participant, not the session, so this
              applies to <strong>every session</strong> that participant took
              part in. It cannot be undone. Photos and recordings the
              participant captured stay private: they are only visible to
              whoever ran the session.
            </p>
          </HelpSection>

          {/* ── 14. Class overview ─────────────────────────────────── */}
          <HelpSection
            id="class-overview"
            title={HELP_SECTIONS["class-overview"]}
            icon={<LayoutList className="h-5 w-5 text-primary" />}
          >
            <p>
              Owners of an organization see a <strong>class overview</strong>{" "}
              at the top of the organization page: one row per project, so you
              can see which teams need something without opening each one.
              Projects waiting for your review come first, then projects with
              warnings, then the rest.
            </p>
            <HelpScreenshot
              src="/help/23-class-overview.png"
              alt="The class overview table, one row per project with inspection, protocol, review, sessions, consent, order, co-rating, observation and reflection"
              caption="Four teams at different stages. The first row is waiting for your review."
            />
            <p>
              Each column is the evidence a learning objective asks for, where
              the platform records it:
            </p>
            <ul>
              <li>
                <strong>Inspection</strong>: passes in so far, or merged with
                the share of problems evaluators found in common.
              </li>
              <li>
                <strong>Protocol</strong>: warnings the protocol review still
                raises, such as tasks that lead the participant.
              </li>
              <li>
                <strong>Review</strong>: where the instructor review stands.
              </li>
              <li>
                <strong>Consent</strong>, <strong>Order</strong>,{" "}
                <strong>Co-rated</strong>, <strong>Observed</strong>,{" "}
                <strong>Reflected</strong>: of the completed sessions, how many
                have consent on file, a counterbalanced task order, a second
                rater, an observer, and a submitted reflection. Order is only
                expected once a protocol has four measured tasks.
              </li>
            </ul>
            <p>
              Pilot sessions are not counted, because they rehearse a protocol
              before approval. The overview shows only what you are already
              allowed to read: an inspection still collecting passes shows its
              progress, not its findings.
            </p>
            <p>
              Two things it cannot tell you, so it does not pretend to: whether a
              team's report states the uncertainty of its results, and whether a
              warning was dismissed for a good reason. Those still need reading.
            </p>
          </HelpSection>
        </div>
      </div>
    </PageWrapper>
  );
}
