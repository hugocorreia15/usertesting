import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";

const { fontFamily: sans } = loadInter("normal", {
  weights: ["400", "500", "600", "700", "800"],
  subsets: ["latin"],
});

const { fontFamily: mono } = loadMono("normal", {
  weights: ["500", "700"],
  subsets: ["latin"],
});

/**
 * Brand tokens lifted from the Avalux app (`src/index.css`) and `public/logo.svg`
 * so the videos read as the product rather than as a template.
 */
export const theme = {
  font: { sans, mono },

  color: {
    ground: "#fafaff",
    card: "#ffffff",
    sidebar: "#f5f5ff",
    ink: "#1e1b4b",
    inkMuted: "#6b7280",
    inkSoft: "#9ca3af",
    primary: "#6366f1",
    primaryInk: "#3730a3",
    primarySoft: "#eef2ff",
    violet: "#8b5cf6",
    accent: "#14b8a6",
    accentSoft: "#ccfbf1",
    border: "#e0e0f0",
    mark: "#468ac7",
    success: "#16a34a",
    warning: "#ca8a04",
    danger: "#ef4444",
    white: "#ffffff",
  },

  gradient: "linear-gradient(135deg, #6366f1, #8b5cf6, #14b8a6)",

  radius: { sm: 8, md: 14, lg: 22, xl: 32, pill: 999 },

  shadow: {
    card: "0 18px 50px rgba(30, 27, 75, 0.10), 0 2px 8px rgba(30, 27, 75, 0.05)",
    lift: "0 34px 90px rgba(30, 27, 75, 0.18), 0 4px 12px rgba(30, 27, 75, 0.06)",
    glow: "0 0 40px rgba(99, 102, 241, 0.28), 0 0 14px rgba(99, 102, 241, 0.18)",
  },

  /** Type scale for a 1920px-wide composition. */
  size: {
    hero: 118,
    h1: 92,
    h2: 68,
    h3: 52,
    body: 44,
    small: 34,
    tiny: 27,
    micro: 22,
  },

  /** Keep key content inside this margin. */
  safe: { x: 150, y: 110 },
} as const;

/** Standard eased entry used across every scene. */
export const EASE_OUT = [0.16, 1, 0.3, 1] as const;
