import { ChatCompletionMessageToolCall } from "openai/resources/index.mjs";
import { LLM } from "../llm";
import { Tool } from "../tool";
import { AgentConfig, AgentResponse, LLMResult, Message, Provider, ToolConfig } from "../types";

export class Agent {
  private name: string;
  private prompt: string;
  private messages: Message[];
  private maxIterations: number;
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
    this.logger.debug(this.prompt);

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

      try {
        result = await this.llm.call(this.messages, this.functions());

        await this.handleLlmResult(result);

        if (result.content?.stop) break;
      } catch (error) {
        this.pushToMessages({ role: "assistant", content: `There was an error ${error.message}` });
      }

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
	    1. Make sure that you break the task into logical steps and execute methodically until the objective is achieved. Do not attempt to solve before breaking it into steps.
      2. Provide the breakdown steps as thought process in the first step.
	    3. Use only the provided tools, avoiding unnecessary or improvised function calls. If a tool can assist in solving the task, do not invoke it immediately rather provide reasoning first and then invoke the tool.
	    4. Include thoughtProcess during intermediate steps, but omit it from the final answer.
	    5. Mark the completion of the task by setting 'stop': true.
	    6. Ensure outputs are structured in the specified JSON format:
      - thoughtProcess: A concise explanation of reasoning and next steps (only for intermediate responses).
	    - output: The complete, user-friendly answer (final response only).
      - stop: Boolean indicator of task status (false for intermediate, true for final).


      Make sure that the format is followed properly:
      While processing: {thoughtProcess: '<reasoning>', stop: false}
	    Upon completion: {output: '<final result>', stop: true}
    `;
  }

  private prepareTools(tools: ToolConfig[]): Tool[] {
    return tools.map(
      (tool) => new Tool(tool.name, tool.description, tool.config, tool.implementation)
    );
  }

  private functions(): Array<{
    type: string,
    function:{
      name: string;
      description: string;
      parameters: {
        type: string;
        properties: Record<string, { type: string; description: string }>;
        required: string[];
      };
    }

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
        type: 'function',
        function: {
          name: tool.name,
          description: tool.description,
          parameters: {
            type: "object",
            properties,
            required
          }
        }
      };
    });
  }

  private pushToMessages(message: Message): void {
    this.logger.debug(`Message: ${JSON.stringify(message)}`);
    this.messages.push(message);
  }

  private async executeTool(toolCalls: ChatCompletionMessageToolCall[]): Promise<AgentResponse> {
    const toolCall = toolCalls[0];

    const tool = this.tools.find(t => t.name === toolCall.function.name);

    if (!tool) {
      return { output: "Invalid tool_name, please try again", stop: false };
    }

    this.logger.debug(
      `tool_call: ${toolCall.function.name}, ${toolCall.function.arguments}`,
    );
    this.pushToMessages({ role: "assistant", content: `Used the tool ${toolCall.function.name}` });

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
