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
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import MenuIcon from "@mui/icons-material/Menu";
import HomeIcon from "@mui/icons-material/Home";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
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

const SIDEBAR_WIDTH_EXPANDED = 260;
const SIDEBAR_WIDTH_COLLAPSED = 64;

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
  const isDark = theme.palette.mode === "dark";
  
  const [collapsed, setCollapsed] = useState(false);

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
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString();
  };

  const sidebarWidth = collapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED;

  const sidebarContent = (
    <Box
      sx={{
        width: sidebarWidth,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        backgroundColor: isDark ? "#111113" : "#f1f5f9",
        borderRight: `1px solid ${alpha(isDark ? "#ffffff" : "#000000", 0.08)}`,
        transition: "width 200ms ease",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: collapsed ? 1 : 1.5,
          borderBottom: `1px solid ${alpha(isDark ? "#ffffff" : "#000000", 0.06)}`,
        }}
      >
        {/* Back to home */}
        <Tooltip title={collapsed ? "All Repositories" : ""} placement="right">
          <Button
            startIcon={!collapsed && <HomeIcon sx={{ fontSize: 16 }} />}
            onClick={() => router.push("/")}
            size="small"
            sx={{
              mb: 1.5,
              minWidth: collapsed ? 40 : "auto",
              width: collapsed ? 40 : "auto",
              color: "text.secondary",
              justifyContent: collapsed ? "center" : "flex-start",
              textTransform: "none",
              fontSize: "0.75rem",
              px: collapsed ? 0 : 1,
              "&:hover": {
                backgroundColor: alpha(isDark ? "#ffffff" : "#000000", 0.05),
                color: "text.primary",
              },
            }}
          >
            {collapsed ? <HomeIcon sx={{ fontSize: 18 }} /> : "All Repositories"}
          </Button>
        </Tooltip>

        {/* Repository info */}
        <Tooltip title={collapsed ? `${repository.name} (${repository.owner})` : ""} placement="right">
          <Box 
            sx={{ 
              display: "flex", 
              alignItems: "center", 
              gap: 1, 
              mb: 1.5,
              justifyContent: collapsed ? "center" : "flex-start",
            }}
          >
            <Avatar
              src={repository.metadata.avatarUrl}
              alt={repository.owner}
              sx={{ 
                width: 32, 
                height: 32,
                border: `1px solid ${alpha(isDark ? "#ffffff" : "#000000", 0.1)}`,
              }}
            >
              {repository.owner[0]?.toUpperCase()}
            </Avatar>
            {!collapsed && (
              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    fontSize: "0.85rem",
                  }}
                >
                  {repository.name}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: "text.secondary",
                    display: "block",
                    fontSize: "0.7rem",
                  }}
                >
                  {repository.owner}
                </Typography>
              </Box>
            )}
          </Box>
        </Tooltip>

        {/* New chat button */}
        <Tooltip title={collapsed ? "New Chat" : ""} placement="right">
          <Button
            fullWidth
            variant="contained"
            onClick={onNewChat}
            sx={{
              background: "linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)",
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 500,
              py: 0.75,
              minWidth: collapsed ? 40 : "auto",
              "&:hover": {
                background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)",
                boxShadow: `0 4px 12px ${alpha("#8b5cf6", 0.3)}`,
              },
            }}
          >
            <AddIcon sx={{ fontSize: 18, mr: collapsed ? 0 : 0.5 }} />
            {!collapsed && <span>New Chat</span>}
          </Button>
        </Tooltip>
      </Box>

      {/* Chat list */}
      <Box
        sx={{
          flexGrow: 1,
          overflow: "auto",
          py: 0.5,
        }}
      >
        {!collapsed && (
          <Typography
            variant="caption"
            sx={{
              color: "text.secondary",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              px: 1.5,
              py: 0.75,
              display: "block",
              fontSize: "0.6rem",
            }}
          >
            Recent Chats
          </Typography>
        )}

        {chats === undefined ? (
          // Loading state
          <List sx={{ px: 0.5 }} dense>
            {Array.from({ length: 3 }).map((_, index) => (
              <ListItemButton key={index} sx={{ borderRadius: 1.5, mb: 0.25, py: 0.75 }}>
                <Skeleton variant="circular" width={18} height={18} sx={{ mr: collapsed ? 0 : 1 }} />
                {!collapsed && <Skeleton variant="text" width="70%" height={16} />}
              </ListItemButton>
            ))}
          </List>
        ) : chats.length === 0 ? (
          // Empty state
          <Box
            sx={{
              textAlign: "center",
              py: 3,
              px: 1,
              color: "text.secondary",
            }}
          >
            <ChatBubbleOutlineIcon sx={{ fontSize: 24, mb: 0.5, opacity: 0.4 }} />
            {!collapsed && (
              <Typography variant="caption" sx={{ display: "block", fontSize: "0.75rem" }}>
                No chats yet
              </Typography>
            )}
          </Box>
        ) : (
          // Chat list - compact single row items
          <List sx={{ px: 0.5 }} dense>
            {chats.map((chat) => (
              <Tooltip key={chat._id} title={collapsed ? chat.title : ""} placement="right">
                <ListItemButton
                  selected={chat._id === activeChatId}
                  onClick={() => onSelectChat(chat._id)}
                  sx={{
                    borderRadius: 1.5,
                    mb: 0.25,
                    py: 0.75,
                    px: 1,
                    minHeight: 36,
                    justifyContent: collapsed ? "center" : "flex-start",
                    "&:hover .delete-chat-btn": {
                      opacity: 1,
                    },
                    "&.Mui-selected": {
                      backgroundColor: alpha("#8b5cf6", 0.12),
                      borderLeft: collapsed ? "none" : `2px solid #8b5cf6`,
                      "&:hover": {
                        backgroundColor: alpha("#8b5cf6", 0.18),
                      },
                    },
                  }}
                >
                  <ChatBubbleOutlineIcon
                    sx={{
                      fontSize: 16,
                      mr: collapsed ? 0 : 1,
                      flexShrink: 0,
                      color: chat._id === activeChatId ? "primary.main" : "text.secondary",
                      opacity: chat._id === activeChatId ? 1 : 0.6,
                    }}
                  />
                  {!collapsed && (
                    <>
                      <Typography
                        variant="body2"
                        sx={{
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          fontWeight: chat._id === activeChatId ? 600 : 400,
                          fontSize: "0.8rem",
                          flexGrow: 1,
                        }}
                      >
                        {chat.title}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          color: "text.secondary",
                          fontSize: "0.65rem",
                          ml: 1,
                          flexShrink: 0,
                        }}
                      >
                        {formatDate(chat.updatedAt)}
                      </Typography>
                      <IconButton
                        className="delete-chat-btn"
                        size="small"
                        onClick={(e) => handleDeleteChat(e, chat._id)}
                        sx={{
                          opacity: 0,
                          transition: "opacity 150ms",
                          ml: 0.5,
                          width: 24,
                          height: 24,
                          "&:hover": {
                            backgroundColor: alpha("#ef4444", 0.15),
                          },
                        }}
                      >
                        <DeleteOutlineIcon sx={{ fontSize: 14, color: "#ef4444" }} />
                      </IconButton>
                    </>
                  )}
                </ListItemButton>
              </Tooltip>
            ))}
          </List>
        )}
      </Box>

      {/* Collapse toggle - desktop only */}
      {!isMobile && (
        <Box
          sx={{
            p: 1,
            borderTop: `1px solid ${alpha(isDark ? "#ffffff" : "#000000", 0.06)}`,
            display: "flex",
            justifyContent: collapsed ? "center" : "flex-end",
          }}
        >
          <Tooltip title={collapsed ? "Expand sidebar" : "Collapse sidebar"} placement="right">
            <IconButton
              onClick={() => setCollapsed(!collapsed)}
              size="small"
              sx={{
                width: 28,
                height: 28,
                backgroundColor: alpha(isDark ? "#ffffff" : "#000000", 0.05),
                "&:hover": {
                  backgroundColor: alpha(isDark ? "#ffffff" : "#000000", 0.1),
                },
              }}
            >
              {collapsed ? (
                <ChevronRightIcon sx={{ fontSize: 16 }} />
              ) : (
                <ChevronLeftIcon sx={{ fontSize: 16 }} />
              )}
            </IconButton>
          </Tooltip>
        </Box>
      )}
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
            backgroundColor: isDark ? "#18181b" : "#ffffff",
            border: `1px solid ${alpha(isDark ? "#ffffff" : "#000000", 0.1)}`,
            width: 40,
            height: 40,
            "&:hover": {
              backgroundColor: isDark ? "#27272a" : "#f1f5f9",
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
              width: SIDEBAR_WIDTH_EXPANDED,
              backgroundColor: isDark ? "#111113" : "#f1f5f9",
              borderRight: `1px solid ${alpha(isDark ? "#ffffff" : "#000000", 0.06)}`,
            },
          }}
        >
          {/* Override collapsed for mobile */}
          <Box
            sx={{
              width: SIDEBAR_WIDTH_EXPANDED,
              height: "100%",
              display: "flex",
              flexDirection: "column",
              backgroundColor: isDark ? "#111113" : "#f1f5f9",
            }}
          >
            {sidebarContent}
          </Box>
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
        width: sidebarWidth,
        zIndex: 100,
        transition: "width 200ms ease",
      }}
    >
      {sidebarContent}
    </Box>
  );
}

// Export sidebar width for layout calculations
export const getSidebarWidth = (collapsed: boolean) => 
  collapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED;
export { SIDEBAR_WIDTH_EXPANDED, SIDEBAR_WIDTH_COLLAPSED };
