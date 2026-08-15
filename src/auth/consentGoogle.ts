import { google } from 'googleapis';

const SCOPES = ['https://www.googleapis.com/auth/presentations', 'https://www.googleapis.com/auth/drive.readonly'];

export type ConsentClient = {
  clientId: string;
  clientSecret: string;
};

export const googleAuthorizeUrl = (client: ConsentClient, redirectUri: string, state: string): string =>
  new google.auth.OAuth2(client.clientId, client.clientSecret, redirectUri).generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: SCOPES,
    state,
  });

export const exchangeGoogleCode = async (client: ConsentClient, redirectUri: string, code: string): Promise<string> => {
  const oauth = new google.auth.OAuth2(client.clientId, client.clientSecret, redirectUri);
  const { tokens } = await oauth.getToken(code);
  if (!tokens.refresh_token) {
    throw new Error('Google did not return a refresh token. Retry consent.');
  }
  return tokens.refresh_token;
};
