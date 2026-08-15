import { BatchUpdatePresentationArgsSchema, type BatchUpdatePresentationArgs } from '../schemas.js';
import type { ToolModule } from '../utils/tool.js';
import type { slides_v1 } from 'googleapis';

const toRequest = (value: unknown): slides_v1.Schema$Request => {
  if (value === null || typeof value !== 'object') {
    throw new Error('Each batch update request must be an object.');
  }
  return { ...value };
};

const toWriteControl = (value: unknown): slides_v1.Schema$WriteControl | undefined => {
  if (value === null || value === undefined || typeof value !== 'object') {
    return undefined;
  }
  return { ...value };
};

const handler = async (slides: slides_v1.Slides, args: BatchUpdatePresentationArgs): Promise<unknown> => {
  const response = await slides.presentations.batchUpdate({
    presentationId: args.presentationId,
    requestBody: {
      requests: args.requests.map(toRequest),
      writeControl: toWriteControl(args.writeControl),
    },
  });
  return response.data;
};

export const batchUpdatePresentation: ToolModule<BatchUpdatePresentationArgs> = {
  name: 'batch_update_presentation',
  schema: BatchUpdatePresentationArgsSchema,
  handler,
  descriptor: {
    description: 'Apply a batch of updates to a Google Slides presentation',
  },
};
