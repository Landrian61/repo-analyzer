"use client";

import React from "react";
import { Box, Typography, Paper, alpha, Chip, Tooltip } from "@mui/material";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";

// Chart colors
const CHART_COLORS = [
  "#8b5cf6",
  "#6366f1",
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#ec4899",
  "#06b6d4",
];

// Valid response types
type ResponseType = "text" | "diff" | "chart" | "table" | "mixed";

// Response props interface (forward declaration for use throughout file)
interface AIResponseProps {
  response: {
    type: ResponseType;
    data: any;
  };
}

// Text Response Renderer
interface TextResponseProps {
  content: string;
}

// Helper to detect and parse JSON response content
function tryParseJsonResponse(content: string): { type: ResponseType; data: any } | null {
  if (!content || typeof content !== 'string') return null;
  const trimmed = content.trim();
  if (!trimmed.startsWith('{') || !trimmed.includes('"type"')) return null;
  
  try {
    const parsed = JSON.parse(trimmed);
    const validTypes: ResponseType[] = ["text", "diff", "chart", "table", "mixed"];
    if (parsed && typeof parsed === 'object' && validTypes.includes(parsed.type) && parsed.data) {
      return parsed as { type: ResponseType; data: any };
    }
  } catch (e) {
    // Not valid JSON
  }
  return null;
}

// Inner component for pure markdown rendering
function MarkdownContent({ content }: { content: string }) {
  return (
    <Box className="markdown-content">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ node, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || "");
            const isInline = !match && !className;
            
            if (isInline) {
              return (
                <code
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                    padding: "0.2em 0.4em",
                    borderRadius: "4px",
                    fontSize: "0.875em",
                  }}
                  {...props}
                >
                  {children}
                </code>
              );
            }

            return (
              <SyntaxHighlighter
                style={oneDark}
                language={match ? match[1] : "text"}
                PreTag="div"
                customStyle={{
                  margin: "1em 0",
                  borderRadius: "8px",
                  fontSize: "0.875rem",
                }}
              >
                {String(children).replace(/\n$/, "")}
              </SyntaxHighlighter>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </Box>
  );
}

// TextResponse is defined later after all dependencies are available

// Diff Response Renderer
interface DiffResponseProps {
  prNumber?: number | string;
  title: string;
  author: string;
  diff: string;
  additions: number;
  deletions: number;
  files: string[];
}

export function DiffResponse({
  prNumber,
  title,
  author,
  diff,
  additions,
  deletions,
  files,
}: DiffResponseProps) {
  // Clean up diff - remove any markdown code fences if AI added them incorrectly
  const cleanDiff = (rawDiff: string): string => {
    if (!rawDiff) return '';
    
    // Remove leading/trailing code fences like ```diff and ```
    let cleaned = rawDiff.trim();
    if (cleaned.startsWith('```diff') || cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(?:diff)?\n?/, '');
      cleaned = cleaned.replace(/\n?```$/, '');
    }
    
    return cleaned.trim();
  };
  
  // Parse and colorize diff
  const renderDiff = () => {
    const cleanedDiff = cleanDiff(diff);
    const lines = cleanedDiff.split("\n");
    return lines.map((line, index) => {
      let backgroundColor = "transparent";
      let color = "#d4d4d4";

      if (line.startsWith("+") && !line.startsWith("+++")) {
        backgroundColor = alpha("#10b981", 0.15);
        color = "#34d399";
      } else if (line.startsWith("-") && !line.startsWith("---")) {
        backgroundColor = alpha("#ef4444", 0.15);
        color = "#f87171";
      } else if (line.startsWith("@@")) {
        backgroundColor = alpha("#6366f1", 0.15);
        color = "#818cf8";
      } else if (line.startsWith("diff") || line.startsWith("index")) {
        color = "#9ca3af";
      }

      return (
        <Box
          key={index}
          sx={{
            backgroundColor,
            color,
            fontFamily: "monospace",
            fontSize: "0.8rem",
            lineHeight: 1.6,
            px: 1,
            whiteSpace: "pre-wrap",
            wordBreak: "break-all",
          }}
        >
          {line || " "}
        </Box>
      );
    });
  };

  return (
    <Paper
      sx={{
        backgroundColor: "#1e1e21",
        border: `1px solid ${alpha("#ffffff", 0.1)}`,
        borderRadius: 2,
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2,
          borderBottom: `1px solid ${alpha("#ffffff", 0.1)}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 1,
        }}
      >
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            {prNumber && prNumber !== "N/A" ? `PR #${prNumber}: ` : ""}{title}
          </Typography>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            by @{author}
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Chip
            size="small"
            icon={<AddIcon sx={{ fontSize: 14 }} />}
            label={`+${additions}`}
            sx={{
              backgroundColor: alpha("#10b981", 0.15),
              color: "#34d399",
            }}
          />
          <Chip
            size="small"
            icon={<RemoveIcon sx={{ fontSize: 14 }} />}
            label={`-${deletions}`}
            sx={{
              backgroundColor: alpha("#ef4444", 0.15),
              color: "#f87171",
            }}
          />
        </Box>
      </Box>

      {/* Files list */}
      {files && files.length > 0 && (
        <Box
          sx={{
            px: 2,
            py: 1,
            borderBottom: `1px solid ${alpha("#ffffff", 0.1)}`,
            display: "flex",
            flexWrap: "wrap",
            gap: 1,
          }}
        >
          {files.map((file, index) => (
            <Tooltip key={index} title={file}>
              <Chip
                size="small"
                icon={<InsertDriveFileIcon sx={{ fontSize: 14 }} />}
                label={file.split("/").pop()}
                sx={{
                  backgroundColor: alpha("#ffffff", 0.05),
                  fontSize: "0.7rem",
                }}
              />
            </Tooltip>
          ))}
        </Box>
      )}

      {/* Diff content */}
      <Box
        sx={{
          maxHeight: 400,
          overflow: "auto",
        }}
      >
        {renderDiff()}
      </Box>
    </Paper>
  );
}

