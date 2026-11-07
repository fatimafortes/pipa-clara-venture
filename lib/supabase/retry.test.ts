import { describe, expect, it, vi } from "vitest";
import { retryOnFutureToken } from "./retry";

const futureToken = { data: null, error: { code: "PGRST303", message: "JWT issued at future" } };
const ok = { data: { id: "c1" }, error: null };

// A fake query: answers each call with the next result in the list
function fakeQuery(...results: { data: unknown; error: { code?: string } | null }[]) {
  const run = vi.fn();
  results.forEach((r) => run.mockResolvedValueOnce(r));
  return run;
}

describe("retryOnFutureToken", () => {
  it("fails once with PGRST303, then succeeds → returns the data, asked twice", async () => {
    const run = fakeQuery(futureToken, ok);
    expect(await retryOnFutureToken("test", run, 0)).toEqual(ok);
    expect(run).toHaveBeenCalledTimes(2);
  });

  it("fails twice with PGRST303 → gives up and returns the error, never a third try", async () => {
    const run = fakeQuery(futureToken, futureToken, ok);
    expect(await retryOnFutureToken("test", run, 0)).toEqual(futureToken);
    expect(run).toHaveBeenCalledTimes(2);
  });

  it("a normal answer is asked only once", async () => {
    const run = fakeQuery(ok);
    expect(await retryOnFutureToken("test", run, 0)).toEqual(ok);
    expect(run).toHaveBeenCalledTimes(1);
  });

  it("any other error is not retried (e.g. permission denied)", async () => {
    const denied = { data: null, error: { code: "42501" } };
    const run = fakeQuery(denied, ok);
    expect(await retryOnFutureToken("test", run, 0)).toEqual(denied);
    expect(run).toHaveBeenCalledTimes(1);
  });

  it("waits before the second try", async () => {
    vi.useFakeTimers();
    const run = fakeQuery(futureToken, ok);
    const result = retryOnFutureToken("test", run);
    await vi.advanceTimersByTimeAsync(999);
    expect(run).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(await result).toEqual(ok);
    expect(run).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });
});
