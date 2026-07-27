/**
 * Centralized logo configuration for JobNova branding.
 * Update paths here once to propagate everywhere.
 */

export const LOGO = {
  /** Full primary logo — used on landing page hero, footer */
  primary: "/logo/primary logo/primary logo.png.jpeg",

  /** Light background variant — used in navbar, light sections */
  light: "/logo/light background/light background .png",

  /** Dark background variant — used in dark sections, dark mode */
  dark: "/logo/dark background/dark background.png",

  /** Icon only — used in sidebar, favicon, PWA icon, browser tab */
  icon: "/logo/icon only/icon only.png",

  /** Lettermark (JN) — used on auth pages, compact branding */
  lettermark: "/logo/lettermark (JN)/lettermark.png",

  /** App icon — used for PWA, mobile splash */
  appIcon: "/logo/app icon/app icon.png",
} as const;

/** Alt text for accessibility */
export const LOGO_ALT = {
  primary: "JobNova — AI-Powered Job Platform",
  light: "JobNova Logo",
  dark: "JobNova Logo",
  icon: "JobNova Icon",
  lettermark: "JN — JobNova",
  appIcon: "JobNova App",
} as const;

/** Brand colors */
export const BRAND = {
  name: "JobNova",
  tagline: "AI-Powered Job Platform",
  themeColor: "#2563eb",
  backgroundColor: "#ffffff",
  version: "1.0.0",
} as const;
