import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get all repositories
export const list = query({
  args: {},
  handler: async (ctx) => {
    const repositories = await ctx.db
      .query("repositories")
      .withIndex("by_addedAt")
      .order("desc")
      .collect();
    return repositories;
  },
});

// Get single repository by ID
export const get = query({
  args: { id: v.id("repositories") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Get repository by full name (owner/repo)
export const getByFullName = query({
  args: { fullName: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("repositories")
      .withIndex("by_fullName", (q) => q.eq("fullName", args.fullName))
      .first();
  },
});

// Add new repository
export const add = mutation({
  args: {
    url: v.string(),
    owner: v.string(),
    name: v.string(),
    fullName: v.string(),
    description: v.optional(v.string()),
    defaultBranch: v.string(),
    metadata: v.object({
      stars: v.number(),
      forks: v.number(),
      language: v.optional(v.string()),
      contributors: v.number(),
      openIssues: v.number(),
      avatarUrl: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    // Check if repository already exists
    const existing = await ctx.db
      .query("repositories")
      .withIndex("by_fullName", (q) => q.eq("fullName", args.fullName))
      .first();

    if (existing) {
      // Update existing repository
      await ctx.db.patch(existing._id, {
        description: args.description,
        defaultBranch: args.defaultBranch,
        metadata: args.metadata,
        lastAnalyzedAt: Date.now(),
      });
      return existing._id;
    }

    // Create new repository
    const repositoryId = await ctx.db.insert("repositories", {
      url: args.url,
      owner: args.owner,
      name: args.name,
      fullName: args.fullName,
      description: args.description,
      defaultBranch: args.defaultBranch,
      addedAt: Date.now(),
      lastAnalyzedAt: Date.now(),
      metadata: args.metadata,
    });

    return repositoryId;
  },
});

// Delete repository
export const remove = mutation({
  args: { id: v.id("repositories") },
  handler: async (ctx, args) => {
    // Delete all chats associated with this repository
    const chats = await ctx.db
      .query("chats")
      .withIndex("by_repository", (q) => q.eq("repositoryId", args.id))
      .collect();

    for (const chat of chats) {
      // Delete all messages in each chat
      const messages = await ctx.db
        .query("messages")
        .withIndex("by_chat", (q) => q.eq("chatId", chat._id))
        .collect();

      for (const message of messages) {
        await ctx.db.delete(message._id);
      }

      await ctx.db.delete(chat._id);
    }

    // Delete cached data
    const cacheEntries = await ctx.db
      .query("cache")
      .withIndex("by_repository_type", (q) => q.eq("repositoryId", args.id))
      .collect();

    for (const entry of cacheEntries) {
      await ctx.db.delete(entry._id);
    }

    // Delete the repository
    await ctx.db.delete(args.id);
  },
});

// Update last analyzed timestamp
export const updateLastAnalyzed = mutation({
  args: { id: v.id("repositories") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      lastAnalyzedAt: Date.now(),
    });
  },
});
