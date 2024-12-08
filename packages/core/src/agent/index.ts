import { ChatCompletionMessageToolCall } from "openai/resources/index.mjs";
import { LLM } from "../llm";
import { Tool } from "../tool";
import { AgentConfig, AgentResponse, LLMResult, Message, Provider, ToolConfig } from "../types";

export class Agent {
  public name: string;
  public prompt: string;
  public messages: Message[];
  public maxIterations: number;
  private tools: Tool[];
  private llm: any;
  private logger: any;
  private provider: Provider;
  private secrets: Record<string, string>;

  constructor(name: string, config: AgentConfig) {
    this.name = name;
    this.prompt = this.constructPrompt(config);
    this.provider = config.provider || 'openai';
    this.tools = this.prepareTools(config.tools || []);
    this.messages = config.messages || [];
    this.maxIterations = config.maxIterations || 10;
    this.secrets = config.secrets;
    this.logger = config.logger || console;
    this.logger.info(this.prompt);

    this.llm = new LLM({ provider: this.provider, apiKey: config.secrets.OPENAI_API_KEY, logger: this.logger });
  }

  public async execute(input: string, context?: string): Promise<string> {
    this.setupMessages(input, context);
    let iterationCount = 0;
    let result: LLMResult = {};

    while (true) {
      if (iterationCount > this.maxIterations) break;

      if (iterationCount === this.maxIterations) {
        this.pushToMessages({ role: "system", content: "Provide a final answer" });
      }

      result = await this.llm.call(this.messages, this.functions());

      await this.handleLlmResult(result);

      if (result.content?.stop) break;
      iterationCount++;
    }

    return result.content?.output || '';
  }

  public registerTool(tool: Tool): void {
    this.tools.push(tool);
  }

  private setupMessages(input: string, context?: string): void {
    if (!this.messages.length) {
      this.pushToMessages({ role: "system", content: this.prompt });

      if (context) {
        this.pushToMessages({ role: "assistant", content: context });
      }
    }

    this.pushToMessages({ role: "user", content: input });
  }

  private async handleLlmResult(result: LLMResult): Promise<void> {
    if (result.toolCalls) {
      const toolResult = await this.executeTool(result.toolCalls);
      this.pushToMessages({ role: "assistant", content: toolResult.output || '' });
    } else {
      this.pushToMessages({
        role: "assistant",
        content: result.content?.thoughtProcess || result.content?.output || ''
      });
    }
  }

  private constructPrompt(config: AgentConfig): string {
    if (config.prompt) return config.prompt;

    return `
      Persona: ${config.persona}
      Objective: ${config.goal}
      Guidelines:
      - Work diligently until the stated objective is achieved.
      - Utilize only the provided tools for solving the task. Do not make up names of the functions
      - Set 'stop: true' when the objective is complete.
      - If you have enough information to provide the details to the user, prepare a final result collecting all the information you have.
      Output Structure:
      If you find a function, that can be used, directly call the function.
      When providing the final answer:
      {
        'thoughtProcess': 'Describe the reasoning and steps that will lead to the final result.',
        'output': 'The complete answer in text form.',
        'stop': true
      }
    `;
  }

  private prepareTools(tools: ToolConfig[]): Tool[] {
    return tools.map(
      (tool) => new Tool(tool.name, tool.description, tool.config, tool.implementation)
    );
  }

  private functions(): Array<{
    name: string;
    description: string;
    parameters: {
      type: string;
      properties: Record<string, { type: string; description: string }>;
      required: string[];
    };
  }> {
    return this.tools.map(tool => {
      const properties: Record<string, { type: string; description: string }> = {};

      Object.entries(tool.config.properties).forEach(([propertyName, propertyDetails]) => {
        properties[propertyName] = {
          type: propertyDetails.type,
          description: propertyDetails.description
        };
      });

      const required = Object.entries(tool.config.properties)
        .filter(([_, details]) => details.required)
        .map(([name]) => name);

      return {
        name: tool.name,
        description: tool.description,
        parameters: {
          type: "object",
          properties,
          required
        }
      };
    });
  }

  private pushToMessages(message: Message): void {
    this.logger.info(`Message: ${JSON.stringify(message)}`);
    this.messages.push(message);
  }

  private async executeTool(toolCalls: ChatCompletionMessageToolCall[]): Promise<AgentResponse> {
    const toolCall = toolCalls[0];

    const tool = this.tools.find(t => t.name === toolCall.function.name);

    if (!tool) {
      return { output: "Invalid tool_name, please try again", stop: false };
    }

    this.logger.info(
      `tool_call: ${toolCall.function.name}, ${toolCall.function.arguments}`,
    );

    const functionArgs = JSON.parse(toolCall.function.arguments);


    const toolResult = await tool.execute(
      Object.fromEntries(
        Object.entries(functionArgs).map(([k, v]) => [k, v])
      ),
      this.secrets
    );

    return {
      output: toolResult || '',
      stop: false
    };
  }
}
