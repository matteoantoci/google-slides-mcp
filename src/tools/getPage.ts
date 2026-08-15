import { GetPageArgsSchema, type GetPageArgs } from '../schemas.js';
import { handleGoogleApiError } from '../utils/errorHandler.js';
import type { ToolModule, ToolResult } from '../utils/toolExecutor.js';
import type { slides_v1 } from 'googleapis';

const JSON_INDENT = 2;

const handler = async (slides: slides_v1.Slides, args: GetPageArgs): Promise<ToolResult> => {
  try {
    const response = await slides.presentations.pages.get({
      presentationId: args.presentationId,
      pageObjectId: args.pageObjectId,
    });
    return {
      content: [{ type: 'text', text: JSON.stringify(response.data, null, JSON_INDENT) }],
    };
  } catch (error: unknown) {
    throw handleGoogleApiError(error, 'get_page');
  }
};

export const getPage: ToolModule<GetPageArgs> = {
  name: 'get_page',
  schema: GetPageArgsSchema,
  handler,
  descriptor: {
    name: 'get_page',
    description: 'Get details about a specific page (slide) in a presentation',
    inputSchema: {
      type: 'object',
      properties: {
        presentationId: {
          type: 'string',
          description: 'The ID of the presentation.',
        },
        pageObjectId: {
          type: 'string',
          description: 'The object ID of the page (slide) to retrieve.',
        },
      },
      required: ['presentationId', 'pageObjectId'],
    },
  },
};
