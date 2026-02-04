"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { toolDeclarations, executeTool } from "./tools";

// Tool name to human-readable description
const TOOL_DESCRIPTIONS: Record<string, string> = {
  getRepositoryOverview: "📊 Getting repository overview",
  getContributors: "👥 Fetching contributors",
  getPullRequests: "🔀 Loading pull requests",
  getPullRequestDetails: "📝 Analyzing PR details",
  getIssues: "🐛 Fetching issues",
  getCommits: "📜 Loading commit history",
  getFileTree: "📁 Browsing file structure",
  getFileContent: "📄 Reading source code",
  getCommitDiff: "🔍 Analyzing code changes",
  compareBranches: "⚖️ Comparing branches",
  searchCode: "🔎 Searching code",
  getBranches: "🌿 Listing branches",
  getLanguages: "💻 Analyzing languages",
};

// System prompt for the repository analyzer
const SYSTEM_PROMPT = `You are an expert GitHub repository analyst with deep knowledge of software development, code review, and collaboration patterns.

You have access to powerful tools that can fetch real-time data from GitHub repositories. ALWAYS use these tools proactively to provide comprehensive, data-driven analysis. Don't make assumptions - fetch the actual data.

AVAILABLE TOOLS:
- getRepositoryOverview: Get repo stats and metadata
- getContributors: List contributors (returns {items: [...]})
- getPullRequests: Get PRs with status (returns {items: [...]})
- getPullRequestDetails: Get detailed PR info including file changes and code diffs
- getIssues: Get issues with labels (returns {items: [...]})
- getCommits: Get commit history (returns {items: [...]})
- getFileTree: Browse repository file structure
- getFileContent: Read source code files (IMPORTANT: Use this to show actual code)
- getCommitDiff: See changes in a specific commit with actual code diffs
- compareBranches: Compare two branches
- searchCode: Search for code patterns
- getBranches: List all branches
- getLanguages: Get language breakdown

IMPORTANT INSTRUCTIONS:
1. ALWAYS use the relevant tools to fetch actual data before responding
2. When tools return {items: [...]}, access the data from the 'items' field
3. When asked about code changes, PRs, or commits - USE the diff tools to get actual code
4. Provide specific metrics, names, dates, and code snippets
5. Format code with proper syntax highlighting using markdown code blocks
6. When showing diffs, use diff syntax highlighting (\`\`\`diff)

For structured responses, you can return JSON (start with { and end with }):
- {"type": "chart", "data": {"chartType": "bar|pie|line", "title": "...", "labels": [...], "datasets": [{"label": "...", "data": [...]}]}}
- {"type": "table", "data": {"title": "...", "headers": [...], "rows": [[...], [...]], "summary": "..."}}
- {"type": "diff", "data": {"prNumber": N, "title": "...", "author": "...", "additions": N, "deletions": N, "files": [...], "diff": "..."}}
- {"type": "text", "data": {"content": "markdown content"}}
- {"type": "mixed", "data": {"sections": [...]}}

Be thorough but concise. Focus on actionable insights.`;

// Convert tool declarations to Gemini format
function getGeminiTools(): any[] {
  return toolDeclarations.map((tool) => ({
    name: tool.name,
    description: tool.description,
    parameters: {
      type: SchemaType.OBJECT,
      properties: Object.fromEntries(
        Object.entries(tool.parameters.properties).map(([key, value]: [string, any]) => [
          key,
          {
            type: value.type === "number" ? SchemaType.NUMBER : SchemaType.STRING,
            description: value.description,
            ...(value.enum ? { enum: value.enum } : {}),
          },
        ])
      ),
      required: tool.parameters.required,
    },
  }));
}

