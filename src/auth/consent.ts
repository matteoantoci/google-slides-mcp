import { google } from 'googleapis';
import { randomBytes } from 'node:crypto';
import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import open from 'open';
import { errorPage, setupPage, successPage } from './consentPages.js';
import { deferred } from './deferred.js';
import type { GoogleCredential, PartialGoogleCredential } from './credential.js';

const HTTP_OK = 200;
const HTTP_BAD_REQUEST = 400;
const HTTP_FOUND = 302;
const STATE_BYTES = 16;
const SCOPES = ['https://www.googleapis.com/auth/presentations', 'https://www.googleapis.com/auth/drive.readonly'];

type ConsentClient = {
  clientId: string;
  clientSecret: string;
};

type ConsentSession = ConsentClient & {
  state: string;
};

type ConsentRun = {
  origin: string;
  seed: PartialGoogleCredential;
  getSession: () => ConsentSession | undefined;
  setSession: (session: ConsentSession) => void;
  finish: (credential: GoogleCredential) => void;
};

type ConsentListener = {
  server: Server;
  origin: string;
  close: () => Promise<void>;
};

const sendHtml = (res: ServerResponse, status: number, body: string): void => {
  res.writeHead(status, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(body);
};

const redirect = (res: ServerResponse, location: string): void => {
  res.writeHead(HTTP_FOUND, { Location: location });
  res.end();
};

const readBody = (req: IncomingMessage): Promise<string> => {
  const wait = deferred<string>();
  const chunks: Buffer[] = [];
  req.on('data', (chunk: Buffer) => {
    chunks.push(chunk);
  });
  req.on('end', () => {
    wait.resolve(Buffer.concat(chunks).toString('utf8'));
  });
  req.on('error', wait.reject);
  return wait.promise;
};

const originOk = (req: IncomingMessage, origin: string): boolean => {
  const host = req.headers.host;
  if (host !== new URL(origin).host) {
    return false;
  }
  const requestOrigin = req.headers.origin;
  return requestOrigin === undefined || requestOrigin === origin;
};

const googleAuthorizeUrl = (client: ConsentClient, redirectUri: string, state: string): string =>
  new google.auth.OAuth2(client.clientId, client.clientSecret, redirectUri).generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: SCOPES,
    state,
  });

const exchangeGoogleCode = async (client: ConsentClient, redirectUri: string, code: string): Promise<string> => {
  const oauth = new google.auth.OAuth2(client.clientId, client.clientSecret, redirectUri);
  const { tokens } = await oauth.getToken(code);
  if (!tokens.refresh_token) {
    throw new Error('Google did not return a refresh token. Retry consent.');
  }
  return tokens.refresh_token;
};

const newSession = (client: ConsentClient): ConsentSession => ({
  ...client,
  state: randomBytes(STATE_BYTES).toString('hex'),
});

const callbackUri = (origin: string): string => `${origin}/oauth2callback`;

const handleSetupGet = (res: ServerResponse, seed: PartialGoogleCredential): void => {
  sendHtml(res, HTTP_OK, setupPage(seed.clientId ?? '', seed.clientSecret ?? '', ''));
};

const handleSetupPost = async (req: IncomingMessage, res: ServerResponse, run: ConsentRun): Promise<void> => {
  const fields = new URLSearchParams(await readBody(req));
  const clientId = fields.get('clientId')?.trim() ?? '';
  const clientSecret = fields.get('clientSecret')?.trim() ?? '';
  if (clientId === '' || clientSecret === '') {
    sendHtml(res, HTTP_BAD_REQUEST, setupPage(clientId, clientSecret, 'Client id and client secret are required.'));
    return;
  }
  const session = newSession({ clientId, clientSecret });
  run.setSession(session);
  redirect(res, googleAuthorizeUrl(session, callbackUri(run.origin), session.state));
};

const handleStart = (res: ServerResponse, run: ConsentRun): void => {
  const session = run.getSession();
  if (!session) {
    redirect(res, `${run.origin}/setup`);
    return;
  }
  redirect(res, googleAuthorizeUrl(session, callbackUri(run.origin), session.state));
};

