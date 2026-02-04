"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Box, Typography, CircularProgress, Alert, alpha, Avatar, Chip } from "@mui/material";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { ChatSidebar, SIDEBAR_WIDTH_EXPANDED, SIDEBAR_WIDTH_COLLAPSED } from "@/components/ChatSidebar";
import { ChatMessages } from "@/components/ChatMessages";
import { MessageInput } from "@/components/MessageInput";
import { ModelSelector, useSelectedModel } from "@/components/ModelSelector";
import { ThemeToggle } from "@/components/ThemeToggle";
import StarIcon from "@mui/icons-material/Star";
import ForkRightIcon from "@mui/icons-material/ForkRight";
import { useTheme } from "@mui/material";

export default function RepositoryPage() {
  const params = useParams();
  const router = useRouter();
  const repoId = params.repoId as Id<"repositories">;

  const [activeChatId, setActiveChatId] = useState<Id<"chats"> | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [contributors, setContributors] = useState<any[] | undefined>(undefined);
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // Get selected AI model
  const selectedModelId = useSelectedModel();

  // Convex queries
  const repository = useQuery(api.repositories.get, { id: repoId });
  const chats = useQuery(api.chats.listByRepository, { repositoryId: repoId });
  const messages = useQuery(
    api.messages.listByChat,
    activeChatId ? { chatId: activeChatId } : "skip"
  );
  const progress = useQuery(
    api.progress.getProgress,
    activeChatId ? { chatId: activeChatId } : "skip"
  );

  // Convex mutations and actions
  const createChat = useMutation(api.chats.create);
  const addUserMessage = useMutation(api.messages.addUserMessage);
  const fetchContributors = useAction(api.github.fetchContributors);
  const gatherRepoData = useAction(api.ai.gatherRepositoryData);
  const analyzeRepository = useAction(api.ai.analyzeRepository);

  // Load contributors when repository is available
  useEffect(() => {
    if (repository && !contributors) {
      fetchContributors({
        owner: repository.owner,
        repo: repository.name,
        limit: 100,
      })
        .then(setContributors)
        .catch(console.error);
    }
  }, [repository, contributors, fetchContributors]);

  // Auto-select the most recent chat or create a new one
  useEffect(() => {
    if (chats && chats.length > 0 && !activeChatId) {
      setActiveChatId(chats[0]._id);
    }
  }, [chats, activeChatId]);

  // Handle creating a new chat
  const handleNewChat = useCallback(async () => {
    try {
      const chatId = await createChat({ repositoryId: repoId });
      setActiveChatId(chatId);
      setMobileOpen(false);
      return chatId;
    } catch (error) {
      console.error("Failed to create chat:", error);
      return null;
    }
  }, [createChat, repoId]);

  // Handle selecting a chat
  const handleSelectChat = useCallback((chatId: Id<"chats">) => {
    setActiveChatId(chatId);
    setMobileOpen(false);
  }, []);

  // Handle sending a message
  const handleSendMessage = useCallback(
    async (content: string, selectedContributors: string[]) => {
      let chatId = activeChatId;
      
      // Create a new chat if none is active
      if (!chatId) {
        chatId = await handleNewChat();
        if (!chatId) return;
      }
      
      if (!repository) return;

      setIsAnalyzing(true);

      try {
        // Add user message
        await addUserMessage({
          chatId,
          content,
          attachedContributors:
            selectedContributors.length > 0 ? selectedContributors : undefined,
        });

        // Gather repository data
        const repoData = await gatherRepoData({ repositoryId: repoId });

        // Analyze with AI using selected model
        await analyzeRepository({
          chatId,
          query: content,
          repositoryData: repoData,
          contributors:
            selectedContributors.length > 0 ? selectedContributors : undefined,
          modelId: selectedModelId,
        });
      } catch (error) {
        console.error("Failed to send message:", error);
      } finally {
        setIsAnalyzing(false);
      }
    },
    [activeChatId, repository, addUserMessage, gatherRepoData, analyzeRepository, repoId, handleNewChat, selectedModelId]
  );

  // Handle suggestion click
  const handleSuggestionClick = useCallback((suggestion: string) => {
    handleSendMessage(suggestion, []);
  }, [handleSendMessage]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K for new chat
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        handleNewChat();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleNewChat]);

  // Loading state
  if (repository === undefined) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0f0f10",
        }}
      >
        <CircularProgress sx={{ color: "#8b5cf6" }} />
      </Box>
    );
  }

  // Repository not found
  if (repository === null) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0f0f10",
          p: 4,
        }}
      >
        <Alert
          severity="error"
          action={
            <Typography
              component="a"
              href="/"
              sx={{ color: "inherit", textDecoration: "underline" }}
            >
              Go back
            </Typography>
          }
        >
          Repository not found
        </Alert>
      </Box>
    );
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        backgroundColor: "background.default",
      }}
    >
      {/* Sidebar */}
      <ChatSidebar
        repository={repository}
        chats={chats}
        activeChatId={activeChatId}
        onSelectChat={handleSelectChat}
        onNewChat={handleNewChat}
        mobileOpen={mobileOpen}
        onMobileToggle={() => setMobileOpen(!mobileOpen)}
      />

      {/* Main content area */}
      <Box
        sx={{
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          ml: { xs: 0, md: `${SIDEBAR_WIDTH_EXPANDED}px` },
          height: "100vh",
          overflow: "hidden",
          transition: "margin-left 200ms ease",
        }}
      >
        {/* Chat header - cleaner design */}
        <Box
          sx={{
            px: 3,
            py: 2,
            borderBottom: (theme) => `1px solid ${alpha(theme.palette.mode === "dark" ? "#ffffff" : "#000000", 0.06)}`,
            backgroundColor: (theme) => alpha(theme.palette.background.default, 0.95),
            backdropFilter: "blur(12px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Avatar
              src={repository.metadata.avatarUrl}
              sx={{ 
                width: 40, 
                height: 40,
                border: (theme) => `1px solid ${alpha(theme.palette.mode === "dark" ? "#ffffff" : "#000000", 0.1)}`,
              }}
            >
              {repository.owner[0]}
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, fontSize: "1.1rem" }}>
                {repository.name}
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  {repository.fullName}
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <StarIcon sx={{ fontSize: 12, color: "#f59e0b" }} />
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                      {formatNumber(repository.metadata.stars)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <ForkRightIcon sx={{ fontSize: 12, color: "text.secondary" }} />
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                      {formatNumber(repository.metadata.forks)}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Box>
          
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <ModelSelector compact />
            <ThemeToggle size="small" />
            <Chip
              label="⌘K New Chat"
              size="small"
              onClick={handleNewChat}
              sx={{
                backgroundColor: (theme) => alpha(theme.palette.mode === "dark" ? "#ffffff" : "#000000", 0.05),
                border: (theme) => `1px solid ${alpha(theme.palette.mode === "dark" ? "#ffffff" : "#000000", 0.1)}`,
                color: "text.secondary",
                fontSize: "0.7rem",
                height: 28,
                cursor: "pointer",
                "&:hover": {
                  backgroundColor: alpha("#8b5cf6", 0.1),
                  borderColor: alpha("#8b5cf6", 0.3),
                },
              }}
            />
          </Box>
        </Box>

        {/* Messages area */}
        {activeChatId ? (
          <ChatMessages 
            messages={messages} 
            isLoading={isAnalyzing}
            onSuggestionClick={handleSuggestionClick}
            progressMessage={progress?.currentStep}
          />
        ) : (
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
            <Typography 
              variant="h5" 
              sx={{ 
                fontWeight: 600, 
                mb: 1,
                background: "linear-gradient(135deg, #ffffff 0%, #a1a1aa 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Welcome to {repository.name}
            </Typography>
            <Typography
              variant="body1"
              sx={{ color: "text.secondary", maxWidth: 400, mb: 3 }}
            >
              Start a new chat to analyze this repository with AI. Ask questions
              about contributors, PRs, issues, and more.
            </Typography>
            <Typography
              component="button"
              onClick={handleNewChat}
              sx={{
                background: "linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)",
                color: "white",
                border: "none",
                borderRadius: 2,
                px: 4,
                py: 1.5,
                fontSize: "1rem",
                fontWeight: 500,
                cursor: "pointer",
                "&:hover": {
                  transform: "scale(1.02)",
                  boxShadow: `0 4px 20px ${alpha("#8b5cf6", 0.4)}`,
                },
                transition: "all 200ms ease",
              }}
            >
              Start New Chat
            </Typography>
          </Box>
        )}

        {/* Message input - always visible */}
        <MessageInput
          onSendMessage={handleSendMessage}
          isLoading={isAnalyzing}
          contributors={contributors}
          disabled={false}
        />
      </Box>
    </Box>
  );
}
