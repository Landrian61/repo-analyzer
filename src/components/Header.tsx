"use client";

import { Box, Typography, alpha, useTheme } from "@mui/material";
import AutoGraphIcon from "@mui/icons-material/AutoGraph";
import { ModelSelector } from "./ModelSelector";
import { ThemeToggle } from "./ThemeToggle";

export function Header() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  return (
    <Box
      component="header"
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 2,
        py: 2,
        px: 4,
        borderBottom: `1px solid ${alpha(isDark ? "#ffffff" : "#000000", 0.06)}`,
        backgroundColor: alpha(isDark ? "#0f0f10" : "#ffffff", 0.95),
        backdropFilter: "blur(12px)",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}
    >
      {/* Logo and title */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 36,
            height: 36,
            borderRadius: 2,
            background: "linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)",
          }}
        >
          <AutoGraphIcon sx={{ color: "white", fontSize: 20 }} />
        </Box>
        <Box>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              fontSize: "1.1rem",
              background: "linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              letterSpacing: "-0.02em",
              lineHeight: 1.2,
            }}
          >
            Repo Analyzer
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: "text.secondary",
              display: "block",
              fontSize: "0.65rem",
              mt: -0.25,
            }}
          >
            AI-Powered GitHub Analysis
          </Typography>
        </Box>
      </Box>

      {/* Model selector and theme toggle */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        <ModelSelector />
        <ThemeToggle />
      </Box>
    </Box>
  );
}
