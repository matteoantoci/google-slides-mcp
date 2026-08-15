import { runConsent } from './consent.js';
import { isCompleteCredential, mergeCredential, sameCredential, type GoogleCredential } from './credential.js';
import { readTokenStore, writeTokenStore } from './tokenStore.js';

const persistIfChanged = async (stored: GoogleCredential | undefined, next: GoogleCredential): Promise<void> => {
  if (stored && sameCredential(stored, next)) {
    return;
  }
  await writeTokenStore(next);
};

export const resolveGoogleCredential = async (): Promise<GoogleCredential> => {
  const stored = await readTokenStore();
  const merged = mergeCredential(stored);
  if (isCompleteCredential(merged)) {
    await persistIfChanged(stored, merged);
    return merged;
  }
  const credential = await runConsent(merged);
  await writeTokenStore(credential);
  return credential;
};
