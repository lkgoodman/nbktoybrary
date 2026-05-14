"use client";

import {
  createTheme,
  type Theme,
  type ThemeOptions,
  type TypographyVariantsOptions,
} from "@mui/material/styles";

// Extend MUI's variants with project-specific ones. Every place that renders
// text must pick one of these variants — no inline font sizes/weights/colors.
declare module "@mui/material/styles" {
  interface TypographyVariants {
    pageTitle: React.CSSProperties;
    sectionTitle: React.CSSProperties;
    bodyStrong: React.CSSProperties;
    label: React.CSSProperties;
    navTitle: React.CSSProperties;
  }
  interface TypographyVariantsOptions {
    pageTitle?: React.CSSProperties;
    sectionTitle?: React.CSSProperties;
    bodyStrong?: React.CSSProperties;
    label?: React.CSSProperties;
    navTitle?: React.CSSProperties;
  }
  interface Palette {
    header: { main: string };
    brand: { name: string };
    filterBar: { main: string };
    toyCard: { main: string };
    cartAction: { main: string; contrastText: string };
  }
  interface PaletteOptions {
    header?: { main: string };
    brand?: { name: string };
    filterBar?: { main: string };
    toyCard?: { main: string };
    cartAction?: { main: string; contrastText: string };
  }
  interface Theme {
    layout: { sidebarWidth: number };
  }
  interface ThemeOptions {
    layout?: { sidebarWidth?: number };
  }
}

declare module "@mui/material/Typography" {
  interface TypographyPropsVariantOverrides {
    pageTitle: true;
    sectionTitle: true;
    bodyStrong: true;
    label: true;
    navTitle: true;
  }
}

// Space Mono: display/heading font (matches nbktoybrary.org)
// DM Sans: body/UI font (closest free substitute for Halyard Micro used on nbktoybrary.org)
const displayFont: string = ["var(--font-space-mono)", "monospace"].join(", ");
const bodyFont: string = ["var(--font-dm-sans)", "system-ui", "-apple-system", "sans-serif"].join(", ");

const typography: TypographyVariantsOptions = {
  fontFamily: bodyFont,
  pageTitle: {
    fontFamily: displayFont,
    fontSize: "2.25rem",
    fontWeight: 700,
    lineHeight: 1.2,
  },
  sectionTitle: {
    fontFamily: displayFont,
    fontSize: "1rem",
    fontWeight: 700,
    lineHeight: 1.3,
    letterSpacing: "0.02em",
  },
  bodyStrong: {
    fontFamily: bodyFont,
    fontSize: "1rem",
    fontWeight: 600,
    lineHeight: 1.5,
  },
  label: {
    fontFamily: bodyFont,
    fontSize: "0.75rem",
    fontWeight: 500,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },
  navTitle: {
    fontFamily: displayFont,
    fontSize: "1.5rem",
    fontWeight: 700,
    lineHeight: 1.3,
  },
};

const themeOptions: ThemeOptions = {
  palette: {
    mode: "light",
    primary: { main: "#1f2937" },
    secondary: { main: "#6366f1" },
    background: { default: "#FBF5EF", paper: "#f9fafb" },
    text: { primary: "#111827", secondary: "#4b5563" },
    header: { main: "#ED6B2D" },
    brand: { name: "#000000" },
    filterBar: { main: "#C1B2F0" },
    toyCard: { main: "#EFF483" },
    cartAction: { main: "#194027", contrastText: "#ffffff" },
  },
  spacing: 8,
  shape: { borderRadius: 8 },
  layout: { sidebarWidth: 220 },
  typography,
};

export const theme: Theme = createTheme(themeOptions);
