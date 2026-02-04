"use client";

import { useRef, useEffect } from "react";
import {
  Box,
  Typography,
  Avatar,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  Skeleton,
  alpha,
  Button,
} from "@mui/material";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import PersonIcon from "@mui/icons-material/Person";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import AutoGraphIcon from "@mui/icons-material/AutoGraph";
import { AIResponse, TextResponse } from "./ResponseRenderers";
import { Id } from "../../convex/_generated/dataModel";

interface Message {
  _id: Id<"messages">;
  role: "user" | "assistant";
  content: string;
  attachedContributors?: string[];
  response?: {
    type: "text" | "diff" | "chart" | "table" | "mixed";
    data: any;
  };
  timestamp: number;
}

interface ChatMessagesProps {
  messages: Message[] | undefined;
  isLoading: boolean;
  onSuggestionClick?: (suggestion: string) => void;
  progressMessage?: string;
}

const SUGGESTIONS = [
  "Who are the top contributors?",
  "Show me recent pull requests",
  "What issues need attention?",
  "Display contribution trends",
];

// Helper component to render assistant messages with proper JSON detection
function AssistantMessage({ message }: { message: Message }) {
  // First, check if we have a proper response object
  if (message.response && message.response.type && message.response.data) {
    return <AIResponse response={message.response} />;
  }
  
  // If no response field, try to parse content as JSON
  const content = message.content;
  if (content && content.trim().startsWith("{") && content.includes('"type"')) {
    try {
      const parsed = JSON.parse(content.trim());
      if (parsed && parsed.type && parsed.data) {
        // Successfully parsed JSON response
        return <AIResponse response={parsed} />;
      }
    } catch (e) {
      // Not valid JSON, will fall through to TextResponse
      console.log('[AssistantMessage] Failed to parse JSON:', e);
    }
  }
  
  // Fall back to text response
  return <TextResponse content={content || ""} />;
}

