"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardActionArea,
  Box,
  Typography,
  Chip,
  IconButton,
  Avatar,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  alpha,
  Skeleton,
} from "@mui/material";
import StarIcon from "@mui/icons-material/Star";
import ForkRightIcon from "@mui/icons-material/ForkRight";
import PeopleIcon from "@mui/icons-material/People";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import BugReportIcon from "@mui/icons-material/BugReport";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

// Fixed card height for consistency
const CARD_HEIGHT = 220;

interface RepositoryCardProps {
  id: Id<"repositories">;
  name: string;
  owner: string;
  fullName: string;
  description?: string;
  language?: string;
  stars: number;
  forks: number;
  contributors: number;
  openIssues: number;
  avatarUrl?: string;
  lastAnalyzedAt?: number;
}

// Language color mapping
const languageColors: Record<string, string> = {
  TypeScript: "#3178c6",
  JavaScript: "#f7df1e",
  Python: "#3776ab",
  Rust: "#dea584",
  Go: "#00add8",
  Java: "#b07219",
  "C++": "#f34b7d",
  C: "#555555",
  Ruby: "#cc342d",
  PHP: "#4f5d95",
  Swift: "#fa7343",
  Kotlin: "#a97bff",
  Dart: "#00b4ab",
  Vue: "#41b883",
  HTML: "#e34c26",
  CSS: "#563d7c",
  Shell: "#89e051",
  Scala: "#c22d40",
};

