import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get all chats for a repository
export const listByRepository = query({
  args: { repositoryId: v.id("repositories") },
  handler: async (ctx, args) => {
    const chats = await ctx.db
      .query("chats")
      .withIndex("by_repository", (q) => q.eq("repositoryId", args.repositoryId))
      .order("desc")
      .collect();
    
    // Sort by updatedAt descending
    return chats.sort((a, b) => b.updatedAt - a.updatedAt);
  },
});

// Get single chat by ID
export const get = query({
  args: { id: v.id("chats") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Create new chat
export const create = mutation({
  args: {
    repositoryId: v.id("repositories"),
    title: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const chatId = await ctx.db.insert("chats", {
      repositoryId: args.repositoryId,
      title: args.title || "New Chat",
      createdAt: now,
      updatedAt: now,
    });
    return chatId;
  },
});

// Update chat title
export const updateTitle = mutation({
  args: {
    id: v.id("chats"),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      title: args.title,
      updatedAt: Date.now(),
    });
  },
});

// Update chat timestamp (called when new message is added)
export const touch = mutation({
  args: { id: v.id("chats") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      updatedAt: Date.now(),
    });
  },
});

// Delete chat and all its messages
export const remove = mutation({
  args: { id: v.id("chats") },
  handler: async (ctx, args) => {
    // Delete all messages in this chat
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_chat", (q) => q.eq("chatId", args.id))
      .collect();

    for (const message of messages) {
      await ctx.db.delete(message._id);
    }

    // Delete the chat
    await ctx.db.delete(args.id);
  },
});
