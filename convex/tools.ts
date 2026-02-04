"use node";

import { Octokit } from "octokit";

// Helper to get Octokit instance
const getOctokit = () => {
  return new Octokit({
    auth: process.env.GITHUB_TOKEN,
  });
};

// ==================== Tool Definitions for Gemini ====================

export const toolDeclarations = [
  {
    name: "getRepositoryOverview",
    description: "Get an overview of the repository including stats, language, description, and metadata",
    parameters: {
      type: "object",
      properties: {
        owner: { type: "string", description: "Repository owner/organization" },
        repo: { type: "string", description: "Repository name" },
      },
      required: ["owner", "repo"],
    },
  },
  {
    name: "getContributors",
    description: "Get the list of contributors to the repository with their contribution counts",
    parameters: {
      type: "object",
      properties: {
        owner: { type: "string", description: "Repository owner/organization" },
        repo: { type: "string", description: "Repository name" },
        limit: { type: "number", description: "Maximum number of contributors to return (default: 30)" },
      },
      required: ["owner", "repo"],
    },
  },
  {
    name: "getPullRequests",
    description: "Get pull requests from the repository with their status, author, and basic info",
    parameters: {
      type: "object",
      properties: {
        owner: { type: "string", description: "Repository owner/organization" },
        repo: { type: "string", description: "Repository name" },
        state: { type: "string", enum: ["open", "closed", "all"], description: "Filter by PR state (default: all)" },
        limit: { type: "number", description: "Maximum number of PRs to return (default: 20)" },
      },
      required: ["owner", "repo"],
    },
  },
  {
    name: "getPullRequestDetails",
    description: "Get detailed information about a specific pull request including the code diff and changed files",
    parameters: {
      type: "object",
      properties: {
        owner: { type: "string", description: "Repository owner/organization" },
        repo: { type: "string", description: "Repository name" },
        prNumber: { type: "number", description: "Pull request number" },
      },
      required: ["owner", "repo", "prNumber"],
    },
  },
  {
    name: "getIssues",
    description: "Get issues from the repository with their status, labels, and assignees",
    parameters: {
      type: "object",
      properties: {
        owner: { type: "string", description: "Repository owner/organization" },
        repo: { type: "string", description: "Repository name" },
        state: { type: "string", enum: ["open", "closed", "all"], description: "Filter by issue state (default: all)" },
        labels: { type: "string", description: "Comma-separated list of labels to filter by" },
        limit: { type: "number", description: "Maximum number of issues to return (default: 20)" },
      },
      required: ["owner", "repo"],
    },
  },
  {
    name: "getCommits",
    description: "Get recent commits from the repository with author, message, and timestamp",
    parameters: {
      type: "object",
      properties: {
        owner: { type: "string", description: "Repository owner/organization" },
        repo: { type: "string", description: "Repository name" },
        author: { type: "string", description: "Filter by commit author username" },
        path: { type: "string", description: "Filter by file path" },
        limit: { type: "number", description: "Maximum number of commits to return (default: 30)" },
      },
      required: ["owner", "repo"],
    },
  },
  {
    name: "getFileTree",
    description: "Get the file and directory structure of the repository at a specific path",
    parameters: {
      type: "object",
      properties: {
        owner: { type: "string", description: "Repository owner/organization" },
        repo: { type: "string", description: "Repository name" },
        path: { type: "string", description: "Path to a specific directory (default: root)" },
        branch: { type: "string", description: "Branch name (default: main/master)" },
      },
      required: ["owner", "repo"],
    },
  },
  {
    name: "getFileContent",
    description: "Get the content of a specific file in the repository. Use this to read source code files.",
    parameters: {
      type: "object",
      properties: {
        owner: { type: "string", description: "Repository owner/organization" },
        repo: { type: "string", description: "Repository name" },
        path: { type: "string", description: "Full path to the file (e.g., 'src/index.ts')" },
        branch: { type: "string", description: "Branch name (default: main/master)" },
      },
      required: ["owner", "repo", "path"],
    },
  },
  {
    name: "getCommitDiff",
    description: "Get the diff/changes introduced by a specific commit",
    parameters: {
      type: "object",
      properties: {
        owner: { type: "string", description: "Repository owner/organization" },
        repo: { type: "string", description: "Repository name" },
        sha: { type: "string", description: "Commit SHA (can be short or full)" },
      },
      required: ["owner", "repo", "sha"],
    },
  },
  {
    name: "compareBranches",
    description: "Compare two branches or commits to see the differences",
    parameters: {
      type: "object",
      properties: {
        owner: { type: "string", description: "Repository owner/organization" },
        repo: { type: "string", description: "Repository name" },
        base: { type: "string", description: "Base branch or commit SHA" },
        head: { type: "string", description: "Head branch or commit SHA to compare" },
      },
      required: ["owner", "repo", "base", "head"],
    },
  },
  {
    name: "searchCode",
    description: "Search for code patterns or text within the repository",
    parameters: {
      type: "object",
      properties: {
        owner: { type: "string", description: "Repository owner/organization" },
        repo: { type: "string", description: "Repository name" },
        query: { type: "string", description: "Search query (code pattern or text to find)" },
        extension: { type: "string", description: "Limit search to files with this extension (e.g., 'ts', 'py')" },
      },
      required: ["owner", "repo", "query"],
    },
  },
  {
    name: "getBranches",
    description: "Get list of branches in the repository",
    parameters: {
      type: "object",
      properties: {
        owner: { type: "string", description: "Repository owner/organization" },
        repo: { type: "string", description: "Repository name" },
      },
      required: ["owner", "repo"],
    },
  },
  {
    name: "getLanguages",
    description: "Get the programming languages used in the repository with their percentages",
    parameters: {
      type: "object",
      properties: {
        owner: { type: "string", description: "Repository owner/organization" },
        repo: { type: "string", description: "Repository name" },
      },
      required: ["owner", "repo"],
    },
  },
];

