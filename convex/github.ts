"use node";

import { action, internalAction } from "./_generated/server";
import { v } from "convex/values";
import { Octokit } from "octokit";

// Helper to get Octokit instance
const getOctokit = () => {
  return new Octokit({
    auth: process.env.GITHUB_TOKEN,
  });
};

// Fetch repository metadata
export const fetchRepository = action({
  args: { owner: v.string(), repo: v.string() },
  handler: async (ctx, { owner, repo }) => {
    const octokit = getOctokit();

    try {
      const { data } = await octokit.rest.repos.get({
        owner,
        repo,
      });

      // Get contributor count
      let contributorCount = 0;
      try {
        const contributors = await octokit.rest.repos.listContributors({
          owner,
          repo,
          per_page: 1,
          anon: "false",
        });
        // Check headers for total count
        const linkHeader = contributors.headers.link;
        if (linkHeader) {
          const match = linkHeader.match(/page=(\d+)>; rel="last"/);
          contributorCount = match ? parseInt(match[1]) : contributors.data.length;
        } else {
          contributorCount = contributors.data.length;
        }
      } catch {
        contributorCount = 0;
      }

      return {
        name: data.name,
        owner: data.owner.login,
        fullName: data.full_name,
        description: data.description || undefined,
        defaultBranch: data.default_branch,
        stars: data.stargazers_count,
        forks: data.forks_count,
        language: data.language || undefined,
        openIssues: data.open_issues_count,
        contributors: contributorCount,
        avatarUrl: data.owner.avatar_url,
        url: data.html_url,
      };
    } catch (error: any) {
      if (error.status === 404) {
        throw new Error("Repository not found. Make sure it exists and is public.");
      }
      if (error.status === 403) {
        throw new Error("GitHub API rate limit exceeded. Please try again later.");
      }
      throw new Error(`Failed to fetch repository: ${error.message}`);
    }
  },
});

// Fetch contributors
export const fetchContributors = action({
  args: { owner: v.string(), repo: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, { owner, repo, limit = 100 }) => {
    const octokit = getOctokit();

    try {
      const contributors: any[] = [];
      let page = 1;
      const perPage = Math.min(limit, 100);

      while (contributors.length < limit) {
        const { data } = await octokit.rest.repos.listContributors({
          owner,
          repo,
          per_page: perPage,
          page,
          anon: "false",
        });

        if (data.length === 0) break;

        contributors.push(
          ...data.map((c: any) => ({
            login: c.login,
            avatarUrl: c.avatar_url,
            contributions: c.contributions,
            htmlUrl: c.html_url,
            type: c.type,
          }))
        );

        if (data.length < perPage) break;
        page++;
      }

      return contributors.slice(0, limit);
    } catch (error: any) {
      throw new Error(`Failed to fetch contributors: ${error.message}`);
    }
  },
});

// Fetch pull requests
export const fetchPullRequests = action({
  args: {
    owner: v.string(),
    repo: v.string(),
    state: v.optional(v.union(v.literal("open"), v.literal("closed"), v.literal("all"))),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { owner, repo, state = "all", limit = 50 }) => {
    const octokit = getOctokit();

    try {
      const { data } = await octokit.rest.pulls.list({
        owner,
        repo,
        state,
        per_page: Math.min(limit, 100),
        sort: "updated",
        direction: "desc",
      });

      return data.map((pr: any) => ({
        number: pr.number,
        title: pr.title,
        state: pr.state,
        user: {
          login: pr.user?.login,
          avatarUrl: pr.user?.avatar_url,
        },
        createdAt: pr.created_at,
        updatedAt: pr.updated_at,
        mergedAt: pr.merged_at,
        closedAt: pr.closed_at,
        draft: pr.draft,
        additions: pr.additions,
        deletions: pr.deletions,
        changedFiles: pr.changed_files,
        labels: pr.labels?.map((l: any) => l.name) || [],
        htmlUrl: pr.html_url,
      }));
    } catch (error: any) {
      throw new Error(`Failed to fetch pull requests: ${error.message}`);
    }
  },
});

// Fetch single PR with diff
export const fetchPullRequestDiff = action({
  args: { owner: v.string(), repo: v.string(), prNumber: v.number() },
  handler: async (ctx, { owner, repo, prNumber }) => {
    const octokit = getOctokit();

    try {
      const [prData, diffData] = await Promise.all([
        octokit.rest.pulls.get({
          owner,
          repo,
          pull_number: prNumber,
        }),
        octokit.rest.pulls.get({
          owner,
          repo,
          pull_number: prNumber,
          mediaType: {
            format: "diff",
          },
        }),
      ]);

      return {
        number: prData.data.number,
        title: prData.data.title,
        body: prData.data.body,
        state: prData.data.state,
        user: {
          login: prData.data.user?.login,
          avatarUrl: prData.data.user?.avatar_url,
        },
        diff: diffData.data as unknown as string,
        additions: prData.data.additions,
        deletions: prData.data.deletions,
        changedFiles: prData.data.changed_files,
        files: [],
        createdAt: prData.data.created_at,
        mergedAt: prData.data.merged_at,
      };
    } catch (error: any) {
      throw new Error(`Failed to fetch PR diff: ${error.message}`);
    }
  },
});

