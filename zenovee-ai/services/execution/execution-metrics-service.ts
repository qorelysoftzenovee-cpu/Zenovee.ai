export type ExecutionMetrics = {
  durationMs: number;
  retries: number;
  failures: number;
  model: string;
  creditsConsumed: number;
};

export class ExecutionMetricsService {
  static build(params: {
    startedAt: number;
    attempts: number;
    model: string;
    creditsConsumed: number;
    failed?: boolean;
  }): ExecutionMetrics {
    return {
      durationMs: Math.max(0, Date.now() - params.startedAt),
      retries: Math.max(0, params.attempts - 1),
      failures: params.failed ? 1 : 0,
      model: params.model,
      creditsConsumed: params.creditsConsumed,
    };
  }
}
