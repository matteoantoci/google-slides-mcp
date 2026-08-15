import { batchUpdatePresentation } from './tools/batchUpdatePresentation.js';
import { createPresentation } from './tools/createPresentation.js';
import { getPage } from './tools/getPage.js';
import { getPresentation } from './tools/getPresentation.js';
import { summarizePresentation } from './tools/summarizePresentation.js';
import type { ToolModule } from './utils/toolExecutor.js';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { slides_v1 } from 'googleapis';

const register = <T>(server: McpServer, slides: slides_v1.Slides, tool: ToolModule<T>): void => {
  server.registerTool(
    tool.name,
    {
      description: tool.descriptor.description,
      inputSchema: tool.schema,
    },
    async (args) => tool.handler(slides, args)
  );
};

export const setupToolHandlers = (server: McpServer, slides: slides_v1.Slides): void => {
  register(server, slides, createPresentation);
  register(server, slides, getPresentation);
  register(server, slides, batchUpdatePresentation);
  register(server, slides, getPage);
  register(server, slides, summarizePresentation);
};
