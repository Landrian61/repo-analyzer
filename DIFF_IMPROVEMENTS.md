# Diff Response Improvements

## Problem

The diff responses were showing poorly structured output with several issues:

1. **Truncated diffs** - Patches were cut off mid-content (at 2000-3000 chars) with no indication
2. **Missing context** - Only showing 20 files maximum, limiting analysis
3. **Double-escaped code blocks** - AI was wrapping diffs in \`\`\`diff within JSON, causing formatting issues
4. **No truncation indicators** - Users couldn't tell when content was incomplete
5. **Poor AI instructions** - System prompt didn't provide clear guidance on diff formatting

## Example of Previous Bad Output

```json
{
  "type": "diff",
  "data": {
    "prNumber": "N/A",
    "title": "Last Contribution",
    "diff": "```diff\n--- a/file.js\n+++ b/file.js\n@@ -1,5 +1,6 @@\n-old line\n+new line\n... [CUTS OFF MID-DIFF]"
  }
}
```

**Issues:**
- Diff wrapped in \`\`\`diff (double markdown formatting)
- Truncated without warning
- Limited context

## Solutions Implemented

### 1. **Increased Patch Size Limits**

**Before:**
- PR patches: 3000 characters max
- Commit patches: 2000 characters max
- Files shown: 20 max

**After:**
- All patches: 10,000 characters max (5x increase)
- Files shown: 50 for commits, 100 for PRs
- Clear truncation indicators when limits hit

**Code Changes:**

```typescript
// convex/tools.ts - getPullRequestDetails
const MAX_PATCH_SIZE = 10000;

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
})
```

### 2. **Enhanced System Prompt with Clear Diff Instructions**

**Updated AI prompt in `convex/agent.ts`:**

```text
CRITICAL DIFF RULES:
- NEVER use ```diff in the diff field - just raw diff string
- Include complete context (at least 10 lines before and after changes when possible)
- If a diff is truncated, mention it in the title or add a summary section
- Always include file names in the "files" array
- Show the most important/relevant files first
```

**Response Format Examples:**

```typescript
// CORRECT - Raw diff string
{
  "type": "diff",
  "data": {
    "title": "Added authentication middleware",
    "author": "username",
    "additions": 50,
    "deletions": 20,
    "files": ["middleware/auth.ts", "routes/api.ts"],
    "diff": "diff --git a/middleware/auth.ts b/middleware/auth.ts\n--- a/middleware/auth.ts\n+++ b/middleware/auth.ts\n..."
  }
}

// WRONG - Wrapped in code fences
{
  "type": "diff",
  "data": {
    "diff": "```diff\n...\n```"  // DON'T DO THIS
  }
}
```

### 3. **Frontend Defensive Cleanup**

Added cleanup logic in `ResponseRenderers.tsx` to handle cases where AI might still add code fences:

```typescript
const cleanDiff = (rawDiff: string): string => {
  if (!rawDiff) return '';
  
  // Remove leading/trailing code fences if AI added them incorrectly
  let cleaned = rawDiff.trim();
  if (cleaned.startsWith('```diff') || cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:diff)?\n?/, '');
    cleaned = cleaned.replace(/\n?```$/, '');
  }
  
  return cleaned.trim();
};
```

### 4. **Improved PR Number Handling**

Made `prNumber` flexible to handle both numbers and "N/A" strings:

```typescript
interface DiffResponseProps {
  prNumber?: number | string;  // Can be number, string, or undefined
  // ... other props
}

// Rendering logic
<Typography variant="subtitle1">
  {prNumber && prNumber !== "N/A" ? `PR #${prNumber}: ` : ""}{title}
</Typography>
```

### 5. **Better Metadata for Tools**

Enhanced commit diff tool to provide more context:

```typescript
return {
  sha: data.sha.slice(0, 7),
  fullSha: data.sha,           // Full SHA for reference
  message: data.commit.message,
  author: data.author?.login,
  date: data.commit.author?.date,
  stats: {
    additions: data.stats?.additions || 0,
    deletions: data.stats?.deletions || 0,
    total: data.stats?.total || 0,
  },
  totalFiles,                   // Total number of files changed
  filesShown: Math.min(totalFiles, MAX_FILES),  // How many we're showing
  files: [ /* ... */ ]
};
```

## Expected Results

### Example Well-Structured Diff Response

```json
{
  "type": "mixed",
  "data": {
    "sections": [
      {
        "type": "text",
        "data": {
          "content": "The last contribution by **aheebwa32** was on **2025-12-30T11:51:40Z** with commit message: \"added a self discovery url for the task tracker\".\n\n**Summary of Changes:**\n- Reformatted imports and code style\n- Added new routes and middleware\n- Updated TypeScript configuration"
        }
      },
      {
        "type": "diff",
        "data": {
          "title": "Commit: added a self discovery url",
          "author": "aheebwa32",
          "additions": 277,
          "deletions": 205,
          "files": ["src/index.ts", "src/routes/discovery.ts"],
          "diff": "diff --git a/src/index.ts b/src/index.ts\nindex abc123..def456 100644\n--- a/src/index.ts\n+++ b/src/index.ts\n@@ -1,10 +1,12 @@\n-import { serve } from '@hono/node-server'\n-import { Hono } from 'hono'\n+import { serve } from \"@hono/node-server\";\n+import { Hono } from \"hono\";\n+import { createNodeWebSocket } from \"@hono/node-ws\";\n \n-const app = new Hono()\n+const app = new Hono();\n...[COMPLETE, READABLE DIFF]"
        }
      }
    ]
  }
}
```

**Key Improvements:**
✅ Clean, raw diff strings (no double code fences)  
✅ Complete context (10,000 chars vs 2,000)  
✅ Clear truncation indicators when needed  
✅ Multiple files shown (up to 100 vs 20)  
✅ Proper mixed response with text explanation + diff  
✅ File names clearly listed  

## Testing

To verify improvements:

1. **Ask about code changes:**
   ```
   "What was the last contribution by [username] and what files did they change?"
   ```

2. **Check that responses:**
   - Show complete diffs with proper syntax highlighting
   - Display file lists clearly
   - Include explanatory text before diffs
   - Show "truncated" indicator only when necessary
   - Don't have double-escaped code blocks

3. **Test with large commits:**
   - Should show up to 10,000 chars per file
   - Should show up to 50-100 files
   - Should clearly indicate when more files exist

## Benefits

| Aspect | Before | After |
|--------|--------|-------|
| **Patch Size** | 2,000-3,000 chars | 10,000 chars |
| **Files Shown** | 20 max | 50-100 max |
| **Truncation** | Silent cutoff | Clear indicator |
| **Formatting** | Double-escaped | Clean raw diffs |
| **Context** | Limited | Comprehensive |
| **AI Guidance** | Minimal | Explicit rules |

## Future Enhancements

Potential improvements for later:

1. **Pagination** - For commits with 100+ files, allow viewing in chunks
2. **Syntax Highlighting by File Type** - Detect language from extension
3. **Collapsible Files** - Let users expand/collapse individual files in multi-file diffs
4. **Diff Statistics** - Show per-file stats in a summary table
5. **Smart Truncation** - Truncate at logical boundaries (function end, etc.) instead of character count
6. **Download Option** - Allow downloading full diffs as `.patch` files

## Related Files

- `convex/tools.ts` - GitHub API tool implementations
- `convex/agent.ts` - AI system prompt and response handling
- `src/components/ResponseRenderers.tsx` - Frontend diff rendering
- `ERROR_HANDLING_UPDATE.md` - Related error handling improvements
