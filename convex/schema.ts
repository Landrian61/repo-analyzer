import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Repositories table
  repositories: defineTable({
    url: v.string(),
    owner: v.string(),
    name: v.string(),
    fullName: v.string(), // "owner/repo"
    description: v.optional(v.string()),
    defaultBranch: v.string(),
    addedAt: v.number(),
    lastAnalyzedAt: v.optional(v.number()),
    metadata: v.object({
      stars: v.number(),
      forks: v.number(),
      language: v.optional(v.string()),
      contributors: v.number(),
      openIssues: v.number(),
      avatarUrl: v.optional(v.string()),
    }),
  })
    .index("by_fullName", ["fullName"])
    .index("by_addedAt", ["addedAt"]),

  // Chats table
  chats: defineTable({
    repositoryId: v.id("repositories"),
    title: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_repository", ["repositoryId"])
    .index("by_updatedAt", ["updatedAt"]),

  // Messages table
  messages: defineTable({
    chatId: v.id("chats"),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    attachedContributors: v.optional(v.array(v.string())),
    response: v.optional(
      v.object({
        type: v.union(
          v.literal("text"),
          v.literal("diff"),
          v.literal("chart"),
          v.literal("table"),
          v.literal("mixed")
        ),
        data: v.any(),
      })
    ),
    timestamp: v.number(),
    toolCalls: v.optional(v.array(v.any())), // Track tool calls made
  })
    .index("by_chat", ["chatId"])
    .index("by_timestamp", ["timestamp"]),

  // Cache table for GitHub data
  cache: defineTable({
    repositoryId: v.id("repositories"),
    dataType: v.union(
      v.literal("contributors"),
      v.literal("prs"),
      v.literal("issues"),
      v.literal("commits"),
      v.literal("files"),
      v.literal("file_content")
    ),
    key: v.optional(v.string()), // For file-specific caching
    data: v.any(),
    expiresAt: v.number(),
  })
    .index("by_repository_type", ["repositoryId", "dataType"])
    .index("by_repository_type_key", ["repositoryId", "dataType", "key"])
    .index("by_expiry", ["expiresAt"]),

  // Analysis progress tracking
  analysisProgress: defineTable({
    chatId: v.id("chats"),
    status: v.string(),
    currentStep: v.optional(v.string()),
    updatedAt: v.number(),
  })
    .index("by_chat", ["chatId"]),
});
