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
} from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import BoltIcon from "@mui/icons-material/Bolt";
import CheckIcon from "@mui/icons-material/Check";

export interface GeminiModel {
  id: string;
  name: string;
  description: string;
}

// Available models - more can be added later
export const GEMINI_MODELS: GeminiModel[] = [
  {
    id: "gemini-2.5-flash",
    name: "Gemini 2.5 Flash",
    description: "Latest balanced model for complex analysis",
  },
  {
    id: "gemini-2.5-flash-lite",
    name: "Gemini 2.5 Flash Lite",
    description: "Lightweight and fast for quick analysis",
  },
  {
    id: "gemini-3-flash-preview",
    name: "Gemini 3 Flash Preview",
    description: "Preview of next-gen model (experimental)",
  },
];

const MODEL_STORAGE_KEY = "repo-analyzer-gemini-model";
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
    if (saved && GEMINI_MODELS.some((m) => m.id === saved)) {
      setSelectedModelId(saved);
    }
  }, []);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    // Only open menu if there are multiple models
    if (GEMINI_MODELS.length > 1) {
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

  const selectedModel = GEMINI_MODELS.find((m) => m.id === selectedModelId) || GEMINI_MODELS[0];

  return (
    <>
      <Button
        onClick={handleClick}
        variant="outlined"
        size={compact ? "small" : "medium"}
        endIcon={GEMINI_MODELS.length > 1 ? <KeyboardArrowDownIcon /> : undefined}
        sx={{
          borderColor: alpha("#ffffff", 0.12),
          color: "text.primary",
          textTransform: "none",
          borderRadius: 2,
          px: compact ? 1.5 : 2,
          py: compact ? 0.5 : 0.75,
          backgroundColor: alpha("#ffffff", 0.03),
          cursor: GEMINI_MODELS.length > 1 ? "pointer" : "default",
          "&:hover": {
            borderColor: GEMINI_MODELS.length > 1 ? alpha("#8b5cf6", 0.5) : alpha("#ffffff", 0.12),
            backgroundColor: GEMINI_MODELS.length > 1 ? alpha("#8b5cf6", 0.08) : alpha("#ffffff", 0.03),
          },
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
          <BoltIcon sx={{ fontSize: compact ? 16 : 18, color: "#8b5cf6" }} />
          <Typography variant={compact ? "caption" : "body2"} sx={{ fontWeight: 500 }}>
            {compact ? selectedModel.name.replace(" Preview", "") : selectedModel.name}
          </Typography>
        </Box>
      </Button>

      {/* Menu only shows if there are multiple models */}
      {GEMINI_MODELS.length > 1 && (
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
              minWidth: 280,
              backgroundColor: "#1e1e21",
              border: `1px solid ${alpha("#ffffff", 0.1)}`,
              borderRadius: 2,
              mt: 1,
              boxShadow: `0 8px 32px ${alpha("#000000", 0.5)}`,
            },
          }}
        >
          <Box sx={{ px: 2, py: 1.5 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              Select AI Model
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              Choose which Gemini model to use
            </Typography>
          </Box>

          {GEMINI_MODELS.map((model) => (
            <MenuItem
              key={model.id}
              onClick={() => handleSelectModel(model.id)}
              selected={model.id === selectedModelId}
              sx={{
                py: 1.5,
                px: 2,
                "&.Mui-selected": {
                  backgroundColor: alpha("#8b5cf6", 0.12),
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 36, color: "#8b5cf6" }}>
                <BoltIcon sx={{ fontSize: 18 }} />
              </ListItemIcon>
              <ListItemText
                primary={model.name}
                secondary={model.description}
                primaryTypographyProps={{ fontWeight: 500, fontSize: "0.9rem" }}
                secondaryTypographyProps={{ fontSize: "0.75rem" }}
              />
              {model.id === selectedModelId && (
                <CheckIcon sx={{ fontSize: 18, color: "primary.main", ml: 1 }} />
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
    if (saved && GEMINI_MODELS.some((m) => m.id === saved)) {
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
