export class AgentError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class InvalidImplementationError extends AgentError {
  constructor(message: string) {
    super(message, 'INVALID_IMPLEMENTATION');
  }
}

export class InvalidSecretsError extends AgentError {
  constructor(message: string) {
    super(message, 'INVALID_SECRETS');
  }
}

export class ExecutionError extends AgentError {
  constructor(message: string) {
    super(message, 'EXECUTION_ERROR');
  }
}


export class InvalidProviderError extends AgentError {
  constructor(message: string) {
    super(message, 'INVALID_PROVIDER_ERROR');
  }
}
export class ContentParsingError extends AgentError {
  constructor(message: string) {
    super(message, 'CONTENT_PARSER_ERROR');
  }
}


export class ProviderError extends AgentError {
  constructor(message: string) {
    super(message, 'PROVIDER_ERROR');
  }
}

export class LLMModelError extends AgentError {
  constructor(message: string) {
    super(message, 'LLM_MODEL_ERROR');
  }
}
