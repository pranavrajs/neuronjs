import OpenAI from 'openai';
import { AgentResponse, LLMResult, LLMServiceConfig, Provider } from '../types';
import { ContentParsingError, InvalidProviderError, LLMModelError, ProviderError } from '../errors';
import { ensureError } from '../utils';


const DEFAULT_MODEL = 'gpt-4o' as const;

export class LLM {
  private readonly client: OpenAI;
  private readonly model: string;
  private readonly logger: Console;
  private readonly provider: Provider;

  constructor({
    provider = 'openai',
    apiKey,
    defaultModel = DEFAULT_MODEL,
    logger = console
  }: LLMServiceConfig) {
    this.provider = this.validateProvider(provider);
    this.client = this.initializeClient(apiKey);
    this.model = this.validateModel(defaultModel);
    this.logger = logger;
  }

  async call(
    messages: OpenAI.Chat.ChatCompletionMessageParam[],
    tools: OpenAI.Chat.ChatCompletionTool[] = [],
  ): Promise<LLMResult> {
    try {
      switch (this.provider) {
        case 'openai':
          return this.callOpenAI(messages, tools, this.model);
        case 'anthropic':
          throw new InvalidProviderError('Anthropic support not yet implemented');
        case 'google':
          throw new InvalidProviderError('Google support not yet implemented');
        default:
          throw new InvalidProviderError(`Unsupported provider: ${this.provider}`);
      }
    } catch (error) {
      return this.handleError(error);
    }
  }

  private async callOpenAI(
    messages: OpenAI.Chat.ChatCompletionMessageParam[],
    tools: OpenAI.Chat.ChatCompletionTool[],
    model: string
  ): Promise<LLMResult> {
    try {
      const response = await this.client.chat.completions.create({
        model,
        messages,
        response_format: { type: "json_object" },
        tools: tools?.length ? tools : undefined,
      });

      const message = response.choices[0].message;
      return this.prepareResult(message);
    } catch (error) {
      throw new ProviderError(
        `Failed to call OpenAI API: ${ensureError(error).message}`,
      );
    }
  }

  private prepareResult(message: OpenAI.Chat.ChatCompletionMessage): LLMResult {
    if (message.tool_calls) {
      return this.prepareToolCallResult(message);
    }
    return this.prepareContentResult(message.content);
  }

  private prepareToolCallResult(message: OpenAI.Chat.ChatCompletionMessage): LLMResult {
    return {
      toolCalls: message.tool_calls,
      content: { output: message.content }
    };
  }

  private prepareContentResult(content: string | null | undefined): LLMResult {
    try {
      const trimmedContent = content?.trim() ?? "";
      const parsedContent: AgentResponse = this.parseJsonContent(trimmedContent);
      return { content: parsedContent };
    } catch (error) {
      throw new ContentParsingError(
        `Failed to prepare content result: ${ensureError(error).message}`
      );
    }
  }

  private parseJsonContent(content: string): AgentResponse  {
    try {
      return JSON.parse(content);
    } catch (error) {
      throw new ContentParsingError(
        `Failed to parse JSON content: ${ensureError(error).message}`
      );
    }
  }

  private initializeClient(apiKey: string): OpenAI {
    try {
      switch (this.provider) {
        case 'openai':
          return new OpenAI({ apiKey });
        case 'anthropic':
          throw new Error('Anthropic support is not yet implemented');
        case 'google':
          throw new Error('Google support is not yet implemented');
        default:
          throw new Error(`Unsupported provider: ${this.provider}`);
      }
    } catch (error) {
      throw new InvalidProviderError(
        `Failed to initialize ${this.provider} client: ${ensureError(error).message}`
      );
    }
  }

  private validateProvider(provider: Provider): Provider {
    const validProviders: Provider[] = ['openai', 'anthropic', 'google'];
    if (!validProviders.includes(provider)) {
      throw new InvalidProviderError(
        `Invalid provider. Must be one of: ${validProviders.join(', ')}`
      );
    }
    return provider;
  }

  private validateModel(model: string): string {
    if (!model || typeof model !== 'string' || model.trim().length === 0) {
      throw new LLMModelError('Model name must be a non-empty string');
    }
    return model.trim();
  }

  private handleError(error: unknown): LLMResult {
    const normalizedError = ensureError(error);
    let errorMessage: string;

    if (error instanceof ContentParsingError) {
      errorMessage = `Content parsing error: ${normalizedError.message}`;
    } else if (error instanceof ProviderError) {
      errorMessage = `Provider error: ${normalizedError.message}`;
    } else if (error instanceof LLMModelError) {
      errorMessage = `LLM model error: ${normalizedError.message}`;
    } else {
      errorMessage = `Unexpected error: ${normalizedError.message}`;
    }

    this.logger.error({
      message: errorMessage,
      timestamp: new Date().toISOString(),
      stack: normalizedError.stack,
    });

    return { content: { output: "An error occurred while processing your request. ${errorMessage}" } };
  }
}
