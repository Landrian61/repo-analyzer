import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";

const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Get cached data
export const get = query({
  args: {
    repositoryId: v.id("repositories"),
    dataType: v.union(
      v.literal("contributors"),
      v.literal("prs"),
      v.literal("issues"),
      v.literal("commits")
    ),
  },
  handler: async (ctx, { repositoryId, dataType }) => {
    const cached = await ctx.db
      .query("cache")
      .withIndex("by_repository_type", (q) =>
        q.eq("repositoryId", repositoryId).eq("dataType", dataType)
      )
      .first();

    if (!cached) return null;

    // Check if cache is expired
    if (cached.expiresAt < Date.now()) {
      return null;
    }

    return cached.data;
  },
});

// Set cached data
export const set = mutation({
  args: {
    repositoryId: v.id("repositories"),
    dataType: v.union(
      v.literal("contributors"),
      v.literal("prs"),
      v.literal("issues"),
      v.literal("commits")
    ),
    data: v.any(),
  },
  handler: async (ctx, { repositoryId, dataType, data }) => {
    // Delete existing cache entry
    const existing = await ctx.db
      .query("cache")
      .withIndex("by_repository_type", (q) =>
        q.eq("repositoryId", repositoryId).eq("dataType", dataType)
      )
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
    }

    // Create new cache entry
    await ctx.db.insert("cache", {
      repositoryId,
      dataType,
      data,
      expiresAt: Date.now() + CACHE_TTL,
    });
  },
});

// Internal mutation for setting cache from actions
export const setInternal = internalMutation({
  args: {
    repositoryId: v.id("repositories"),
    dataType: v.union(
      v.literal("contributors"),
      v.literal("prs"),
      v.literal("issues"),
      v.literal("commits")
    ),
    data: v.any(),
  },
  handler: async (ctx, { repositoryId, dataType, data }) => {
    // Delete existing cache entry
    const existing = await ctx.db
      .query("cache")
      .withIndex("by_repository_type", (q) =>
        q.eq("repositoryId", repositoryId).eq("dataType", dataType)
      )
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
    }

    // Create new cache entry
    await ctx.db.insert("cache", {
      repositoryId,
      dataType,
      data,
      expiresAt: Date.now() + CACHE_TTL,
    });
  },
});

// Clear cache for a repository
export const clear = mutation({
  args: {
    repositoryId: v.id("repositories"),
  },
  handler: async (ctx, { repositoryId }) => {
    const entries = await ctx.db
      .query("cache")
      .withIndex("by_repository_type", (q) => q.eq("repositoryId", repositoryId))
      .collect();

    for (const entry of entries) {
      await ctx.db.delete(entry._id);
    }
  },
});

// Clean up expired cache entries (can be called periodically)
export const cleanExpired = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const expired = await ctx.db
      .query("cache")
      .withIndex("by_expiry")
      .filter((q) => q.lt(q.field("expiresAt"), now))
      .collect();

    for (const entry of expired) {
      await ctx.db.delete(entry._id);
    }

    return { deleted: expired.length };
  },
});
