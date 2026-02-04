"use client";

import { useEffect } from "react";
import { Box, Typography, Button, alpha } from "@mui/material";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#0f0f10",
        p: 4,
        textAlign: "center",
      }}
    >
      <Box
        sx={{
          width: 80,
          height: 80,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: alpha("#ef4444", 0.1),
          mb: 3,
        }}
      >
        <ErrorOutlineIcon sx={{ fontSize: 40, color: "#ef4444" }} />
      </Box>

      <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
        Something went wrong!
      </Typography>

      <Typography
        variant="body1"
        sx={{ color: "text.secondary", maxWidth: 400, mb: 3 }}
      >
        An unexpected error occurred. Please try again or contact support if the
        problem persists.
      </Typography>

      <Box sx={{ display: "flex", gap: 2 }}>
        <Button variant="outlined" onClick={() => window.location.href = "/"}>
          Go Home
        </Button>
        <Button
          variant="contained"
          onClick={reset}
          sx={{
            background: "linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)",
            "&:hover": {
              background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)",
            },
          }}
        >
          Try Again
        </Button>
      </Box>
    </Box>
  );
}
