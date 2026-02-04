"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Typography,
  alpha,
  useTheme,
  Divider,
  Chip,
} from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import BoltIcon from "@mui/icons-material/Bolt";
import CheckIcon from "@mui/icons-material/Check";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";

export interface AIModel {
  id: string;
  name: string;
  description: string;
  provider: "gemini" | "groq";
  contextWindow?: string;
}

// Available models - organized by provider
export const AI_MODELS: AIModel[] = [
  // Gemini models
  {
    id: "gemini-2.5-flash",
    name: "Gemini 2.5 Flash",
    description: "Balanced speed & quality",
    provider: "gemini",
    contextWindow: "1M tokens",
  },
  {
    id: "gemini-2.5-flash-lite",
    name: "Gemini 2.5 Flash Lite",
    description: "Lightweight and fast",
    provider: "gemini",
    contextWindow: "1M tokens",
  },
  // Groq models
  {
    id: "llama-3.3-70b-versatile",
    name: "Llama 3.3 70B",
    description: "Reliable tool logic",
    provider: "groq",
    contextWindow: "128k tokens",
  },
  {
    id: "openai/gpt-oss-120b",
    name: "GPT-OSS 120B",
    description: "High reasoning & agents",
    provider: "groq",
    contextWindow: "131k tokens",
  },
];

// Legacy export for backwards compatibility
export const GEMINI_MODELS = AI_MODELS;

const MODEL_STORAGE_KEY = "repo-analyzer-ai-model";
const DEFAULT_MODEL = "gemini-2.5-flash";

interface ModelSelectorProps {
  compact?: boolean;
}

