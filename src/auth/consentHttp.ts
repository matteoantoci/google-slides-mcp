import { deferred } from './deferred.js';
import type { IncomingMessage, ServerResponse } from 'node:http';

export const HTTP_OK = 200;
export const HTTP_BAD_REQUEST = 400;
export const HTTP_FOUND = 302;

export const sendHtml = (res: ServerResponse, status: number, body: string): void => {
  res.writeHead(status, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(body);
};

export const redirect = (res: ServerResponse, location: string): void => {
  res.writeHead(HTTP_FOUND, { Location: location });
  res.end();
};

export const readBody = (req: IncomingMessage): Promise<string> => {
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

export const originOk = (req: IncomingMessage, origin: string): boolean => {
  const host = req.headers.host;
  if (host !== new URL(origin).host) {
    return false;
  }
  const requestOrigin = req.headers.origin;
  return requestOrigin === undefined || requestOrigin === origin;
};
