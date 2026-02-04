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
5. Format code with proper syntax highlighting using markdown code blocks in TEXT responses
6. When showing diffs in structured responses, NEVER wrap them in \`\`\`diff - return RAW diff strings

RESPONSE FORMATS - Return valid JSON (start with { and end with }):

TEXT RESPONSE (for explanations with code):
{"type": "text", "data": {"content": "**Heading**\n\nExplanation text here.\n\n\`\`\`javascript\nconst code = 'example';\n\`\`\`"}}

DIFF RESPONSE (for code changes - IMPORTANT: diff field is a RAW STRING, not markdown):
{"type": "diff", "data": {
  "prNumber": 123,
  "title": "Description of the change",
  "author": "username",
  "additions": 50,
  "deletions": 20,
  "files": ["file1.js", "file2.ts"],
  "diff": "diff --git a/file.js b/file.js\nindex abc123..def456\n--- a/file.js\n+++ b/file.js\n@@ -1,5 +1,6 @@\n-old line\n+new line"
}}

MIXED RESPONSE (combine multiple sections):
{"type": "mixed", "data": {"sections": [
  {"type": "text", "data": {"content": "Overview text"}},
  {"type": "diff", "data": {"title": "...", "diff": "raw diff string here", "additions": 10, "deletions": 5, "files": ["file.js"]}},
  {"type": "table", "data": {"title": "Stats", "headers": ["Name", "Count"], "rows": [["Item", 5]]}}
]}}

CRITICAL DIFF RULES:
- NEVER use \`\`\`diff in the diff field - just raw diff string
- Include complete context (at least 10 lines before and after changes when possible)
- If a diff is truncated, mention it in the title or add a summary section
- Always include file names in the "files" array
- Show the most important/relevant files first

Be thorough but concise. Focus on actionable insights.`;

// Check if model is a Groq model
function isGroqModel(modelId: string): boolean {
  return modelId.startsWith("llama-") || 
         modelId.startsWith("openai/") || 
         modelId.includes("groq");
}

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

// Convert tool declarations to OpenAI/Groq format
function getGroqTools(): any[] {
  return toolDeclarations.map((tool) => ({
    type: "function",
    function: {
      name: tool.name,
      description: tool.description,
      parameters: {
        type: "object",
        properties: tool.parameters.properties,
        required: tool.parameters.required,
      },
    },
  }));
}

// Call Groq API
async function callGroqAPI(
  apiKey: string,
  modelId: string,
  messages: Array<{ role: string; content: string; tool_calls?: any[]; tool_call_id?: string }>,
  tools?: any[]
): Promise<any> {
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: modelId,
      messages,
      tools: tools && tools.length > 0 ? tools : undefined,
      tool_choice: tools && tools.length > 0 ? "auto" : undefined,
      temperature: 0.7,
      max_tokens: 8000,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: { message: response.statusText } }));
    const err: any = new Error(error.error?.message || `Groq API error: ${response.status}`);
    err.status = response.status;
    throw err;
  }

  return response.json();
}

// Process with Groq model
async function processWithGroq(
  ctx: any,
  chatId: string,
  fullQuery: string,
  apiKey: string,
  modelId: string,
  owner: string,
  name: string
): Promise<any> {
  const tools = getGroqTools();
  let toolCallsExecuted: any[] = [];

  // Initial message
  const messages: Array<{ role: string; content: string; tool_calls?: any[]; tool_call_id?: string; name?: string }> = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: fullQuery },
  ];

  // Update progress
  await ctx.runMutation(internal.progress.updateProgress, {
    chatId,
    status: "analyzing",
    currentStep: "💬 Processing your question",
  });

  let response = await callGroqAPI(apiKey, modelId, messages, tools);
  let assistantMessage = response.choices[0].message;

  // Process tool calls in a loop
  const MAX_ITERATIONS = 10;
  let iteration = 0;

  while (iteration < MAX_ITERATIONS && assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
    // Add assistant's message with tool calls to history
    messages.push(assistantMessage);

    // Execute each tool call
    for (const toolCall of assistantMessage.tool_calls) {
      const functionName = toolCall.function.name;
      const functionArgs = JSON.parse(toolCall.function.arguments || "{}");

      // Update progress
      const toolDescription = TOOL_DESCRIPTIONS[functionName] || `⚙️ ${functionName}`;
      await ctx.runMutation(internal.progress.updateProgress, {
        chatId,
        status: "analyzing",
        currentStep: toolDescription,
      });

      console.log(`Executing tool: ${functionName}`, functionArgs);

      // Add owner and repo to args if not provided
      const argsWithContext = {
        owner,
        repo: name,
        ...functionArgs,
      };

      const toolResult = await executeTool(functionName, argsWithContext);
      
      toolCallsExecuted.push({
        name: functionName,
        args: functionArgs,
        result: typeof toolResult === 'object' && 'error' in toolResult ? toolResult : 'success',
      });

      // Add tool result to messages
      messages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: JSON.stringify(toolResult),
      });
    }

    // Update progress
    await ctx.runMutation(internal.progress.updateProgress, {
      chatId,
      status: "analyzing",
      currentStep: "🧠 Analyzing results",
    });

    // Get next response
    response = await callGroqAPI(apiKey, modelId, messages, tools);
    assistantMessage = response.choices[0].message;
    iteration++;
  }

  // Update progress
  await ctx.runMutation(internal.progress.updateProgress, {
    chatId,
    status: "analyzing",
    currentStep: "✨ Generating response",
  });

  // Get final response text
  const responseText = assistantMessage.content || "";

  return { responseText, toolCallsExecuted };
}