export function ModelSelector({ compact = false }: ModelSelectorProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedModelId, setSelectedModelId] = useState<string>(DEFAULT_MODEL);

  const open = Boolean(anchorEl);

  // Load saved model preference
  useEffect(() => {
    const saved = localStorage.getItem(MODEL_STORAGE_KEY);
    if (saved && AI_MODELS.some((m) => m.id === saved)) {
      setSelectedModelId(saved);
    }
  }, []);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    if (AI_MODELS.length > 1) {
      setAnchorEl(event.currentTarget);
    }
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSelectModel = (modelId: string) => {
    setSelectedModelId(modelId);
    localStorage.setItem(MODEL_STORAGE_KEY, modelId);
    handleClose();
  };

  const selectedModel = AI_MODELS.find((m) => m.id === selectedModelId) || AI_MODELS[0];
  
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  // Group models by provider
  const geminiModels = AI_MODELS.filter(m => m.provider === "gemini");
  const groqModels = AI_MODELS.filter(m => m.provider === "groq");

  // Provider colors
  const providerColors = {
    gemini: "#4285f4",
    groq: "#f97316",
  };

  return (
    <>
      <Button
        onClick={handleClick}
        variant="outlined"
        size={compact ? "small" : "medium"}
        endIcon={AI_MODELS.length > 1 ? <KeyboardArrowDownIcon /> : undefined}
        sx={{
          borderColor: alpha(isDark ? "#ffffff" : "#000000", 0.12),
          color: "text.primary",
          textTransform: "none",
          borderRadius: 2,
          px: compact ? 1.5 : 2,
          py: compact ? 0.5 : 0.75,
          backgroundColor: alpha(isDark ? "#ffffff" : "#000000", 0.03),
          cursor: AI_MODELS.length > 1 ? "pointer" : "default",
          "&:hover": {
            borderColor: AI_MODELS.length > 1 ? alpha("#8b5cf6", 0.5) : alpha(isDark ? "#ffffff" : "#000000", 0.12),
            backgroundColor: AI_MODELS.length > 1 ? alpha("#8b5cf6", 0.08) : alpha(isDark ? "#ffffff" : "#000000", 0.03),
          },
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
          {selectedModel.provider === "groq" ? (
            <AutoAwesomeIcon sx={{ fontSize: compact ? 16 : 18, color: providerColors.groq }} />
          ) : (
            <BoltIcon sx={{ fontSize: compact ? 16 : 18, color: providerColors.gemini }} />
          )}
          <Typography variant={compact ? "caption" : "body2"} sx={{ fontWeight: 500 }}>
            {compact ? selectedModel.name.split(" ").slice(0, 2).join(" ") : selectedModel.name}
          </Typography>
        </Box>
      </Button>

      {AI_MODELS.length > 1 && (
        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "right",
          }}
          transformOrigin={{
            vertical: "top",
            horizontal: "right",
          }}
          PaperProps={{
            sx: {
              minWidth: 300,
              backgroundColor: isDark ? "#1e1e21" : "#ffffff",
              border: `1px solid ${alpha(isDark ? "#ffffff" : "#000000", 0.1)}`,
              borderRadius: 2,
              mt: 1,
              boxShadow: `0 8px 32px ${alpha("#000000", isDark ? 0.5 : 0.15)}`,
            },
          }}
        >
          <Box sx={{ px: 2, py: 1.5 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              Select AI Model
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              Choose a model for analysis
            </Typography>
          </Box>

          {/* Gemini Models */}
          <Box sx={{ px: 2, py: 0.5 }}>
            <Chip 
              label="Google Gemini" 
              size="small" 
              sx={{ 
                backgroundColor: alpha(providerColors.gemini, 0.1),
                color: providerColors.gemini,
                fontWeight: 600,
                fontSize: "0.65rem",
                height: 20,
              }} 
            />
          </Box>
          {geminiModels.map((model) => (
            <MenuItem
              key={model.id}
              onClick={() => handleSelectModel(model.id)}
              selected={model.id === selectedModelId}
              sx={{
                py: 1.25,
                px: 2,
                "&.Mui-selected": {
                  backgroundColor: alpha(providerColors.gemini, 0.1),
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 32, color: providerColors.gemini }}>
                <BoltIcon sx={{ fontSize: 18 }} />
              </ListItemIcon>
              <ListItemText
                primary={
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <span>{model.name}</span>
                    {model.contextWindow && (
                      <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.65rem" }}>
                        {model.contextWindow}
                      </Typography>
                    )}
                  </Box>
                }
                secondary={model.description}
                primaryTypographyProps={{ fontWeight: 500, fontSize: "0.85rem" }}
                secondaryTypographyProps={{ fontSize: "0.7rem" }}
              />
              {model.id === selectedModelId && (
                <CheckIcon sx={{ fontSize: 16, color: providerColors.gemini, ml: 1 }} />
              )}
            </MenuItem>
          ))}

          <Divider sx={{ my: 1, borderColor: alpha(isDark ? "#ffffff" : "#000000", 0.08) }} />

          {/* Groq Models */}
          <Box sx={{ px: 2, py: 0.5 }}>
            <Chip 
              label="Groq (Fast)" 
              size="small" 
              sx={{ 
                backgroundColor: alpha(providerColors.groq, 0.1),
                color: providerColors.groq,
                fontWeight: 600,
                fontSize: "0.65rem",
                height: 20,
              }} 
            />
          </Box>
          {groqModels.map((model) => (
            <MenuItem
              key={model.id}
              onClick={() => handleSelectModel(model.id)}
              selected={model.id === selectedModelId}
              sx={{
                py: 1.25,
                px: 2,
                "&.Mui-selected": {
                  backgroundColor: alpha(providerColors.groq, 0.1),
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 32, color: providerColors.groq }}>
                <AutoAwesomeIcon sx={{ fontSize: 18 }} />
              </ListItemIcon>
              <ListItemText
                primary={
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <span>{model.name}</span>
                    {model.contextWindow && (
                      <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.65rem" }}>
                        {model.contextWindow}
                      </Typography>
                    )}
                  </Box>
                }
                secondary={model.description}
                primaryTypographyProps={{ fontWeight: 500, fontSize: "0.85rem" }}
                secondaryTypographyProps={{ fontSize: "0.7rem" }}
              />
              {model.id === selectedModelId && (
                <CheckIcon sx={{ fontSize: 16, color: providerColors.groq, ml: 1 }} />
              )}
            </MenuItem>
          ))}
        </Menu>
      )}
    </>
  );
}

// Hook to get the selected model
export function useSelectedModel(): string {
  const [modelId, setModelId] = useState<string>(DEFAULT_MODEL);

  useEffect(() => {
    const saved = localStorage.getItem(MODEL_STORAGE_KEY);
    if (saved && AI_MODELS.some((m) => m.id === saved)) {
      setModelId(saved);
    }

    // Listen for changes
    const handleStorage = (e: StorageEvent) => {
      if (e.key === MODEL_STORAGE_KEY && e.newValue) {
        setModelId(e.newValue);
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  return modelId;
}
