import { GetPresentationArgsSchema, type GetPresentationArgs } from '../schemas.js';
import { handleGoogleApiError } from '../utils/errorHandler.js';
import type { ToolModule, ToolResult } from '../utils/toolExecutor.js';
import type { slides_v1 } from 'googleapis';

const JSON_INDENT = 2;

const handler = async (slides: slides_v1.Slides, args: GetPresentationArgs): Promise<ToolResult> => {
  try {
    const response = await slides.presentations.get({
      presentationId: args.presentationId,
      fields: args.fields,
    });
    return {
      content: [{ type: 'text', text: JSON.stringify(response.data, null, JSON_INDENT) }],
    };
  } catch (error: unknown) {
    throw handleGoogleApiError(error, 'get_presentation');
  }
};

export const getPresentation: ToolModule<GetPresentationArgs> = {
  name: 'get_presentation',
  schema: GetPresentationArgsSchema,
  handler,
  descriptor: {
    description: 'Get details about a Google Slides presentation',
  },
};
