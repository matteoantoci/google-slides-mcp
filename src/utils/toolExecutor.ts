import type { slides_v1 } from 'googleapis';
import type { z } from 'zod';

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
