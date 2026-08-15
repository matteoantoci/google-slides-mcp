#!/usr/bin/env node
import { google } from 'googleapis';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { parse } from 'node:url';
import open from 'open';

const PORT = 3000;
const HTTP_OK = 200;
const HTTP_BAD_REQUEST = 400;
const HTTP_SERVER_ERROR = 500;
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

const scopes = ['https://www.googleapis.com/auth/presentations', 'https://www.googleapis.com/auth/drive.readonly'];

type HtmlResponse = {
  res: ServerResponse;
  status: number;
  title: string;
  body: string;
};

const htmlPage = (title: string, body: string): string => `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title}</title>
</head>
<body>
  ${body}
</body>
</html>`;

const send = ({ res, status, title, body }: HtmlResponse): void => {
  res.writeHead(status, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(htmlPage(title, body));
};

const requireEnv = (value: string | undefined): string => {
  if (!value) {
    console.error('Please set the GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables');
    process.exit(1);
  }
  return value;
};

const clientId = requireEnv(CLIENT_ID);
const clientSecret = requireEnv(CLIENT_SECRET);
const redirectUri = `http://localhost:${PORT}/oauth2callback`;
const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
const authorizeUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: scopes,
  prompt: 'consent',
});

const exchangeCode = async (code: string, res: ServerResponse, close: () => void): Promise<void> => {
  const { tokens } = await oauth2Client.getToken(code);
  send({
    res,
    status: HTTP_OK,
    title: 'Authentication Successful',
    body: '<h1>Authentication Successful!</h1><p>Please close this window and return to the terminal.</p>',
  });
  console.log('\n=== Refresh Token ===');
  console.log(tokens.refresh_token);
  console.log('========================\n');
  console.log('Please set this refresh token to the GOOGLE_REFRESH_TOKEN environment variable.');
  close();
};

const handleCallback = async (req: IncomingMessage, res: ServerResponse, close: () => void): Promise<void> => {
  if (!req.url) {
    throw new Error('No URL in request');
  }
  const code = parse(req.url, true).query.code;
  if (typeof code !== 'string') {
    send({ res, status: HTTP_BAD_REQUEST, title: 'Error', body: '<h1>Authentication code not found</h1>' });
    return;
  }
  await exchangeCode(code, res, close);
};

const errorText = (error: unknown): string => (error instanceof Error ? error.message : String(error));

const startServer = (): void => {
  const server = createServer((req, res) => {
    handleCallback(req, res, () => {
      server.closeAllConnections();
      server.close();
    }).catch((error: unknown) => {
      send({
        res,
        status: HTTP_SERVER_ERROR,
        title: 'Error',
        body: `<h1>An error occurred</h1><p>${errorText(error)}</p>`,
      });
      console.error('Error:', error);
    });
  });
  server.listen(PORT, () => {
    console.log('Opening authentication URL...');
    open(authorizeUrl, { wait: false }).catch((error: unknown) => {
      console.error('Error:', error);
    });
  });
};

startServer();
