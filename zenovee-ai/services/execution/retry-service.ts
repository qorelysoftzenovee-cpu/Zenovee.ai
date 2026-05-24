export type RetryContext = {
  maxAttempts: number;
  baseDelayMs?: number;
  isRetryable?: (error: unknown) => boolean;
};

export type RetryResult<T> = {
  value: T;
  attempts: number;
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class RetryService {
  static async run<T>(task: (attempt: number) => Promise<T>, context: RetryContext): Promise<RetryResult<T>> {
    const maxAttempts = Math.max(1, context.maxAttempts);
    const baseDelayMs = Math.max(100, context.baseDelayMs ?? 350);
    let lastError: unknown;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        const value = await task(attempt);
        return { value, attempts: attempt };
      } catch (error) {
        lastError = error;
        const shouldRetry = attempt < maxAttempts && (context.isRetryable ? context.isRetryable(error) : false);
        if (!shouldRetry) break;
        await sleep(baseDelayMs * Math.pow(2, attempt - 1));
      }
    }

    throw lastError instanceof Error ? lastError : new Error("Execution failed after retries.");
  }
}
