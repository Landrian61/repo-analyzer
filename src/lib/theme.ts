"use client";

import { createTheme, alpha, PaletteMode } from "@mui/material/styles";

// Create theme based on mode
export const getTheme = (mode: PaletteMode) => {
  const isDark = mode === "dark";

  return createTheme({
    palette: {
      mode,
      primary: {
        main: "#8b5cf6", // Purple accent
        light: "#a78bfa",
        dark: "#7c3aed",
      },
      secondary: {
        main: "#6366f1", // Blue-purple
        light: "#818cf8",
        dark: "#4f46e5",
      },
      background: {
        default: isDark ? "#0f0f10" : "#f8fafc", // Deep charcoal / Light gray
        paper: isDark ? "#18181b" : "#ffffff", // Slightly lighter / White
      },
      text: {
        primary: isDark ? "#fafafa" : "#0f172a",
        secondary: isDark ? "#a1a1aa" : "#64748b",
      },
      divider: isDark ? alpha("#ffffff", 0.08) : alpha("#000000", 0.08),
      error: {
        main: "#ef4444",
      },
      warning: {
        main: "#f59e0b",
      },
      success: {
        main: "#10b981",
      },
      info: {
        main: "#3b82f6",
      },
    },
    typography: {
      fontFamily: '"Inter", "system-ui", "Segoe UI", sans-serif',
      h1: {
        fontWeight: 700,
        letterSpacing: "-0.02em",
      },
      h2: {
        fontWeight: 700,
        letterSpacing: "-0.01em",
      },
      h3: {
        fontWeight: 600,
        letterSpacing: "-0.01em",
      },
      h4: {
        fontWeight: 600,
      },
      h5: {
        fontWeight: 600,
      },
      h6: {
        fontWeight: 600,
      },
      body1: {
        lineHeight: 1.6,
      },
      body2: {
        lineHeight: 1.5,
      },
      button: {
        textTransform: "none",
        fontWeight: 500,
      },
    },
    shape: {
      borderRadius: 12,
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            scrollbarColor: isDark ? "#3f3f46 #18181b" : "#cbd5e1 #f1f5f9",
            "&::-webkit-scrollbar": {
              width: 8,
              height: 8,
            },
            "&::-webkit-scrollbar-track": {
              backgroundColor: isDark ? "#18181b" : "#f1f5f9",
            },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: isDark ? "#3f3f46" : "#cbd5e1",
              borderRadius: 4,
              "&:hover": {
                backgroundColor: isDark ? "#52525b" : "#94a3b8",
              },
            },
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            padding: "8px 16px",
            transition: "all 150ms ease-in-out",
            "&:hover": {
              transform: "scale(1.02)",
            },
          },
          contained: {
            boxShadow: "none",
            "&:hover": {
              boxShadow: "0 4px 12px rgba(139, 92, 246, 0.3)",
            },
          },
          outlined: {
            borderColor: isDark ? alpha("#ffffff", 0.12) : alpha("#000000", 0.12),
            "&:hover": {
              borderColor: isDark ? alpha("#ffffff", 0.24) : alpha("#000000", 0.24),
              backgroundColor: isDark ? alpha("#ffffff", 0.04) : alpha("#000000", 0.04),
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundImage: "none",
            backgroundColor: isDark ? "#18181b" : "#ffffff",
            border: `1px solid ${isDark ? alpha("#ffffff", 0.08) : alpha("#000000", 0.08)}`,
            transition: "all 200ms ease-in-out",
            "&:hover": {
              borderColor: isDark ? alpha("#ffffff", 0.16) : alpha("#000000", 0.12),
              boxShadow: isDark
                ? `0 8px 24px ${alpha("#000000", 0.4)}`
                : `0 8px 24px ${alpha("#000000", 0.08)}`,
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: "none",
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            "& .MuiOutlinedInput-root": {
              borderRadius: 8,
              backgroundColor: isDark ? alpha("#ffffff", 0.02) : alpha("#000000", 0.02),
              "& fieldset": {
                borderColor: isDark ? alpha("#ffffff", 0.12) : alpha("#000000", 0.12),
              },
              "&:hover fieldset": {
                borderColor: isDark ? alpha("#ffffff", 0.24) : alpha("#000000", 0.24),
              },
              "&.Mui-focused fieldset": {
                borderColor: "#8b5cf6",
              },
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 6,
          },
          outlined: {
            borderColor: isDark ? alpha("#ffffff", 0.16) : alpha("#000000", 0.16),
          },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            backgroundColor: isDark ? "#27272a" : "#1e293b",
            border: `1px solid ${isDark ? alpha("#ffffff", 0.12) : alpha("#ffffff", 0.08)}`,
            borderRadius: 8,
            fontSize: "0.75rem",
            color: "#ffffff",
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            backgroundImage: "none",
            backgroundColor: isDark ? "#18181b" : "#ffffff",
            border: `1px solid ${isDark ? alpha("#ffffff", 0.12) : alpha("#000000", 0.08)}`,
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundImage: "none",
            backgroundColor: isDark ? "#18181b" : "#ffffff",
            borderRight: `1px solid ${isDark ? alpha("#ffffff", 0.08) : alpha("#000000", 0.08)}`,
          },
        },
      },
      MuiList: {
        styleOverrides: {
          root: {
            padding: 0,
          },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            margin: "2px 8px",
            "&.Mui-selected": {
              backgroundColor: alpha("#8b5cf6", 0.15),
              "&:hover": {
                backgroundColor: alpha("#8b5cf6", 0.2),
              },
            },
            "&:hover": {
              backgroundColor: isDark ? alpha("#ffffff", 0.05) : alpha("#000000", 0.04),
            },
          },
        },
      },
      MuiSkeleton: {
        styleOverrides: {
          root: {
            backgroundColor: isDark ? alpha("#ffffff", 0.08) : alpha("#000000", 0.08),
          },
        },
      },
      MuiAlert: {
        styleOverrides: {
          root: {
            borderRadius: 8,
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            transition: "all 150ms ease-in-out",
            "&:hover": {
              backgroundColor: isDark ? alpha("#ffffff", 0.08) : alpha("#000000", 0.06),
            },
          },
        },
      },
      MuiMenu: {
        styleOverrides: {
          paper: {
            backgroundColor: isDark ? "#1e1e21" : "#ffffff",
            border: `1px solid ${isDark ? alpha("#ffffff", 0.1) : alpha("#000000", 0.08)}`,
          },
        },
      },
      MuiMenuItem: {
        styleOverrides: {
          root: {
            "&:hover": {
              backgroundColor: isDark ? alpha("#ffffff", 0.05) : alpha("#000000", 0.04),
            },
            "&.Mui-selected": {
              backgroundColor: alpha("#8b5cf6", 0.12),
              "&:hover": {
                backgroundColor: alpha("#8b5cf6", 0.16),
              },
            },
          },
        },
      },
    },
  });
};

// Default export for backwards compatibility
const theme = getTheme("dark");
export default theme;
