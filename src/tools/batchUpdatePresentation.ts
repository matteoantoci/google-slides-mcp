import { BatchUpdatePresentationArgsSchema, type BatchUpdatePresentationArgs } from '../schemas.js';
import { handleGoogleApiError } from '../utils/errorHandler.js';
import type { ToolModule, ToolResult } from '../utils/toolExecutor.js';
import type { slides_v1 } from 'googleapis';

const JSON_INDENT = 2;

const toRequest = (value: unknown): slides_v1.Schema$Request => {
  if (value === null || typeof value !== 'object') {
    return {};
  }
  return { ...value };
};

const toWriteControl = (value: unknown): slides_v1.Schema$WriteControl | undefined => {
  if (value === null || value === undefined || typeof value !== 'object') {
    return undefined;
  }
  return { ...value };
};

const handler = async (slides: slides_v1.Slides, args: BatchUpdatePresentationArgs): Promise<ToolResult> => {
  try {
    const response = await slides.presentations.batchUpdate({
      presentationId: args.presentationId,
      requestBody: {
        requests: args.requests.map(toRequest),
        writeControl: toWriteControl(args.writeControl),
      },
    });
    return {
      content: [{ type: 'text', text: JSON.stringify(response.data, null, JSON_INDENT) }],
    };
  } catch (error: unknown) {
    throw handleGoogleApiError(error, 'batch_update_presentation');
  }
};

export const batchUpdatePresentation: ToolModule<BatchUpdatePresentationArgs> = {
  name: 'batch_update_presentation',
  schema: BatchUpdatePresentationArgsSchema,
  handler,
  descriptor: {
    description: 'Apply a batch of updates to a Google Slides presentation',
  },
};
