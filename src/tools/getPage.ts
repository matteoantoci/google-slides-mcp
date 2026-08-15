import { GetPageArgsSchema, type GetPageArgs } from '../schemas.js';
import type { ToolModule } from '../utils/tool.js';
import type { slides_v1 } from 'googleapis';

const handler = async (slides: slides_v1.Slides, args: GetPageArgs): Promise<unknown> => {
  const response = await slides.presentations.pages.get({
    presentationId: args.presentationId,
    pageObjectId: args.pageObjectId,
  });
  return response.data;
};

export const getPage: ToolModule<GetPageArgs> = {
  name: 'get_page',
  schema: GetPageArgsSchema,
  handler,
  descriptor: {
    description: 'Get details about a specific page (slide) in a presentation',
  },
};
