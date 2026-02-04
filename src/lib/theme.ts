"use client";

import { createTheme, alpha } from "@mui/material/styles";

// Graphite-inspired dark theme
const theme = createTheme({
  palette: {
    mode: "dark",
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
      default: "#0f0f10", // Deep charcoal
      paper: "#18181b", // Slightly lighter
    },
    text: {
      primary: "#fafafa",
      secondary: "#a1a1aa",
    },
    divider: alpha("#ffffff", 0.08),
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
          scrollbarColor: "#3f3f46 #18181b",
          "&::-webkit-scrollbar": {
            width: 8,
            height: 8,
          },
          "&::-webkit-scrollbar-track": {
            backgroundColor: "#18181b",
          },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: "#3f3f46",
            borderRadius: 4,
            "&:hover": {
              backgroundColor: "#52525b",
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
          borderColor: alpha("#ffffff", 0.12),
          "&:hover": {
            borderColor: alpha("#ffffff", 0.24),
            backgroundColor: alpha("#ffffff", 0.04),
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          backgroundColor: "#18181b",
          border: `1px solid ${alpha("#ffffff", 0.08)}`,
          transition: "all 200ms ease-in-out",
          "&:hover": {
            borderColor: alpha("#ffffff", 0.16),
            boxShadow: `0 8px 24px ${alpha("#000000", 0.4)}`,
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
            backgroundColor: alpha("#ffffff", 0.02),
            "& fieldset": {
              borderColor: alpha("#ffffff", 0.12),
            },
            "&:hover fieldset": {
              borderColor: alpha("#ffffff", 0.24),
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
          borderColor: alpha("#ffffff", 0.16),
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: "#27272a",
          border: `1px solid ${alpha("#ffffff", 0.12)}`,
          borderRadius: 8,
          fontSize: "0.75rem",
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundImage: "none",
          backgroundColor: "#18181b",
          border: `1px solid ${alpha("#ffffff", 0.12)}`,
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundImage: "none",
          backgroundColor: "#18181b",
          borderRight: `1px solid ${alpha("#ffffff", 0.08)}`,
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
            backgroundColor: alpha("#ffffff", 0.05),
          },
        },
      },
    },
    MuiSkeleton: {
      styleOverrides: {
        root: {
          backgroundColor: alpha("#ffffff", 0.08),
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
            backgroundColor: alpha("#ffffff", 0.08),
          },
        },
      },
    },
  },
});

export default theme;