const handleCallback = async (url: URL, res: ServerResponse, run: ConsentRun): Promise<void> => {
  const session = run.getSession();
  if (!session || url.searchParams.get('state') !== session.state) {
    sendHtml(res, HTTP_BAD_REQUEST, errorPage('Invalid consent state. Retry setup.'));
    return;
  }
  const code = url.searchParams.get('code');
  if (!code) {
    sendHtml(res, HTTP_BAD_REQUEST, errorPage('Google did not return a code.'));
    return;
  }
  const refreshToken = await exchangeGoogleCode(session, callbackUri(run.origin), code);
  sendHtml(res, HTTP_OK, successPage());
  run.finish({ clientId: session.clientId, clientSecret: session.clientSecret, refreshToken });
};

const closeServer =
  (server: Server): (() => Promise<void>) =>
  () => {
    const wait = deferred<void>();
    server.close((error) => {
      if (error) {
        wait.reject(error);
        return;
      }
      wait.resolve();
    });
    return wait.promise;
  };

const listenLoopback = (): Promise<ConsentListener> => {
  const server = createServer();
  const wait = deferred<ConsentListener>();
  server.once('error', wait.reject);
  server.listen(0, '127.0.0.1', () => {
    const address = server.address();
    if (address === null || typeof address === 'string') {
      wait.reject(new Error('Consent server did not bind a TCP port.'));
      return;
    }
    wait.resolve({ server, origin: `http://127.0.0.1:${String(address.port)}`, close: closeServer(server) });
  });
  return wait.promise;
};

const routeConsent = (req: IncomingMessage, res: ServerResponse, run: ConsentRun): Promise<void> => {
  const url = new URL(req.url ?? '/', run.origin);
  if (req.method === 'GET' && url.pathname === '/setup') {
    handleSetupGet(res, run.seed);
    return Promise.resolve();
  }
  if (req.method === 'POST' && url.pathname === '/setup') {
    return handleSetupPost(req, res, run);
  }
  if (req.method === 'GET' && url.pathname === '/start') {
    handleStart(res, run);
    return Promise.resolve();
  }
  if (req.method === 'GET' && url.pathname === '/oauth2callback') {
    return handleCallback(url, res, run);
  }
  sendHtml(res, HTTP_BAD_REQUEST, errorPage('Unknown setup path.'));
  return Promise.resolve();
};

const attachConsentHandler = (listener: ConsentListener, run: ConsentRun): void => {
  listener.server.on('request', (req, res) => {
    if (!originOk(req, listener.origin)) {
      sendHtml(res, HTTP_BAD_REQUEST, errorPage('Rejected host.'));
      return;
    }
    routeConsent(req, res, run).catch((error: unknown) => {
      const message = error instanceof Error ? error.message : 'Setup failed.';
      sendHtml(res, HTTP_BAD_REQUEST, errorPage(message));
    });
  });
};

const openConsentPage = (url: string): void => {
  console.error(`Open ${url} to finish Google setup.`);
  open(url, { wait: false }).catch((error: unknown) => {
    console.error('Could not open a browser.', error);
  });
};

const seedSession = (seed: PartialGoogleCredential): ConsentSession | undefined => {
  if (!seed.clientId || !seed.clientSecret) {
    return undefined;
  }
  return newSession({ clientId: seed.clientId, clientSecret: seed.clientSecret });
};

const logCloseError = (error: unknown): void => {
  console.error('Could not close the consent server.', error);
};

export const runConsent = async (seed: PartialGoogleCredential): Promise<GoogleCredential> => {
  const listener = await listenLoopback();
  const wait = deferred<GoogleCredential>();
  let session = seedSession(seed);
  const run: ConsentRun = {
    origin: listener.origin,
    seed,
    getSession: () => session,
    setSession: (next) => {
      session = next;
    },
    finish: (credential) => {
      wait.resolve(credential);
      listener.close().catch(logCloseError);
    },
  };
  attachConsentHandler(listener, run);
  const startPath = session === undefined ? '/setup' : '/start';
  openConsentPage(`${listener.origin}${startPath}`);
  return wait.promise;
};
