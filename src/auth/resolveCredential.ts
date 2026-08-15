import { runConsent } from './consentServer.js';
import { isCompleteCredential, mergeCredential, type GoogleCredential } from './credential.js';
import { readTokenStore, writeTokenStore } from './tokenStore.js';

export const resolveGoogleCredential = async (): Promise<GoogleCredential> => {
  const merged = mergeCredential(await readTokenStore());
  if (isCompleteCredential(merged)) {
    await writeTokenStore(merged);
    return merged;
  }
  const credential = await runConsent(merged);
  await writeTokenStore(credential);
  return credential;
};
