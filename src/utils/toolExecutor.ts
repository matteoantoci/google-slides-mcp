import { ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import type { slides_v1 } from 'googleapis';

export type ToolResult = {
  content: { type: 'text'; text: string }[];
  isError?: boolean;
  errorCode?: number;
};

export type ToolDescriptor = {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
};

export type ToolModule<T> = {
  name: string;
  descriptor: ToolDescriptor;
  schema: z.ZodType<T>;
  handler: (slides: slides_v1.Slides, parsedArgs: T) => Promise<ToolResult>;
};

export type ExecuteToolOptions<T> = {
  slides: slides_v1.Slides;
  name: string;
  args: unknown;
  schema: z.ZodType<T>;
  handler: (slides: slides_v1.Slides, parsedArgs: T) => Promise<ToolResult>;
};

const extractErrorMessage = (err: unknown): string => {
  if (err instanceof Error) {
    return err.message;
  }
  if (typeof err === 'string') {
    return err;
  }
  return 'Unknown error';
};

const validationMessage = (toolName: string, error: z.ZodError): string => {
  const details = error.errors.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; ');
  return `Invalid arguments for tool "${toolName}": ${details}`;
};

const toErrorResult = (error: McpError): ToolResult => ({
  content: [{ type: 'text', text: error.message }],
  isError: true,
  errorCode: error.code,
});

const runHandler = async <T>(options: ExecuteToolOptions<T>): Promise<ToolResult> => {
  if (options.args === undefined) {
    throw new McpError(ErrorCode.InvalidParams, `Missing arguments for tool "${options.name}".`);
  }
  return options.handler(options.slides, options.schema.parse(options.args));
};

const executeFailure = (name: string, error: unknown): ToolResult => {
  console.error(`Error executing tool "${name}":`, error);
  if (error instanceof z.ZodError) {
    return toErrorResult(new McpError(ErrorCode.InvalidParams, validationMessage(name, error)));
  }
  if (error instanceof McpError) {
    return toErrorResult(error);
  }
  return toErrorResult(
    new McpError(ErrorCode.InternalError, `Failed to execute tool "${name}": ${extractErrorMessage(error)}`)
  );
};

export const executeTool = async <T>(options: ExecuteToolOptions<T>): Promise<ToolResult> => {
  try {
    return await runHandler(options);
  } catch (error: unknown) {
    return executeFailure(options.name, error);
  }
};