// Fetch issues
export const fetchIssues = action({
  args: {
    owner: v.string(),
    repo: v.string(),
    state: v.optional(v.union(v.literal("open"), v.literal("closed"), v.literal("all"))),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { owner, repo, state = "all", limit = 50 }) => {
    const octokit = getOctokit();

    try {
      const { data } = await octokit.rest.issues.listForRepo({
        owner,
        repo,
        state,
        per_page: Math.min(limit, 100),
        sort: "updated",
        direction: "desc",
      });

      // Filter out pull requests (GitHub API includes them in issues)
      return data
        .filter((issue: any) => !issue.pull_request)
        .map((issue: any) => ({
          number: issue.number,
          title: issue.title,
          state: issue.state,
          user: {
            login: issue.user?.login,
            avatarUrl: issue.user?.avatar_url,
          },
          createdAt: issue.created_at,
          updatedAt: issue.updated_at,
          closedAt: issue.closed_at,
          labels: issue.labels?.map((l: any) => (typeof l === "string" ? l : l.name)) || [],
          comments: issue.comments,
          htmlUrl: issue.html_url,
        }));
    } catch (error: any) {
      throw new Error(`Failed to fetch issues: ${error.message}`);
    }
  },
});

// Fetch commits
export const fetchCommits = action({
  args: {
    owner: v.string(),
    repo: v.string(),
    author: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { owner, repo, author, limit = 50 }) => {
    const octokit = getOctokit();

    try {
      const params: any = {
        owner,
        repo,
        per_page: Math.min(limit, 100),
      };

      if (author) {
        params.author = author;
      }

      const { data } = await octokit.rest.repos.listCommits(params);

      return data.map((commit: any) => ({
        sha: commit.sha,
        message: commit.commit.message,
        author: {
          name: commit.commit.author?.name,
          email: commit.commit.author?.email,
          date: commit.commit.author?.date,
          login: commit.author?.login,
          avatarUrl: commit.author?.avatar_url,
        },
        committer: {
          name: commit.commit.committer?.name,
          date: commit.commit.committer?.date,
        },
        htmlUrl: commit.html_url,
      }));
    } catch (error: any) {
      throw new Error(`Failed to fetch commits: ${error.message}`);
    }
  },
});

// Fetch repository statistics
export const fetchRepoStats = action({
  args: { owner: v.string(), repo: v.string() },
  handler: async (ctx, { owner, repo }) => {
    const octokit = getOctokit();

    try {
      const [contributors, codeFrequency, participation] = await Promise.allSettled([
        octokit.rest.repos.getContributorsStats({ owner, repo }),
        octokit.rest.repos.getCodeFrequencyStats({ owner, repo }),
        octokit.rest.repos.getParticipationStats({ owner, repo }),
      ]);

      return {
        contributors:
          contributors.status === "fulfilled"
            ? contributors.value.data
            : [],
        codeFrequency:
          codeFrequency.status === "fulfilled"
            ? codeFrequency.value.data
            : [],
        participation:
          participation.status === "fulfilled"
            ? participation.value.data
            : null,
      };
    } catch (error: any) {
      throw new Error(`Failed to fetch repository stats: ${error.message}`);
    }
  },
});

// Fetch file tree (directory contents)
export const fetchFileTree = action({
  args: {
    owner: v.string(),
    repo: v.string(),
    path: v.optional(v.string()),
    branch: v.optional(v.string()),
  },
  handler: async (ctx, { owner, repo, path = "", branch }) => {
    const octokit = getOctokit();

    try {
      // First get the default branch if not specified
      let ref = branch;
      if (!ref) {
        const { data: repoData } = await octokit.rest.repos.get({ owner, repo });
        ref = repoData.default_branch;
      }

      const { data } = await octokit.rest.repos.getContent({
        owner,
        repo,
        path,
        ref,
      });

      // If it's an array, it's a directory listing
      if (Array.isArray(data)) {
        return {
          path,
          branch: ref,
          items: data.map((item: any) => ({
            name: item.name,
            path: item.path,
            type: item.type, // "file" or "dir"
            size: item.size,
            sha: item.sha,
            url: item.html_url,
          })),
        };
      }

      // If it's a single file
      return {
        path,
        branch: ref,
        items: [{
          name: data.name,
          path: data.path,
          type: data.type,
          size: data.size,
          sha: data.sha,
          url: data.html_url,
        }],
      };
    } catch (error: any) {
      if (error.status === 404) {
        throw new Error(`Path not found: ${path}`);
      }
      throw new Error(`Failed to fetch file tree: ${error.message}`);
    }
  },
});

