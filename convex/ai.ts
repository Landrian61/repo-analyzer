"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

// Re-export the agent functions
export { analyzeWithTools as analyzeRepository, analyzeSimple as analyzeRepositorySimple } from "./agent";

// Action to gather all repository data for analysis
export const gatherRepositoryData = action({
  args: {
    repositoryId: v.id("repositories"),
  },
  handler: async (ctx, { repositoryId }): Promise<{
    repository: any;
    contributors: any;
    pullRequests: any;
    issues: any;
    commits: any;
  }> => {
    const repository = await ctx.runQuery(api.repositories.get, { id: repositoryId });

    if (!repository) {
      throw new Error("Repository not found");
    }

    const { owner, name } = repository;

    // Fetch all data in parallel
    const [contributors, pullRequests, issues, commits] = await Promise.all([
      ctx.runAction(api.github.fetchContributors, { owner, repo: name, limit: 100 }),
      ctx.runAction(api.github.fetchPullRequests, { owner, repo: name, limit: 50 }),
      ctx.runAction(api.github.fetchIssues, { owner, repo: name, limit: 50 }),
      ctx.runAction(api.github.fetchCommits, { owner, repo: name, limit: 100 }),
    ]);

    return {
      repository,
      contributors,
      pullRequests,
      issues,
      commits,
    };
  },
});
