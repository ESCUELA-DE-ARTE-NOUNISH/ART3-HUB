// File: utils/openrouter.js
import { ChatOpenAI } from "@langchain/openai";

/**
 * Creates a custom LangChain chat model that uses OpenRouter
 * @param {Object} config Configuration options
 * @returns {ChatOpenAI} A LangChain chat model instance
 */
export function createOpenRouterChat(config = {}) {
  const {
    apiKey,
    model = "anthropic/claude-3-opus-20240229",
    temperature = 0.7,
    maxTokens,
    topP,
    presencePenalty,
    frequencyPenalty,
    timeout,
  } = config;

  if (!apiKey) {
    throw new Error("OpenRouter API key is required");
  }

  // Create a ChatOpenAI instance with OpenRouter base URL
  const openRouter = new ChatOpenAI({
    openAIApiKey: apiKey,
    modelName: model,
    temperature,
    maxTokens,
    topP,
    presencePenalty,
    frequencyPenalty,
    timeout,
    configuration: {
      baseURL: "https://openrouter.ai/api/v1",
      defaultHeaders: {
        "HTTP-Referer": process.env.NEXT_PUBLIC_NEXT_PUBLIC_URL || "http://localhost:3000",
        "X-Title": process.env.NEXT_PUBLIC_APP_NAME || "Next.js LangChain Chat App",
      },
    },
  });

  return openRouter;
}

/**
 * Shortcut list for popular OpenRouter models
 */
export const OpenRouterModels = {
  CLAUDE_OPUS: "anthropic/claude-3-opus-20240229",
  CLAUDE_SONNET: "anthropic/claude-3-sonnet-20240229",
  CLAUDE_HAIKU: "anthropic/claude-3-haiku-20240307", 
  GPT_4: "openai/gpt-4-turbo-preview",
  GPT_3_5: "openai/gpt-3.5-turbo",
  GEMINI_PRO: "google/gemini-pro",
  MIXTRAL: "mistralai/mixtral-8x7b-instruct",
  LLAMA_3: "meta-llama/llama-3-70b-instruct",
  COMMAND_R: "anthropic/claude-3-5-sonnet-20240620"
};