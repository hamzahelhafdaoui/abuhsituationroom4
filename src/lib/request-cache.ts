/** Coalesce simultaneous refreshes; failed requests are retryable and never cached. */
export function createRequestCache() {
  const values = new Map<string, { at: number; value: unknown }>();
  const pending = new Map<string, Promise<unknown>>();
  return function cached<T>(key: string, ttl: number, fetcher: () => Promise<T>): Promise<T> {
    const hit = values.get(key);
    if (hit && Date.now() - hit.at < ttl) return Promise.resolve(hit.value as T);
    const active = pending.get(key);
    if (active) return active as Promise<T>;
    const request = Promise.resolve()
      .then(fetcher)
      .then((value) => {
        values.set(key, { at: Date.now(), value });
        return value;
      })
      .finally(() => pending.delete(key));
    pending.set(key, request);
    return request;
  };
}
