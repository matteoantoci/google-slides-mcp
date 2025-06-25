#!/usr/bin/env node
import { google } from 'googleapis';
import * as http from 'http';
import * as url from 'url';
import open from 'open';
import destroyer from 'server-destroy';

// Before running this script, please set the following environment variables
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = 'http://localhost:3000/oauth2callback';

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('Please set the GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables');
  process.exit(1);
}

// Initialize OAuth2 client
const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

// Set authentication scopes
const scopes = [
  'https://www.googleapis.com/auth/presentations',
  'https://www.googleapis.com/auth/drive.readonly'
];

async function main() {
  // Generate authentication URL
  const authorizeUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent' // Required to force refresh token acquisition
  });

  // Start local server
  const server = http.createServer(async (req, res) => {
    try {
      if (!req.url) {
        throw new Error('No URL in request');
      }

      // Get code from callback URL
      const queryParams = url.parse(req.url, true).query;
      const code = queryParams.code;

      if (code) {
        // Exchange code for tokens
        const { tokens } = await oauth2Client.getToken(code as string);

        // Return response
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>Authentication Successful</title>
          </head>
          <body>
            <h1>Authentication Successful!</h1>
            <p>Please close this window and return to the terminal.</p>
          </body>
          </html>
        `);

        // Display refresh token
        console.log('\n=== Refresh Token ===');
        console.log(tokens.refresh_token);
        console.log('========================\n');
        console.log('Please set this refresh token to the GOOGLE_REFRESH_TOKEN environment variable.');

        // Stop the server
        server.destroy();
      } else {
        res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>Error</title>
          </head>
          <body>
            <h1>Authentication code not found</h1>
          </body>
          </html>
        `);
      }
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Error</title>
        </head>
        <body>
          <h1>An error occurred</h1>
          <p>${e}</p>
        </body>
        </html>
      `);
      console.error('Error:', e);
    }
  }).listen(3000, () => {
    // Open authentication URL in browser
    console.log('Opening authentication URL...');
    open(authorizeUrl, { wait: false });
  });

  destroyer(server);
}

main().catch(console.error);
