import { z } from 'zod';

export type PartialGoogleCredential = {
  clientId?: string;
  clientSecret?: string;
  refreshToken?: string;
};

export type GoogleCredential = {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
};

export const GoogleCredentialSchema = z.object({
  clientId: z.string().min(1),
  clientSecret: z.string().min(1),
  refreshToken: z.string().min(1),
});

const emptyToUndefined = (value: string | undefined): string | undefined => {
  if (value === undefined || value === '') {
    return undefined;
  }
  return value;
};

export const isCompleteCredential = (value: PartialGoogleCredential): value is GoogleCredential =>
  Boolean(value.clientId && value.clientSecret && value.refreshToken);

export const parseCredential = (raw: string): GoogleCredential | undefined => {
  try {
    return GoogleCredentialSchema.parse(JSON.parse(raw));
  } catch {
    return undefined;
  }
};

export const readEnvCredential = (): PartialGoogleCredential => ({
  clientId: emptyToUndefined(process.env.GOOGLE_CLIENT_ID),
  clientSecret: emptyToUndefined(process.env.GOOGLE_CLIENT_SECRET),
  refreshToken: emptyToUndefined(process.env.GOOGLE_REFRESH_TOKEN),
});

export const mergeCredential = (stored: PartialGoogleCredential | undefined): PartialGoogleCredential => {
  const env = readEnvCredential();
  return {
    clientId: env.clientId ?? stored?.clientId,
    clientSecret: env.clientSecret ?? stored?.clientSecret,
    refreshToken: env.refreshToken ?? stored?.refreshToken,
  };
};

export const sameCredential = (left: GoogleCredential, right: GoogleCredential): boolean =>
  left.clientId === right.clientId &&
  left.clientSecret === right.clientSecret &&
  left.refreshToken === right.refreshToken;