// Chart Response Renderer
interface ChartResponseProps {
  chartType: "pie" | "bar" | "line";
  title: string;
  description?: string;
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
  }>;
}

export function ChartResponse({
  chartType,
  title,
  description,
  labels,
  datasets,
}: ChartResponseProps) {
  // Transform data for Recharts
  const chartData = labels.map((label, index) => {
    const dataPoint: Record<string, any> = { name: label };
    datasets.forEach((dataset) => {
      dataPoint[dataset.label] = dataset.data[index];
    });
    return dataPoint;
  });

  const renderChart = () => {
    switch (chartType) {
      case "pie":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey={datasets[0]?.label || "value"}
                label={(props: any) =>
                  `${props.name || ''} (${((props.percent ?? 0) * 100).toFixed(0)}%)`
                }
                labelLine={false}
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                  />
                ))}
              </Pie>
              <RechartsTooltip
                contentStyle={{
                  backgroundColor: "#27272a",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 8,
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );

      case "line":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis
                dataKey="name"
                stroke="#9ca3af"
                fontSize={12}
                tickLine={false}
              />
              <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} />
              <RechartsTooltip
                contentStyle={{
                  backgroundColor: "#27272a",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 8,
                }}
              />
              <Legend />
              {datasets.map((dataset, index) => (
                <Line
                  key={dataset.label}
                  type="monotone"
                  dataKey={dataset.label}
                  stroke={CHART_COLORS[index % CHART_COLORS.length]}
                  strokeWidth={2}
                  dot={{ fill: CHART_COLORS[index % CHART_COLORS.length] }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );

      case "bar":
      default:
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis
                dataKey="name"
                stroke="#9ca3af"
                fontSize={12}
                tickLine={false}
              />
              <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} />
              <RechartsTooltip
                contentStyle={{
                  backgroundColor: "#27272a",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 8,
                }}
              />
              <Legend />
              {datasets.map((dataset, index) => (
                <Bar
                  key={dataset.label}
                  dataKey={dataset.label}
                  fill={CHART_COLORS[index % CHART_COLORS.length]}
                  radius={[4, 4, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );
    }
  };

  return (
    <Paper
      sx={{
        p: 3,
        backgroundColor: "#1e1e21",
        border: `1px solid ${alpha("#ffffff", 0.1)}`,
        borderRadius: 2,
      }}
    >
      <Typography variant="h6" sx={{ mb: 1 }}>
        {title}
      </Typography>
      {description && (
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
          {description}
        </Typography>
      )}
      {renderChart()}
    </Paper>
  );
}

// Table Response Renderer
interface TableResponseProps {
  title?: string;
  headers: string[];
  rows: any[][];
  summary?: string;
}

export function TableResponse({ title, headers, rows, summary }: TableResponseProps) {
  return (
    <Paper
      sx={{
        backgroundColor: "#1e1e21",
        border: `1px solid ${alpha("#ffffff", 0.1)}`,
        borderRadius: 2,
        overflow: "hidden",
      }}
    >
      {title && (
        <Box sx={{ p: 2, borderBottom: `1px solid ${alpha("#ffffff", 0.1)}` }}>
          <Typography variant="h6">{title}</Typography>
        </Box>
      )}

      <Box sx={{ overflow: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "0.875rem",
          }}
        >
          <thead>
            <tr>
              {headers.map((header, index) => (
                <th
                  key={index}
                  style={{
                    padding: "12px 16px",
                    textAlign: "left",
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                    borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                  }}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                style={{
                  borderBottom:
                    rowIndex < rows.length - 1
                      ? "1px solid rgba(255, 255, 255, 0.05)"
                      : "none",
                }}
              >
                {row.map((cell, cellIndex) => (
                  <td
                    key={cellIndex}
                    style={{
                      padding: "12px 16px",
                      verticalAlign: "top",
                    }}
                  >
                    {String(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </Box>

      {summary && (
        <Box
          sx={{
            p: 2,
            borderTop: `1px solid ${alpha("#ffffff", 0.1)}`,
            backgroundColor: alpha("#8b5cf6", 0.05),
          }}
        >
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            {summary}
          </Typography>
        </Box>
      )}
    </Paper>
  );
}

// Mixed Response Renderer
interface MixedResponseProps {
  sections: Array<{
    type: "text" | "diff" | "chart" | "table";
    data: any;
  }>;
}

export function MixedResponse({ sections }: MixedResponseProps) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {sections.map((section, index) => {
        switch (section.type) {
          case "text":
            // Use MarkdownContent to avoid circular dependency
            return <MarkdownContent key={index} content={section.data?.content || ""} />;
          case "diff":
            return <DiffResponse key={index} {...section.data} />;
          case "chart":
            return <ChartResponse key={index} {...section.data} />;
          case "table":
            return <TableResponse key={index} {...section.data} />;
          default:
            return null;
        }
      })}
    </Box>
  );
}

// Inner response renderer that avoids circular dependency with TextResponse
// This is used when we detect JSON in TextResponse content
function AIResponseInner({ response }: AIResponseProps): React.ReactElement {
  switch (response.type) {
    case "text":
      // Use MarkdownContent directly to avoid infinite loop
      return <MarkdownContent content={response.data?.content || ""} />;
    case "diff":
      return <DiffResponse {...response.data} />;
    case "chart":
      return <ChartResponse {...response.data} />;
    case "table":
      return <TableResponse {...response.data} />;
    case "mixed":
      return <MixedResponseInner sections={response.data?.sections || []} />;
    default:
      return (
        <MarkdownContent
          content={typeof response.data === "string" ? response.data : JSON.stringify(response.data, null, 2)}
        />
      );
  }
}

// Mixed response renderer that uses AIResponseInner to avoid circular deps
function MixedResponseInner({ sections }: { sections: Array<{ type: string; data: any }> }) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {sections.map((section, index) => {
        switch (section.type) {
          case "text":
            return <MarkdownContent key={index} content={section.data?.content || ""} />;
          case "diff":
            return <DiffResponse key={index} {...section.data} />;
          case "chart":
            return <ChartResponse key={index} {...section.data} />;
          case "table":
            return <TableResponse key={index} {...section.data} />;
          default:
            return null;
        }
      })}
    </Box>
  );
}

// TextResponse - defined here after AIResponseInner to enable JSON detection
export function TextResponse({ content }: TextResponseProps) {
  // Check if content is actually a JSON response that should be rendered as rich content
  const parsedResponse = tryParseJsonResponse(content);
  
  if (parsedResponse) {
    console.log('[TextResponse] Detected JSON response, type:', parsedResponse.type);
    // Render as rich content using the appropriate renderer
    return <AIResponseInner response={parsedResponse} />;
  }
  
  // Regular markdown content
  return <MarkdownContent content={content} />;
}

// Main Response Renderer that handles all types (public API)
export function AIResponse({ response }: AIResponseProps) {
  switch (response.type) {
    case "text":
      return <TextResponse content={response.data?.content || ""} />;
    case "diff":
      return <DiffResponse {...response.data} />;
    case "chart":
      return <ChartResponse {...response.data} />;
    case "table":
      return <TableResponse {...response.data} />;
    case "mixed":
      return <MixedResponse sections={response.data?.sections || []} />;
    default:
      // Fallback to text if type is unknown
      return (
        <TextResponse
          content={typeof response.data === "string" ? response.data : JSON.stringify(response.data, null, 2)}
        />
      );
  }
}
