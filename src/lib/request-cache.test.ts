import test from "node:test";
import assert from "node:assert/strict";
import { createRequestCache } from "./request-cache.ts";
test("concurrent requests coalesce; failures remain retryable", async () => {
  const cached = createRequestCache();
  let calls = 0;
  const fetcher = async () => {
    calls++;
    return 42;
  };
  assert.deepEqual(
    await Promise.all([cached("a", 1000, fetcher), cached("a", 1000, fetcher)]),
    [42, 42],
  );
  await cached("a", 1000, fetcher);
  assert.equal(calls, 1);
  await assert.rejects(
    cached("b", 1000, async () => {
      throw new Error("down");
    }),
  );
  assert.equal(await cached("b", 1000, fetcher), 42);
  assert.equal(calls, 2);
});