// Main analysis action using Gemini with function calling
export const analyzeWithTools = action({
  args: {
    chatId: v.id("chats"),
    query: v.string(),
    repositoryData: v.any(),
    contributors: v.optional(v.array(v.string())),
    modelId: v.optional(v.string()),
  },
  handler: async (ctx, { chatId, query, repositoryData, contributors, modelId }): Promise<any> => {
    const apiKey = process.env.GEMINI_API_KEY;
    const selectedModel = modelId || "gemini-2.0-flash";

    if (!apiKey) {
      const errorResponse = {
        type: "text" as const,
        data: {
          content: "⚠️ **Gemini API key not configured**\n\nPlease set the `GEMINI_API_KEY` environment variable in Convex.",
        },
      };

      await ctx.runMutation(internal.messages.addAssistantMessageInternal, {
        chatId,
        content: errorResponse.data.content,
        response: errorResponse,
      });

      return errorResponse;
    }

    const { owner, name, fullName } = repositoryData.repository;

    // Build context for the agent
    let contextMessage = `Repository: ${fullName} (owner: ${owner}, repo: ${name})`;
    
    if (contributors && contributors.length > 0) {
      contextMessage += `\n\nFocus analysis on these contributors: ${contributors.join(", ")}`;
    }

    // Include repository metadata as context
    contextMessage += `\n\nRepository metadata:
- Stars: ${repositoryData.repository?.metadata?.stars || 0}
- Forks: ${repositoryData.repository?.metadata?.forks || 0}
- Language: ${repositoryData.repository?.metadata?.language || "Unknown"}
- Open Issues: ${repositoryData.repository?.metadata?.openIssues || 0}
- Contributors: ${repositoryData.repository?.metadata?.contributors || 0}`;

    const fullQuery = `${contextMessage}\n\nUser question: ${query}`;

    try {
      // Update progress: Starting analysis
      await ctx.runMutation(internal.progress.updateProgress, {
        chatId,
        status: "analyzing",
        currentStep: "🤖 Starting AI analysis",
      });

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: selectedModel,
        systemInstruction: SYSTEM_PROMPT,
        tools: [{ functionDeclarations: getGeminiTools() }],
      });

      // Start a chat session
      const chat = model.startChat({
        history: [],
      });

      // Update progress: Sending query
      await ctx.runMutation(internal.progress.updateProgress, {
        chatId,
        status: "analyzing",
        currentStep: "💬 Processing your question",
      });

      let response = await chat.sendMessage(fullQuery);
      let result = response.response;
      let toolCallsExecuted: any[] = [];

      // Process tool calls in a loop
      const MAX_ITERATIONS = 10;
      let iteration = 0;

      while (iteration < MAX_ITERATIONS) {
        const functionCalls = result.functionCalls();
        
        if (!functionCalls || functionCalls.length === 0) {
          break; // No more tool calls, we're done
        }

        // Execute all function calls and prepare responses
        const toolResults = await Promise.all(
          functionCalls.map(async (call) => {
            // Update progress for this tool call
            const toolDescription = TOOL_DESCRIPTIONS[call.name] || `⚙️ ${call.name}`;
            await ctx.runMutation(internal.progress.updateProgress, {
              chatId,
              status: "analyzing",
              currentStep: toolDescription,
            });

            console.log(`Executing tool: ${call.name}`, call.args);
            const toolResult = await executeTool(call.name, call.args);
            toolCallsExecuted.push({
              name: call.name,
              args: call.args,
              result: typeof toolResult === 'object' && 'error' in toolResult ? toolResult : 'success',
            });
            return {
              name: call.name,
              result: toolResult,
            };
          })
        );

        // Update progress: Processing results
        await ctx.runMutation(internal.progress.updateProgress, {
          chatId,
          status: "analyzing",
          currentStep: "🧠 Analyzing results",
        });

        // Format function responses according to Gemini's expected format
        // Gemini expects response to be an object (Struct), not an array
        // So wrap arrays and primitives in an object
        const functionResponseParts = toolResults.map((tr) => {
          let responseData = tr.result;
          
          // If result is an array or primitive, wrap it in an object
          if (Array.isArray(responseData)) {
            responseData = { items: responseData };
          } else if (typeof responseData !== 'object' || responseData === null) {
            responseData = { value: responseData };
          }

          return {
            functionResponse: {
              name: tr.name,
              response: responseData,
            },
          };
        });

        // Send function results back to the model
        response = await chat.sendMessage(functionResponseParts);
        result = response.response;
        iteration++;
      }

      // Update progress: Generating response
      await ctx.runMutation(internal.progress.updateProgress, {
        chatId,
        status: "analyzing",
        currentStep: "✨ Generating response",
      });

      // Get the final text response
      const responseText = result.text() || "";

      // Try to parse as structured response
      let parsedResponse;
      try {
        // Check if the response is JSON
        const jsonMatch = responseText.match(/^\s*\{[\s\S]*\}\s*$/);
        if (jsonMatch) {
          parsedResponse = JSON.parse(jsonMatch[0]);
        } else {
          parsedResponse = {
            type: "text",
            data: {
              content: responseText,
            },
          };
        }
      } catch (parseError) {
        parsedResponse = {
          type: "text",
          data: {
            content: responseText,
          },
        };
      }

      // Save the assistant message with tool calls info
      await ctx.runMutation(internal.messages.addAssistantMessageInternal, {
        chatId,
        content: typeof parsedResponse.data?.content === "string"
          ? parsedResponse.data.content
          : responseText,
        response: parsedResponse,
        toolCalls: toolCallsExecuted.length > 0 ? toolCallsExecuted : undefined,
      });

      // Clear progress
      await ctx.runMutation(internal.progress.clearProgress, {
        chatId,
      });

      return {
        ...parsedResponse,
        toolCalls: toolCallsExecuted,
      };
    } catch (error: any) {
      console.error("Agent error:", error);

      let errorContent: string;

      // Check for rate limit / quota exceeded errors
      if (error.status === 429 || error.message?.includes("quota") || error.message?.includes("Too Many Requests")) {
        // Extract retry delay if available
        let retryInfo = "";
        if (error.errorDetails) {
          const retryDetail = error.errorDetails.find((detail: any) => detail["@type"]?.includes("RetryInfo"));
          if (retryDetail?.retryDelay) {
            const seconds = parseInt(retryDetail.retryDelay);
            retryInfo = seconds > 60 
              ? ` Please try again in about ${Math.ceil(seconds / 60)} minutes.`
              : ` Please try again in ${seconds} seconds.`;
          }
        }

        // Extract model name
        const modelMatch = error.message?.match(/model:\s*([^\s,]+)/);
        const modelName = modelMatch ? modelMatch[1] : selectedModel;

        errorContent = `⏱️ **Rate Limit Reached**\n\nYou've reached the request limit for the **${modelName}** model.${retryInfo}\n\n**What you can do:**\n- Wait a moment and try again\n- Switch to a different Gemini model in the header\n- Upgrade your Gemini API plan for higher limits\n\n💡 *Tip: Different models have separate rate limits, so switching models can help!*`;
      } else if (error.status === 400) {
        errorContent = `❌ **Invalid Request**\n\nThere was an issue with the request format.\n\nThis might be a temporary issue. Please try:\n- Rephrasing your question\n- Trying a different model\n- Waiting a moment and trying again`;
      } else if (error.status === 403) {
        errorContent = `🔒 **Access Denied**\n\nThe API key doesn't have permission for this operation.\n\nPlease check:\n- Your Gemini API key is valid\n- The API key has the necessary permissions\n- Your API quota hasn't been exceeded`;
      } else if (error.status === 404) {
        errorContent = `🔍 **Model Not Found**\n\nThe selected AI model (${selectedModel}) couldn't be found.\n\nThis might mean:\n- The model is not available in your region\n- The model name has changed\n- The model requires a different API tier\n\nTry selecting a different model from the header.`;
      } else {
        // Generic error
        const shortError = error.message?.split('\n')[0] || "An unexpected error occurred";
        errorContent = `❌ **Error analyzing repository**\n\n${shortError}\n\nPlease try again or rephrase your question.`;
      }

      const errorResponse = {
        type: "text" as const,
        data: {
          content: errorContent,
        },
      };

      await ctx.runMutation(internal.messages.addAssistantMessageInternal, {
        chatId,
        content: errorResponse.data.content,
        response: errorResponse,
      });

      // Clear progress on error
      await ctx.runMutation(internal.progress.clearProgress, {
        chatId,
      });

      return errorResponse;
    }
  },
});

