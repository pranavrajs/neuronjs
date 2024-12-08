# LLM

## Overview
The LLM service provides a unified interface for interacting with various Large Language Model providers (OpenAI, Anthropic, Google). Currently implements OpenAI with future support planned for other providers.

## Configuration
### LLMServiceConfig
- `provider`: Optional string, defaults to 'openai'
  - Supported values: 'openai', Future: ['anthropic', 'google']
- `apiKey`: Required string
  - Authentication key for the selected provider
- `defaultModel`: Optional string, defaults to 'gpt-4o'
  - Model identifier to use for requests
- `logger`: Optional Console interface, defaults to global console
  - Used for error logging and debugging

### Call Method
**Input Parameters:**
- `messages`: Array of chat completion messages
- `tools`: Optional array of chat completion tools

**Returns:**
- Promise<LLMResult> containing either:
  - `{ content: string }` for standard responses
  - `{ content: string | null, toolsCall: array }` for tool-based responses

## Response Formats
### Standard Response
```typescript
{
  content: string  // JSON-parsed content from LLM
}
```

### Tool Call Response
```typescript
{
  content: string | null,
  toolsCall: Array<{
    id: string,
    type: string,
    function: {
      name: string,
      arguments: string
    }
  }>
}
```

## Error Handling
### Error Types
- `ContentParsingError`: JSON parsing failures
- `InvalidProviderError`: Unsupported or invalid providers
- `LLMModelError`: Invalid model specifications
- `ProviderError`: API communication errors


## Notes
- Currently only supports OpenAI
- Requires JSON response format
- Todo: Streaming support
