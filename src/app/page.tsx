"use client";

import { useState } from "react";
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  TextField,
  InputAdornment,
  alpha,
  Chip,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import GitHubIcon from "@mui/icons-material/GitHub";
import AutoGraphIcon from "@mui/icons-material/AutoGraph";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Header } from "@/components/Header";
import { RepositoryCard, RepositoryCardSkeleton } from "@/components/RepositoryCard";
import { AddRepositoryDialog } from "@/components/AddRepositoryDialog";

export default function HomePage() {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const repositories = useQuery(api.repositories.list);

  const filteredRepositories = repositories?.filter(
    (repo) =>
      repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      repo.owner.toLowerCase().includes(searchQuery.toLowerCase()) ||
      repo.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isLoading = repositories === undefined;

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", backgroundColor: "background.default" }}>
      <Header />

      <Box sx={{ flexGrow: 1 }}>
        {/* Hero section - more compact */}
        <Container maxWidth="lg" sx={{ pt: 6, pb: 4 }}>
          <Box
            sx={{
              textAlign: "center",
              maxWidth: 700,
              mx: "auto",
            }}
          >
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 1,
                px: 2,
                py: 0.75,
                borderRadius: 3,
                backgroundColor: alpha("#8b5cf6", 0.1),
                border: `1px solid ${alpha("#8b5cf6", 0.2)}`,
                mb: 3,
              }}
            >
              <AutoGraphIcon sx={{ fontSize: 16, color: "#8b5cf6" }} />
              <Typography variant="caption" sx={{ color: "#a78bfa", fontWeight: 500 }}>
                AI-Powered Analysis
              </Typography>
            </Box>

            <Typography
              variant="h3"
              sx={{
                fontWeight: 700,
                mb: 2,
                fontSize: { xs: "1.75rem", sm: "2.25rem", md: "2.75rem" },
                background: (theme) => theme.palette.mode === "dark" 
                  ? "linear-gradient(135deg, #ffffff 0%, #a1a1aa 100%)"
                  : "linear-gradient(135deg, #0f172a 0%, #475569 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                lineHeight: 1.2,
              }}
            >
              Analyze GitHub Repositories
              <br />
              with AI
            </Typography>

            <Typography
              variant="body1"
              sx={{
                color: "text.secondary",
                maxWidth: 500,
                mx: "auto",
                mb: 4,
                fontSize: "1rem",
                lineHeight: 1.6,
              }}
            >
              Get intelligent insights about contributors, pull requests, issues, and collaboration patterns through an interactive chat interface.
            </Typography>

            <Button
              variant="contained"
              size="large"
              startIcon={<AddIcon />}
              onClick={() => setAddDialogOpen(true)}
              sx={{
                px: 4,
                py: 1.5,
                fontSize: "0.95rem",
                borderRadius: 2,
                background: "linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)",
                boxShadow: `0 4px 20px ${alpha("#8b5cf6", 0.3)}`,
                "&:hover": {
                  background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)",
                  boxShadow: `0 6px 24px ${alpha("#8b5cf6", 0.4)}`,
                  transform: "translateY(-1px)",
                },
                transition: "all 200ms ease",
              }}
            >
              Add Repository
            </Button>
          </Box>
        </Container>

        {/* Repository list section */}
        <Container maxWidth="lg" sx={{ pb: 6 }}>
          {(repositories && repositories.length > 0) || isLoading ? (
            <>
              {/* Section header with search */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  mb: 3,
                  gap: 2,
                  flexWrap: "wrap",
                  pt: 2,
                  borderTop: `1px solid ${alpha("#ffffff", 0.06)}`,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Your Repositories
                  </Typography>
                  {repositories && (
                    <Chip
                      label={repositories.length}
                      size="small"
                      sx={{
                        backgroundColor: alpha("#8b5cf6", 0.15),
                        color: "#a78bfa",
                        fontWeight: 600,
                        fontSize: "0.75rem",
                        height: 24,
                      }}
                    />
                  )}
                </Box>

                <TextField
                  size="small"
                  placeholder="Search repositories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: "text.secondary", fontSize: 18 }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ 
                    minWidth: 260,
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                      backgroundColor: alpha("#ffffff", 0.03),
                    },
                  }}
                />
              </Box>

              {/* Repository grid */}
              <Grid container spacing={2.5}>
                {isLoading ? (
                  // Loading skeletons
                  Array.from({ length: 6 }).map((_, index) => (
                    <Grid item xs={12} sm={6} md={4} key={index}>
                      <RepositoryCardSkeleton />
                    </Grid>
                  ))
                ) : filteredRepositories && filteredRepositories.length > 0 ? (
                  // Repository cards
                  filteredRepositories.map((repo) => (
                    <Grid item xs={12} sm={6} md={4} key={repo._id}>
                      <RepositoryCard
                        id={repo._id}
                        name={repo.name}
                        owner={repo.owner}
                        fullName={repo.fullName}
                        description={repo.description}
                        language={repo.metadata.language}
                        stars={repo.metadata.stars}
                        forks={repo.metadata.forks}
                        contributors={repo.metadata.contributors}
                        openIssues={repo.metadata.openIssues}
                        avatarUrl={repo.metadata.avatarUrl}
                        lastAnalyzedAt={repo.lastAnalyzedAt}
                      />
                    </Grid>
                  ))
                ) : (
                  // No results
                  <Grid item xs={12}>
                    <Box
                      sx={{
                        textAlign: "center",
                        py: 6,
                        color: "text.secondary",
                      }}
                    >
                      <SearchIcon sx={{ fontSize: 40, mb: 1.5, opacity: 0.4 }} />
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        No repositories found
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.7 }}>
                        Try adjusting your search query
                      </Typography>
                    </Box>
                  </Grid>
                )}
              </Grid>
            </>
          ) : (
            // Empty state
            <Box
              sx={{
                textAlign: "center",
                py: 8,
                px: 4,
                borderRadius: 3,
                border: `1px dashed ${alpha("#ffffff", 0.12)}`,
                backgroundColor: alpha("#ffffff", 0.02),
                maxWidth: 500,
                mx: "auto",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 64,
                  height: 64,
                  borderRadius: "50%",
                  backgroundColor: alpha("#8b5cf6", 0.1),
                  border: `1px solid ${alpha("#8b5cf6", 0.2)}`,
                  mx: "auto",
                  mb: 3,
                }}
              >
                <GitHubIcon sx={{ fontSize: 32, color: "#8b5cf6" }} />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                No repositories yet
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: "text.secondary", mb: 3 }}
              >
                Add your first GitHub repository to start analyzing it with AI-powered insights.
              </Typography>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() => setAddDialogOpen(true)}
                sx={{
                  borderColor: alpha("#8b5cf6", 0.5),
                  color: "#a78bfa",
                  "&:hover": {
                    borderColor: "#8b5cf6",
                    backgroundColor: alpha("#8b5cf6", 0.1),
                  },
                }}
              >
                Add Repository
              </Button>
            </Box>
          )}
        </Container>
      </Box>

      {/* Footer */}
      <Box
        component="footer"
        sx={{
          py: 2.5,
          textAlign: "center",
          borderTop: `1px solid ${alpha("#ffffff", 0.06)}`,
          color: "text.secondary",
        }}
      >
        <Typography variant="caption">
          Built with Next.js, Convex, and Google Gemini AI
        </Typography>
      </Box>

      {/* Add Repository Dialog */}
      <AddRepositoryDialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
      />
    </Box>
  );
}