export function ChatMessages({ messages, isLoading, onSuggestionClick, progressMessage }: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (messages === undefined) {
    // Loading state
    return (
      <Box sx={{ p: 3, display: "flex", flexDirection: "column", gap: 3 }}>
        {Array.from({ length: 3 }).map((_, index) => (
          <Box
            key={index}
            sx={{
              display: "flex",
              gap: 2,
              flexDirection: index % 2 === 0 ? "row" : "row-reverse",
            }}
          >
            <Skeleton variant="circular" width={36} height={36} />
            <Box sx={{ flexGrow: 1, maxWidth: "70%" }}>
              <Skeleton variant="rounded" height={80} sx={{ borderRadius: 2 }} />
            </Box>
          </Box>
        ))}
      </Box>
    );
  }

  if (messages.length === 0) {
    // Empty state - centered and clean
    return (
      <Box
        sx={{
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          p: 4,
          textAlign: "center",
        }}
      >
        {/* Icon */}
        <Box
          sx={{
            width: 72,
            height: 72,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: `linear-gradient(135deg, ${alpha("#8b5cf6", 0.2)} 0%, ${alpha("#6366f1", 0.2)} 100%)`,
            border: `1px solid ${alpha("#8b5cf6", 0.3)}`,
            mb: 3,
          }}
        >
          <AutoGraphIcon sx={{ fontSize: 36, color: "#8b5cf6" }} />
        </Box>

        {/* Title */}
        <Typography 
          variant="h5" 
          sx={{ 
            fontWeight: 600, 
            mb: 1,
            background: (theme) => theme.palette.mode === "dark"
              ? "linear-gradient(135deg, #ffffff 0%, #a1a1aa 100%)"
              : "linear-gradient(135deg, #0f172a 0%, #475569 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Start a Conversation
        </Typography>

        {/* Subtitle */}
        <Typography
          variant="body1"
          sx={{ color: "text.secondary", maxWidth: 400, mb: 4 }}
        >
          Ask questions about this repository. I can analyze contributors, PRs, issues, and collaboration patterns.
        </Typography>

        {/* Suggestion chips - horizontal layout */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, width: "100%", maxWidth: 400 }}>
          <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 500 }}>
            Try asking:
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {SUGGESTIONS.map((suggestion, index) => (
              <Button
                key={index}
                variant="outlined"
                size="small"
                onClick={() => onSuggestionClick?.(suggestion)}
                sx={{
                  justifyContent: "flex-start",
                  textTransform: "none",
                  borderColor: (theme) => alpha(theme.palette.mode === "dark" ? "#ffffff" : "#000000", 0.1),
                  color: "text.primary",
                  backgroundColor: (theme) => alpha(theme.palette.mode === "dark" ? "#ffffff" : "#000000", 0.02),
                  borderRadius: 2,
                  py: 1.5,
                  px: 2,
                  fontSize: "0.875rem",
                  "&:hover": {
                    borderColor: alpha("#8b5cf6", 0.5),
                    backgroundColor: alpha("#8b5cf6", 0.08),
                  },
                }}
              >
                {suggestion}
              </Button>
            ))}
          </Box>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        flexGrow: 1,
        overflow: "auto",
        py: 3,
        px: { xs: 2, sm: 3, md: 4, lg: 6 },
        display: "flex",
        flexDirection: "column",
        gap: 3,
      }}
    >
      {/* Centered content container */}
      <Box
        sx={{
          maxWidth: 800,
          width: "100%",
          mx: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 3,
        }}
      >
      {messages.map((message) => (
        <Box
          key={message._id}
          className="animate-slide-in"
          sx={{
            display: "flex",
            gap: 2,
            flexDirection: message.role === "user" ? "row-reverse" : "row",
          }}
        >
          {/* Avatar */}
          <Avatar
            sx={{
              width: 36,
              height: 36,
              backgroundColor:
                message.role === "user"
                  ? alpha("#8b5cf6", 0.2)
                  : alpha("#6366f1", 0.2),
              border: `1px solid ${alpha(message.role === "user" ? "#8b5cf6" : "#6366f1", 0.3)}`,
              flexShrink: 0,
            }}
          >
            {message.role === "user" ? (
              <PersonIcon sx={{ fontSize: 20, color: "#8b5cf6" }} />
            ) : (
              <SmartToyIcon sx={{ fontSize: 20, color: "#6366f1" }} />
            )}
          </Avatar>

          {/* Message content */}
          <Box
            sx={{
              maxWidth: message.role === "user" ? "70%" : "85%",
              display: "flex",
              flexDirection: "column",
              alignItems: message.role === "user" ? "flex-end" : "flex-start",
            }}
          >
            {/* Attached contributors for user messages */}
            {message.attachedContributors && message.attachedContributors.length > 0 && (
              <Box sx={{ display: "flex", gap: 0.5, mb: 1, flexWrap: "wrap" }}>
                {message.attachedContributors.map((contributor) => (
                  <Chip
                    key={contributor}
                    label={`@${contributor}`}
                    size="small"
                    sx={{
                      height: 22,
                      fontSize: "0.7rem",
                      backgroundColor: alpha("#8b5cf6", 0.15),
                      border: `1px solid ${alpha("#8b5cf6", 0.3)}`,
                    }}
                  />
                ))}
              </Box>
            )}

            {/* Message bubble */}
            <Paper
              sx={{
                p: 2.5,
                backgroundColor: (theme) =>
                  message.role === "user" 
                    ? alpha("#8b5cf6", 0.12) 
                    : alpha(theme.palette.mode === "dark" ? "#ffffff" : "#000000", 0.03),
                border: (theme) => `1px solid ${alpha(theme.palette.mode === "dark" ? "#ffffff" : "#000000", message.role === "user" ? 0.15 : 0.06)}`,
                borderRadius: 3,
                position: "relative",
                "&:hover .copy-button": {
                  opacity: 1,
                },
              }}
            >
              {/* User message - plain text */}
              {message.role === "user" ? (
                <Typography variant="body1" sx={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
                  {message.content}
                </Typography>
              ) : (
                // Assistant message - rich content
                <AssistantMessage message={message} />
              )}

              {/* Copy button */}
              <Tooltip title="Copy">
                <IconButton
                  className="copy-button"
                  size="small"
                  onClick={() => copyToClipboard(message.content)}
                  sx={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    opacity: 0,
                    transition: "opacity 150ms",
                    backgroundColor: (theme) => alpha(theme.palette.mode === "dark" ? "#ffffff" : "#000000", 0.1),
                    "&:hover": {
                      backgroundColor: (theme) => alpha(theme.palette.mode === "dark" ? "#ffffff" : "#000000", 0.15),
                    },
                  }}
                >
                  <ContentCopyIcon sx={{ fontSize: 14 }} />
                </IconButton>
              </Tooltip>
            </Paper>

            {/* Timestamp */}
            <Typography
              variant="caption"
              sx={{
                color: "text.secondary",
                mt: 0.5,
                px: 1,
                fontSize: "0.7rem",
              }}
            >
              {formatTime(message.timestamp)}
            </Typography>
          </Box>
        </Box>
      ))}

      {/* Loading indicator for AI response */}
      {isLoading && (
        <Box sx={{ display: "flex", gap: 2 }} className="animate-slide-in">
          <Avatar
            sx={{
              width: 36,
              height: 36,
              backgroundColor: alpha("#6366f1", 0.2),
              border: `1px solid ${alpha("#6366f1", 0.3)}`,
            }}
          >
            <SmartToyIcon sx={{ fontSize: 20, color: "#6366f1" }} />
          </Avatar>
          <Paper
            sx={{
              p: 2.5,
              backgroundColor: (theme) => alpha(theme.palette.mode === "dark" ? "#ffffff" : "#000000", 0.03),
              border: (theme) => `1px solid ${alpha(theme.palette.mode === "dark" ? "#ffffff" : "#000000", 0.06)}`,
              borderRadius: 3,
              minWidth: 200,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Box sx={{ display: "flex", gap: 0.5 }}>
                {[0, 1, 2].map((i) => (
                  <Box
                    key={i}
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      backgroundColor: "#8b5cf6",
                      animation: "pulse 1.5s ease-in-out infinite",
                      animationDelay: `${i * 0.15}s`,
                    }}
                  />
                ))}
              </Box>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                {progressMessage || "Starting analysis..."}
              </Typography>
            </Box>
          </Paper>
        </Box>
      )}

      {/* Scroll anchor */}
      <div ref={messagesEndRef} />
      </Box>
    </Box>
  );
}
