export type NavItem = {
  label: string;
  href: string;
  icon: string;
  children?: { label: string; href: string }[];
};

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/", icon: "LayoutDashboard" },
  { label: "Templates", href: "/templates", icon: "FileText" },
  { label: "Participants", href: "/participants", icon: "Users" },
  { label: "Sessions", href: "/sessions", icon: "ClipboardList" },
  { label: "Analytics", href: "/analytics", icon: "BarChart3" },
];

export const TASK_COMPLEXITY = ["simple", "complex"] as const;
export type TaskComplexity = (typeof TASK_COMPLEXITY)[number];

export const COMPLETION_STATUS = ["success", "partial", "failure", "skipped"] as const;
export type CompletionStatus = (typeof COMPLETION_STATUS)[number];

export const SEQ_SCALE = [1, 2, 3, 4, 5, 6, 7] as const;

export const SESSION_STATUS = ["planned", "in_progress", "completed"] as const;
export type SessionStatus = (typeof SESSION_STATUS)[number];
