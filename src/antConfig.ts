// src/shared/theme/antd.theme.ts
import type { ThemeConfig } from "antd";
import { theme as antdTheme } from "antd";

/**
 * Charte "Arianespace-like" (approx)
 * Primary: #007BC4
 * Ink (text): #0B1F3B
 */
const BRAND = {
  primary: "#0069c8",
  ink: "#0B1F3B",
  inkMuted: "rgba(11,31,59,0.68)",
  border: "rgba(11,31,59,0.12)",
  layout: "#F5F7FA", // fond pages
  container: "#FFFFFF",
};

export const antdConfig: ThemeConfig = {
  algorithm: antdTheme.defaultAlgorithm,    
  token: {
    // Couleurs globales
    colorPrimary: BRAND.primary,
    colorInfo: BRAND.primary,
    colorLink: BRAND.primary,
    colorLinkHover: "#005E97",
    colorLinkActive: "#004E7D",

    colorTextBase: BRAND.ink,
    colorTextSecondary: BRAND.inkMuted,

    colorBgLayout: BRAND.layout,
    colorBgContainer: BRAND.container,

    colorBorder: BRAND.border,

    // Rendus
    borderRadius: 12,
    wireframe: false,

    // Typos
    // dans le cas ou j'ai plussieurs polices, je les mets dans l'ordre de préférence (la première est la plus prioritaire) Akrobat et Open Sans

    fontFamily: '"Open Sans", "Akrobat", -apple-system, Segoe UI, Roboto, Arial, sans-serif',


    fontSize: 14,
    fontSizeHeading1: 24,
    fontSizeHeading2: 22,
    fontSizeHeading3: 20,
    fontSizeHeading4: 18,
    fontSizeHeading5: 16,
    


    // Optionnel: focus plus "corporate"
    controlOutline: "rgba(0, 123, 196, 0.22)",
  },

  components: {
    Layout: {
      bodyBg: BRAND.layout,
      headerBg: BRAND.container,
      siderBg: BRAND.container,
    },

    Card: {
      borderRadiusLG: 12,
      paddingLG: 24,
      colorBorderSecondary: BRAND.border,
    },

    Button: {
      borderRadius: 10,
      controlHeight: 40,
      fontWeight: 700,
    },

    Tag: {
      borderRadiusSM: 999,
      fontSizeSM: 12,
    },

    Typography: {
      titleMarginTop: 0,
      titleMarginBottom: 8,
    },

    Divider: {
      colorSplit: BRAND.border,
    },

    Table: {
      borderRadiusLG: 12,
      colorBorderSecondary: BRAND.border,
    },

    Modal: {
      borderRadiusLG: 12,
    },

    Popover: {
      borderRadiusLG: 12,
    },

    Input: {
      borderRadius: 10,
      controlHeight: 40,
    },

    Select: {
      borderRadius: 10,
      controlHeight: 40,
    },
  },
};

export default antdConfig;
