import { batchUpdatePresentation } from './tools/batchUpdatePresentation.js';
import { createPresentation } from './tools/createPresentation.js';
import { getPage } from './tools/getPage.js';
import { getPresentation } from './tools/getPresentation.js';
import { summarizePresentation } from './tools/summarizePresentation.js';
import { handleGoogleApiError } from './utils/errorHandler.js';
import type { ToolModule } from './utils/tool.js';
import type { McpServer } from '@modelcontextprotocol/server';
import type { slides_v1 } from 'googleapis';

const JSON_INDENT = 2;

const jsonText = (data: unknown): { content: { type: 'text'; text: string }[] } => ({
  content: [{ type: 'text', text: JSON.stringify(data, null, JSON_INDENT) }],
});

const invoke = async <T>(slides: slides_v1.Slides, tool: ToolModule<T>, args: T) => {
  try {
    return jsonText(await tool.handler(slides, args));
  } catch (error: unknown) {
    throw handleGoogleApiError(error, tool.name);
  }
};

const register = <T>(server: McpServer, slides: slides_v1.Slides, tool: ToolModule<T>): void => {
  server.registerTool(
    tool.name,
    {
      description: tool.descriptor.description,
      inputSchema: tool.schema,
    },
    async (args) => invoke(slides, tool, args)
  );
};

export const setupToolHandlers = (server: McpServer, slides: slides_v1.Slides): void => {
  register(server, slides, createPresentation);
  register(server, slides, getPresentation);
  register(server, slides, batchUpdatePresentation);
  register(server, slides, getPage);
  register(server, slides, summarizePresentation);
};
