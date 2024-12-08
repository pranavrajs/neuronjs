import { ChatCompletionMessageToolCall } from "openai/resources/index.mjs";

export type FunctionInput = {
  type: string;
  description: string;
  required?: boolean;
};

export type Provider = 'openai' | 'anthropic' | 'google';
export interface AgentResponse {
  thoughtProcess?: string | null,
  output?: string | null;
  stop?: boolean;
}

export interface LLMResult {
  content?: AgentResponse | null;
  toolCalls?: ChatCompletionMessageToolCall[];
}

export interface LLMServiceConfig {
  provider?: Provider;
  apiKey: string;
  defaultModel?: string;
  logger?: Console;
}


export interface ToolProperty {
  type: string;
  description: string;
  required?: boolean;
}

export  interface ToolConfig {
  name: string;
  description: string;
  config: {
    properties: Record<string, ToolProperty>;
    secrets?: string[];
  },
  implementation?: any;
}

export interface AgentConfig {
  prompt?: string;
  tools?: ToolConfig[];
  messages?: Message[];
  maxIterations?: number;
  persona?: string;
  provider?: Provider;
  goal?: string;
  secrets: Record<string, string>;
  logger?: Console
}

export interface Message {
  role: string;
  content: string;
}