export function RepositoryCard({
  id,
  name,
  owner,
  fullName,
  description,
  language,
  stars,
  forks,
  contributors,
  openIssues,
  avatarUrl,
  lastAnalyzedAt,
}: RepositoryCardProps) {
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const removeRepository = useMutation(api.repositories.remove);

  const handleClick = () => {
    router.push(`/repo/${id}`);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      await removeRepository({ id });
    } catch (error) {
      console.error("Failed to delete repository:", error);
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <>
      <Card
        sx={{
          height: CARD_HEIGHT,
          display: "flex",
          flexDirection: "column",
          position: "relative",
          "&:hover .delete-button": {
            opacity: 1,
          },
        }}
      >
        <CardActionArea
          onClick={handleClick}
          sx={{
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "stretch",
            justifyContent: "flex-start",
          }}
        >
          <CardContent 
            sx={{ 
              p: 2.5,
              height: "100%",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Header with avatar and name */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
              <Avatar
                src={avatarUrl}
                alt={owner}
                sx={{
                  width: 40,
                  height: 40,
                  border: `1px solid ${alpha("#ffffff", 0.1)}`,
                }}
              >
                {owner[0]?.toUpperCase()}
              </Avatar>
              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Typography
                  variant="caption"
                  sx={{
                    color: "text.secondary",
                    fontSize: "0.7rem",
                    display: "block",
                    lineHeight: 1.2,
                  }}
                >
                  {owner}
                </Typography>
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: 600,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    lineHeight: 1.3,
                    fontSize: "0.95rem",
                  }}
                >
                  {name}
                </Typography>
              </Box>
            </Box>

            {/* Description - fixed height */}
            <Typography
              variant="body2"
              sx={{
                color: "text.secondary",
                fontSize: "0.8rem",
                lineHeight: 1.4,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                height: 36, // Fixed height for 2 lines
                mb: 1.5,
              }}
            >
              {description || "No description available"}
            </Typography>

            {/* Language and stats row */}
            <Box 
              sx={{ 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "space-between",
                mb: 1.5,
                minHeight: 24,
              }}
            >
              {/* Language badge */}
              {language ? (
                <Chip
                  size="small"
                  label={language}
                  sx={{
                    backgroundColor: alpha(languageColors[language] || "#888", 0.15),
                    color: languageColors[language] || "#888",
                    fontWeight: 500,
                    fontSize: "0.65rem",
                    height: 22,
                    "& .MuiChip-label": {
                      px: 0.75,
                    },
                  }}
                  icon={
                    <Box
                      sx={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        backgroundColor: languageColors[language] || "#888",
                        ml: 0.75,
                      }}
                    />
                  }
                />
              ) : (
                <Box /> // Empty placeholder to maintain layout
              )}

              {/* Stats inline */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Tooltip title="Stars" arrow>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.3 }}>
                    <StarIcon sx={{ fontSize: 14, color: "#f59e0b" }} />
                    <Typography variant="caption" sx={{ fontWeight: 500, fontSize: "0.7rem" }}>
                      {formatNumber(stars)}
                    </Typography>
                  </Box>
                </Tooltip>

                <Tooltip title="Forks" arrow>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.3 }}>
                    <ForkRightIcon sx={{ fontSize: 14, color: "text.secondary" }} />
                    <Typography variant="caption" sx={{ fontWeight: 500, fontSize: "0.7rem" }}>
                      {formatNumber(forks)}
                    </Typography>
                  </Box>
                </Tooltip>

                <Tooltip title="Contributors" arrow>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.3 }}>
                    <PeopleIcon sx={{ fontSize: 14, color: "#8b5cf6" }} />
                    <Typography variant="caption" sx={{ fontWeight: 500, fontSize: "0.7rem" }}>
                      {formatNumber(contributors)}
                    </Typography>
                  </Box>
                </Tooltip>

                <Tooltip title="Open Issues" arrow>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.3 }}>
                    <BugReportIcon sx={{ fontSize: 14, color: "#10b981" }} />
                    <Typography variant="caption" sx={{ fontWeight: 500, fontSize: "0.7rem" }}>
                      {formatNumber(openIssues)}
                    </Typography>
                  </Box>
                </Tooltip>
              </Box>
            </Box>

            {/* Spacer to push footer to bottom */}
            <Box sx={{ flexGrow: 1 }} />

            {/* Last analyzed - always at bottom */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.5,
                color: "text.secondary",
                pt: 1.5,
                borderTop: `1px solid ${alpha("#ffffff", 0.06)}`,
              }}
            >
              <AccessTimeIcon sx={{ fontSize: 12 }} />
              <Typography variant="caption" sx={{ fontSize: "0.7rem" }}>
                {lastAnalyzedAt ? `Analyzed ${formatDate(lastAnalyzedAt)}` : "Not analyzed yet"}
              </Typography>
            </Box>
          </CardContent>
        </CardActionArea>

        {/* Delete button */}
        <IconButton
          className="delete-button"
          onClick={handleDelete}
          sx={{
            position: "absolute",
            top: 8,
            right: 8,
            opacity: 0,
            transition: "opacity 200ms ease-in-out",
            backgroundColor: alpha("#ef4444", 0.1),
            width: 32,
            height: 32,
            "&:hover": {
              backgroundColor: alpha("#ef4444", 0.2),
            },
          }}
          size="small"
        >
          <DeleteOutlineIcon sx={{ fontSize: 16, color: "#ef4444" }} />
        </IconButton>
      </Card>

      {/* Delete confirmation dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        PaperProps={{
          sx: {
            minWidth: 360,
            borderRadius: 3,
          },
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>Delete Repository?</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontSize: "0.9rem" }}>
            Are you sure you want to delete <strong>{fullName}</strong>? This will also delete all
            associated chats and analysis history. This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 1 }}>
          <Button 
            onClick={() => setDeleteDialogOpen(false)} 
            disabled={isDeleting}
            sx={{ borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button
            onClick={confirmDelete}
            color="error"
            variant="contained"
            disabled={isDeleting}
            sx={{ borderRadius: 2 }}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

// Loading skeleton for repository card - same fixed height
export function RepositoryCardSkeleton() {
  return (
    <Card sx={{ height: CARD_HEIGHT }}>
      <CardContent sx={{ p: 2.5, height: "100%", display: "flex", flexDirection: "column" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
          <Skeleton variant="circular" width={40} height={40} />
          <Box sx={{ flexGrow: 1 }}>
            <Skeleton variant="text" width={60} height={14} />
            <Skeleton variant="text" width={120} height={22} />
          </Box>
        </Box>
        <Skeleton variant="text" width="100%" height={16} />
        <Skeleton variant="text" width="70%" height={16} sx={{ mb: 1.5 }} />
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1.5 }}>
          <Skeleton variant="rounded" width={70} height={22} />
          <Box sx={{ display: "flex", gap: 1.5 }}>
            <Skeleton variant="text" width={30} height={18} />
            <Skeleton variant="text" width={30} height={18} />
            <Skeleton variant="text" width={30} height={18} />
          </Box>
        </Box>
        <Box sx={{ flexGrow: 1 }} />
        <Box sx={{ pt: 1.5, borderTop: `1px solid ${alpha("#ffffff", 0.06)}` }}>
          <Skeleton variant="text" width={100} height={14} />
        </Box>
      </CardContent>
    </Card>
  );
}
