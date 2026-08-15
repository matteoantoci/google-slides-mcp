const unusedResolve = (): undefined => undefined;
const unusedReject = (): undefined => undefined;

export type Deferred<T> = {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason?: unknown) => void;
};

export const deferred = <T>(): Deferred<T> => {
  let resolve: Deferred<T>['resolve'] = unusedResolve;
  let reject: Deferred<T>['reject'] = unusedReject;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};
