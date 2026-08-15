import type { slides_v1 } from 'googleapis';
import type { z } from 'zod';

export type ToolResult = {
  content: { type: 'text'; text: string }[];
};

export type ToolDescriptor = {
  description: string;
};

export type ToolModule<T> = {
  name: string;
  descriptor: ToolDescriptor;
  schema: z.ZodType<T>;
  handler: (slides: slides_v1.Slides, parsedArgs: T) => Promise<ToolResult>;
};
