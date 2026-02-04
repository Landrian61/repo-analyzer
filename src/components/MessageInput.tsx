"use client";

import { useState, useRef, useEffect, KeyboardEvent } from "react";
import {
  Box,
  TextField,
  IconButton,
  Chip,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  ListItemAvatar,
  Typography,
  CircularProgress,
  alpha,
  InputAdornment,
  Divider,
  Badge,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import AddIcon from "@mui/icons-material/Add";
import PersonIcon from "@mui/icons-material/Person";
import GroupIcon from "@mui/icons-material/Group";
import CloseIcon from "@mui/icons-material/Close";
import SearchIcon from "@mui/icons-material/Search";

interface Contributor {
  login: string;
  avatarUrl: string;
  contributions: number;
}

interface MessageInputProps {
  onSendMessage: (message: string, contributors: string[]) => void;
  isLoading: boolean;
  contributors: Contributor[] | undefined;
  disabled?: boolean;
}

export function MessageInput({
  onSendMessage,
  isLoading,
  contributors,
  disabled = false,
}: MessageInputProps) {
  const [message, setMessage] = useState("");
  const [selectedContributors, setSelectedContributors] = useState<string[]>([]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const textFieldRef = useRef<HTMLTextAreaElement>(null);

  const menuOpen = Boolean(anchorEl);

  useEffect(() => {
    if (!isLoading && textFieldRef.current) {
      textFieldRef.current.focus();
    }
  }, [isLoading]);

  const handleSend = () => {
    if (message.trim() && !isLoading && !disabled) {
      onSendMessage(message.trim(), selectedContributors);
      setMessage("");
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
    setSearchQuery("");
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSearchQuery("");
  };

  const toggleContributor = (login: string) => {
    setSelectedContributors((prev) =>
      prev.includes(login)
        ? prev.filter((c) => c !== login)
        : [...prev, login]
    );
  };

  const removeContributor = (login: string) => {
    setSelectedContributors((prev) => prev.filter((c) => c !== login));
  };

  const clearAllContributors = () => {
    setSelectedContributors([]);
    handleMenuClose();
  };

  const filteredContributors = contributors?.filter((c) =>
    c.login.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Box
      sx={{
        p: 3,
        borderTop: `1px solid ${alpha("#ffffff", 0.08)}`,
        backgroundColor: alpha("#0f0f10", 0.95),
        backdropFilter: "blur(12px)",
      }}
    >
      {/* Selected contributors chips */}
      {selectedContributors.length > 0 && (
        <Box 
          sx={{ 
            display: "flex", 
            flexWrap: "wrap", 
            gap: 1, 
            mb: 2,
            p: 1.5,
            borderRadius: 2,
            backgroundColor: alpha("#8b5cf6", 0.08),
            border: `1px solid ${alpha("#8b5cf6", 0.2)}`,
          }}
        >
          <Typography 
            variant="caption" 
            sx={{ 
              color: "text.secondary", 
              alignSelf: "center",
              fontWeight: 500,
            }}
          >
            Focusing on:
          </Typography>
          {selectedContributors.map((login) => {
            const contributor = contributors?.find((c) => c.login === login);
            return (
              <Chip
                key={login}
                size="small"
                avatar={
                  <Avatar
                    src={contributor?.avatarUrl}
                    sx={{ width: 20, height: 20 }}
                  >
                    {login[0]}
                  </Avatar>
                }
                label={login}
                onDelete={() => removeContributor(login)}
                sx={{
                  backgroundColor: alpha("#8b5cf6", 0.2),
                  border: `1px solid ${alpha("#8b5cf6", 0.3)}`,
                  "& .MuiChip-deleteIcon": {
                    color: alpha("#ffffff", 0.6),
                    "&:hover": {
                      color: alpha("#ffffff", 0.9),
                    },
                  },
                }}
              />
            );
          })}
        </Box>
      )}

      {/* Main input container - Gemini-inspired */}
      <Box
        sx={{
          display: "flex",
          alignItems: "flex-end",
          gap: 1,
          p: 1,
          borderRadius: 3,
          backgroundColor: alpha("#ffffff", 0.05),
          border: `1px solid ${alpha("#ffffff", 0.1)}`,
          transition: "all 200ms ease",
          "&:focus-within": {
            borderColor: alpha("#8b5cf6", 0.5),
            backgroundColor: alpha("#ffffff", 0.07),
          },
        }}
      >
        {/* Add button with dropdown */}
        <IconButton
          onClick={handleMenuOpen}
          disabled={isLoading || disabled}
          sx={{
            width: 40,
            height: 40,
            backgroundColor: selectedContributors.length > 0 
              ? alpha("#8b5cf6", 0.2) 
              : "transparent",
            border: `1px solid ${alpha("#ffffff", 0.1)}`,
            "&:hover": {
              backgroundColor: alpha("#8b5cf6", 0.15),
              borderColor: alpha("#8b5cf6", 0.3),
            },
          }}
        >
          <Badge 
            badgeContent={selectedContributors.length} 
            color="primary"
            sx={{
              "& .MuiBadge-badge": {
                fontSize: 10,
                height: 16,
                minWidth: 16,
              }
            }}
          >
            <AddIcon sx={{ fontSize: 20 }} />
          </Badge>
        </IconButton>

        {/* Text input */}
        <TextField
          inputRef={textFieldRef}
          fullWidth
          multiline
          maxRows={6}
          placeholder="Ask about this repository..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading || disabled}
          variant="standard"
          InputProps={{
            disableUnderline: true,
            sx: {
              fontSize: "0.95rem",
              py: 1,
              px: 1,
            },
          }}
          sx={{
            "& .MuiInputBase-root": {
              backgroundColor: "transparent",
            },
          }}
        />

        {/* Send button */}
        <IconButton
          onClick={handleSend}
          disabled={!message.trim() || isLoading || disabled}
          sx={{
            width: 40,
            height: 40,
            backgroundColor: message.trim() ? "primary.main" : alpha("#ffffff", 0.1),
            color: message.trim() ? "white" : "text.secondary",
            "&:hover": {
              backgroundColor: message.trim() ? "primary.dark" : alpha("#ffffff", 0.15),
            },
            "&:disabled": {
              backgroundColor: alpha("#ffffff", 0.05),
              color: alpha("#ffffff", 0.3),
            },
            transition: "all 200ms ease",
          }}
        >
          {isLoading ? (
            <CircularProgress size={20} color="inherit" />
          ) : (
            <SendIcon sx={{ fontSize: 18 }} />
          )}
        </IconButton>
      </Box>

      {/* Contributor selection menu - Gemini-inspired dropdown */}
      <Menu
        anchorEl={anchorEl}
        open={menuOpen}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
        transformOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
        PaperProps={{
          sx: {
            width: 320,
            maxHeight: 400,
            backgroundColor: "#1e1e21",
            border: `1px solid ${alpha("#ffffff", 0.1)}`,
            borderRadius: 3,
            mt: -1,
            boxShadow: `0 8px 32px ${alpha("#000000", 0.5)}`,
          },
        }}
      >
        {/* Menu header */}
        <Box sx={{ p: 2, pb: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>
            Focus on Contributors
          </Typography>
          
          {/* Search input */}
          <TextField
            fullWidth
            size="small"
            placeholder="Search contributors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ fontSize: 18, color: "text.secondary" }} />
                </InputAdornment>
              ),
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                backgroundColor: alpha("#ffffff", 0.05),
                borderRadius: 2,
              },
            }}
          />
        </Box>

        <Divider sx={{ borderColor: alpha("#ffffff", 0.08) }} />

        {/* Clear selection option */}
        {selectedContributors.length > 0 && (
          <>
            <MenuItem 
              onClick={clearAllContributors}
              sx={{ 
                py: 1.5,
                color: "error.main",
                "&:hover": {
                  backgroundColor: alpha("#ef4444", 0.1),
                },
              }}
            >
              <ListItemIcon>
                <CloseIcon sx={{ color: "error.main", fontSize: 20 }} />
              </ListItemIcon>
              <ListItemText 
                primary="Clear selection" 
                secondary={`${selectedContributors.length} selected`}
              />
            </MenuItem>
            <Divider sx={{ borderColor: alpha("#ffffff", 0.08) }} />
          </>
        )}

        {/* Contributors list */}
        <Box sx={{ maxHeight: 250, overflow: "auto" }}>
          {contributors === undefined ? (
            <Box sx={{ p: 3, textAlign: "center" }}>
              <CircularProgress size={24} />
              <Typography variant="body2" sx={{ mt: 1, color: "text.secondary" }}>
                Loading contributors...
              </Typography>
            </Box>
          ) : filteredContributors && filteredContributors.length > 0 ? (
            filteredContributors.slice(0, 20).map((contributor) => (
              <MenuItem
                key={contributor.login}
                onClick={() => toggleContributor(contributor.login)}
                selected={selectedContributors.includes(contributor.login)}
                sx={{
                  py: 1.5,
                  "&.Mui-selected": {
                    backgroundColor: alpha("#8b5cf6", 0.15),
                    "&:hover": {
                      backgroundColor: alpha("#8b5cf6", 0.2),
                    },
                  },
                }}
              >
                <ListItemAvatar sx={{ minWidth: 44 }}>
                  <Avatar 
                    src={contributor.avatarUrl} 
                    sx={{ width: 32, height: 32 }}
                  >
                    {contributor.login[0]}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={contributor.login}
                  secondary={`${contributor.contributions} contributions`}
                  primaryTypographyProps={{ fontWeight: 500, fontSize: "0.9rem" }}
                  secondaryTypographyProps={{ fontSize: "0.75rem" }}
                />
                {selectedContributors.includes(contributor.login) && (
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      backgroundColor: "primary.main",
                      ml: 1,
                    }}
                  />
                )}
              </MenuItem>
            ))
          ) : (
            <Box sx={{ p: 3, textAlign: "center", color: "text.secondary" }}>
              <GroupIcon sx={{ fontSize: 32, mb: 1, opacity: 0.5 }} />
              <Typography variant="body2">No contributors found</Typography>
            </Box>
          )}
        </Box>
      </Menu>
    </Box>
  );
}
