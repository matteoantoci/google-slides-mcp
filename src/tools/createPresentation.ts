import { CreatePresentationArgsSchema, type CreatePresentationArgs } from '../schemas.js';
import type { ToolModule } from '../utils/tool.js';
import type { slides_v1 } from 'googleapis';

const handler = async (slides: slides_v1.Slides, args: CreatePresentationArgs): Promise<unknown> => {
  const response = await slides.presentations.create({
    requestBody: {
      title: args.title,
    },
  });
  return response.data;
};

export const createPresentation: ToolModule<CreatePresentationArgs> = {
  name: 'create_presentation',
  schema: CreatePresentationArgsSchema,
  handler,
  descriptor: {
    description: 'Create a new Google Slides presentation',
  },
};
