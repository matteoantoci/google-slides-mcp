import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import open from 'open';
import { HTTP_BAD_REQUEST, originOk, sendHtml } from './consentHttp.js';
import { errorPage } from './consentPages.js';
import {
  handleCallback,
  handleSetupGet,
  handleSetupPost,
  handleStart,
  newSession,
  type ConsentContext,
} from './consentRoutes.js';
import { deferred } from './deferred.js';
import type { GoogleCredential, PartialGoogleCredential } from './credential.js';

type ConsentListener = {
  server: Server;
  origin: string;
  close: () => Promise<void>;
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

const routeConsent = (req: IncomingMessage, res: ServerResponse, ctx: ConsentContext): Promise<void> => {
  const url = new URL(req.url ?? '/', ctx.origin);
  if (req.method === 'GET' && url.pathname === '/setup') {
    handleSetupGet(res, ctx.seed);
    return Promise.resolve();
  }
  if (req.method === 'POST' && url.pathname === '/setup') {
    return handleSetupPost(req, res, ctx);
  }
  if (req.method === 'GET' && url.pathname === '/start') {
    handleStart(res, ctx);
    return Promise.resolve();
  }
  if (req.method === 'GET' && url.pathname === '/oauth2callback') {
    return handleCallback(url, res, ctx);
  }
  sendHtml(res, HTTP_BAD_REQUEST, errorPage('Unknown setup path.'));
  return Promise.resolve();
};

const attachConsentHandler = (listener: ConsentListener, ctx: ConsentContext): void => {
  listener.server.on('request', (req, res) => {
    if (!originOk(req, listener.origin)) {
      sendHtml(res, HTTP_BAD_REQUEST, errorPage('Rejected host.'));
      return;
    }
    routeConsent(req, res, ctx).catch((error: unknown) => {
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

const seedSession = (seed: PartialGoogleCredential): ConsentContext['session'] => {
  if (!seed.clientId || !seed.clientSecret) {
    return undefined;
  }
  return newSession({ clientId: seed.clientId, clientSecret: seed.clientSecret });
};

export const runConsent = async (seed: PartialGoogleCredential): Promise<GoogleCredential> => {
  const listener = await listenLoopback();
  const wait = deferred<GoogleCredential>();
  const ctx: ConsentContext = {
    origin: listener.origin,
    seed,
    session: seedSession(seed),
    setSession: (session) => {
      ctx.session = session;
    },
    finish: (credential) => {
      listener.close().then(() => {
        wait.resolve(credential);
      }, wait.reject);
    },
  };
  attachConsentHandler(listener, ctx);
  const startPath = ctx.session === undefined ? '/setup' : '/start';
  openConsentPage(`${listener.origin}${startPath}`);
  return wait.promise;
};
