import { describe, test, expect, vi, beforeEach } from 'vitest';
import { Tool } from './index';
import { ExecutionError, InvalidImplementationError, InvalidSecretsError } from '../errors';
import { FunctionInput } from '../types';

describe('Tool', () => {
  let validConfig: {
    properties: Record<string, FunctionInput>;
    secrets?: string[];
  };

  beforeEach(() => {
    validConfig = {
      properties: {
        requiredProp: { type: 'string', description: 'This is a required prop', required: true },
        optionalProp: { type: 'string', description: 'This is an optional prop', required: false }
      },
      secrets: ['apiKey']
    };
  });

  describe('constructor', () => {
    test('creates a valid tool with all required properties', () => {
      const tool = new Tool('testTool', 'Test description', validConfig);
      expect(tool.name).toBe('testTool');
      expect(tool.description).toBe('Test description');
      expect(tool.config).toEqual(validConfig);
    });

    test('throws error when missing required properties', () => {
      expect(() => {
        new Tool('', 'Test description', validConfig);
      }).toThrow(InvalidImplementationError);

      expect(() => {
        // @ts-expect-error Testing invalid constructor params
        new Tool('Test Tool', 'Test description', null);
      }).toThrow(InvalidImplementationError);
    });
  });


  describe('execute', () => {
    test('successfully executes a registered function with valid input and secrets', async () => {
      const implementation = vi.fn().mockReturnValue('success');
      const tool = new Tool('testTool', 'Test description', validConfig);
      tool.registerFunction(implementation);

      const result = await tool.execute(
        { requiredProp: 'value' },
        { apiKey: 'test-key' }
      );

      expect(result).toBe('success');
      expect(implementation).toHaveBeenCalledWith(
        { requiredProp: 'value' },
        { apiKey: 'test-key' }
      );
    });

    test('throws ExecutionError when no implementation is registered', () => {
      const tool = new Tool('testTool', 'Test description', validConfig);

      expect(() => tool.execute(
        { requiredProp: 'value' },
        { apiKey: 'test-key' }
      )).toThrow(ExecutionError);
    });

    test('throws InvalidSecretsError when required secrets are missing', async () => {
      const implementation = vi.fn();
      const tool = new Tool('testTool', 'Test description', validConfig, implementation);

      expect(() => tool.execute(
        { requiredProp: 'value' },
        {}
      )).toThrow(InvalidSecretsError);
    });

    test('throws InvalidImplementationError when required properties are missing', async () => {
      const implementation = vi.fn();
      const tool = new Tool('testTool', 'Test description', validConfig, implementation);

      expect(() => tool.execute(
        { optionalProp: 'value' },
        { apiKey: 'test-key' }
      )).toThrow(InvalidImplementationError);
    });

    test('handles implementation throwing an error', async () => {
      const implementation = vi.fn().mockImplementation(() => {
        throw new Error('Implementation error');
      });
      const tool = new Tool('testTool', 'Test description', validConfig, implementation);

      expect(() => tool.execute(
        { requiredProp: 'value' },
        { apiKey: 'test-key' }
      )).toThrow(ExecutionError);
    });


    test('works with no secrets configured', async () => {
      const implementation = vi.fn().mockReturnValue('success');
      const tool = new Tool('testTool', 'Test description', {
        properties: {
          requiredProp: { type: 'string', description: 'This is a required prop', required: true }
        }
      }, implementation);

      const result = tool.execute(
        { requiredProp: 'value' }
      );

      expect(result).toBe('success');
    });
  });
});
