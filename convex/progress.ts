import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";

// Store for tracking analysis progress
// This is a simple in-memory store that clients can subscribe to

export const updateProgress = internalMutation({
  args: {
    chatId: v.id("chats"),
    status: v.string(),
    currentStep: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if a progress entry exists for this chat
    const existing = await ctx.db
      .query("analysisProgress")
      .withIndex("by_chat", (q) => q.eq("chatId", args.chatId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        status: args.status,
        currentStep: args.currentStep,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("analysisProgress", {
        chatId: args.chatId,
        status: args.status,
        currentStep: args.currentStep,
        updatedAt: Date.now(),
      });
    }
  },
});

export const getProgress = query({
  args: {
    chatId: v.id("chats"),
  },
  handler: async (ctx, args) => {
    const progress = await ctx.db
      .query("analysisProgress")
      .withIndex("by_chat", (q) => q.eq("chatId", args.chatId))
      .first();

    return progress || null;
  },
});

export const clearProgress = internalMutation({
  args: {
    chatId: v.id("chats"),
  },
  handler: async (ctx, args) => {
    const progress = await ctx.db
      .query("analysisProgress")
      .withIndex("by_chat", (q) => q.eq("chatId", args.chatId))
      .first();

    if (progress) {
      await ctx.db.delete(progress._id);
    }
  },
});