// ==================== Tool Implementations ====================

export async function executeTool(name: string, args: any): Promise<any> {
  const octokit = getOctokit();

  try {
    switch (name) {
      case "getRepositoryOverview":
        return await getRepositoryOverview(octokit, args);
      case "getContributors":
        return await getContributors(octokit, args);
      case "getPullRequests":
        return await getPullRequests(octokit, args);
      case "getPullRequestDetails":
        return await getPullRequestDetails(octokit, args);
      case "getIssues":
        return await getIssues(octokit, args);
      case "getCommits":
        return await getCommits(octokit, args);
      case "getFileTree":
        return await getFileTree(octokit, args);
      case "getFileContent":
        return await getFileContent(octokit, args);
      case "getCommitDiff":
        return await getCommitDiff(octokit, args);
      case "compareBranches":
        return await compareBranches(octokit, args);
      case "searchCode":
        return await searchCode(octokit, args);
      case "getBranches":
        return await getBranches(octokit, args);
      case "getLanguages":
        return await getLanguages(octokit, args);
      default:
        return { error: `Unknown tool: ${name}` };
    }
  } catch (error: any) {
    return { error: `Tool error: ${error.message}` };
  }
}

async function getRepositoryOverview(octokit: Octokit, args: { owner: string; repo: string }) {
  const { data } = await octokit.rest.repos.get({
    owner: args.owner,
    repo: args.repo,
  });

  return {
    name: data.name,
    fullName: data.full_name,
    description: data.description,
    language: data.language,
    stars: data.stargazers_count,
    forks: data.forks_count,
    openIssues: data.open_issues_count,
    watchers: data.watchers_count,
    defaultBranch: data.default_branch,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    pushedAt: data.pushed_at,
    topics: data.topics,
    license: data.license?.name,
    hasWiki: data.has_wiki,
    hasIssues: data.has_issues,
    archived: data.archived,
    url: data.html_url,
  };
}

async function getContributors(octokit: Octokit, args: { owner: string; repo: string; limit?: number }) {
  const { data } = await octokit.rest.repos.listContributors({
    owner: args.owner,
    repo: args.repo,
    per_page: args.limit || 30,
  });

  return data.map((c: any) => ({
    login: c.login,
    contributions: c.contributions,
    avatarUrl: c.avatar_url,
    profileUrl: c.html_url,
    type: c.type,
  }));
}

async function getPullRequests(octokit: Octokit, args: { owner: string; repo: string; state?: string; limit?: number }) {
  const { data } = await octokit.rest.pulls.list({
    owner: args.owner,
    repo: args.repo,
    state: (args.state as any) || "all",
    per_page: args.limit || 20,
    sort: "updated",
    direction: "desc",
  });

  return data.map((pr: any) => ({
    number: pr.number,
    title: pr.title,
    state: pr.state,
    author: pr.user?.login,
    createdAt: pr.created_at,
    updatedAt: pr.updated_at,
    mergedAt: pr.merged_at,
    closedAt: pr.closed_at,
    draft: pr.draft,
    labels: pr.labels?.map((l: any) => l.name),
    url: pr.html_url,
  }));
}

