import { Box, CircularProgress, Typography } from "@mui/material";

export default function Loading() {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#0f0f10",
        gap: 2,
      }}
    >
      <CircularProgress size={40} sx={{ color: "#8b5cf6" }} />
      <Typography variant="body2" sx={{ color: "text.secondary" }}>
        Loading...
      </Typography>
    </Box>
  );
}
