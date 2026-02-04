"use client";

import { useState } from "react";
import {
  Box,
  Typography,
  Button,
  List,
  ListItemButton,
  ListItemText,
  Avatar,
  IconButton,
  Tooltip,
  alpha,
  Skeleton,
  Drawer,
  useMediaQuery,
  useTheme,
  Divider,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import MenuIcon from "@mui/icons-material/Menu";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import HomeIcon from "@mui/icons-material/Home";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

interface Chat {
  _id: Id<"chats">;
  title: string;
  createdAt: number;
  updatedAt: number;
}

interface Repository {
  _id: Id<"repositories">;
  name: string;
  owner: string;
  metadata: {
    avatarUrl?: string;
  };
}

interface ChatSidebarProps {
  repository: Repository;
  chats: Chat[] | undefined;
  activeChatId: Id<"chats"> | null;
  onSelectChat: (chatId: Id<"chats">) => void;
  onNewChat: () => void;
  mobileOpen: boolean;
  onMobileToggle: () => void;
}

const SIDEBAR_WIDTH = 280;

export function ChatSidebar({
  repository,
  chats,
  activeChatId,
  onSelectChat,
  onNewChat,
  mobileOpen,
  onMobileToggle,
}: ChatSidebarProps) {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const removeChat = useMutation(api.chats.remove);

  const handleDeleteChat = async (e: React.MouseEvent, chatId: Id<"chats">) => {
    e.stopPropagation();
    try {
      await removeChat({ id: chatId });
    } catch (error) {
      console.error("Failed to delete chat:", error);
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

  const sidebarContent = (
    <Box
      sx={{
        width: SIDEBAR_WIDTH,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        backgroundColor: (theme) => theme.palette.mode === "dark" ? "#111113" : "#f8fafc",
        borderRight: (theme) => `1px solid ${alpha(theme.palette.mode === "dark" ? "#ffffff" : "#000000", 0.06)}`,
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2,
          borderBottom: (theme) => `1px solid ${alpha(theme.palette.mode === "dark" ? "#ffffff" : "#000000", 0.06)}`,
        }}
      >
        {/* Back to home */}
        <Button
          startIcon={<HomeIcon sx={{ fontSize: 18 }} />}
          onClick={() => router.push("/")}
          size="small"
          sx={{
            mb: 2,
            color: "text.secondary",
            justifyContent: "flex-start",
            textTransform: "none",
            fontSize: "0.8rem",
            "&:hover": {
              backgroundColor: (theme) => alpha(theme.palette.mode === "dark" ? "#ffffff" : "#000000", 0.05),
              color: "text.primary",
            },
          }}
        >
          All Repositories
        </Button>

        {/* Repository info */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
          <Avatar
            src={repository.metadata.avatarUrl}
            alt={repository.owner}
            sx={{ 
              width: 36, 
              height: 36,
              border: (theme) => `1px solid ${alpha(theme.palette.mode === "dark" ? "#ffffff" : "#000000", 0.1)}`,
            }}
          >
            {repository.owner[0]?.toUpperCase()}
          </Avatar>
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 600,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {repository.name}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: "text.secondary",
                display: "block",
              }}
            >
              {repository.owner}
            </Typography>
          </Box>
        </Box>

        {/* New chat button */}
        <Button
          fullWidth
          variant="contained"
          startIcon={<AddIcon />}
          onClick={onNewChat}
          sx={{
            background: "linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)",
            borderRadius: 2,
            textTransform: "none",
            fontWeight: 500,
            py: 1,
            "&:hover": {
              background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)",
              boxShadow: `0 4px 12px ${alpha("#8b5cf6", 0.3)}`,
            },
          }}
        >
          New Chat
        </Button>
      </Box>

      {/* Chat list */}
      <Box
        sx={{
          flexGrow: 1,
          overflow: "auto",
          py: 1,
        }}
      >
        <Typography
          variant="caption"
          sx={{
            color: "text.secondary",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            px: 2,
            py: 1,
            display: "block",
            fontSize: "0.65rem",
          }}
        >
          Recent Chats
        </Typography>

        {chats === undefined ? (
          // Loading state
          <List sx={{ px: 1 }}>
            {Array.from({ length: 3 }).map((_, index) => (
              <ListItemButton key={index} sx={{ borderRadius: 2, mb: 0.5 }}>
                <Skeleton variant="circular" width={20} height={20} sx={{ mr: 1.5 }} />
                <Box sx={{ flexGrow: 1 }}>
                  <Skeleton variant="text" width="80%" height={18} />
                  <Skeleton variant="text" width="40%" height={14} />
                </Box>
              </ListItemButton>
            ))}
          </List>
        ) : chats.length === 0 ? (
          // Empty state
          <Box
            sx={{
              textAlign: "center",
              py: 4,
              px: 2,
              color: "text.secondary",
            }}
          >
            <ChatBubbleOutlineIcon sx={{ fontSize: 28, mb: 1, opacity: 0.4 }} />
            <Typography variant="body2" sx={{ fontSize: "0.85rem" }}>
              No chats yet
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.7 }}>
              Start a new chat to begin
            </Typography>
          </Box>
        ) : (
          // Chat list
          <List sx={{ px: 1 }}>
            {chats.map((chat) => (
              <ListItemButton
                key={chat._id}
                selected={chat._id === activeChatId}
                onClick={() => onSelectChat(chat._id)}
                sx={{
                  borderRadius: 2,
                  mb: 0.5,
                  py: 1.5,
                  px: 1.5,
                  "&:hover .delete-chat-btn": {
                    opacity: 1,
                  },
                  "&.Mui-selected": {
                    backgroundColor: alpha("#8b5cf6", 0.12),
                    borderLeft: `2px solid #8b5cf6`,
                    "&:hover": {
                      backgroundColor: alpha("#8b5cf6", 0.18),
                    },
                  },
                }}
              >
                <ChatBubbleOutlineIcon
                  sx={{
                    fontSize: 16,
                    mr: 1.5,
                    color: chat._id === activeChatId ? "primary.main" : "text.secondary",
                    opacity: chat._id === activeChatId ? 1 : 0.6,
                  }}
                />
                <ListItemText
                  primary={
                    <Typography
                      variant="body2"
                      sx={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        fontWeight: chat._id === activeChatId ? 600 : 400,
                        fontSize: "0.85rem",
                      }}
                    >
                      {chat.title}
                    </Typography>
                  }
                  secondary={
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        color: "text.secondary",
                        fontSize: "0.7rem",
                      }}
                    >
                      {formatDate(chat.updatedAt)}
                    </Typography>
                  }
                />
                <IconButton
                  className="delete-chat-btn"
                  size="small"
                  onClick={(e) => handleDeleteChat(e, chat._id)}
                  sx={{
                    opacity: 0,
                    transition: "opacity 150ms",
                    ml: 0.5,
                    width: 28,
                    height: 28,
                    "&:hover": {
                      backgroundColor: alpha("#ef4444", 0.15),
                    },
                  }}
                >
                  <DeleteOutlineIcon sx={{ fontSize: 16, color: "#ef4444" }} />
                </IconButton>
              </ListItemButton>
            ))}
          </List>
        )}
      </Box>
    </Box>
  );

  if (isMobile) {
    return (
      <>
        {/* Mobile menu button */}
        <IconButton
          onClick={onMobileToggle}
          sx={{
            position: "fixed",
            top: 12,
            left: 12,
            zIndex: 1300,
            backgroundColor: "#18181b",
            border: `1px solid ${alpha("#ffffff", 0.1)}`,
            width: 40,
            height: 40,
            "&:hover": {
              backgroundColor: "#27272a",
            },
          }}
        >
          <MenuIcon sx={{ fontSize: 20 }} />
        </IconButton>

        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={onMobileToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            "& .MuiDrawer-paper": {
              width: SIDEBAR_WIDTH,
              backgroundColor: "#111113",
              borderRight: `1px solid ${alpha("#ffffff", 0.06)}`,
            },
          }}
        >
          {sidebarContent}
        </Drawer>
      </>
    );
  }

  return (
    <Box
      sx={{
        position: "fixed",
        left: 0,
        top: 0,
        bottom: 0,
        width: SIDEBAR_WIDTH,
        zIndex: 100,
      }}
    >
      {sidebarContent}
    </Box>
  );
}