async function getPullRequestDetails(octokit: Octokit, args: { owner: string; repo: string; prNumber: number }) {
  const [prData, filesData] = await Promise.all([
    octokit.rest.pulls.get({
      owner: args.owner,
      repo: args.repo,
      pull_number: args.prNumber,
    }),
    octokit.rest.pulls.listFiles({
      owner: args.owner,
      repo: args.repo,
      pull_number: args.prNumber,
      per_page: 100,
    }),
  ]);

  const MAX_PATCH_SIZE = 10000;
  
  return {
    number: prData.data.number,
    title: prData.data.title,
    body: prData.data.body,
    state: prData.data.state,
    author: prData.data.user?.login,
    merged: prData.data.merged,
    mergeable: prData.data.mergeable,
    additions: prData.data.additions,
    deletions: prData.data.deletions,
    changedFiles: prData.data.changed_files,
    commits: prData.data.commits,
    createdAt: prData.data.created_at,
    mergedAt: prData.data.merged_at,
    baseBranch: prData.data.base.ref,
    headBranch: prData.data.head.ref,
    files: filesData.data.map((f: any) => {
      const patch = f.patch || '';
      const truncated = patch.length > MAX_PATCH_SIZE;
      const displayPatch = truncated 
        ? patch.slice(0, MAX_PATCH_SIZE) + '\n\n... [Diff truncated - file too large]'
        : patch;
      
      return {
        filename: f.filename,
        status: f.status,
        additions: f.additions,
        deletions: f.deletions,
        patch: displayPatch,
        truncated,
      };
    }),
    url: prData.data.html_url,
  };
}

async function getIssues(octokit: Octokit, args: { owner: string; repo: string; state?: string; labels?: string; limit?: number }) {
  const { data } = await octokit.rest.issues.listForRepo({
    owner: args.owner,
    repo: args.repo,
    state: (args.state as any) || "all",
    labels: args.labels,
    per_page: args.limit || 20,
    sort: "updated",
    direction: "desc",
  });

  return data
    .filter((issue: any) => !issue.pull_request)
    .map((issue: any) => ({
      number: issue.number,
      title: issue.title,
      state: issue.state,
      author: issue.user?.login,
      labels: issue.labels?.map((l: any) => (typeof l === "string" ? l : l.name)),
      assignees: issue.assignees?.map((a: any) => a.login),
      comments: issue.comments,
      createdAt: issue.created_at,
      updatedAt: issue.updated_at,
      closedAt: issue.closed_at,
      url: issue.html_url,
    }));
}

async function getCommits(octokit: Octokit, args: { owner: string; repo: string; author?: string; path?: string; limit?: number }) {
  const params: any = {
    owner: args.owner,
    repo: args.repo,
    per_page: args.limit || 30,
  };
  if (args.author) params.author = args.author;
  if (args.path) params.path = args.path;

  const { data } = await octokit.rest.repos.listCommits(params);

  return data.map((commit: any) => ({
    sha: commit.sha.slice(0, 7),
    fullSha: commit.sha,
    message: commit.commit.message.split("\n")[0],
    fullMessage: commit.commit.message,
    author: commit.author?.login || commit.commit.author?.name,
    authorEmail: commit.commit.author?.email,
    date: commit.commit.author?.date,
    url: commit.html_url,
  }));
}

async function getFileTree(octokit: Octokit, args: { owner: string; repo: string; path?: string; branch?: string }) {
  let ref = args.branch;
  if (!ref) {
    const { data: repoData } = await octokit.rest.repos.get({
      owner: args.owner,
      repo: args.repo,
    });
    ref = repoData.default_branch;
  }

  const { data } = await octokit.rest.repos.getContent({
    owner: args.owner,
    repo: args.repo,
    path: args.path || "",
    ref,
  });

  if (Array.isArray(data)) {
    return {
      path: args.path || "/",
      branch: ref,
      items: data
        .map((item: any) => ({
          name: item.name,
          path: item.path,
          type: item.type === "dir" ? "directory" : "file",
          size: item.size,
        }))
        .sort((a: any, b: any) => {
          if (a.type !== b.type) return a.type === "directory" ? -1 : 1;
          return a.name.localeCompare(b.name);
        }),
    };
  }
  return { path: args.path, type: "file", name: (data as any).name };
}

