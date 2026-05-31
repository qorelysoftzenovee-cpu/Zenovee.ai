import { z } from "zod";
import { runAIStructuredWithSchema } from "@/services/ai";
import type { AIGenerateStructuredResult } from "@/services/ai/types";
import { DEFAULT_HEAVY_MODEL, DEFAULT_LIGHT_MODEL, getModelExecutionConfig, getPreferredModelForOutputLength, type AIModel } from "@/services/ai/models";
import {
  type GenerationExecutionOptions,
  type GenerationMode,
  getToolPromptProfile,
  parseToolPromptAdminOverrides,
  resolvePromptControls,
  type ResolvedPromptControls,
  type ToolPromptAdminOverrides,
} from "@/services/ai/prompt-system";
import type { ToolDefinition } from "@/types/tools";

type ValidationContext = {
  input: Record<string, unknown>;
  controls: ResolvedPromptControls;
  mode: GenerationMode;
};

type GenerationMeta = {
  promptVersion: string;
  attempts: number;
  qualityScore: number;
  validationIssues: string[];
  modelReason: string;
  controls: ResolvedPromptControls;
  mode: GenerationMode;
  outputSections: string[];
};

export class AIGenerationError extends Error {
  code: "TIMEOUT" | "EMPTY_RESPONSE" | "MALFORMED_RESPONSE" | "VALIDATION_FAILED" | "RATE_LIMIT" | "API_ERROR";
  retryable: boolean;
  status: number;
  details?: Record<string, unknown>;

  constructor(
    message: string,
    options: {
      code: AIGenerationError["code"];
      retryable: boolean;
      status?: number;
      details?: Record<string, unknown>;
    }
  ) {
    super(message);
    this.name = "AIGenerationError";
    this.code = options.code;
    this.retryable = options.retryable;
    this.status = options.status ?? 502;
    this.details = options.details;
  }
}

