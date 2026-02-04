# Changelog

## Latest Update - AI Agent with Tool Calling & Real-Time Progress

### New Features

#### 1. **Intelligent AI Agent with Function Calling**
The AI can now autonomously fetch real-time data from GitHub using 13 specialized tools:

- **Repository Data**
  - `getRepositoryOverview` - Fetch repo stats, stars, forks, topics, license
  - `getLanguages` - Analyze programming language breakdown
  - `getBranches` - List all branches with default indicator

- **Code Analysis**
  - `getFileTree` - Browse directory structure
  - `getFileContent` - Read actual source code files (up to 50KB)
  - `searchCode` - Search for patterns in the codebase
  
- **Collaboration**
  - `getContributors` - List contributors with contribution counts
  - `getPullRequests` - Fetch PRs with status and metadata
  - `getPullRequestDetails` - Get detailed PR info with code diffs
  - `getIssues` - Fetch issues with labels, assignees, and comments
  
- **Code Changes**
  - `getCommits` - Get commit history with authors and messages
  - `getCommitDiff` - See actual code changes in commits
  - `compareBranches` - Compare two branches or commits

#### 2. **Real-Time Progress Updates**
Users now see exactly what the AI is doing:
- 🤖 Starting AI analysis
- 💬 Processing your question
- 📊 Getting repository overview
- 👥 Fetching contributors
- 🔀 Loading pull requests
- 📄 Reading source code
- 🔍 Analyzing code changes
- 🧠 Analyzing results
- ✨ Generating response

#### 3. **Enhanced GitHub API Integration**
New GitHub actions for richer data:
- `fetchFileTree` - Directory structure browsing
- `fetchFileContent` - Source code reading
- `fetchCommitDiff` - Commit diffs with file patches
- `compareBranches` - Branch comparison
- `searchCode` - Code search within repos
- `fetchBranches` - Branch listing
- `fetchPullRequestFiles` - PR file changes
- `fetchLanguages` - Language statistics

### Bug Fixes

- Fixed Gemini API function response format error
- Improved error handling for tool execution
- Better handling of rate limits and API errors

### Database Schema Changes

Added `analysisProgress` table:
```typescript
{
  chatId: Id<"chats">,
  status: string,
  currentStep?: string,
  updatedAt: number
}
```

### Example Queries You Can Now Ask

**Code Inspection:**
- "Show me the contents of the README.md file"
- "What files are in the src/components directory?"
- "Search for 'authentication' in the codebase"

**Code Changes:**
- "Show me the diff for commit abc123"
- "What changed in PR #42?"
- "Compare the main and develop branches"

**Deep Analysis:**
- "Who wrote the most code in the auth module?"
- "What languages are used in this project?"
- "Show me all TypeScript files changed in recent PRs"

### Technical Details

**Tool Execution Flow:**
1. User asks a question
2. AI analyzes query and determines which tools to call
3. Tools fetch real-time data from GitHub
4. Progress updates shown to user in real-time
5. AI synthesizes data and generates response
6. Response rendered with proper formatting (code, diffs, charts, tables)

**Performance:**
- Tool calls execute in parallel when possible
- Maximum 10 iterations to prevent infinite loops
- Progress updates every tool execution
- Automatic cleanup on completion or error

### Migration Notes

No breaking changes. The update is backward compatible with existing chats and repositories.
