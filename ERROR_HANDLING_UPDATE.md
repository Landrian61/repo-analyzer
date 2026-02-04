# Error Handling & Model Selection Updates

## Changes Made

### 1. **Added New Gemini Models**

Updated `ModelSelector.tsx` to include three Gemini models:

- **Gemini 2.5 Flash** (Default) - Latest balanced model for complex analysis
- **Gemini 2.5 Flash Lite** - Lightweight and fast for quick analysis  
- **Gemini 3 Flash Preview** - Preview of next-gen model (experimental)

Users can now switch between models from the header dropdown to:
- Avoid rate limits (each model has separate quotas)
- Choose speed vs. capability trade-offs
- Test different model capabilities

### 2. **Improved Error Handling**

Completely revamped error messages in `agent.ts` to be user-friendly:

#### Rate Limit Errors (429)
**Before:**
```
❌ Error analyzing repository

[GoogleGenerativeAI Error]: Error fetching from https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent: [429 Too Many Requests] You exceeded your current quota...
```

**After:**
```
⏱️ Rate Limit Reached

You've reached the request limit for the gemini-3-flash model. Please try again in 46 seconds.

What you can do:
- Wait a moment and try again
- Switch to a different Gemini model in the header
- Upgrade your Gemini API plan for higher limits

💡 Tip: Different models have separate rate limits, so switching models can help!
```

#### Other Error Types
Now handling specific error codes with helpful messages:

- **400 Bad Request**: Invalid request format with troubleshooting steps
- **403 Forbidden**: API key permission issues
- **404 Not Found**: Model not available
- **Generic Errors**: Simplified, user-friendly messages

### 3. **Smart Error Detection**

The error handler now:
- Detects rate limit errors by status code (429) or message content
- Extracts retry delay information when available
- Identifies the specific model that hit the limit
- Provides contextual help based on error type
- Strips technical stack traces from user-facing messages

### 4. **Consistent Error Handling**

Both `analyzeWithTools` and `analyzeSimple` functions now have:
- Consistent error message formatting
- Same detection logic for rate limits
- User-friendly guidance for resolution
- Clean markdown formatting

## Benefits

✅ Users understand what went wrong  
✅ Clear actionable steps to resolve issues  
✅ Model switching encourages trying alternatives  
✅ No more technical error dumps in the UI  
✅ Better user experience during API limits  

## Example Use Case

When a user hits the rate limit on one model:
1. They see a clean, friendly error message
2. They're told exactly how long to wait
3. They're prompted to try a different model
4. They can click the model selector and switch
5. The new model likely has quota available
6. They continue their analysis without waiting

## Technical Details

### Model Detection in Errors
```typescript
const modelMatch = error.message?.match(/model:\s*([^\s,]+)/);
const modelName = modelMatch ? modelMatch[1] : selectedModel;
```

### Retry Delay Extraction
```typescript
const retryDetail = error.errorDetails.find((detail: any) => 
  detail["@type"]?.includes("RetryInfo")
);
if (retryDetail?.retryDelay) {
  const seconds = parseInt(retryDetail.retryDelay);
  // Convert to minutes if > 60 seconds
}
```

### Error Type Detection
```typescript
if (error.status === 429 || 
    error.message?.includes("quota") || 
    error.message?.includes("Too Many Requests")) {
  // Handle rate limit
}
```
