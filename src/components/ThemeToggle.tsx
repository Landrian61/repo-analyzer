"use client";

import { IconButton, Tooltip, alpha } from "@mui/material";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import { useThemeMode } from "@/lib/ThemeContext";

interface ThemeToggleProps {
  size?: "small" | "medium";
}

export function ThemeToggle({ size = "medium" }: ThemeToggleProps) {
  const { mode, toggleTheme } = useThemeMode();
  const isDark = mode === "dark";

  return (
    <Tooltip title={isDark ? "Switch to light mode" : "Switch to dark mode"}>
      <IconButton
        onClick={toggleTheme}
        size={size}
        sx={{
          color: "text.primary",
          backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.08),
          border: (theme) => `1px solid ${alpha(theme.palette.divider, 1)}`,
          "&:hover": {
            backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.16),
          },
          transition: "all 200ms ease-in-out",
        }}
      >
        {isDark ? (
          <LightModeIcon sx={{ fontSize: size === "small" ? 18 : 20 }} />
        ) : (
          <DarkModeIcon sx={{ fontSize: size === "small" ? 18 : 20 }} />
        )}
      </IconButton>
    </Tooltip>
  );
}