function wordCount(value: unknown) {
  return String(value ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function stringArrayLength(value: unknown) {
  return Array.isArray(value) ? value.filter((item) => String(item ?? "").trim().length > 0).length : 0;
}

function objectArrayLength(value: unknown) {
  return Array.isArray(value) ? value.filter((item) => item && typeof item === "object").length : 0;
}

function getMinWordsFromLength(length: ResolvedPromptControls["outputLength"], map: Record<ResolvedPromptControls["outputLength"], number>) {
  return map[length] ?? map.medium;
}

function validateOutput(toolId: string, output: Record<string, unknown>, context: ValidationContext) {
  const issues: string[] = [];

  switch (toolId) {
    case "seo-article-generator": {
      if (wordCount(output.fullArticle) < getMinWordsFromLength(context.controls.outputLength, { short: 700, medium: 1200, long: 1800 })) {
        issues.push("The full article is not detailed enough for the requested output length.");
      }
      if (stringArrayLength(output.keywordClusters) < 4) issues.push("Add more keyword clusters.");
      if (stringArrayLength(output.articleOutline) < 6) issues.push("Add a more complete article outline.");
      if (objectArrayLength(output.faqSection) < 3) issues.push("Provide at least three FAQ items.");
      if (stringArrayLength(output.internalLinkSuggestions) < 3) issues.push("Provide more internal linking suggestions.");
      break;
    }
    case "ad-copy-generator": {
      if (stringArrayLength(output.angleExplanation) < 3) issues.push("Provide more strategic angle explanations.");
      break;
    }
    case "customer-persona-builder": {
      if (stringArrayLength(output.demographics) < 3) issues.push("Demographics need more depth.");
      if (stringArrayLength(output.painPoints) < 4) issues.push("Pain points need more specificity.");
      if (stringArrayLength(output.objections) < 3) issues.push("Add more realistic objections.");
      if (stringArrayLength(output.buyingTriggers) < 3) issues.push("Buying triggers need stronger detail.");
      break;
    }
    case "landing-page-copy-generator": {
      if (stringArrayLength(output.ctaButtons) < 2) issues.push("Include stronger CTA variations.");
      if (stringArrayLength(output.benefits) < 4) issues.push("Add a more complete benefit stack.");
      if (objectArrayLength(output.faq) < 3) issues.push("Add more FAQ coverage.");
      if (wordCount(output.finalCta) < 6) issues.push("The final CTA needs more persuasive detail.");
      break;
    }
    default: {
      if (wordCount(output.result) < getMinWordsFromLength(context.controls.outputLength, { short: 35, medium: 60, long: 90 })) {
        issues.push("The primary result is too thin for the selected output length.");
      }
      if (stringArrayLength(output.suggestions) < 3) issues.push("Provide at least three useful follow-up suggestions.");
      break;
    }
  }

  return issues;
}

function validateOutputByCategory(tool: ToolDefinition<Record<string, unknown>, Record<string, unknown>>, output: Record<string, unknown>, context: ValidationContext) {
  const issues: string[] = [];

  switch (tool.metadata.category) {
    case "Executive Branding": {
      if (wordCount(output.strategicHook) < 6) issues.push("Strategic hook needs more substance.");
      if (stringArrayLength(output.hookAnalysis) < 3) issues.push("Add more hook analysis detail.");
      if (stringArrayLength(output.storytellingStructure) < 3) issues.push("Storytelling structure needs more depth.");
      if (stringArrayLength(output.authorityAngles) < 3) issues.push("Provide more authority angles.");
      if (stringArrayLength(output.audiencePsychologyTriggers) < 3) issues.push("Audience psychology triggers need more specificity.");
      if (wordCount(output.finalDraft) < getMinWordsFromLength(context.controls.outputLength, { short: 80, medium: 140, long: 220 })) issues.push("Final draft is too thin for the selected output length.");
      break;
    }
    case "B2B Sales": {
      if (stringArrayLength(output.objectionHandlingFrames) < 3) issues.push("Add more objection-handling frames.");
      if (stringArrayLength(output.buyerPsychologyLevers) < 3) issues.push("Buyer psychology levers need more depth.");
      if (wordCount(output.concisePitch) < 20) issues.push("Concise pitch needs more substance.");
      if (stringArrayLength(output.enterpriseFraming) < 2) issues.push("Enterprise framing needs more detail.");
      if (stringArrayLength(output.conversionSequence) < 3) issues.push("Conversion sequence needs more progression.");
      break;
    }
    case "Conversion Copywriting": {
      if (objectArrayLength(output.frameworkBlocks) < 3) issues.push("Framework blocks need more complete structure.");
      if (stringArrayLength(output.emotionalTriggers) < 3) issues.push("Add more emotional triggers.");
      if (stringArrayLength(output.conversionAngles) < 3) issues.push("Add more conversion angles.");
      if (stringArrayLength(output.ctaHierarchy) < 2) issues.push("CTA hierarchy needs stronger progression.");
      if (stringArrayLength(output.scrollStoppingHooks) < 3) issues.push("Provide more scroll-stopping hooks.");
      if (wordCount(output.finalCopy) < getMinWordsFromLength(context.controls.outputLength, { short: 90, medium: 160, long: 260 })) issues.push("Final copy is too short for the requested output length.");
      break;
    }
    case "SEO & Authority": {
      if (stringArrayLength(output.intentAnalysis) < 3) issues.push("Intent analysis needs more depth.");
      if (objectArrayLength(output.semanticClusters) < 3) issues.push("Provide more semantic clusters.");
      if (stringArrayLength(output.topicalAuthorityMap) < 3) issues.push("Topical authority map needs more coverage.");
      if (objectArrayLength(output.faqBlocks) < 3) issues.push("Provide at least three FAQ blocks.");
      if (stringArrayLength(output.internalLinkingPlan) < 3) issues.push("Internal linking plan needs more detail.");
      if (stringArrayLength(output.contentStructure) < 4) issues.push("Content structure needs more completeness.");
      break;
    }
    case "Premium Image/Brand Assets": {
      if (wordCount(output.masterPrompt) < 25) issues.push("Master prompt needs more visual specificity.");
      if (stringArrayLength(output.compositionInstructions) < 3) issues.push("Add more composition instructions.");
      if (stringArrayLength(output.lightingInstructions) < 2) issues.push("Lighting instructions need more detail.");
      if (stringArrayLength(output.cameraStyleDirection) < 2) issues.push("Camera style direction needs more detail.");
      if (stringArrayLength(output.premiumAestheticRules) < 3) issues.push("Premium aesthetic rules need stronger coverage.");
      if (stringArrayLength(output.variations) < 3) issues.push("Add more useful visual variations.");
      break;
    }
    case "Browser Tools": {
      if (wordCount(output.result) < getMinWordsFromLength(context.controls.outputLength, { short: 25, medium: 45, long: 70 })) issues.push("The browser-tool result is too thin for the selected output length.");
      if (stringArrayLength(output.suggestions) < 2) issues.push("Provide more useful follow-up suggestions.");
      break;
    }
    default:
      return validateOutput(tool.id, output, context);
  }

  return issues;
}

function mapModeInstruction(mode: GenerationMode) {
  switch (mode) {
    case "regenerate":
      return "Generate a materially different variation while preserving the requested output structure and quality level.";
    case "improve":
      return "Improve the existing output by making it sharper, more complete, more premium, and more publish-ready.";
    case "shorten":
      return "Compress the output while preserving the strongest points, clarity, and usefulness.";
    case "expand":
      return "Expand the output with more depth, more specificity, and stronger supporting details.";
    default:
      return "Generate the best possible first-pass output.";
  }
}

function resolveModelConfiguration(tool: ToolDefinition, controls: ResolvedPromptControls, adminOverrides?: ToolPromptAdminOverrides) {
  if (adminOverrides?.modelOverride) {
    const config = getModelExecutionConfig(adminOverrides.modelOverride, {
      isLong: controls.outputLength === "long",
    });

    return {
      model: adminOverrides.modelOverride,
      temperature: 0.4,
      maxTokens: config.maxTokens,
      timeoutMs: config.timeoutMs,
      reason: "Admin override applied.",
    };
  }

  const isLong = controls.outputLength === "long";
  const model: AIModel = getPreferredModelForOutputLength({
    usageClass: tool.usageClass,
    outputLength: controls.outputLength,
  });
  const config = getModelExecutionConfig(model, { isLong });

  return {
    model,
    temperature: controls.outputLength === "short" ? 0.35 : config.temperature,
    maxTokens: config.maxTokens,
    timeoutMs: config.timeoutMs,
    reason:
      model === DEFAULT_HEAVY_MODEL
        ? "Using the strongest Groq model for long-form or high-complexity output quality."
        : "Using a lightweight Groq model for fast, concise generations.",
  };
}

function buildPromptBundle(params: {
  tool: ToolDefinition<Record<string, unknown>, Record<string, unknown>>;
  input: Record<string, unknown>;
  options: GenerationExecutionOptions;
  adminOverrides?: ToolPromptAdminOverrides;
  repairHint?: string;
}) {
  const profile = getToolPromptProfile(params.tool.id, params.tool.metadata.category);
  const controls = resolvePromptControls(params.tool.id, params.options.controls, params.adminOverrides, params.tool.metadata.category);
  const systemPrompt = [
    profile?.systemPrompt ?? "You are Zenovee's premium AI generation engine.",
    `Objective: ${profile?.objective ?? "Produce structured, premium-quality output."}`,
    "You must return only valid JSON that matches the provided schema exactly.",
    "Do not include markdown, code fences, preambles, notes, or explanations outside the JSON response.",
    profile ? `Required sections: ${profile.outputSections.join(", ")}.` : "",
    profile ? `Formatting rules: ${profile.formattingRules.join(" ")}` : "",
    profile ? `Quality checklist: ${profile.qualityChecklist.join(" ")}` : "",
    `Mode instruction: ${mapModeInstruction(params.options.mode)}.`,
    params.adminOverrides?.systemPromptAppend ? `Additional admin system guidance: ${params.adminOverrides.systemPromptAppend}` : "",
  ].filter(Boolean).join("\n\n");

  const userPrompt = [
    profile?.userPrompt({
      input: params.input,
      controls,
      mode: params.options.mode,
      previousOutput: params.options.previousOutput,
      repairHint: params.repairHint,
    }) ?? `Input:\n${JSON.stringify(params.input, null, 2)}`,
    `Delivery settings:\n- Tone: ${controls.tone}\n- Writing style: ${controls.writingStyle}\n- Output length: ${controls.outputLength}\n- Language: ${controls.language}`,
    controls.customInstructions ? `Custom instructions: ${controls.customInstructions}` : "",
    params.adminOverrides?.userPromptAppend ? `Additional admin user guidance: ${params.adminOverrides.userPromptAppend}` : "",
    `JSON schema: ${JSON.stringify(z.toJSONSchema(params.tool.outputSchema))}`,
  ].filter(Boolean).join("\n\n");

  return {
    systemPrompt,
    userPrompt,
    controls,
    profile,
  };
}

function normalizeGenerationError(error: unknown, details?: Record<string, unknown>) {
  if (error instanceof AIGenerationError) return error;

  const message = error instanceof Error ? error.message : "AI generation failed.";
  const normalizedMessage = message.toLowerCase();

  if (normalizedMessage.includes("timed out")) {
    return new AIGenerationError("The AI model took too long to respond.", { code: "TIMEOUT", retryable: true, status: 504, details });
  }

  if (normalizedMessage.includes("empty content")) {
    return new AIGenerationError("The AI model returned an empty response.", { code: "EMPTY_RESPONSE", retryable: true, status: 502, details });
  }

  if (normalizedMessage.includes("non-json") || normalizedMessage.includes("invalid json")) {
    return new AIGenerationError("The AI model returned malformed structured output.", { code: "MALFORMED_RESPONSE", retryable: true, status: 502, details });
  }

  if (normalizedMessage.includes("429") || normalizedMessage.includes("rate limit")) {
    return new AIGenerationError("The AI provider rate-limited this request.", { code: "RATE_LIMIT", retryable: true, status: 429, details });
  }

  return new AIGenerationError(message || "AI generation failed.", { code: "API_ERROR", retryable: true, status: 502, details });
}

export function toClientErrorDetails(error: AIGenerationError) {
  const issues = error.details?.issues;

  return {
    title:
      error.code === "TIMEOUT"
        ? "Generation timed out"
        : error.code === "VALIDATION_FAILED"
          ? "Output quality check failed"
          : error.code === "RATE_LIMIT"
            ? "Provider temporarily busy"
            : "Generation failed",
    description: error.message,
    retryable: error.retryable,
    issues: Array.isArray(issues) ? issues : [],
  };
}

export function buildToolPromptPreview(params: {
  tool: ToolDefinition<Record<string, unknown>, Record<string, unknown>>;
  input: Record<string, unknown>;
  options: GenerationExecutionOptions;
  adminOverrides?: unknown;
}) {
  const bundle = buildPromptBundle({
    tool: params.tool,
    input: params.input,
    options: params.options,
    adminOverrides: parseToolPromptAdminOverrides(params.adminOverrides),
  });

  return `${bundle.systemPrompt}\n\n${bundle.userPrompt}`;
}

export async function generateToolOutput(params: {
  tool: ToolDefinition<Record<string, unknown>, Record<string, unknown>>;
  input: Record<string, unknown>;
  options: GenerationExecutionOptions;
  adminOverrides?: unknown;
}) {
  const adminOverrides = parseToolPromptAdminOverrides(params.adminOverrides);
  const retries = adminOverrides.maxValidationRetries ?? 2;
  const modelConfig = resolveModelConfiguration(
    params.tool,
    resolvePromptControls(params.tool.id, params.options.controls, adminOverrides, params.tool.metadata.category),
    adminOverrides
  );

  let lastIssues: string[] = [];
  let lastError: unknown;

  for (let attempt = 1; attempt <= retries + 1; attempt += 1) {
    const repairHint = lastIssues.length
      ? `Previous attempt failed quality checks. Fix these issues explicitly: ${lastIssues.join(" ")}`
      : undefined;

    const bundle = buildPromptBundle({
      tool: params.tool,
      input: params.input,
      options: params.options,
      adminOverrides,
      repairHint,
    });

    try {
      const aiResponse = await runAIStructuredWithSchema({
        schema: params.tool.outputSchema,
        model: modelConfig.model,
        systemPrompt: bundle.systemPrompt,
        prompt: bundle.userPrompt,
        temperature: modelConfig.temperature,
        maxTokens: modelConfig.maxTokens,
        timeoutMs: modelConfig.timeoutMs,
      }) as AIGenerateStructuredResult<Record<string, unknown>>;

      const validationIssues = validateOutputByCategory(params.tool, aiResponse.data, {
        input: params.input,
        controls: bundle.controls,
        mode: params.options.mode,
      });

      if (validationIssues.length > 0) {
        lastIssues = validationIssues;
        lastError = new AIGenerationError("The AI output did not meet Zenovee's quality checks.", {
          code: "VALIDATION_FAILED",
          retryable: attempt <= retries,
          status: 502,
          details: { issues: validationIssues, attempt },
        });

        if (attempt <= retries) continue;
        throw lastError;
      }

      const meta: GenerationMeta = {
        promptVersion: bundle.profile?.version ?? `${params.tool.id}@1`,
        attempts: attempt,
        qualityScore: Math.max(80, 100 - validationIssues.length * 5 - (attempt - 1) * 2),
        validationIssues,
        modelReason: modelConfig.reason,
        controls: bundle.controls,
        mode: params.options.mode,
        outputSections: bundle.profile?.outputSections ?? [],
      };

      return { output: aiResponse.data, aiResponse, meta };
    } catch (error) {
      lastError = normalizeGenerationError(error, { issues: lastIssues, attempt });
      if (lastError instanceof AIGenerationError && (!lastError.retryable || attempt > retries)) {
        throw lastError;
      }
    }
  }

  throw normalizeGenerationError(lastError, { issues: lastIssues });
}