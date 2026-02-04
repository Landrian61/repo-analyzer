import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";

// Get all messages for a chat
export const listByChat = query({
  args: { chatId: v.id("chats") },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_chat", (q) => q.eq("chatId", args.chatId))
      .order("asc")
      .collect();
    return messages;
  },
});

// Get single message by ID
export const get = query({
  args: { id: v.id("messages") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Add user message
export const addUserMessage = mutation({
  args: {
    chatId: v.id("chats"),
    content: v.string(),
    attachedContributors: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const messageId = await ctx.db.insert("messages", {
      chatId: args.chatId,
      role: "user",
      content: args.content,
      attachedContributors: args.attachedContributors,
      timestamp: Date.now(),
    });

    // Update chat timestamp
    await ctx.db.patch(args.chatId, {
      updatedAt: Date.now(),
    });

    // Update chat title if this is the first message
    const chat = await ctx.db.get(args.chatId);
    if (chat && chat.title === "New Chat") {
      // Generate a title from the first message
      const title = args.content.slice(0, 50) + (args.content.length > 50 ? "..." : "");
      await ctx.db.patch(args.chatId, {
        title,
      });
    }

    return messageId;
  },
});

// Add assistant message
export const addAssistantMessage = mutation({
  args: {
    chatId: v.id("chats"),
    content: v.string(),
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
  },
  handler: async (ctx, args) => {
    const messageId = await ctx.db.insert("messages", {
      chatId: args.chatId,
      role: "assistant",
      content: args.content,
      response: args.response,
      timestamp: Date.now(),
    });

    // Update chat timestamp
    await ctx.db.patch(args.chatId, {
      updatedAt: Date.now(),
    });

    return messageId;
  },
});

// Internal mutation for adding assistant message from actions
export const addAssistantMessageInternal = internalMutation({
  args: {
    chatId: v.id("chats"),
    content: v.string(),
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
    toolCalls: v.optional(v.array(v.any())),
  },
  handler: async (ctx, args) => {
    const messageId = await ctx.db.insert("messages", {
      chatId: args.chatId,
      role: "assistant",
      content: args.content,
      response: args.response,
      toolCalls: args.toolCalls,
      timestamp: Date.now(),
    });

    // Update chat timestamp
    await ctx.db.patch(args.chatId, {
      updatedAt: Date.now(),
    });

    return messageId;
  },
});
