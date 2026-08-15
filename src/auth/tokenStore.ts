import { Entry } from '@napi-rs/keyring';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { parseCredential, type GoogleCredential } from './credential.js';

const SERVICE = 'google-slides-mcp';
const ACCOUNT = 'google-credential';

const fileStorePath = (): string =>
  join(process.env.XDG_CONFIG_HOME ?? join(homedir(), '.config'), SERVICE, 'credential.json');

const keychainEntry = (): Entry => new Entry(SERVICE, ACCOUNT);

const parseKeychainRaw = (raw: string | null): GoogleCredential | undefined => {
  if (!raw) {
    return undefined;
  }
  return parseCredential(raw);
};

const readKeychain = (): GoogleCredential | undefined => {
  try {
    return parseKeychainRaw(keychainEntry().getPassword());
  } catch {
    return undefined;
  }
};

const writeKeychain = (credential: GoogleCredential): boolean => {
  try {
    keychainEntry().setPassword(JSON.stringify(credential));
    return true;
  } catch {
    return false;
  }
};

const readFileStore = async (): Promise<GoogleCredential | undefined> => {
  try {
    return parseCredential(await readFile(fileStorePath(), 'utf8'));
  } catch {
    return undefined;
  }
};

const writeFileStore = async (credential: GoogleCredential): Promise<void> => {
  const path = fileStorePath();
  await mkdir(dirname(path), { recursive: true });
  const FILE_MODE = 0o600;
  await writeFile(path, `${JSON.stringify(credential, null, 2)}\n`, { mode: FILE_MODE });
};

const deleteFileStore = async (): Promise<void> => {
  await rm(fileStorePath(), { force: true });
};

export const readTokenStore = async (): Promise<GoogleCredential | undefined> =>
  readKeychain() ?? (await readFileStore());

export const writeTokenStore = async (credential: GoogleCredential): Promise<void> => {
  if (writeKeychain(credential)) {
    await deleteFileStore();
    return;
  }
  await writeFileStore(credential);
};