// Process with Gemini model
async function processWithGemini(
  ctx: any,
  chatId: string,
  fullQuery: string,
  apiKey: string,
  modelId: string,
  owner: string,
  name: string
): Promise<any> {
  let toolCallsExecuted: any[] = [];

  // Update progress
  await ctx.runMutation(internal.progress.updateProgress, {
    chatId,
    status: "analyzing",
    currentStep: "💬 Processing your question",
  });

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: modelId,
    systemInstruction: SYSTEM_PROMPT,
    tools: [{ functionDeclarations: getGeminiTools() }],
  });

  // Start a chat session
  const chat = model.startChat({
    history: [],
  });

  let response = await chat.sendMessage(fullQuery);
  let result = response.response;

  // Process tool calls in a loop
  const MAX_ITERATIONS = 10;
  let iteration = 0;

  while (iteration < MAX_ITERATIONS) {
    const functionCalls = result.functionCalls();
    
    if (!functionCalls || functionCalls.length === 0) {
      break;
    }

    // Execute all function calls and prepare responses
    const toolResults = await Promise.all(
      functionCalls.map(async (call) => {
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

    await ctx.runMutation(internal.progress.updateProgress, {
      chatId,
      status: "analyzing",
      currentStep: "🧠 Analyzing results",
    });

    // Format function responses
    const functionResponseParts = toolResults.map((tr) => {
      let responseData = tr.result;
      
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

    response = await chat.sendMessage(functionResponseParts);
    result = response.response;
    iteration++;
  }

  await ctx.runMutation(internal.progress.updateProgress, {
    chatId,
    status: "analyzing",
    currentStep: "✨ Generating response",
  });

  const responseText = result.text() || "";

  return { responseText, toolCallsExecuted };
}

// Main analysis action using Gemini or Groq with function calling
export const analyzeWithTools = action({
  args: {
    chatId: v.id("chats"),
    query: v.string(),
    repositoryData: v.any(),
    contributors: v.optional(v.array(v.string())),
    modelId: v.optional(v.string()),
  },
  handler: async (ctx, { chatId, query, repositoryData, contributors, modelId }): Promise<any> => {
    const selectedModel = modelId || "gemini-2.5-flash";
    const useGroq = isGroqModel(selectedModel);
    
    console.log(`[Agent] Model requested: "${modelId}", Selected: "${selectedModel}", isGroq: ${useGroq}`);
    
    const apiKey = useGroq 
      ? process.env.GROQ_API_KEY 
      : process.env.GEMINI_API_KEY;

    if (!apiKey) {
      const providerName = useGroq ? "Groq" : "Gemini";
      const envVar = useGroq ? "GROQ_API_KEY" : "GEMINI_API_KEY";
      const errorResponse = {
        type: "text" as const,
        data: {
          content: `⚠️ **${providerName} API key not configured**\n\nPlease set the \`${envVar}\` environment variable in Convex.`,
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
        currentStep: `🤖 Starting AI analysis with ${useGroq ? "Groq" : "Gemini"}`,
      });

      let responseText: string;
      let toolCallsExecuted: any[];

      if (useGroq) {
        const result = await processWithGroq(ctx, chatId, fullQuery, apiKey, selectedModel, owner, name);
        responseText = result.responseText;
        toolCallsExecuted = result.toolCallsExecuted;
      } else {
        const result = await processWithGemini(ctx, chatId, fullQuery, apiKey, selectedModel, owner, name);
        responseText = result.responseText;
        toolCallsExecuted = result.toolCallsExecuted;
      }

      // Try to parse as structured response
      let parsedResponse;
      try {
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

      // Ensure response has proper structure before saving
      const validatedResponse = {
        type: parsedResponse.type || "text",
        data: parsedResponse.data || { content: responseText },
      };

      // For content field, extract a text summary
      let contentSummary = responseText;
      if (validatedResponse.type === "text" && typeof validatedResponse.data?.content === "string") {
        contentSummary = validatedResponse.data.content;
      } else if (validatedResponse.type === "mixed" && Array.isArray(validatedResponse.data?.sections)) {
        const textSection = validatedResponse.data.sections.find((s: any) => s.type === "text");
        if (textSection?.data?.content) {
          contentSummary = textSection.data.content;
        }
      } else if (validatedResponse.type === "diff") {
        contentSummary = `Code changes: ${validatedResponse.data?.title || "Diff"}`;
      } else if (validatedResponse.type === "chart") {
        contentSummary = `Chart: ${validatedResponse.data?.title || "Data visualization"}`;
      } else if (validatedResponse.type === "table") {
        contentSummary = `Table: ${validatedResponse.data?.title || "Data table"}`;
      }

      // Save the assistant message with tool calls info
      await ctx.runMutation(internal.messages.addAssistantMessageInternal, {
        chatId,
        content: contentSummary,
        response: validatedResponse,
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
      const providerName = useGroq ? "Groq" : "Gemini";

      // Check for rate limit / quota exceeded errors
      if (error.status === 429 || error.message?.includes("quota") || error.message?.includes("Too Many Requests") || error.message?.includes("rate_limit")) {
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

        const modelMatch = error.message?.match(/model[:\s]*([^\s,]+)/i);
        const modelName = modelMatch ? modelMatch[1] : selectedModel;

        errorContent = `⏱️ **Rate Limit Reached**\n\nYou've reached the request limit for the **${modelName}** model on ${providerName}.${retryInfo}\n\n**What you can do:**\n- Wait a moment and try again\n- Switch to a different model in the header\n- Different providers have separate rate limits\n\n💡 *Tip: Try switching between Gemini and Groq models!*`;
      } else if (error.status === 400) {
        errorContent = `❌ **Invalid Request**\n\nThere was an issue with the request format.\n\nThis might be a temporary issue. Please try:\n- Rephrasing your question\n- Trying a different model\n- Waiting a moment and trying again`;
      } else if (error.status === 403) {
        errorContent = `🔒 **Access Denied**\n\nThe ${providerName} API key doesn't have permission for this operation.\n\nPlease check:\n- Your API key is valid\n- The API key has the necessary permissions\n- Your API quota hasn't been exceeded`;
      } else if (error.status === 404) {
        errorContent = `🔍 **Model Not Found**\n\nThe selected AI model (${selectedModel}) couldn't be found on ${providerName}.\n\nThis might mean:\n- The model is not available in your region\n- The model name has changed\n- The model requires a different API tier\n\nTry selecting a different model from the header.`;
      } else {
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
    const selectedModel = modelId || "gemini-2.5-flash";
    const useGroq = isGroqModel(selectedModel);
    
    const apiKey = useGroq 
      ? process.env.GROQ_API_KEY 
      : process.env.GEMINI_API_KEY;

    if (!apiKey) {
      const providerName = useGroq ? "Groq" : "Gemini";
      const errorResponse = {
        type: "text" as const,
        data: {
          content: `⚠️ **${providerName} API key not configured**`,
        },
      };

      await ctx.runMutation(internal.messages.addAssistantMessageInternal, {
        chatId,
        content: errorResponse.data.content,
        response: errorResponse,
      });

      return errorResponse;
    }

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
      let text: string;

      if (useGroq) {
        const response = await callGroqAPI(apiKey, selectedModel, [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ]);
        text = response.choices[0].message.content || "";
      } else {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
          model: selectedModel,
          generationConfig: {
            responseMimeType: "application/json",
          },
        });

        const result = await model.generateContent(prompt);
        const response = await result.response;
        text = response.text();
      }

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
      const providerName = useGroq ? "Groq" : "Gemini";

      if (error.status === 429 || error.message?.includes("quota") || error.message?.includes("Too Many Requests") || error.message?.includes("rate_limit")) {
        const modelMatch = error.message?.match(/model[:\s]*([^\s,]+)/i);
        const modelName = modelMatch ? modelMatch[1] : selectedModel;

        errorContent = `⏱️ **Rate Limit Reached**\n\nYou've reached the request limit for the **${modelName}** model on ${providerName}.\n\n**What you can do:**\n- Wait a moment and try again\n- Switch to a different model in the header\n\n💡 *Tip: Different providers have separate rate limits!*`;
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
