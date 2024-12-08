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
