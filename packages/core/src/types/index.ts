import OpenAI from "openai";

export type FunctionInput = {
  type: string;
  description: string;
  required?: boolean;
};

export type Provider = 'openai' | 'anthropic' | 'google';

export interface LLMResult {
  content?: string | null;
  toolCalls?: OpenAI.Chat.ChatCompletionMessage['tool_calls'];
}

export interface LLMServiceConfig {
  provider?: Provider;
  apiKey: string;
  defaultModel?: string;
  logger?: Console;
}
