export const GROQ_MODELS = ["llama-3.1-8b-instant", "llama-3.1-70b-versatile"] as const;

export type AIModel = (typeof GROQ_MODELS)[number];

export const DEFAULT_LIGHT_MODEL: AIModel = "llama-3.1-8b-instant";
export const DEFAULT_STANDARD_MODEL: AIModel = "llama-3.1-8b-instant";
export const DEFAULT_HEAVY_MODEL: AIModel = "llama-3.1-70b-versatile";

export function getDefaultModelForTier(tier: "light" | "premium"): AIModel {
  return tier === "premium" ? DEFAULT_HEAVY_MODEL : DEFAULT_LIGHT_MODEL;
}

export function getDefaultModelForUsageClass(usageClass: "standard" | "heavy" = "standard"): AIModel {
  return usageClass === "heavy" ? DEFAULT_HEAVY_MODEL : DEFAULT_STANDARD_MODEL;
}

export function getPreferredModelForOutputLength(params: {
  usageClass?: "standard" | "heavy";
  outputLength: "short" | "medium" | "long";
}): AIModel {
  if (params.outputLength === "long") return DEFAULT_HEAVY_MODEL;
  if (params.usageClass === "heavy") return DEFAULT_HEAVY_MODEL;
  return DEFAULT_STANDARD_MODEL;
}

export function getModelExecutionConfig(model: AIModel, options?: { isLong?: boolean }) {
  const isHeavyModel = model === DEFAULT_HEAVY_MODEL;

  return {
    temperature: options?.isLong ? 0.45 : model === DEFAULT_LIGHT_MODEL ? 0.35 : 0.45,
    maxTokens: isHeavyModel ? (options?.isLong ? 4200 : 2800) : 1600,
    timeoutMs: isHeavyModel ? 45_000 : 30_000,
    reason: isHeavyModel
      ? "Using the strongest Groq model for long-form or high-complexity output quality."
      : "Using the fast Groq model for concise and standard generations.",
  };
}