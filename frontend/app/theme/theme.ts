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
  }
  interface PaletteOptions {
    header?: { main: string };
    brand?: { name: string };
    filterBar?: { main: string };
    toyCard?: { main: string };
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

const fontFamily: string = [
  "system-ui",
  "-apple-system",
  "Segoe UI",
  "Roboto",
  "sans-serif",
].join(", ");

const typography: TypographyVariantsOptions = {
  fontFamily,
  pageTitle: {
    fontFamily,
    fontSize: "2.25rem",
    fontWeight: 700,
    lineHeight: 1.2,
    letterSpacing: "-0.02em",
  },
  sectionTitle: {
    fontFamily,
    fontSize: "1.5rem",
    fontWeight: 600,
    lineHeight: 1.3,
  },
  bodyStrong: {
    fontFamily,
    fontSize: "1rem",
    fontWeight: 600,
    lineHeight: 1.5,
  },
  label: {
    fontFamily,
    fontSize: "0.75rem",
    fontWeight: 500,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },
  navTitle: {
    fontFamily,
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
  },
  spacing: 8,
  shape: { borderRadius: 8 },
  layout: { sidebarWidth: 220 },
  typography,
};

export const theme: Theme = createTheme(themeOptions);