// Simpler analysis without tools (for quick responses)
export const analyzeSimple = action({
  args: {
    chatId: v.id("chats"),
    query: v.string(),
    repositoryData: v.any(),
    contributors: v.optional(v.array(v.string())),
    modelId: v.optional(v.string()),
  },
  handler: async (ctx, { chatId, query, repositoryData, contributors, modelId }): Promise<any> => {
    const apiKey = process.env.GEMINI_API_KEY;
    const selectedModel = modelId || "gemini-2.0-flash";

    if (!apiKey) {
      const errorResponse = {
        type: "text" as const,
        data: {
          content: "⚠️ **Gemini API key not configured**",
        },
      };

      await ctx.runMutation(internal.messages.addAssistantMessageInternal, {
        chatId,
        content: errorResponse.data.content,
        response: errorResponse,
      });

      return errorResponse;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: selectedModel,
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    const systemPrompt = `You are an expert GitHub repository analyst. Analyze the provided data and return insights in JSON format.`;

    const contextData = {
      repository: repositoryData.repository,
      contributors: repositoryData.contributors?.slice(0, 50),
      recentPRs: repositoryData.pullRequests?.slice(0, 30),
      recentIssues: repositoryData.issues?.slice(0, 30),
      recentCommits: repositoryData.commits?.slice(0, 50),
    };

    const prompt = `${systemPrompt}

REPOSITORY DATA:
${JSON.stringify(contextData, null, 2)}

${contributors && contributors.length > 0 ? `FOCUS ON THESE CONTRIBUTORS: ${contributors.join(", ")}` : ""}

USER QUERY: ${query}

Return JSON with type: "text", "chart", "table", "diff", or "mixed".`;

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      let parsedResponse;
      try {
        parsedResponse = JSON.parse(text);
      } catch {
        parsedResponse = {
          type: "text",
          data: { content: text },
        };
      }

      await ctx.runMutation(internal.messages.addAssistantMessageInternal, {
        chatId,
        content: typeof parsedResponse.data?.content === "string"
          ? parsedResponse.data.content
          : JSON.stringify(parsedResponse.data),
        response: parsedResponse,
      });

      return parsedResponse;
    } catch (error: any) {
      let errorContent: string;

      // Check for rate limit / quota exceeded errors
      if (error.status === 429 || error.message?.includes("quota") || error.message?.includes("Too Many Requests")) {
        const modelMatch = error.message?.match(/model:\s*([^\s,]+)/);
        const modelName = modelMatch ? modelMatch[1] : selectedModel;

        errorContent = `⏱️ **Rate Limit Reached**\n\nYou've reached the request limit for the **${modelName}** model.\n\n**What you can do:**\n- Wait a moment and try again\n- Switch to a different Gemini model in the header\n- Upgrade your Gemini API plan for higher limits\n\n💡 *Tip: Different models have separate rate limits!*`;
      } else {
        const shortError = error.message?.split('\n')[0] || "An unexpected error occurred";
        errorContent = `❌ **Error**: ${shortError}`;
      }

      const errorResponse = {
        type: "text" as const,
        data: {
          content: errorContent,
        },
      };

      await ctx.runMutation(internal.messages.addAssistantMessageInternal, {
        chatId,
        content: errorResponse.data.content,
        response: errorResponse,
      });

      return errorResponse;
    }
  },
});