// Fetch file content
export const fetchFileContent = action({
  args: {
    owner: v.string(),
    repo: v.string(),
    path: v.string(),
    branch: v.optional(v.string()),
  },
  handler: async (ctx, { owner, repo, path, branch }) => {
    const octokit = getOctokit();

    try {
      // Get default branch if not specified
      let ref = branch;
      if (!ref) {
        const { data: repoData } = await octokit.rest.repos.get({ owner, repo });
        ref = repoData.default_branch;
      }

      const { data } = await octokit.rest.repos.getContent({
        owner,
        repo,
        path,
        ref,
      });

      // Make sure it's a file
      if (Array.isArray(data)) {
        throw new Error(`Path is a directory, not a file: ${path}`);
      }

      if (data.type !== "file") {
        throw new Error(`Path is not a file: ${path}`);
      }

      // Decode base64 content
      const content = data.encoding === "base64" 
        ? Buffer.from(data.content, "base64").toString("utf-8")
        : data.content;

      // Determine language from file extension
      const extension = path.split(".").pop()?.toLowerCase() || "";
      const languageMap: Record<string, string> = {
        ts: "typescript",
        tsx: "typescript",
        js: "javascript",
        jsx: "javascript",
        py: "python",
        rb: "ruby",
        go: "go",
        rs: "rust",
        java: "java",
        kt: "kotlin",
        swift: "swift",
        cs: "csharp",
        cpp: "cpp",
        c: "c",
        h: "c",
        hpp: "cpp",
        php: "php",
        html: "html",
        css: "css",
        scss: "scss",
        json: "json",
        yaml: "yaml",
        yml: "yaml",
        md: "markdown",
        sql: "sql",
        sh: "bash",
        bash: "bash",
        dockerfile: "dockerfile",
      };

      return {
        path,
        name: data.name,
        branch: ref,
        sha: data.sha,
        size: data.size,
        content,
        language: languageMap[extension] || extension,
        url: data.html_url,
        truncated: content.length > 100000, // Flag if content might be truncated
      };
    } catch (error: any) {
      if (error.status === 404) {
        throw new Error(`File not found: ${path}`);
      }
      throw new Error(`Failed to fetch file content: ${error.message}`);
    }
  },
});

// Fetch commit diff
export const fetchCommitDiff = action({
  args: {
    owner: v.string(),
    repo: v.string(),
    sha: v.string(),
  },
  handler: async (ctx, { owner, repo, sha }) => {
    const octokit = getOctokit();

    try {
      const { data } = await octokit.rest.repos.getCommit({
        owner,
        repo,
        ref: sha,
      });

      return {
        sha: data.sha,
        message: data.commit.message,
        author: {
          name: data.commit.author?.name,
          email: data.commit.author?.email,
          date: data.commit.author?.date,
          login: data.author?.login,
          avatarUrl: data.author?.avatar_url,
        },
        committer: {
          name: data.commit.committer?.name,
          date: data.commit.committer?.date,
        },
        stats: {
          additions: data.stats?.additions || 0,
          deletions: data.stats?.deletions || 0,
          total: data.stats?.total || 0,
        },
        files: data.files?.map((file: any) => ({
          filename: file.filename,
          status: file.status, // "added", "removed", "modified", "renamed"
          additions: file.additions,
          deletions: file.deletions,
          changes: file.changes,
          patch: file.patch, // The diff content
          previousFilename: file.previous_filename,
        })) || [],
        url: data.html_url,
      };
    } catch (error: any) {
      if (error.status === 404) {
        throw new Error(`Commit not found: ${sha}`);
      }
      throw new Error(`Failed to fetch commit diff: ${error.message}`);
    }
  },
});

