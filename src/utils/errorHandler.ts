import { ProtocolError, ProtocolErrorCode } from '@modelcontextprotocol/server';

const readMessage = (value: unknown): string | undefined => {
  if (typeof value !== 'object' || value === null || !('message' in value)) {
    return undefined;
  }
  if (typeof value.message !== 'string') {
    return undefined;
  }
  return value.message;
};

const readNested = (value: unknown, key: string): unknown => {
  if (typeof value !== 'object' || value === null) {
    return undefined;
  }
  return Reflect.get(value, key);
};

const googleApiMessage = (err: unknown): string | undefined => {
  const response = readNested(err, 'response');
  const data = readNested(response, 'data');
  const error = readNested(data, 'error');
  return readMessage(error);
};

const extractRawErrorMessage = (err: unknown): string =>
  googleApiMessage(err) ?? readMessage(err) ?? (typeof err === 'string' ? err : 'Unknown Google API error');

export const handleGoogleApiError = (error: unknown, toolName: string): ProtocolError => {
  const finalErrorMessage = `Google API Error in ${toolName}: ${extractRawErrorMessage(error)}`;
  console.error(`Google API Error (${toolName}):`, error);
  return new ProtocolError(ProtocolErrorCode.InternalError, finalErrorMessage);
};
