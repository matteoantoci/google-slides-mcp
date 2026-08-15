import { CreatePresentationArgsSchema, type CreatePresentationArgs } from '../schemas.js';
import { handleGoogleApiError } from '../utils/errorHandler.js';
import type { ToolModule, ToolResult } from '../utils/toolExecutor.js';
import type { slides_v1 } from 'googleapis';

const JSON_INDENT = 2;

const handler = async (slides: slides_v1.Slides, args: CreatePresentationArgs): Promise<ToolResult> => {
  try {
    const response = await slides.presentations.create({
      requestBody: {
        title: args.title,
      },
    });
    return {
      content: [{ type: 'text', text: JSON.stringify(response.data, null, JSON_INDENT) }],
    };
  } catch (error: unknown) {
    throw handleGoogleApiError(error, 'create_presentation');
  }
};

export const createPresentation: ToolModule<CreatePresentationArgs> = {
  name: 'create_presentation',
  schema: CreatePresentationArgsSchema,
  handler,
  descriptor: {
    description: 'Create a new Google Slides presentation',
  },
};