// Compare two branches or commits
export const compareBranches = action({
  args: {
    owner: v.string(),
    repo: v.string(),
    base: v.string(),
    head: v.string(),
  },
  handler: async (ctx, { owner, repo, base, head }) => {
    const octokit = getOctokit();

    try {
      const { data } = await octokit.rest.repos.compareCommits({
        owner,
        repo,
        base,
        head,
      });

      return {
        status: data.status, // "ahead", "behind", "diverged", "identical"
        aheadBy: data.ahead_by,
        behindBy: data.behind_by,
        totalCommits: data.total_commits,
        commits: data.commits.slice(0, 50).map((commit: any) => ({
          sha: commit.sha,
          message: commit.commit.message,
          author: {
            name: commit.commit.author?.name,
            login: commit.author?.login,
            date: commit.commit.author?.date,
          },
        })),
        files: data.files?.slice(0, 100).map((file: any) => ({
          filename: file.filename,
          status: file.status,
          additions: file.additions,
          deletions: file.deletions,
          changes: file.changes,
          patch: file.patch?.slice(0, 5000), // Limit patch size
        })) || [],
        stats: {
          additions: data.files?.reduce((sum: number, f: any) => sum + f.additions, 0) || 0,
          deletions: data.files?.reduce((sum: number, f: any) => sum + f.deletions, 0) || 0,
          changedFiles: data.files?.length || 0,
        },
        url: data.html_url,
      };
    } catch (error: any) {
      throw new Error(`Failed to compare: ${error.message}`);
    }
  },
});

// Search code in repository
export const searchCode = action({
  args: {
    owner: v.string(),
    repo: v.string(),
    query: v.string(),
    path: v.optional(v.string()),
    extension: v.optional(v.string()),
  },
  handler: async (ctx, { owner, repo, query, path, extension }) => {
    const octokit = getOctokit();

    try {
      // Build the search query
      let searchQuery = `${query} repo:${owner}/${repo}`;
      if (path) {
        searchQuery += ` path:${path}`;
      }
      if (extension) {
        searchQuery += ` extension:${extension}`;
      }

      const { data } = await octokit.rest.search.code({
        q: searchQuery,
        per_page: 30,
      });

      return {
        totalCount: data.total_count,
        items: data.items.map((item: any) => ({
          name: item.name,
          path: item.path,
          sha: item.sha,
          url: item.html_url,
          repository: item.repository.full_name,
          score: item.score,
          textMatches: item.text_matches?.map((match: any) => ({
            fragment: match.fragment,
            matches: match.matches,
          })),
        })),
      };
    } catch (error: any) {
      if (error.status === 403) {
        throw new Error("Code search rate limit exceeded. Please try again later.");
      }
      throw new Error(`Failed to search code: ${error.message}`);
    }
  },
});

// Fetch branches
export const fetchBranches = action({
  args: {
    owner: v.string(),
    repo: v.string(),
  },
  handler: async (ctx, { owner, repo }) => {
    const octokit = getOctokit();

    try {
      const { data } = await octokit.rest.repos.listBranches({
        owner,
        repo,
        per_page: 100,
      });

      // Get default branch
      const { data: repoData } = await octokit.rest.repos.get({ owner, repo });

      return {
        defaultBranch: repoData.default_branch,
        branches: data.map((branch: any) => ({
          name: branch.name,
          sha: branch.commit.sha,
          protected: branch.protected,
          isDefault: branch.name === repoData.default_branch,
        })),
      };
    } catch (error: any) {
      throw new Error(`Failed to fetch branches: ${error.message}`);
    }
  },
});

// Fetch PR files (list of changed files in a PR)
export const fetchPullRequestFiles = action({
  args: {
    owner: v.string(),
    repo: v.string(),
    prNumber: v.number(),
  },
  handler: async (ctx, { owner, repo, prNumber }) => {
    const octokit = getOctokit();

    try {
      const { data } = await octokit.rest.pulls.listFiles({
        owner,
        repo,
        pull_number: prNumber,
        per_page: 100,
      });

      return {
        prNumber,
        totalFiles: data.length,
        files: data.map((file: any) => ({
          filename: file.filename,
          status: file.status,
          additions: file.additions,
          deletions: file.deletions,
          changes: file.changes,
          patch: file.patch?.slice(0, 10000), // Limit patch size
          blobUrl: file.blob_url,
          rawUrl: file.raw_url,
          previousFilename: file.previous_filename,
        })),
      };
    } catch (error: any) {
      throw new Error(`Failed to fetch PR files: ${error.message}`);
    }
  },
});

// Fetch languages used in repository
export const fetchLanguages = action({
  args: {
    owner: v.string(),
    repo: v.string(),
  },
  handler: async (ctx, { owner, repo }) => {
    const octokit = getOctokit();

    try {
      const { data } = await octokit.rest.repos.listLanguages({
        owner,
        repo,
      });

      const total = Object.values(data).reduce((sum: number, bytes: any) => sum + bytes, 0);

      return {
        total,
        languages: Object.entries(data).map(([language, bytes]: [string, any]) => ({
          language,
          bytes,
          percentage: ((bytes / total) * 100).toFixed(2),
        })).sort((a, b) => b.bytes - a.bytes),
      };
    } catch (error: any) {
      throw new Error(`Failed to fetch languages: ${error.message}`);
    }
  },
});
