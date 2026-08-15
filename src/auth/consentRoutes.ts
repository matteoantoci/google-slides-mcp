import { randomBytes } from 'node:crypto';
import { exchangeGoogleCode, googleAuthorizeUrl, type ConsentClient } from './consentGoogle.js';
import { HTTP_BAD_REQUEST, HTTP_OK, readBody, redirect, sendHtml } from './consentHttp.js';
import { errorPage, setupPage, successPage } from './consentPages.js';
import type { GoogleCredential, PartialGoogleCredential } from './credential.js';
import type { IncomingMessage, ServerResponse } from 'node:http';

const STATE_BYTES = 16;

export type ConsentSession = ConsentClient & {
  state: string;
};

export type ConsentContext = {
  origin: string;
  seed: PartialGoogleCredential;
  session: ConsentSession | undefined;
  setSession: (session: ConsentSession) => void;
  finish: (credential: GoogleCredential) => void;
};

export const newSession = (client: ConsentClient): ConsentSession => ({
  ...client,
  state: randomBytes(STATE_BYTES).toString('hex'),
});
const callbackUri = (origin: string): string => `${origin}/oauth2callback`;

export const handleSetupGet = (res: ServerResponse, seed: PartialGoogleCredential): void => {
  sendHtml(res, HTTP_OK, setupPage(seed.clientId ?? '', seed.clientSecret ?? '', ''));
};

export const handleSetupPost = async (
  req: IncomingMessage,
  res: ServerResponse,
  ctx: ConsentContext
): Promise<void> => {
  const fields = new URLSearchParams(await readBody(req));
  const clientId = fields.get('clientId')?.trim() ?? '';
  const clientSecret = fields.get('clientSecret')?.trim() ?? '';
  if (clientId === '' || clientSecret === '') {
    sendHtml(res, HTTP_BAD_REQUEST, setupPage(clientId, clientSecret, 'Client id and client secret are required.'));
    return;
  }
  const session = newSession({ clientId, clientSecret });
  ctx.setSession(session);
  redirect(res, googleAuthorizeUrl(session, callbackUri(ctx.origin), session.state));
};

export const handleStart = (res: ServerResponse, ctx: ConsentContext): void => {
  if (!ctx.session) {
    redirect(res, `${ctx.origin}/setup`);
    return;
  }
  redirect(res, googleAuthorizeUrl(ctx.session, callbackUri(ctx.origin), ctx.session.state));
};

export const handleCallback = async (url: URL, res: ServerResponse, ctx: ConsentContext): Promise<void> => {
  if (!ctx.session || url.searchParams.get('state') !== ctx.session.state) {
    sendHtml(res, HTTP_BAD_REQUEST, errorPage('Invalid consent state. Retry setup.'));
    return;
  }
  const code = url.searchParams.get('code');
  if (!code) {
    sendHtml(res, HTTP_BAD_REQUEST, errorPage('Google did not return a code.'));
    return;
  }
  const refreshToken = await exchangeGoogleCode(ctx.session, callbackUri(ctx.origin), code);
  sendHtml(res, HTTP_OK, successPage());
  ctx.finish({ clientId: ctx.session.clientId, clientSecret: ctx.session.clientSecret, refreshToken });
};
