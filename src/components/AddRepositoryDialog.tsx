"use client";

import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  Alert,
  CircularProgress,
  alpha,
} from "@mui/material";
import LinkIcon from "@mui/icons-material/Link";
import { useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useToast } from "./Toast";

interface AddRepositoryDialogProps {
  open: boolean;
  onClose: () => void;
}

// Parse GitHub URL to extract owner and repo
function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  // Clean up the URL
  url = url.trim();

  // Handle various GitHub URL formats
  const patterns = [
    // https://github.com/owner/repo
    /^https?:\/\/(?:www\.)?github\.com\/([^\/]+)\/([^\/\s?#]+)/i,
    // github.com/owner/repo
    /^(?:www\.)?github\.com\/([^\/]+)\/([^\/\s?#]+)/i,
    // owner/repo format
    /^([^\/\s]+)\/([^\/\s]+)$/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return {
        owner: match[1],
        repo: match[2].replace(/\.git$/, ""), // Remove .git suffix if present
      };
    }
  }

  return null;
}

export function AddRepositoryDialog({ open, onClose }: AddRepositoryDialogProps) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { showSuccess, showError: showToastError } = useToast();

  const addRepository = useMutation(api.repositories.add);
  const fetchRepository = useAction(api.github.fetchRepository);

  const handleClose = () => {
    if (!isLoading) {
      setUrl("");
      setError(null);
      onClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Parse the URL
    const parsed = parseGitHubUrl(url);
    if (!parsed) {
      setError("Please enter a valid GitHub repository URL (e.g., https://github.com/owner/repo)");
      return;
    }

    setIsLoading(true);

    try {
      // Fetch repository data from GitHub
      const repoData = await fetchRepository({
        owner: parsed.owner,
        repo: parsed.repo,
      });

      // Add repository to database
      await addRepository({
        url: repoData.url,
        owner: repoData.owner,
        name: repoData.name,
        fullName: repoData.fullName,
        description: repoData.description,
        defaultBranch: repoData.defaultBranch,
        metadata: {
          stars: repoData.stars,
          forks: repoData.forks,
          language: repoData.language,
          contributors: repoData.contributors,
          openIssues: repoData.openIssues,
          avatarUrl: repoData.avatarUrl,
        },
      });

      // Success - close dialog and show toast
      setUrl("");
      showSuccess(`Repository ${repoData.fullName} added successfully!`);
      onClose();
    } catch (err: any) {
      const errorMessage = err.message || "Failed to add repository. Please try again.";
      setError(errorMessage);
      showToastError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
        },
      }}
    >
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <LinkIcon sx={{ color: "primary.main" }} />
            <Typography variant="h6" component="span">
              Add Repository
            </Typography>
          </Box>
        </DialogTitle>

        <DialogContent>
          <Typography variant="body2" sx={{ color: "text.secondary", mb: 3 }}>
            Enter a GitHub repository URL to start analyzing it with AI.
          </Typography>

          <TextField
            autoFocus
            fullWidth
            label="Repository URL"
            placeholder="https://github.com/owner/repo"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setError(null);
            }}
            disabled={isLoading}
            InputProps={{
              startAdornment: (
                <Box sx={{ mr: 1, color: "text.secondary" }}>
                  <LinkIcon sx={{ fontSize: 20 }} />
                </Box>
              ),
            }}
            sx={{ mb: 2 }}
          />

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box
            sx={{
              p: 2,
              borderRadius: 2,
              backgroundColor: alpha("#8b5cf6", 0.08),
              border: `1px solid ${alpha("#8b5cf6", 0.2)}`,
            }}
          >
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              <strong>Supported formats:</strong>
              <br />
              • https://github.com/owner/repo
              <br />
              • github.com/owner/repo
              <br />
              • owner/repo
            </Typography>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isLoading || !url.trim()}
            sx={{ minWidth: 140 }}
          >
            {isLoading ? (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <CircularProgress size={18} color="inherit" />
                <span>Adding...</span>
              </Box>
            ) : (
              "Add Repository"
            )}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
