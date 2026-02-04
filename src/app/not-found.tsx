import { Box, Typography, Button, alpha } from "@mui/material";
import SearchOffIcon from "@mui/icons-material/SearchOff";
import Link from "next/link";

export default function NotFound() {
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
          backgroundColor: alpha("#8b5cf6", 0.1),
          mb: 3,
        }}
      >
        <SearchOffIcon sx={{ fontSize: 40, color: "#8b5cf6" }} />
      </Box>

      <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
        404
      </Typography>

      <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
        Page Not Found
      </Typography>

      <Typography
        variant="body1"
        sx={{ color: "text.secondary", maxWidth: 400, mb: 3 }}
      >
        The page you're looking for doesn't exist or has been moved.
      </Typography>

      <Link href="/" style={{ textDecoration: "none" }}>
        <Button
          variant="contained"
          sx={{
            background: "linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)",
            "&:hover": {
              background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)",
            },
          }}
        >
          Go Home
        </Button>
      </Link>
    </Box>
  );
}
