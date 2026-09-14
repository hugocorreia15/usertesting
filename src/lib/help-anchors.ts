/**
 * Every section of the help page that something else links to. Kept in one
 * place so a link cannot point at a section that does not exist: adding a
 * value here without adding the section fails the help-page test.
 */
export const HELP_SECTIONS = {
  templates: "1. Creating Templates",
  sessions: "2. Creating Sessions",
  live: "3. Running a Live Session",
  participant: "4. Participant Experience",
  analytics: "5. Analytics & Results",
  exports: "6. PDF Exports",
  "participants-mgmt": "7. Managing Participants",
  organizations: "8. Organizations & Classrooms",
  inspection: "9. Heuristic Inspection",
  review: "10. Instructor Review & Consent",
  "co-rating": "11. Observing & Co-rating",
  reflection: "12. Reflection After a Session",
  "data-protection": "13. Anonymizing Participant Data",
} as const;

export type HelpAnchor = keyof typeof HELP_SECTIONS;
