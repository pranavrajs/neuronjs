import { ExecutionError, InvalidImplementationError, InvalidSecretsError } from '../errors'
import { FunctionInput } from "../types";

export class Tool {
  private static readonly REQUIRED_PROPERTIES = ['name', 'description', 'config'] as const;

  constructor(
    readonly name: string,
    readonly description: string,
    readonly config: {
      properties: Record<string, FunctionInput>,
      secrets?: string[],
    },
    private implementation?: (input: Record<string, any>, secrets: Record<string, any>) => void
  ) {
    this.validateConfig();
  }

  registerFunction(implementation: typeof this.implementation): void {
    this.implementation = implementation;
  }

  execute(input: Record<string, any>, providedSecrets: Record<string, string> = {}): any {
    this.validateSecrets(providedSecrets);
    this.validateInput(input);

    if (!this.implementation) {
      throw new ExecutionError("No implementation registered");
    }

    try {
      return this.implementation(input, providedSecrets);
    } catch (error) {
      throw new ExecutionError(`Execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private validateConfig(): void {
    const configKeys = [this.name, this.description, this.config];
    const missingKeys = Tool.REQUIRED_PROPERTIES.filter((_, index) => !configKeys[index]);

    if (missingKeys.length) {
      throw new InvalidImplementationError(`Missing required properties: ${missingKeys.join(', ')}`);
    }
  }

  private validateSecrets(providedSecrets: Record<string, string>): void {
    if (!this.config.secrets) {
      return;
    }

    const missingSecrets = this.config.secrets.filter(secret => !(secret in providedSecrets));
    if (missingSecrets.length) {
      throw new InvalidSecretsError(`Missing required secrets: ${missingSecrets.join(', ')}`);
    }
  }

  private validateInput(input: Record<string, any>): void {
    Object.entries(this.config.properties).forEach(([property, details]) => {
      if (details.required && !(property in input)) {
        throw new InvalidImplementationError(`Missing required property: ${property}`);
      }
    });
  }
}