async function getFileContent(octokit: Octokit, args: { owner: string; repo: string; path: string; branch?: string }) {
  let ref = args.branch;
  if (!ref) {
    const { data: repoData } = await octokit.rest.repos.get({
      owner: args.owner,
      repo: args.repo,
    });
    ref = repoData.default_branch;
  }

  const { data } = await octokit.rest.repos.getContent({
    owner: args.owner,
    repo: args.repo,
    path: args.path,
    ref,
  });

  if (Array.isArray(data)) {
    return { error: "Path is a directory, not a file" };
  }

  if ((data as any).type !== "file") {
    return { error: "Path is not a file" };
  }

  const content = Buffer.from((data as any).content, "base64").toString("utf-8");
  const extension = args.path.split(".").pop()?.toLowerCase() || "";

  return {
    path: args.path,
    name: (data as any).name,
    size: (data as any).size,
    content: content.slice(0, 50000),
    language: extension,
    truncated: content.length > 50000,
  };
}

async function getCommitDiff(octokit: Octokit, args: { owner: string; repo: string; sha: string }) {
  const { data } = await octokit.rest.repos.getCommit({
    owner: args.owner,
    repo: args.repo,
    ref: args.sha,
  });

  const MAX_PATCH_SIZE = 10000;
  const MAX_FILES = 50;
  const totalFiles = data.files?.length || 0;

  return {
    sha: data.sha.slice(0, 7),
    fullSha: data.sha,
    message: data.commit.message,
    author: data.author?.login || data.commit.author?.name,
    date: data.commit.author?.date,
    stats: {
      additions: data.stats?.additions || 0,
      deletions: data.stats?.deletions || 0,
      total: data.stats?.total || 0,
    },
    totalFiles,
    filesShown: Math.min(totalFiles, MAX_FILES),
    files: data.files?.slice(0, MAX_FILES).map((file: any) => {
      const patch = file.patch || '';
      const truncated = patch.length > MAX_PATCH_SIZE;
      const displayPatch = truncated 
        ? patch.slice(0, MAX_PATCH_SIZE) + '\n\n... [Diff truncated - file too large]'
        : patch;
      
      return {
        filename: file.filename,
        status: file.status,
        additions: file.additions,
        deletions: file.deletions,
        patch: displayPatch,
        truncated,
      };
    }),
  };
}

async function compareBranches(octokit: Octokit, args: { owner: string; repo: string; base: string; head: string }) {
  const { data } = await octokit.rest.repos.compareCommits({
    owner: args.owner,
    repo: args.repo,
    base: args.base,
    head: args.head,
  });

  return {
    status: data.status,
    aheadBy: data.ahead_by,
    behindBy: data.behind_by,
    totalCommits: data.total_commits,
    commits: data.commits.slice(0, 20).map((c: any) => ({
      sha: c.sha.slice(0, 7),
      message: c.commit.message.split("\n")[0],
      author: c.author?.login,
      date: c.commit.author?.date,
    })),
    changedFiles: data.files?.length || 0,
    additions: data.files?.reduce((sum: number, f: any) => sum + f.additions, 0) || 0,
    deletions: data.files?.reduce((sum: number, f: any) => sum + f.deletions, 0) || 0,
  };
}

async function searchCode(octokit: Octokit, args: { owner: string; repo: string; query: string; extension?: string }) {
  let searchQuery = `${args.query} repo:${args.owner}/${args.repo}`;
  if (args.extension) {
    searchQuery += ` extension:${args.extension}`;
  }

  const { data } = await octokit.rest.search.code({
    q: searchQuery,
    per_page: 20,
  });

  return {
    totalCount: data.total_count,
    results: data.items.map((item: any) => ({
      filename: item.name,
      path: item.path,
      url: item.html_url,
    })),
  };
}

async function getBranches(octokit: Octokit, args: { owner: string; repo: string }) {
  const [branchesData, repoData] = await Promise.all([
    octokit.rest.repos.listBranches({
      owner: args.owner,
      repo: args.repo,
      per_page: 50,
    }),
    octokit.rest.repos.get({
      owner: args.owner,
      repo: args.repo,
    }),
  ]);

  return {
    defaultBranch: repoData.data.default_branch,
    branches: branchesData.data.map((b: any) => ({
      name: b.name,
      protected: b.protected,
      isDefault: b.name === repoData.data.default_branch,
    })),
  };
}

async function getLanguages(octokit: Octokit, args: { owner: string; repo: string }) {
  const { data } = await octokit.rest.repos.listLanguages({
    owner: args.owner,
    repo: args.repo,
  });

  const total = Object.values(data).reduce((sum: number, bytes: any) => sum + bytes, 0);

  return {
    languages: Object.entries(data)
      .map(([language, bytes]: [string, any]) => ({
        language,
        bytes,
        percentage: ((bytes / total) * 100).toFixed(1) + "%",
      }))
      .sort((a, b) => b.bytes - a.bytes),
  };
}
