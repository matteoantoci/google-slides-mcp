#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { google } from 'googleapis';
import { setupToolHandlers } from './serverHandlers.js';
import { checkEnvironmentVariables } from './utils/envCheck.js';
import { getStartupErrorMessage } from './utils/errorHandler.js';

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN;

checkEnvironmentVariables();

const shutdown =
  (server: McpServer): (() => void) =>
  () => {
    server
      .close()
      .then(() => process.exit(0))
      .catch(() => process.exit(1));
  };

const initializeAndRunServer = async (): Promise<void> => {
  const server = new McpServer(
    {
      name: 'google-slides-mcp',
      version: '0.1.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );
  const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET);
  oauth2Client.setCredentials({
    refresh_token: REFRESH_TOKEN,
  });
  const slides = google.slides({
    version: 'v1',
    auth: oauth2Client,
  });
  setupToolHandlers(server, slides);
  Reflect.set(server.server, 'onerror', (error: Error) => console.error('[MCP Server Error]', error));
  process.on('SIGINT', shutdown(server));
  process.on('SIGTERM', shutdown(server));
  await server.connect(new StdioServerTransport());
  console.error('Google Slides MCP server running and connected via stdio.');
};

initializeAndRunServer().catch((error: unknown) => {
  const errorMessage = getStartupErrorMessage(error);
  console.error('Failed to start Google Slides MCP server:', errorMessage, error);
  process.exit(1);
});
