"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  Clock3,
  Copy,
  Download,
  FolderKanban,
  History,
  Loader2,
  Palette,
  Pin,
  RefreshCcw,
  Search,
  Sparkles,
  Star,
  Target,
  CalendarDays,
  Wand2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

type ToolOutputType = "article" | "ad-copy" | "persona" | "landing-page" | "text" | "image";
type ExportFormat = "txt" | "md" | "pdf" | "json" | "png";
type OutputLength = "short" | "medium" | "long";
type GenerationMode = "generate" | "regenerate" | "improve" | "shorten" | "expand";

type GenerationControls = {
  tone: string;
  writingStyle: string;
  outputLength: OutputLength;
  language: string;
  customInstructions?: string;
};

type PromptControlCatalog = {
  tones: string[];
  writingStyles: string[];
  languages: string[];
  outputLengths: OutputLength[];
  supportedModes: GenerationMode[];
  defaults: Omit<GenerationControls, "customInstructions">;
  customInstructionsEnabled: boolean;
};

type GenerationMeta = {
  promptVersion: string;
  attempts: number;
  qualityScore: number;
  validationIssues: string[];
  modelReason: string;
  controls: GenerationControls;
  mode: GenerationMode;
  outputSections: string[];
};

type GenerationErrorDetails = {
  title?: string;
  description?: string;
  retryable?: boolean;
  issues?: string[];
};

type ToolField = {
  name: string;
  label: string;
  type: "textarea" | "text" | "select" | "number" | "file";
  placeholder?: string;
  helperText?: string;
  required?: boolean;
  options?: Array<{ label: string; value: string }>;
};

type ToolPreset = {
  label: string;
  description?: string;
  values: Record<string, string>;
};

type ToolExample = {
  title: string;
  description: string;
};

type ToolItem = {
  id: string;
  metadata: {
    name: string;
    description: string;
    category: string;
    icon: string;
    tagline?: string;
    estimatedTimeSeconds?: number;
    outputType?: ToolOutputType;
    tags?: string[];
    featured?: boolean;
    trending?: boolean;
    availability?: "active" | "coming_soon";
    disabledReason?: string;
  };
  creditCost: number;
  fields: ToolField[];
  examples: ToolExample[];
  presets: ToolPreset[];
  exportFormats?: ExportFormat[];
  generationControls?: PromptControlCatalog | null;
};

type WorkspaceModuleItem = {
  id: string;
  name: string;
  description: string;
  toolId?: string;
  availability?: "active" | "coming_soon";
  workflowStage?: "planning" | "generation" | "optimization" | "distribution";
  outputLabel?: string;
  tool?: ToolItem | null;
};

type WorkspaceItem = {
  id: string;
  name: string;
  tagline: string;
  description: string;
  icon: string;
  audiencePresets: string[];
  tonePresets: string[];
  templatePresets: string[];
  modules: WorkspaceModuleItem[];
};

type ExportRecord = {
  id: string;
  tool_usage_id: string | null;
  storage_path: string | null;
  file_type: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

type UsageHistoryItem = {
  id: string;
  tool_id: string;
  tool_name: string;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  credits_consumed: number;
  created_at: string;
  exports: ExportRecord[];
};

const FAVORITE_TOOLS_STORAGE_KEY = "zenovee_workspace_favorite_tools";
const SAVED_OUTPUTS_STORAGE_KEY = "zenovee_workspace_saved_outputs";
const OUTPUT_NAMES_STORAGE_KEY = "zenovee_workspace_output_names";
const MODULE_DRAFTS_STORAGE_KEY = "zenovee_workspace_module_drafts";
const WORKSPACE_PROJECTS_STORAGE_KEY = "zenovee_workspace_projects";
const WORKSPACE_FOLDERS_STORAGE_KEY = "zenovee_workspace_folders";
const WORKSPACE_FAVORITES_STORAGE_KEY = "zenovee_workspace_favorites";
const WORKSPACE_RECENT_STORAGE_KEY = "zenovee_workspace_recent";

type WorkspaceProject = { id: string; workspaceId: string; name: string; updatedAt: string };
type WorkspaceFolder = { id: string; workspaceId: string; name: string; updatedAt: string };
type EditableSection = { id: string; title: string; content: string; pinned?: boolean };

function formatGlobalDateTime(dateValue: string) {
  return new Date(dateValue).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatEta(seconds?: number) {
  if (!seconds) return "~1 min";
  if (seconds < 60) return `~${seconds}s`;
  return `~${Math.round(seconds / 60)} min`;
}

function toReadableValue(value: unknown, depth = 0): string {
  const pad = "  ".repeat(depth);
  if (value == null) return "";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map((item) => `${pad}- ${toReadableValue(item, depth + 1).trimStart()}`).join("\n");
  return Object.entries(value as Record<string, unknown>)
    .map(([key, nested]) => `${pad}${key.replace(/([a-z])([A-Z])/g, "$1 $2")}:\n${toReadableValue(nested, depth + 1)}`)
    .join("\n");
}

function getGenerationSteps(outputType?: ToolOutputType) {
  switch (outputType) {
    case "article":
      return ["Analyzing keyword intent", "Building structure and clusters", "Writing rich article sections", "Formatting export-ready output"];
    case "ad-copy":
      return ["Mapping campaign angles", "Generating hooks and headlines", "Creating CTA variations", "Packaging ad cards"];
    case "persona":
      return ["Extracting audience signals", "Mapping pains and motivations", "Building persona layers", "Preparing messaging insights"];
    case "landing-page":
      return ["Framing conversion narrative", "Writing page sections", "Refining benefits and FAQs", "Preparing page preview layout"];
    default:
      return ["Understanding context", "Generating output", "Refining structure", "Preparing final result"];
  }
}

function readArrayFromStorage(key: string) {
  if (typeof window === "undefined") return [] as string[];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function writeArrayToStorage(key: string, value: string[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // noop
  }
}

function readRecordFromStorage(key: string) {
  if (typeof window === "undefined") return {} as Record<string, string>;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return Object.fromEntries(
      Object.entries(parsed).filter((entry): entry is [string, string] => typeof entry[0] === "string" && typeof entry[1] === "string")
    );
  } catch {
    return {};
  }
}

function writeRecordToStorage(key: string, value: Record<string, string>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // noop
  }
}

function getDefaultGenerationControls(tool?: ToolItem | null): GenerationControls {
  const defaults = tool?.generationControls?.defaults;
  return {
    tone: defaults?.tone ?? "Professional",
    writingStyle: defaults?.writingStyle ?? "Publish-ready",
    outputLength: defaults?.outputLength ?? "medium",
    language: defaults?.language ?? "English",
    customInstructions: "",
  };
}

function asStringArray(value: unknown) {
  return Array.isArray(value) ? value.map((item) => String(item)) : [];
}

function asFaqArray(value: unknown) {
  return Array.isArray(value)
    ? value
        .map((item) => {
          if (!item || typeof item !== "object") return null;
          const question = String((item as { question?: unknown }).question ?? "");
          const answer = String((item as { answer?: unknown }).answer ?? "");
          return question || answer ? { question, answer } : null;
        })
        .filter((item): item is { question: string; answer: string } => Boolean(item))
    : [];
}

function buildExportRequestKey(toolUsageId: string, format: ExportFormat) {
  return `${toolUsageId}:${format}`;
}

function buildEditableSections(result: Record<string, unknown> | null, previewText: string): EditableSection[] {
  if (!result) return [];
  const sections: EditableSection[] = Object.entries(result)
    .map(([key, value], index) => ({
      id: `${key}-${index}`,
      title: key.replace(/([a-z])([A-Z])/g, "$1 $2"),
      content: toReadableValue(value),
      pinned: index === 0,
    }))
    .filter((item) => item.content.trim().length > 0)
    .slice(0, 10);
  return sections.length ? sections : [{ id: "full", title: "Full Output", content: previewText, pinned: true }];
}

function OutputWorkspace({
  result,
  outputType,
  previewText,
}: {
  result: Record<string, unknown>;
  outputType?: ToolOutputType;
  previewText: string;
}) {
  if (outputType === "article") {
    const title = String(result.seoTitle ?? "SEO Article Draft");
    const metaDescription = String(result.metaDescription ?? "");
    const searchIntent = String(result.searchIntent ?? "");
    const keywordClusters = asStringArray(result.keywordClusters);
    const outline = asStringArray(result.articleOutline);
    const articleParagraphs = String(result.fullArticle ?? "")
      .split(/\n{2,}/)
      .map((item) => item.trim())
      .filter(Boolean);
    const faqs = asFaqArray(result.faqSection);
    const links = asStringArray(result.internalLinkSuggestions);

    return (
      <div className="space-y-5 animate-enter">
        <div className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-6">
          <p className="premium-label">SEO article output</p>
          <h3 className="mt-4 text-2xl font-semibold tracking-tight">{title}</h3>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">{metaDescription}</p>
          {searchIntent ? <p className="mt-4 text-sm text-foreground"><span className="font-medium">Search intent:</span> {searchIntent}</p> : null}
        </div>

        {keywordClusters.length ? (
          <div className="rounded-3xl border border-white/10 p-5">
            <p className="text-sm font-medium">Keyword clusters</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {keywordClusters.map((item) => (
                <span key={item} className="rounded-full border border-white/10 px-3 py-1 text-xs text-muted-foreground">
                  {item}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        <div className="grid gap-5 xl:grid-cols-[0.78fr_1.22fr]">
          {outline.length ? (
            <div className="rounded-3xl border border-white/10 p-5">
              <p className="text-sm font-medium">Article outline</p>
              <div className="mt-4 space-y-3">
                {outline.map((item, index) => (
                  <div key={`${item}-${index}`} className="rounded-2xl border border-white/8 bg-white/[0.03] p-3 text-sm text-muted-foreground">
                    <span className="mr-2 font-medium text-foreground">{index + 1}.</span>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <article className="rounded-3xl border border-white/10 p-5">
            <p className="text-sm font-medium">Formatted draft</p>
            <div className="prose prose-invert mt-4 max-w-none space-y-4 text-sm leading-7 text-muted-foreground">
              {articleParagraphs.length
                ? articleParagraphs.map((paragraph, index) => <p key={`${paragraph.slice(0, 20)}-${index}`}>{paragraph}</p>)
                : <pre className="whitespace-pre-wrap text-xs">{previewText}</pre>}
            </div>
          </article>
        </div>

        {faqs.length ? (
          <div className="rounded-3xl border border-white/10 p-5">
            <p className="text-sm font-medium">FAQ section</p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {faqs.map((faq) => (
                <div key={faq.question} className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                  <p className="font-medium text-foreground">{faq.question}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {links.length ? (
          <div className="rounded-3xl border border-white/10 p-5">
            <p className="text-sm font-medium">Internal link suggestions</p>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              {links.map((item) => (
                <li key={item} className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">{item}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    );
  }

  if (outputType === "ad-copy") {
    const headlines = asStringArray(result.headlines);
    const primaryTexts = asStringArray(result.primaryTexts);
    const ctas = asStringArray(result.ctaOptions);
    const angles = asStringArray(result.angleExplanation);
    const variations = Array.isArray(result.adVariations) ? result.adVariations : [];

    return (
      <div className="space-y-5 animate-enter">
        <div className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-6">
          <p className="premium-label">Ad campaign pack</p>
          <h3 className="mt-4 text-2xl font-semibold tracking-tight">High-converting copy variations ready for launch</h3>
          <p className="mt-3 text-sm text-muted-foreground">Structured headlines, body copy, CTAs, and creative angles grouped into a more premium presentation.</p>
        </div>

        {headlines.length ? (
          <div className="rounded-3xl border border-white/10 p-5">
            <p className="text-sm font-medium">Headline bank</p>
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {headlines.map((item) => (
                <div key={item} className="rounded-2xl border border-white/8 bg-white/[0.03] p-4 text-sm text-foreground">{item}</div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="grid gap-5 xl:grid-cols-[1fr_0.88fr]">
          <div className="rounded-3xl border border-white/10 p-5">
            <p className="text-sm font-medium">Primary texts</p>
            <div className="mt-4 space-y-3">
              {primaryTexts.map((item) => (
                <div key={item} className="rounded-2xl border border-white/8 bg-white/[0.03] p-4 text-sm leading-6 text-muted-foreground">
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-5">
            {ctas.length ? (
              <div className="rounded-3xl border border-white/10 p-5">
                <p className="text-sm font-medium">CTA options</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {ctas.map((item) => (
                    <span key={item} className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-muted-foreground">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            {angles.length ? (
              <div className="rounded-3xl border border-white/10 p-5">
                <p className="text-sm font-medium">Angle strategy</p>
                <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                  {angles.map((item) => (
                    <li key={item} className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">{item}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </div>

        {variations.length ? (
          <div className="rounded-3xl border border-white/10 p-5">
            <p className="text-sm font-medium">Creative-ready ad variations</p>
            <div className="mt-4 grid gap-4 xl:grid-cols-3">
              {variations.map((variation, index) => {
                const headline = String((variation as { headline?: unknown }).headline ?? "");
                const body = String((variation as { body?: unknown }).body ?? "");
                const cta = String((variation as { cta?: unknown }).cta ?? "");
                return (
                  <div key={`${headline}-${index}`} className="rounded-[26px] border border-white/8 bg-white/[0.03] p-5">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Variation {index + 1}</p>
                    <p className="mt-4 text-lg font-semibold text-foreground">{headline}</p>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">{body}</p>
                    <div className="mt-4 inline-flex rounded-full bg-primary/15 px-3 py-1 text-xs font-medium text-primary">{cta}</div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  if (outputType === "persona") {
    const buyerPersona = String(result.buyerPersona ?? "Buyer persona");
    const sections = [
      ["Demographics", asStringArray(result.demographics)],
      ["Pain points", asStringArray(result.painPoints)],
      ["Goals", asStringArray(result.goals)],
      ["Objections", asStringArray(result.objections)],
      ["Buying triggers", asStringArray(result.buyingTriggers)],
      ["Content ideas", asStringArray(result.contentIdeas)],
      ["Messaging angles", asStringArray(result.messagingAngles)],
    ] as const;

    return (
      <div className="space-y-5 animate-enter">
        <div className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-6">
          <p className="premium-label">Persona intelligence</p>
          <h3 className="mt-4 text-2xl font-semibold tracking-tight">{buyerPersona}</h3>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Use this profile to sharpen positioning, align campaign messaging, and structure conversion assets around real buyer motivations.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sections.map(([label, items]) => (
            <div key={label} className="rounded-[26px] border border-white/10 p-5">
              <p className="text-sm font-medium text-foreground">{label}</p>
              <div className="mt-4 space-y-2">
                {items.map((item) => (
                  <div key={item} className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-muted-foreground">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (outputType === "landing-page") {
    const ctas = asStringArray(result.ctaButtons);
    const problemSection = asStringArray(result.problemSection);
    const solutionSection = asStringArray(result.solutionSection);
    const benefits = asStringArray(result.benefits);
    const testimonialSuggestions = asStringArray(result.testimonialsSuggestions);
    const faq = asFaqArray(result.faq);

    return (
      <div className="space-y-5 animate-enter">
        <div className="overflow-hidden rounded-[32px] border border-white/10 bg-[linear-gradient(145deg,#0b1020_0%,#10182d_60%,#0a1224_100%)] p-6 text-white">
          <p className="premium-label border-white/15 bg-white/5 text-white/75">Landing page preview</p>
          <h3 className="mt-4 text-3xl font-semibold tracking-tight">{String(result.heroHeadline ?? "Conversion headline")}</h3>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/70">{String(result.subheadline ?? "")}</p>
          <div className="mt-5 flex flex-wrap gap-3">
            {ctas.map((cta) => (
              <span key={cta} className="rounded-full bg-white px-4 py-2 text-xs font-medium text-slate-900">{cta}</span>
            ))}
          </div>
        </div>

        <div className="grid gap-5 xl:grid-cols-2">
          <div className="rounded-3xl border border-white/10 p-5">
            <p className="text-sm font-medium">Problem narrative</p>
            <div className="mt-4 space-y-3">
              {problemSection.map((item) => (
                <div key={item} className="rounded-2xl border border-white/8 bg-white/[0.03] p-4 text-sm text-muted-foreground">{item}</div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 p-5">
            <p className="text-sm font-medium">Solution narrative</p>
            <div className="mt-4 space-y-3">
              {solutionSection.map((item) => (
                <div key={item} className="rounded-2xl border border-white/8 bg-white/[0.03] p-4 text-sm text-muted-foreground">{item}</div>
              ))}
            </div>
          </div>
        </div>

        {benefits.length ? (
          <div className="rounded-3xl border border-white/10 p-5">
            <p className="text-sm font-medium">Benefit stack</p>
            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {benefits.map((item) => (
                <div key={item} className="rounded-[24px] border border-white/8 bg-white/[0.03] p-5 text-sm text-muted-foreground">
                  {item}
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
          {testimonialSuggestions.length ? (
            <div className="rounded-3xl border border-white/10 p-5">
              <p className="text-sm font-medium">Testimonial prompts</p>
              <div className="mt-4 space-y-3">
                {testimonialSuggestions.map((item) => (
                  <div key={item} className="rounded-2xl border border-white/8 bg-white/[0.03] p-4 text-sm text-muted-foreground">{item}</div>
                ))}
              </div>
            </div>
          ) : null}

          {faq.length ? (
            <div className="rounded-3xl border border-white/10 p-5">
              <p className="text-sm font-medium">FAQ preview</p>
              <div className="mt-4 space-y-3">
                {faq.map((item) => (
                  <div key={item.question} className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                    <p className="font-medium text-foreground">{item.question}</p>
                    <p className="mt-2 text-sm text-muted-foreground">{item.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <div className="rounded-[28px] border border-primary/20 bg-primary/10 p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-primary">Final CTA</p>
          <p className="mt-3 text-base font-medium text-foreground">{String(result.finalCta ?? "")}</p>
        </div>
      </div>
    );
  }

  if (outputType === "text") {
    const title = String(result.title ?? "AI output");
    const body = String(result.result ?? previewText);
    const suggestions = asStringArray(result.suggestions);

    return (
      <div className="space-y-5 animate-enter">
        <div className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-6">
          <p className="premium-label">AI result</p>
          <h3 className="mt-4 text-2xl font-semibold tracking-tight">{title}</h3>
          <div className="mt-4 rounded-3xl border border-white/8 bg-white/[0.03] p-5 text-sm leading-7 text-muted-foreground">{body}</div>
        </div>

        {suggestions.length ? (
          <div className="rounded-3xl border border-white/10 p-5">
            <p className="text-sm font-medium">Suggested next moves</p>
            <div className="mt-4 space-y-3">
              {suggestions.map((item) => (
                <div key={item} className="rounded-2xl border border-white/8 bg-white/[0.03] p-4 text-sm text-muted-foreground">{item}</div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <pre className="subtle-scrollbar max-h-[520px] overflow-auto rounded-3xl border border-white/10 bg-white/[0.03] p-5 text-xs whitespace-pre-wrap">
      {previewText}
    </pre>
  );
}

export function ToolsWorkspace() {
  const pendingToolRequestRef = useRef<string | null>(null);
  const pendingExportRequestsRef = useRef<Set<string>>(new Set());
  const [tools, setTools] = useState<ToolItem[]>([]);
  const [workspaces, setWorkspaces] = useState<WorkspaceItem[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>("");
  const [activeModuleId, setActiveModuleId] = useState<string>("");
  const [credits, setCredits] = useState(0);
  const [activeToolId, setActiveToolId] = useState<string>("");
  const [toolSearch, setToolSearch] = useState("");
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [generationControls, setGenerationControls] = useState<GenerationControls>(getDefaultGenerationControls());
  const [generationMeta, setGenerationMeta] = useState<GenerationMeta | null>(null);
  const [generationErrorDetails, setGenerationErrorDetails] = useState<GenerationErrorDetails | null>(null);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [resultExecutionId, setResultExecutionId] = useState<string | null>(null);
  const [history, setHistory] = useState<UsageHistoryItem[]>([]);
  const [favoriteToolIds, setFavoriteToolIds] = useState<string[]>([]);
  const [savedOutputIds, setSavedOutputIds] = useState<string[]>([]);
  const [outputNames, setOutputNames] = useState<Record<string, string>>({});
  const [moduleDrafts, setModuleDrafts] = useState<Record<string, Record<string, string>>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isBootLoading, setIsBootLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"result" | "history" | "saved">("result");
  const [exportFormat, setExportFormat] = useState<ExportFormat>("json");
  const [isExporting, setIsExporting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [generationMode, setGenerationMode] = useState<GenerationMode>("generate");
  const [generationStepIndex, setGenerationStepIndex] = useState(0);
  const [workspaceDataCounts, setWorkspaceDataCounts] = useState<Record<string, number>>({});
  const [workspaceOverview, setWorkspaceOverview] = useState<Record<string, unknown>>({});
  const [workspaceProjects, setWorkspaceProjects] = useState<WorkspaceProject[]>([]);
  const [workspaceFolders, setWorkspaceFolders] = useState<WorkspaceFolder[]>([]);
  const [workspaceFavorites, setWorkspaceFavorites] = useState<string[]>([]);
  const [workspaceRecents, setWorkspaceRecents] = useState<string[]>([]);
  const [editableSections, setEditableSections] = useState<EditableSection[]>([]);
  const [activeOutputView, setActiveOutputView] = useState<"rendered" | "editor" | "insights">("rendered");

  const activeWorkspace = useMemo(() => workspaces.find((workspace) => workspace.id === activeWorkspaceId) ?? null, [workspaces, activeWorkspaceId]);
  const activeModules = useMemo(() => activeWorkspace?.modules ?? [], [activeWorkspace]);
  const activeModule = useMemo(() => activeModules.find((module) => module.id === activeModuleId) ?? null, [activeModules, activeModuleId]);
  const workspaceTools = useMemo(() => {
    if (!activeWorkspace) return tools;
    const fromWorkspace = activeWorkspace.modules
      .map((module) => module.tool)
      .filter((tool): tool is ToolItem => Boolean(tool));
    return fromWorkspace.length ? fromWorkspace : tools;
  }, [activeWorkspace, tools]);
  const activeTool = useMemo(() => workspaceTools.find((tool) => tool.id === activeToolId) ?? null, [workspaceTools, activeToolId]);
  const previewText = useMemo(() => (result ? toReadableValue(result) : ""), [result]);
  const availableFormats = activeTool?.exportFormats?.length ? activeTool.exportFormats : (["json"] as ExportFormat[]);
  const resolvedExportFormat = availableFormats.includes(exportFormat) ? exportFormat : availableFormats[0] ?? "json";
  const generationSteps = useMemo(() => getGenerationSteps(activeTool?.metadata.outputType), [activeTool?.metadata.outputType]);
  const currentHistoryItem = useMemo(() => history.find((item) => item.id === resultExecutionId) ?? null, [history, resultExecutionId]);
  const savedHistoryItems = useMemo(() => history.filter((item) => savedOutputIds.includes(item.id)), [history, savedOutputIds]);
  const currentResultName = useMemo(
    () => (resultExecutionId ? outputNames[resultExecutionId] ?? `${activeTool?.metadata.name ?? "Generated"} Output` : `${activeTool?.metadata.name ?? "Generated"} Output`),
    [activeTool?.metadata.name, outputNames, resultExecutionId]
  );

  const filteredTools = useMemo(() => {
    const q = toolSearch.trim().toLowerCase();
    if (!q) return workspaceTools;
    return workspaceTools.filter((tool) => {
      const searchPool = [tool.metadata.name, tool.metadata.description, tool.metadata.category, tool.metadata.tagline ?? "", ...(tool.metadata.tags ?? [])]
        .join(" ")
        .toLowerCase();
      return searchPool.includes(q);
    });
  }, [toolSearch, workspaceTools]);

  useEffect(() => {
    const init = async () => {
      setIsBootLoading(true);
      const [favoriteIds, savedIds, persistedOutputNames] = [
        readArrayFromStorage(FAVORITE_TOOLS_STORAGE_KEY),
        readArrayFromStorage(SAVED_OUTPUTS_STORAGE_KEY),
        readRecordFromStorage(OUTPUT_NAMES_STORAGE_KEY),
      ];
      const persistedDrafts = readRecordFromStorage(MODULE_DRAFTS_STORAGE_KEY);
      const persistedProjects = readRecordFromStorage(WORKSPACE_PROJECTS_STORAGE_KEY);
      const persistedFolders = readRecordFromStorage(WORKSPACE_FOLDERS_STORAGE_KEY);
      setFavoriteToolIds(favoriteIds);
      setSavedOutputIds(savedIds);
      setOutputNames(persistedOutputNames);
      setWorkspaceFavorites(readArrayFromStorage(WORKSPACE_FAVORITES_STORAGE_KEY));
      setWorkspaceRecents(readArrayFromStorage(WORKSPACE_RECENT_STORAGE_KEY));
      setWorkspaceProjects(
        Object.values(persistedProjects)
          .map((raw) => {
            try {
              return JSON.parse(raw) as WorkspaceProject;
            } catch {
              return null;
            }
          })
          .filter((item): item is WorkspaceProject => Boolean(item))
      );
      setWorkspaceFolders(
        Object.values(persistedFolders)
          .map((raw) => {
            try {
              return JSON.parse(raw) as WorkspaceFolder;
            } catch {
              return null;
            }
          })
          .filter((item): item is WorkspaceFolder => Boolean(item))
      );
      setModuleDrafts(Object.entries(persistedDrafts).reduce<Record<string, Record<string, string>>>((acc, [key, value]) => {
        try {
          const parsed = JSON.parse(value);
          if (parsed && typeof parsed === "object") acc[key] = parsed as Record<string, string>;
        } catch {
          // noop
        }
        return acc;
      }, {}));

      const res = await fetch("/api/tools", { method: "GET" });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Failed to load tools");
        setIsBootLoading(false);
        return;
      }

      const loadedTools: ToolItem[] = json.data.tools;
      const loadedWorkspaces: WorkspaceItem[] = json.data.workspaces ?? [];
      setTools(loadedTools);
      setWorkspaces(loadedWorkspaces);
      setCredits(json.data.credits ?? 0);
      if (loadedWorkspaces.length > 0) {
        const firstWorkspace = loadedWorkspaces[0];
        setActiveWorkspaceId(firstWorkspace.id);
        const firstModule = firstWorkspace.modules[0];
        setActiveModuleId(firstModule?.id ?? "");
        const firstWorkspaceTool = firstWorkspace.modules.find((module) => module.tool)?.tool;
        const resolvedTool = firstWorkspaceTool ?? loadedTools[0];
        if (resolvedTool) {
          setActiveToolId((current) => current || resolvedTool.id);
          setExportFormat((resolvedTool.exportFormats?.[0] as ExportFormat | undefined) ?? "json");
          setGenerationControls(getDefaultGenerationControls(resolvedTool));
        }
      } else if (loadedTools.length > 0) {
        setActiveToolId((current) => current || loadedTools[0].id);
        setExportFormat((loadedTools[0].exportFormats?.[0] as ExportFormat | undefined) ?? "json");
        setGenerationControls(getDefaultGenerationControls(loadedTools[0]));
      }
      setIsBootLoading(false);
    };

    void init();
  }, []);

  useEffect(() => {
    if (!activeToolId) return;

    const loadHistory = async () => {
      const params = new URLSearchParams({ mode: "history", toolId: activeToolId, limit: "12" });
      if (activeWorkspaceId) params.set("workspaceId", activeWorkspaceId);
      if (activeModuleId) params.set("moduleId", activeModuleId);
      const res = await fetch(`/api/tools?${params.toString()}`);
      const json = await res.json();
      if (res.ok) setHistory(json.data ?? []);
    };

    void loadHistory();
  }, [activeToolId, activeWorkspaceId, activeModuleId]);

  useEffect(() => {
    const run = async () => {
      if (!activeWorkspaceId) return;
      const endpointByWorkspace: Record<string, string> = {
        "linkedin-authority-os": "/api/workspaces/linkedin-authority",
        "sales-outreach-os": "/api/workspaces/sales-outreach?mode=overview",
        "conversion-copy-os": "/api/workspaces/conversion-copy",
        "seo-growth-os": "/api/workspaces/seo-growth?mode=overview",
        "ai-brand-studio": "/api/workspaces/brand-studio?mode=overview",
      };
      const endpoint = endpointByWorkspace[activeWorkspaceId];
      if (!endpoint) return;
      try {
        const res = await fetch(endpoint);
        const json = await res.json();
        if (!res.ok) return;
        const data = (json?.data ?? {}) as Record<string, unknown>;
        const total = Object.values(data).reduce<number>((sum, value) => sum + (Array.isArray(value) ? value.length : 0), 0);
        setWorkspaceDataCounts((prev) => ({ ...prev, [activeWorkspaceId]: total }));
        setWorkspaceOverview(data);
      } catch {
        // noop: non-blocking workspace data summary
      }
    };
    void run();
  }, [activeWorkspaceId]);

  useEffect(() => {
    writeArrayToStorage(FAVORITE_TOOLS_STORAGE_KEY, favoriteToolIds);
  }, [favoriteToolIds]);

  useEffect(() => {
    writeArrayToStorage(SAVED_OUTPUTS_STORAGE_KEY, savedOutputIds);
  }, [savedOutputIds]);

  useEffect(() => {
    writeRecordToStorage(OUTPUT_NAMES_STORAGE_KEY, outputNames);
  }, [outputNames]);

  useEffect(() => {
    const serialized: Record<string, string> = {};
    Object.entries(moduleDrafts).forEach(([key, value]) => {
      serialized[key] = JSON.stringify(value);
    });
    writeRecordToStorage(MODULE_DRAFTS_STORAGE_KEY, serialized);
  }, [moduleDrafts]);

  useEffect(() => {
    writeArrayToStorage(WORKSPACE_FAVORITES_STORAGE_KEY, workspaceFavorites);
  }, [workspaceFavorites]);

  useEffect(() => {
    writeArrayToStorage(WORKSPACE_RECENT_STORAGE_KEY, workspaceRecents);
  }, [workspaceRecents]);

  useEffect(() => {
    const next = Object.fromEntries(workspaceProjects.map((item) => [item.id, JSON.stringify(item)]));
    writeRecordToStorage(WORKSPACE_PROJECTS_STORAGE_KEY, next);
  }, [workspaceProjects]);

  useEffect(() => {
    const next = Object.fromEntries(workspaceFolders.map((item) => [item.id, JSON.stringify(item)]));
    writeRecordToStorage(WORKSPACE_FOLDERS_STORAGE_KEY, next);
  }, [workspaceFolders]);

  useEffect(() => {
    if (!isLoading) return;

    const timer = window.setInterval(() => {
      setGenerationStepIndex((current) => (current < generationSteps.length - 1 ? current + 1 : current));
    }, 1300);

    return () => window.clearInterval(timer);
  }, [generationSteps.length, isLoading]);

  const selectTool = (tool: ToolItem) => {
    setActiveToolId(tool.id);
    setFormData({});
    setGenerationControls(getDefaultGenerationControls(tool));
    setGenerationMeta(null);
    setGenerationErrorDetails(null);
    setResult(null);
    setEditableSections([]);
    setResultExecutionId(null);
    setError(null);
    setSuccessMessage(null);
    setActiveTab("result");
    setExportFormat((tool.exportFormats?.[0] as ExportFormat | undefined) ?? "json");
  };

  const selectWorkspace = (workspaceId: string) => {
    setActiveWorkspaceId(workspaceId);
    const workspace = workspaces.find((item) => item.id === workspaceId);
    const firstModule = workspace?.modules[0];
    setActiveModuleId(firstModule?.id ?? "");
    const moduleTool = firstModule?.tool;
    if (moduleTool) {
      selectTool(moduleTool);
      const draftKey = `${workspaceId}:${firstModule?.id}`;
      setFormData(moduleDrafts[draftKey] ?? {});
    }
    setWorkspaceRecents((prev) => [workspaceId, ...prev.filter((item) => item !== workspaceId)].slice(0, 8));
  };

  const selectModule = (moduleId: string) => {
    if (!activeWorkspace) return;
    setActiveModuleId(moduleId);
    const selectedModule = activeWorkspace.modules.find((item) => item.id === moduleId);
    if (selectedModule?.tool) selectTool(selectedModule.tool);
    const draftKey = `${activeWorkspace.id}:${moduleId}`;
    setFormData(moduleDrafts[draftKey] ?? {});
  };

  const onChange = (name: string, value: string) => {
    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      if (activeWorkspaceId && activeModuleId) {
        const draftKey = `${activeWorkspaceId}:${activeModuleId}`;
        setModuleDrafts((drafts) => ({ ...drafts, [draftKey]: next }));
      }
      return next;
    });
  };

  const onGenerationControlChange = <TKey extends keyof GenerationControls>(name: TKey, value: GenerationControls[TKey]) => {
    setGenerationControls((prev) => ({ ...prev, [name]: value }));
  };

  const renameOutput = (executionId: string, fallbackName: string) => {
    const nextName = window.prompt("Rename this saved output", outputNames[executionId] ?? fallbackName);
    if (nextName == null) return;
    const trimmed = nextName.trim();
    setOutputNames((prev) => ({ ...prev, [executionId]: trimmed || fallbackName }));
    setSuccessMessage(trimmed ? "Output renamed successfully." : "Output name reset to default.");
  };

  const validate = () => {
    if (!activeTool) return "Please select a tool.";
    for (const field of activeTool.fields) {
      if (field.required && !String(formData[field.name] ?? "").trim()) {
        return `${field.label} is required.`;
      }
    }
    return null;
  };

  const refreshHistory = async (toolId = activeToolId) => {
    if (!toolId) return;
    const params = new URLSearchParams({ mode: "history", toolId, limit: "12" });
    if (activeWorkspaceId) params.set("workspaceId", activeWorkspaceId);
    if (activeModuleId) params.set("moduleId", activeModuleId);
    const res = await fetch(`/api/tools?${params.toString()}`);
    const json = await res.json();
    if (res.ok) setHistory(json.data ?? []);
  };

  const runTool = async (mode: GenerationMode = "generate") => {
    if (pendingToolRequestRef.current) {
      return;
    }

    setError(null);
    setGenerationErrorDetails(null);
    setSuccessMessage(null);
    setGenerationMode(mode);
    setGenerationStepIndex(0);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!activeTool) return;

    if ((mode === "improve" || mode === "shorten" || mode === "expand") && !result) {
      setError(`Generate an initial ${activeTool.metadata.name} output first before using ${mode}.`);
      return;
    }

    if (credits < activeTool.creditCost) {
      setError(`Insufficient credits. This tool requires ${activeTool.creditCost} credits. Upgrade to continue or buy a credit topup.`);
      return;
    }

    if (activeTool.metadata.availability === "coming_soon") {
      setError(activeTool.metadata.disabledReason ?? "This tool is not available in the launch MVP.");
      return;
    }

    setIsLoading(true);
    setActiveTab("result");
    const requestId = crypto.randomUUID();
    pendingToolRequestRef.current = requestId;

    try {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 45000);
      const res = await fetch("/api/tools", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-idempotency-key": requestId,
        },
        signal: controller.signal,
        body: JSON.stringify({
          toolId: activeTool.id,
          input: { ...formData },
          workspaceId: activeWorkspaceId || undefined,
          moduleId: activeModuleId || undefined,
          options: {
            mode,
            controls: generationControls,
            previousOutput: mode === "generate" ? undefined : result ?? undefined,
          },
        }),
      });
      window.clearTimeout(timeout);

      const json = await res.json();

      if (!res.ok) {
        setGenerationErrorDetails((json.details ?? null) as GenerationErrorDetails | null);
        setError(json.error ?? "Generation failed.");
        return;
      }

      setResult(json.data);
      setResultExecutionId(json.executionId ?? null);
      setGenerationMeta((json.generationMeta ?? null) as GenerationMeta | null);
      setCredits(json.metrics?.creditsAfter ?? credits);
      if (json.executionId && !outputNames[json.executionId]) {
        setOutputNames((prev) => ({ ...prev, [json.executionId]: `${activeTool.metadata.name} Output` }));
      }
      setSuccessMessage(
        mode === "improve"
          ? "Improved variation generated successfully. Review, save, or export it below."
          : mode === "regenerate"
            ? "Fresh variation generated successfully. Compare or export it below."
            : mode === "shorten"
              ? "Shortened variation generated successfully."
              : mode === "expand"
                ? "Expanded variation generated successfully."
                : "Output generated successfully. You can copy, save, or export it now."
      );

      await refreshHistory(activeTool.id);
    } catch (error) {
      setGenerationErrorDetails({
        title: error instanceof DOMException && error.name === "AbortError" ? "Request timeout" : "Temporary issue",
        description: error instanceof DOMException && error.name === "AbortError"
          ? "Generation took too long. Please retry. Your credits are safe unless generation succeeded."
          : "Your credits were not deducted unless the generation completed successfully.",
        retryable: true,
      });
      setError(
        error instanceof DOMException && error.name === "AbortError"
          ? "Generation timed out. Please retry with a shorter or clearer brief."
          : "We couldn't generate your output right now. Please check your connection and try again."
      );
    } finally {
      if (pendingToolRequestRef.current === requestId) {
        pendingToolRequestRef.current = null;
      }
      setIsLoading(false);
    }
  };

  const copyResult = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(previewText || JSON.stringify(result, null, 2));
      setSuccessMessage("Output copied to clipboard.");
    } catch {
      setError("We couldn't copy this output automatically. Please try again.");
    }
  };

  const openSignedUrl = (signedUrl: string) => {
    window.open(signedUrl, "_blank", "noopener,noreferrer");
  };

  const exportCurrentResult = async (format: ExportFormat) => {
    if (!resultExecutionId) return;

    const requestKey = buildExportRequestKey(resultExecutionId, format);
    if (pendingExportRequestsRef.current.has(requestKey)) {
      return;
    }

    setError(null);
    setIsExporting(true);
    pendingExportRequestsRef.current.add(requestKey);
    try {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 30000);
      const res = await fetch("/api/exports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({ toolUsageId: resultExecutionId, format }),
      });
      window.clearTimeout(timeout);
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Export failed.");
        return;
      }
      await refreshHistory();
      setSuccessMessage(`${format.toUpperCase()} export ready.`);
      openSignedUrl(json.data.signedUrl);
    } catch {
      setError("We couldn't prepare your export right now. Please try again.");
    } finally {
      pendingExportRequestsRef.current.delete(requestKey);
      setIsExporting(false);
    }
  };

  const redownloadExport = async (exportId: string) => {
    setError(null);
    try {
      const res = await fetch(`/api/exports?id=${encodeURIComponent(exportId)}`);
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Failed to download export.");
        return;
      }
      setSuccessMessage("Your export is ready.");
      openSignedUrl(json.data.signedUrl);
    } catch {
      setError("We couldn't download that export right now. Please try again.");
    }
  };

  const quickDownload = async (item: UsageHistoryItem | null, format: ExportFormat) => {
    if (!item) return;
    const existing = item.exports.find((entry) => entry.file_type === format);
    if (existing) {
      await redownloadExport(existing.id);
      return;
    }

    const requestKey = buildExportRequestKey(item.id, format);
    if (pendingExportRequestsRef.current.has(requestKey)) {
      return;
    }

    pendingExportRequestsRef.current.add(requestKey);
    setIsExporting(true);
    try {
      const res = await fetch("/api/exports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toolUsageId: item.id, format }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Failed to create export.");
        return;
      }
      await refreshHistory();
      setSuccessMessage(`${format.toUpperCase()} export ready.`);
      openSignedUrl(json.data.signedUrl);
    } catch {
      setError("We couldn't prepare that export right now. Please try again.");
    } finally {
      pendingExportRequestsRef.current.delete(requestKey);
      setIsExporting(false);
    }
  };

  const deleteGeneration = async (generationId: string) => {
    setError(null);
    try {
      const res = await fetch("/api/exports", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: generationId, kind: "generation" }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Failed to delete generation.");
        return;
      }
      if (resultExecutionId === generationId) {
        setResult(null);
        setEditableSections([]);
        setResultExecutionId(null);
        setGenerationMeta(null);
      }
      setSavedOutputIds((prev) => prev.filter((id) => id !== generationId));
      setSuccessMessage("Generation removed successfully.");
      await refreshHistory();
    } catch {
      setError("We couldn't delete that generation right now. Please try again.");
    }
  };

  const toggleFavoriteTool = (toolId: string) => {
    setFavoriteToolIds((prev) => (prev.includes(toolId) ? prev.filter((item) => item !== toolId) : [toolId, ...prev]));
  };

  const toggleSavedOutput = (executionId: string) => {
    setSavedOutputIds((prev) => (prev.includes(executionId) ? prev.filter((item) => item !== executionId) : [executionId, ...prev]));
    setSuccessMessage(savedOutputIds.includes(executionId) ? "Removed from saved outputs." : "Saved to your premium workspace shelf.");
  };

  const duplicateGeneration = (item: UsageHistoryItem) => {
    const nextForm = Object.fromEntries(Object.entries(item.input).map(([key, value]) => [key, String(value ?? "")]));
    if (item.tool_id !== activeToolId) {
      const nextTool = tools.find((tool) => tool.id === item.tool_id);
      if (nextTool) setActiveToolId(nextTool.id);
    }
    setFormData(nextForm);
    setSuccessMessage("Previous generation duplicated into the input workspace.");
  };

  const reopenHistoryItem = (item: UsageHistoryItem) => {
    setResult(item.output);
    setEditableSections(buildEditableSections(item.output, toReadableValue(item.output)));
    setResultExecutionId(item.id);
    setGenerationMeta(null);
    setGenerationErrorDetails(null);
    setFormData(Object.fromEntries(Object.entries(item.input).map(([key, value]) => [key, String(value ?? "")])));
    setActiveTab("result");
    setSuccessMessage("Previous output reopened in the workspace.");
  };

  const createWorkspaceProject = () => {
    if (!activeWorkspaceId) return;
    const nextName = window.prompt("Project name", `${activeWorkspace?.name ?? "Workspace"} Project`);
    if (!nextName?.trim()) return;
    const project: WorkspaceProject = { id: crypto.randomUUID(), workspaceId: activeWorkspaceId, name: nextName.trim(), updatedAt: new Date().toISOString() };
    setWorkspaceProjects((prev) => [project, ...prev]);
    setSuccessMessage("Project created and saved in workspace context.");
  };

  const createWorkspaceFolder = () => {
    if (!activeWorkspaceId) return;
    const nextName = window.prompt("Folder name", "Campaign Assets");
    if (!nextName?.trim()) return;
    const folder: WorkspaceFolder = { id: crypto.randomUUID(), workspaceId: activeWorkspaceId, name: nextName.trim(), updatedAt: new Date().toISOString() };
    setWorkspaceFolders((prev) => [folder, ...prev]);
    setSuccessMessage("Folder created for reusable assets.");
  };

  const toggleWorkspaceFavorite = (workspaceId: string) => {
    setWorkspaceFavorites((prev) => (prev.includes(workspaceId) ? prev.filter((item) => item !== workspaceId) : [workspaceId, ...prev]));
  };

  const updateSectionContent = (id: string, content: string) => {
    setEditableSections((prev) => prev.map((section) => (section.id === id ? { ...section, content } : section)));
  };

  const duplicateSection = (id: string) => {
    setEditableSections((prev) => {
      const target = prev.find((item) => item.id === id);
      if (!target) return prev;
      const clone: EditableSection = { ...target, id: crypto.randomUUID(), title: `${target.title} (Variant)` };
      return [clone, ...prev];
    });
    setSuccessMessage("Section duplicated for alternate drafting.");
  };

  const togglePinSection = (id: string) => {
    setEditableSections((prev) => prev.map((section) => (section.id === id ? { ...section, pinned: !section.pinned } : section)));
  };

  const applyPreset = (preset: ToolPreset) => {
    setFormData((prev) => ({ ...prev, ...preset.values }));
    setSuccessMessage(`Applied preset: ${preset.label}`);
  };

  const favoriteTools = useMemo(() => tools.filter((tool) => favoriteToolIds.includes(tool.id)), [favoriteToolIds, tools]);
  const primaryDownloadFormat = (availableFormats[0] ?? "json") as ExportFormat;
  const generationProgress = Math.round(((generationStepIndex + 1) / generationSteps.length) * 100);
  const activeWorkspaceProjects = workspaceProjects.filter((item) => item.workspaceId === activeWorkspaceId);
  const activeWorkspaceFolders = workspaceFolders.filter((item) => item.workspaceId === activeWorkspaceId);

  if (isBootLoading) {
    return (
      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <Card className="h-fit overflow-hidden">
          <CardHeader><CardTitle>Loading premium workspace</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {[1, 2, 3, 4].map((item) => <div key={item} className="h-20 animate-pulse rounded-3xl bg-muted/70" />)}
          </CardContent>
        </Card>
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Preparing AI tools</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="h-28 animate-pulse rounded-[28px] bg-muted/70" />
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="h-72 animate-pulse rounded-[28px] bg-muted/70" />
                <div className="h-72 animate-pulse rounded-[28px] bg-muted/70" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)] animate-enter">
      <div className="space-y-6 xl:sticky xl:top-24 xl:self-start">
          <Card className="overflow-hidden border-border bg-card">
          <CardHeader>
              <div className="premium-label">Tools</div>
              <CardTitle className="mt-3">Choose your workflow</CardTitle>
              <p className="text-sm text-muted-foreground">Pick a tool, fill the input brief, and generate a structured marketing output.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <div className="dashboard-metric">
                <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Credits</p>
                <p className="mt-3 text-2xl font-semibold tracking-tight">{credits}</p>
              </div>
              <div className="dashboard-metric">
                <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Saved outputs</p>
                <p className="mt-3 text-2xl font-semibold tracking-tight">{savedHistoryItems.length}</p>
              </div>
              <div className="dashboard-metric">
                <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Workspace records</p>
                <p className="mt-3 text-2xl font-semibold tracking-tight">{workspaceDataCounts[activeWorkspaceId] ?? 0}</p>
              </div>
              <div className="dashboard-metric">
                <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Projects</p>
                <p className="mt-3 text-2xl font-semibold tracking-tight">{activeWorkspaceProjects.length}</p>
              </div>
            </div>

            <div className="relative">
              {workspaces.length ? (
                <select
                  className="mb-3 flex h-11 w-full rounded-2xl border border-border/80 bg-background/90 px-3.5 py-2.5 text-sm shadow-[0_8px_18px_-18px_rgba(15,23,42,0.35)]"
                  value={activeWorkspaceId}
                  onChange={(e) => selectWorkspace(e.target.value)}
                >
                  {workspaces.map((workspace) => (
                    <option key={workspace.id} value={workspace.id}>{workspace.name}</option>
                  ))}
                </select>
              ) : null}
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={toolSearch}
                onChange={(e) => setToolSearch(e.target.value)}
                placeholder="Search tools, categories, or tags"
                className="pl-10"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button size="sm" variant="outline" onClick={createWorkspaceProject}><FolderKanban size={14} /> New project</Button>
              <Button size="sm" variant="outline" onClick={createWorkspaceFolder}>New folder</Button>
            </div>

            {activeWorkspace ? (
              <Button size="sm" variant="outline" onClick={() => toggleWorkspaceFavorite(activeWorkspace.id)}>
                <Star size={14} className={workspaceFavorites.includes(activeWorkspace.id) ? "fill-amber-300 text-amber-300" : ""} />
                {workspaceFavorites.includes(activeWorkspace.id) ? "Favorited workspace" : "Favorite workspace"}
              </Button>
            ) : null}
          </CardContent>
        </Card>

        {favoriteTools.length ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Favorites</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {favoriteTools.map((tool) => (
                <button
                  key={tool.id}
                  type="button"
                  onClick={() => selectTool(tool)}
                  className="surface-muted interactive-lift flex w-full items-center justify-between px-4 py-3 text-left"
                >
                  <span>
                    <span className="mr-2 text-lg">{tool.metadata.icon}</span>
                    <span className="text-sm font-medium">{tool.metadata.name}</span>
                  </span>
                  <Star size={14} className="fill-amber-300 text-amber-300" />
                </button>
              ))}
            </CardContent>
          </Card>
        ) : null}

        <Card className="max-h-[70vh] overflow-hidden">
          <CardHeader>
            <CardTitle className="text-base">Workspace modules</CardTitle>
            <p className="text-xs text-muted-foreground">Operate by workflow module, not disconnected tools.</p>
          </CardHeader>
          <CardContent className="subtle-scrollbar space-y-3 overflow-auto">
            {activeModules.length ? activeModules.map((module) => {
              const isActive = module.id === activeModuleId;
              const resolvedTool = module.tool;
              const isFavorite = resolvedTool ? favoriteToolIds.includes(resolvedTool.id) : false;
              return (
                <div
                  key={module.id}
                  className={`rounded-[24px] border p-4 transition-all ${
                    isActive ? "border-primary/40 bg-primary/10 shadow-[0_18px_42px_-34px_rgba(99,102,241,0.65)]" : "border-border/70 bg-card hover:border-border hover:bg-muted/45"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <button type="button" onClick={() => selectModule(module.id)} className="flex-1 text-left">
                      <p className="text-sm font-medium text-foreground">{module.name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{resolvedTool ? `${resolvedTool.creditCost} credits` : "Coming soon"}</p>
                      <p className="mt-3 text-xs leading-5 text-muted-foreground">{module.description}</p>
                    </button>
                    {resolvedTool ? (
                      <button type="button" onClick={() => toggleFavoriteTool(resolvedTool.id)} className="rounded-full border border-border/80 p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground">
                        <Star size={14} className={isFavorite ? "fill-amber-300 text-amber-300" : ""} />
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            }) : filteredTools.map((tool) => {
              const isFavorite = favoriteToolIds.includes(tool.id);
              const isActive = tool.id === activeToolId;
              return (
                <div
                  key={tool.id}
                  className={`rounded-[24px] border p-4 transition-all ${
                    isActive ? "border-primary/40 bg-primary/10 shadow-[0_18px_42px_-34px_rgba(99,102,241,0.65)]" : "border-border/70 bg-card hover:border-border hover:bg-muted/45"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <button type="button" onClick={() => selectTool(tool)} className="flex-1 text-left">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{tool.metadata.icon}</span>
                        <div>
                          <p className="text-sm font-medium text-foreground">{tool.metadata.name}</p>
                          <p className="mt-1 text-xs text-muted-foreground">{tool.metadata.category} • {tool.creditCost} credits</p>
                        </div>
                      </div>
                      <p className="mt-3 text-xs leading-5 text-muted-foreground">{tool.metadata.tagline ?? tool.metadata.description}</p>
                    </button>
                    <button type="button" onClick={() => toggleFavoriteTool(tool.id)} className="rounded-full border border-border/80 p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground">
                      <Star size={14} className={isFavorite ? "fill-amber-300 text-amber-300" : ""} />
                    </button>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {(activeWorkspaceProjects.length || activeWorkspaceFolders.length) ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Organization</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {activeWorkspaceProjects.slice(0, 4).map((project) => (
                <div key={project.id} className="rounded-2xl border border-border/70 bg-muted/35 px-3 py-2">
                  <p className="font-medium">{project.name}</p>
                  <p className="text-xs text-muted-foreground">Updated {formatGlobalDateTime(project.updatedAt)}</p>
                </div>
              ))}
              {activeWorkspaceFolders.slice(0, 4).map((folder) => (
                <div key={folder.id} className="rounded-2xl border border-border/70 bg-muted/35 px-3 py-2">
                  <p className="font-medium">📁 {folder.name}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        ) : null}
      </div>

      <div className="space-y-6">
        <Card className="hero-panel overflow-hidden">
          <CardHeader className="space-y-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="surface-muted flex size-14 items-center justify-center rounded-[20px] text-3xl">
                    {activeWorkspace?.icon ?? activeTool?.metadata.icon ?? "✨"}
                  </div>
                  <div>
                    <p className="premium-label">{activeWorkspace?.name ?? activeTool?.metadata.category ?? "Tool workspace"}</p>
                    <h2 className="mt-3 text-3xl font-semibold tracking-tight">{activeModule?.name ?? activeTool?.metadata.name ?? "Select a tool"}</h2>
                  </div>
                </div>
                <p className="max-w-4xl text-sm leading-6 text-muted-foreground">
                  {activeModule?.description ?? activeWorkspace?.description ?? activeTool?.metadata.tagline ?? activeTool?.metadata.description ?? "Choose a tool to begin."}
                </p>
              </div>

              {activeTool ? (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => toggleFavoriteTool(activeTool.id)}
                    className="stat-chip transition hover:border-white/20 hover:bg-white/10 hover:text-foreground"
                  >
                    <Star size={12} className={favoriteToolIds.includes(activeTool.id) ? "fill-amber-300 text-amber-300" : "text-accent"} />
                    {favoriteToolIds.includes(activeTool.id) ? "Favorited" : "Add favorite"}
                  </button>
                  <div className="stat-chip"><Clock3 size={12} className="text-accent" /> {formatEta(activeTool.metadata.estimatedTimeSeconds)}</div>
                  <div className="stat-chip"><Sparkles size={12} className="text-accent" /> {activeTool.creditCost} credits</div>
                  <div className="stat-chip"><History size={12} className="text-accent" /> {history.length} recent runs</div>
                </div>
              ) : null}
            </div>

            {activeTool?.metadata.tags?.length ? (
              <div className="flex flex-wrap gap-2">
                {activeModule?.workflowStage ? (
                  <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300">
                    Stage: {activeModule.workflowStage}
                  </span>
                ) : null}
                {activeModule?.outputLabel ? (
                  <span className="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-300">
                    Output: {activeModule.outputLabel}
                  </span>
                ) : null}
                {activeTool.metadata.tags.map((tag) => (
                  <span key={tag} className="rounded-full border border-border/80 px-3 py-1 text-xs text-muted-foreground">
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}
          </CardHeader>
        </Card>

        <div className="grid gap-6 2xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Input panel</CardTitle>
                <p className="text-sm text-muted-foreground">Add your brief clearly. Better inputs produce stronger publish-ready outputs.</p>
                {activeWorkspace ? (
                  <div className="mt-3 grid gap-2 md:grid-cols-3">
                    <div className="rounded-2xl border border-border/70 bg-muted/30 p-3">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Audience presets</p>
                      <p className="mt-2 text-xs text-foreground">{activeWorkspace.audiencePresets.join(" • ")}</p>
                    </div>
                    <div className="rounded-2xl border border-border/70 bg-muted/30 p-3">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Tone presets</p>
                      <p className="mt-2 text-xs text-foreground">{activeWorkspace.tonePresets.join(" • ")}</p>
                    </div>
                    <div className="rounded-2xl border border-border/70 bg-muted/30 p-3">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Templates</p>
                      <p className="mt-2 text-xs text-foreground">{activeWorkspace.templatePresets.join(" • ")}</p>
                    </div>
                  </div>
                ) : null}
                {activeWorkspace?.id === "linkedin-authority-os" ? (
                  <div className="mt-3 rounded-2xl border border-indigo-400/20 bg-indigo-500/5 p-3 text-xs text-indigo-100">
                    <div className="flex items-center gap-2"><CalendarDays size={14} /> Content calendar, tone presets, and swipe-file continuity enabled.</div>
                  </div>
                ) : null}
                {activeWorkspace?.id === "sales-outreach-os" ? (
                  <div className="mt-3 rounded-2xl border border-emerald-400/20 bg-emerald-500/5 p-3 text-xs text-emerald-100">
                    <div className="flex items-center gap-2"><Target size={14} /> Sequence builder workflow and objection handling context active.</div>
                  </div>
                ) : null}
                {activeWorkspace?.id === "seo-growth-os" ? (
                  <div className="mt-3 rounded-2xl border border-cyan-400/20 bg-cyan-500/5 p-3 text-xs text-cyan-100">
                    <div className="flex items-center gap-2"><Pin size={14} /> Keyword clustering, SERP planning, and linking map structure active.</div>
                  </div>
                ) : null}
                {activeWorkspace?.id === "ai-brand-studio" ? (
                  <div className="mt-3 rounded-2xl border border-fuchsia-400/20 bg-fuchsia-500/5 p-3 text-xs text-fuchsia-100">
                    <div className="flex items-center gap-2"><Palette size={14} /> Style preset studio mode with gallery-ready generation context.</div>
                  </div>
                ) : null}
              </CardHeader>
              <CardContent className="space-y-5">
                {activeTool?.presets?.length ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium">Presets & templates</p>
                      <span className="text-xs text-muted-foreground">One-click structured inputs</span>
                    </div>
                    <div className="grid gap-3">
                      {activeTool.presets.map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => applyPreset(preset)}
                          className="rounded-[24px] border border-white/8 bg-white/[0.03] px-4 py-4 text-left transition hover:border-white/15 hover:bg-white/[0.05]"
                        >
                          <p className="text-sm font-medium text-foreground">{preset.label}</p>
                          {preset.description ? <p className="mt-1 text-sm text-muted-foreground">{preset.description}</p> : null}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="grid gap-4">
                  {activeTool?.fields.length ? (
                    activeTool.fields.map((field) => (
                      <div key={field.name} className="space-y-2">
                        <div className="flex items-center justify-between gap-3">
                          <Label>{field.label}</Label>
                          {field.required ? <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Required</span> : null}
                        </div>

                        {field.type === "textarea" ? (
                          <Textarea
                            placeholder={field.placeholder}
                            value={formData[field.name] ?? ""}
                            onChange={(e) => onChange(field.name, e.target.value)}
                            className="min-h-32 rounded-2xl"
                          />
                        ) : field.type === "select" ? (
                          <select
                            className="flex h-11 w-full rounded-2xl border border-border/80 bg-background/90 px-3.5 py-2.5 text-sm shadow-[0_8px_18px_-18px_rgba(15,23,42,0.35)] outline-none transition-all duration-200 focus-visible:border-accent/50 focus-visible:ring-2 focus-visible:ring-accent/35"
                            value={formData[field.name] ?? ""}
                            onChange={(e) => onChange(field.name, e.target.value)}
                          >
                            <option value="">Select an option</option>
                            {field.options?.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        ) : field.type === "file" ? (
                          <Input type="file" accept="image/*" onChange={(e) => onChange(field.name, e.target.files?.[0]?.name ?? "")} className="rounded-2xl" />
                        ) : (
                          <Input
                            placeholder={field.placeholder}
                            value={formData[field.name] ?? ""}
                            onChange={(e) => onChange(field.name, e.target.value)}
                            className="rounded-2xl"
                          />
                        )}

                        {field.helperText ? <p className="text-xs leading-5 text-muted-foreground">{field.helperText}</p> : null}
                      </div>
                    ))
                  ) : (
                    <div className="surface-muted px-5 py-8 text-center text-sm text-muted-foreground">
                      This tool uses page or browser context automatically, so no manual fields are required here.
                    </div>
                  )}
                </div>

                {activeTool?.generationControls ? (
                  <div className="surface-card p-5">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium">Generation controls</p>
                        <p className="mt-1 text-xs text-muted-foreground">Adjust tone, style, output depth, and language for more consistent premium results.</p>
                      </div>
                      <span className="rounded-full border border-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                        Quality controls
                      </span>
                    </div>

                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <div>
                        <Label>Tone</Label>
                        <select
                          className="mt-2 flex h-11 w-full rounded-2xl border border-border/80 bg-background/90 px-3.5 py-2.5 text-sm shadow-[0_8px_18px_-18px_rgba(15,23,42,0.35)]"
                          value={generationControls.tone}
                          onChange={(e) => onGenerationControlChange("tone", e.target.value)}
                        >
                          {activeTool.generationControls.tones.map((tone) => (
                            <option key={tone} value={tone}>{tone}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <Label>Writing style</Label>
                        <select
                          className="mt-2 flex h-11 w-full rounded-2xl border border-border/80 bg-background/90 px-3.5 py-2.5 text-sm shadow-[0_8px_18px_-18px_rgba(15,23,42,0.35)]"
                          value={generationControls.writingStyle}
                          onChange={(e) => onGenerationControlChange("writingStyle", e.target.value)}
                        >
                          {activeTool.generationControls.writingStyles.map((style) => (
                            <option key={style} value={style}>{style}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <Label>Output length</Label>
                        <select
                          className="mt-2 flex h-11 w-full rounded-2xl border border-border/80 bg-background/90 px-3.5 py-2.5 text-sm shadow-[0_8px_18px_-18px_rgba(15,23,42,0.35)]"
                          value={generationControls.outputLength}
                          onChange={(e) => onGenerationControlChange("outputLength", e.target.value as OutputLength)}
                        >
                          {activeTool.generationControls.outputLengths.map((length) => (
                            <option key={length} value={length}>{length[0].toUpperCase() + length.slice(1)}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <Label>Language</Label>
                        <select
                          className="mt-2 flex h-11 w-full rounded-2xl border border-border/80 bg-background/90 px-3.5 py-2.5 text-sm shadow-[0_8px_18px_-18px_rgba(15,23,42,0.35)]"
                          value={generationControls.language}
                          onChange={(e) => onGenerationControlChange("language", e.target.value)}
                        >
                          {activeTool.generationControls.languages.map((language) => (
                            <option key={language} value={language}>{language}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {activeTool.generationControls.customInstructionsEnabled ? (
                      <div className="mt-4">
                        <Label>Custom instructions</Label>
                        <Textarea
                          className="mt-2 min-h-24 rounded-2xl"
                          placeholder="Optional: add specific instructions for structure, emphasis, or exclusions."
                          value={generationControls.customInstructions ?? ""}
                          onChange={(e) => onGenerationControlChange("customInstructions", e.target.value)}
                        />
                      </div>
                    ) : null}

                    <div className="mt-4 flex flex-wrap gap-2">
                      {activeTool.generationControls.supportedModes.map((mode) => (
                        <span key={mode} className="rounded-full border border-border/80 px-3 py-1 text-[11px] text-muted-foreground">
                          {mode}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}

                {activeTool?.examples?.length ? (
                  <div className="surface-card p-5">
                    <p className="text-sm font-medium">Examples</p>
                    <div className="mt-4 grid gap-3">
                      {activeTool.examples.map((example) => (
                        <div key={example.title} className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                          <p className="text-sm font-medium text-foreground">{example.title}</p>
                          <p className="mt-2 text-sm text-muted-foreground">{example.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {error ? (
                  <div className="status-danger flex items-start gap-2 rounded-2xl px-4 py-3 text-sm">
                    <AlertCircle size={16} className="mt-0.5 shrink-0" />
                    <div className="space-y-2">
                      <span>{generationErrorDetails?.title ? `${generationErrorDetails.title}: ` : ""}{error}</span>
                      {generationErrorDetails?.description ? <p className="text-xs text-red-100/80">{generationErrorDetails.description}</p> : null}
                      {generationErrorDetails?.issues?.length ? (
                        <ul className="space-y-1 text-xs text-red-100/80">
                          {generationErrorDetails.issues.map((issue) => (
                            <li key={issue}>• {issue}</li>
                          ))}
                        </ul>
                      ) : null}
                      {generationErrorDetails?.retryable ? (
                        <Button variant="outline" size="sm" onClick={() => void runTool(generationMode)} disabled={isLoading}>
                          Retry
                        </Button>
                      ) : null}
                    </div>
                  </div>
                ) : null}

                {successMessage ? (
                  <div className="status-success flex items-start gap-2 rounded-2xl px-4 py-3 text-sm">
                    <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
                    <span>{successMessage}</span>
                  </div>
                ) : null}

                <div className="flex flex-col gap-3 sm:flex-row">
                    <Button onClick={() => void runTool("generate")} disabled={isLoading || activeTool?.metadata.availability === "coming_soon"} className="flex-1">
                    {isLoading ? <><Loader2 size={16} className="animate-spin" /> {generationMode === "improve" ? "Improving..." : generationMode === "regenerate" ? "Regenerating..." : "Generating..."}</> : <><Sparkles size={16} /> Generate output</>}
                  </Button>
                  <Button variant="outline" onClick={() => setFormData({})} disabled={isLoading}>Reset</Button>
                </div>

                {activeTool && credits < activeTool.creditCost ? (
                  <div className="status-warning rounded-2xl px-4 py-3 text-sm">
                    Insufficient credits for this tool. <Link href="/billing" className="font-medium underline">Review billing or buy more credits</Link>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Generation status</CardTitle>
                <p className="text-sm text-muted-foreground">Track progress while Zenovee builds a structured output from your brief.</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="surface-card p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">{isLoading ? "Generating output" : "Ready to generate"}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {isLoading
                          ? generationSteps[generationStepIndex]
                          : activeTool
                            ? `Expected generation time ${formatEta(activeTool.metadata.estimatedTimeSeconds)}.`
                            : "Select a tool to begin."}
                      </p>
                    </div>
                    <div className="surface-muted flex size-11 items-center justify-center rounded-full">
                      {isLoading ? <Loader2 size={18} className="animate-spin text-accent" /> : <Wand2 size={18} className="text-accent" />}
                    </div>
                  </div>

                  <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/[0.06]">
                    <div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${isLoading ? generationProgress : result ? 100 : 12}%` }} />
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {generationSteps.map((step, index) => {
                      const status = isLoading
                        ? index < generationStepIndex
                          ? "done"
                          : index === generationStepIndex
                            ? "active"
                            : "upcoming"
                        : result
                          ? "done"
                          : "upcoming";

                      return (
                        <div
                          key={step}
                          className={`rounded-2xl border p-3 text-sm transition-all ${
                            status === "done"
                              ? "border-success/20 bg-success/10 text-foreground"
                              : status === "active"
                                ? "border-primary/25 bg-primary/10 text-foreground"
                            : "border-border/70 bg-muted/45 text-muted-foreground"
                          }`}
                        >
                          <p className="text-[11px] uppercase tracking-[0.18em]">Step {index + 1}</p>
                          <p className="mt-2 leading-5">{step}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>

            {activeWorkspace ? (
              <Card>
                <CardHeader>
                  <CardTitle>Workspace data panel</CardTitle>
                  <p className="text-sm text-muted-foreground">Project/campaign/plan/gallery summaries for this workspace.</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  {Object.entries(workspaceOverview).length ? (
                    Object.entries(workspaceOverview).map(([key, value]) => {
                      const count = Array.isArray(value) ? value.length : 0;
                      return (
                        <div key={key} className="rounded-2xl border border-border/70 bg-muted/35 px-4 py-3">
                          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{key.replace(/_/g, " ")}</p>
                          <p className="mt-2 text-lg font-semibold text-foreground">{count}</p>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-sm text-muted-foreground">No workspace records yet.</p>
                  )}

                  {activeWorkspace.id === "seo-growth-os" && Array.isArray(workspaceOverview.keyword_clusters) ? (
                    <div className="rounded-2xl border border-cyan-400/25 bg-cyan-500/5 p-4">
                      <p className="text-xs uppercase tracking-[0.16em] text-cyan-300">Topical map view</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {(workspaceOverview.keyword_clusters as Array<Record<string, unknown>>).slice(0, 12).map((cluster, i) => (
                          <span key={`${String(cluster.id ?? i)}`} className="rounded-full border border-cyan-400/30 px-3 py-1 text-xs text-cyan-200">
                            {String(cluster.topic ?? cluster.name ?? `Cluster ${i + 1}`)}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {activeWorkspace.id === "linkedin-authority-os" ? (
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="rounded-2xl border border-indigo-400/25 bg-indigo-500/5 p-4">
                        <p className="text-xs uppercase tracking-[0.16em] text-indigo-300">Content calendar</p>
                        <div className="mt-3 space-y-2 text-sm">
                          {["Mon • Authority post", "Wed • Carousel", "Fri • Newsletter snippet"].map((slot) => (
                            <div key={slot} className="rounded-xl border border-indigo-300/20 px-3 py-2">{slot}</div>
                          ))}
                        </div>
                      </div>
                      <div className="rounded-2xl border border-indigo-400/25 bg-indigo-500/5 p-4">
                        <p className="text-xs uppercase tracking-[0.16em] text-indigo-300">Swipe file</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {[
                            "Contrarian hook",
                            "Founder story framework",
                            "Authority CTA",
                          ].map((item) => (
                            <span key={item} className="rounded-full border border-indigo-300/25 px-3 py-1 text-xs">{item}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {activeWorkspace.id === "sales-outreach-os" ? (
                    <div className="rounded-2xl border border-emerald-400/25 bg-emerald-500/5 p-4">
                      <p className="text-xs uppercase tracking-[0.16em] text-emerald-300">Outreach sequence builder</p>
                      <div className="mt-3 grid gap-2 md:grid-cols-4 text-xs">
                        {["Step 1: Icebreaker", "Step 2: Value pitch", "Step 3: Objection reply", "Step 4: Follow-up CTA"].map((step) => (
                          <div key={step} className="rounded-xl border border-emerald-300/25 px-3 py-2">{step}</div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {activeWorkspace.id === "seo-growth-os" ? (
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="rounded-2xl border border-cyan-400/25 bg-cyan-500/5 p-4">
                        <p className="text-xs uppercase tracking-[0.16em] text-cyan-300">SERP preview planner</p>
                        <div className="mt-3 rounded-xl border border-cyan-300/20 p-3 text-xs">
                          <p className="text-cyan-200">zenovee.ai › seo-growth</p>
                          <p className="mt-1 font-medium">How to Build Topical Authority in 90 Days</p>
                          <p className="mt-1 text-cyan-100/80">Plan clusters, map internal links, and generate publish-ready briefs.</p>
                        </div>
                      </div>
                      <div className="rounded-2xl border border-cyan-400/25 bg-cyan-500/5 p-4">
                        <p className="text-xs uppercase tracking-[0.16em] text-cyan-300">Internal linking map</p>
                        <div className="mt-3 space-y-2 text-xs">
                          {["Pillar Page → Cluster A", "Cluster A → FAQ Hub", "Cluster B → Case Study"].map((link) => (
                            <div key={link} className="rounded-xl border border-cyan-300/20 px-3 py-2">{link}</div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {activeWorkspace.id === "ai-brand-studio" ? (
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="rounded-2xl border border-fuchsia-400/25 bg-fuchsia-500/5 p-4">
                        <p className="text-xs uppercase tracking-[0.16em] text-fuchsia-300">Style presets</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {["Luxury editorial", "Modern neon", "Minimal monochrome", "Bold ecommerce"].map((style) => (
                            <span key={style} className="rounded-full border border-fuchsia-300/25 px-3 py-1 text-xs">{style}</span>
                          ))}
                        </div>
                      </div>
                      <div className="rounded-2xl border border-fuchsia-400/25 bg-fuchsia-500/5 p-4">
                        <p className="text-xs uppercase tracking-[0.16em] text-fuchsia-300">Generation gallery</p>
                        <div className="mt-3 grid grid-cols-3 gap-2">
                          {[1, 2, 3, 4, 5, 6].map((tile) => (
                            <div key={tile} className="aspect-square rounded-lg border border-fuchsia-300/20 bg-gradient-to-br from-fuchsia-500/15 to-indigo-500/15" />
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            ) : null}

            <Card>
              <CardHeader>
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                  <div>
                    <CardTitle>Output panel</CardTitle>
                    <p className="mt-1 text-sm text-muted-foreground">Review, copy, save, export, or regenerate your result.</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button variant={activeTab === "result" ? "default" : "outline"} size="sm" onClick={() => setActiveTab("result")}>Result</Button>
                    <Button variant={activeTab === "history" ? "default" : "outline"} size="sm" onClick={() => setActiveTab("history")}><History size={14} /> History</Button>
                    <Button variant={activeTab === "saved" ? "default" : "outline"} size="sm" onClick={() => setActiveTab("saved")}><Bookmark size={14} /> Saved</Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                {activeTab === "result" ? (
                  result ? (
                    <>
                      <div className="flex flex-wrap items-center gap-2">
                        <Button variant={activeOutputView === "rendered" ? "default" : "outline"} size="sm" onClick={() => setActiveOutputView("rendered")}>Rendered</Button>
                        <Button variant={activeOutputView === "editor" ? "default" : "outline"} size="sm" onClick={() => setActiveOutputView("editor")}>Editor</Button>
                        <Button variant={activeOutputView === "insights" ? "default" : "outline"} size="sm" onClick={() => setActiveOutputView("insights")}>Insights</Button>
                        {resultExecutionId ? (
                          <Button variant="outline" size="sm" onClick={() => renameOutput(resultExecutionId, `${activeTool?.metadata.name ?? "Generated"} Output`)}>
                            Rename
                          </Button>
                        ) : null}
                        <Button variant="outline" size="sm" onClick={copyResult}><Copy size={14} /> Copy</Button>
                        <Button variant="outline" size="sm" onClick={() => void quickDownload(currentHistoryItem, primaryDownloadFormat)} disabled={!resultExecutionId || isExporting}><Download size={14} /> Quick export</Button>
                        <Button variant="outline" size="sm" onClick={() => void runTool("regenerate")} disabled={isLoading}><RefreshCcw size={14} /> Regenerate</Button>
                        {resultExecutionId ? (
                          <Button variant="outline" size="sm" onClick={() => toggleSavedOutput(resultExecutionId)}>
                            {savedOutputIds.includes(resultExecutionId) ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
                            {savedOutputIds.includes(resultExecutionId) ? "Saved" : "Save"}
                          </Button>
                        ) : null}
                        <select
                          className="h-9 rounded-xl border border-border/80 bg-background/90 px-3 text-sm shadow-[0_8px_18px_-18px_rgba(15,23,42,0.35)]"
                          value={resolvedExportFormat}
                          onChange={(e) => setExportFormat(e.target.value as ExportFormat)}
                          disabled={!resultExecutionId || isExporting}
                        >
                          {availableFormats.map((format) => (
                            <option key={format} value={format}>{format.toUpperCase()}</option>
                          ))}
                        </select>
                        <Button variant="outline" size="sm" onClick={() => void exportCurrentResult(resolvedExportFormat)} disabled={!resultExecutionId || isExporting}>
                          {isExporting ? <><Loader2 size={14} className="animate-spin" /> Exporting...</> : "Export"}
                        </Button>
                      </div>

                      <div className="surface-card p-5">
                        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                          <div>
                            <p className="premium-label">Output identity</p>
                            <h3 className="mt-3 text-xl font-semibold tracking-tight">{currentResultName}</h3>
                            <p className="mt-2 text-sm text-muted-foreground">Structured output ready to review, refine, save, and export.</p>
                          </div>
                          {generationMeta ? (
                            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                              <div className="stat-chip">Quality {generationMeta.qualityScore}/100</div>
                              <div className="stat-chip">Attempts {generationMeta.attempts}</div>
                              <div className="stat-chip">Mode {generationMeta.mode}</div>
                            </div>
                          ) : null}
                        </div>

                        {generationMeta ? (
                          <div className="mt-4 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                            <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                              <p className="text-sm font-medium">Generation settings used</p>
                              <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                                <p><span className="font-medium text-foreground">Tone:</span> {generationMeta.controls.tone}</p>
                                <p><span className="font-medium text-foreground">Writing style:</span> {generationMeta.controls.writingStyle}</p>
                                <p><span className="font-medium text-foreground">Output length:</span> {generationMeta.controls.outputLength}</p>
                                <p><span className="font-medium text-foreground">Language:</span> {generationMeta.controls.language}</p>
                                <p><span className="font-medium text-foreground">Generation mode:</span> {generationMeta.mode}</p>
                              </div>
                            </div>

                            <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                              <p className="text-sm font-medium">Section coverage</p>
                              <div className="mt-3 flex flex-wrap gap-2">
                                {generationMeta.outputSections.map((section) => (
                                  <span key={section} className="rounded-full border border-white/10 px-3 py-1 text-[11px] text-muted-foreground">
                                    {section}
                                  </span>
                                ))}
                              </div>
                              {generationMeta.validationIssues.length ? (
                                <div className="mt-4">
                                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Validation notes</p>
                                  <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                                    {generationMeta.validationIssues.map((issue) => (
                                      <li key={issue}>• {issue}</li>
                                    ))}
                                  </ul>
                                </div>
                              ) : (
                                <p className="mt-4 text-sm text-emerald-300">Quality checks passed.</p>
                              )}
                            </div>
                          </div>
                        ) : null}
                      </div>

                      {activeOutputView === "rendered" ? (
                        <OutputWorkspace result={result} outputType={activeTool?.metadata.outputType} previewText={previewText} />
                      ) : null}

                      {activeOutputView === "editor" ? (
                        <div className="space-y-4">
                          {editableSections.map((section) => (
                            <div key={section.id} className="rounded-3xl border border-white/10 bg-white/[0.02] p-4">
                              <div className="mb-3 flex items-center justify-between gap-2">
                                <p className="text-sm font-medium">{section.title}</p>
                                <div className="flex gap-2">
                                  <Button size="sm" variant="outline" onClick={() => togglePinSection(section.id)}><Pin size={13} /> {section.pinned ? "Pinned" : "Pin"}</Button>
                                  <Button size="sm" variant="outline" onClick={() => duplicateSection(section.id)}>Duplicate</Button>
                                  <Button size="sm" variant="outline" onClick={() => void runTool("improve")} disabled={isLoading}>Rewrite</Button>
                                </div>
                              </div>
                              <Textarea value={section.content} onChange={(e) => updateSectionContent(section.id, e.target.value)} className="min-h-28 rounded-2xl" />
                            </div>
                          ))}
                        </div>
                      ) : null}

                      {activeOutputView === "insights" ? (
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="rounded-3xl border border-white/10 p-4">
                            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Workflow continuity</p>
                            <p className="mt-2 text-sm">Drafts are persisted per workspace module with reusable context and favorite tools.</p>
                          </div>
                          <div className="rounded-3xl border border-white/10 p-4">
                            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Output quality layer</p>
                            <p className="mt-2 text-sm">Structured rendering + editable sections + revisions improve publish-readiness.</p>
                          </div>
                          <div className="rounded-3xl border border-white/10 p-4">
                            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Recent workspaces</p>
                            <p className="mt-2 text-sm">{workspaceRecents.length ? workspaceRecents.join(" • ") : "No recent workspace activity yet."}</p>
                          </div>
                          <div className="rounded-3xl border border-white/10 p-4">
                            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Premium confidence signals</p>
                            <p className="mt-2 text-sm">Stage-by-stage generation, quality metadata, and one-click regeneration are active.</p>
                          </div>
                        </div>
                      ) : null}

                      {currentHistoryItem?.exports?.length ? (
                        <div className="surface-card p-5">
                          <p className="text-sm font-medium">Existing exports</p>
                          <div className="mt-4 flex flex-wrap gap-2">
                            {currentHistoryItem.exports.map((file) => (
                              <Button key={file.id} variant="outline" size="sm" onClick={() => void redownloadExport(file.id)}>
                                {String(file.file_type).toUpperCase()}
                              </Button>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </>
                  ) : (
                    <div className="surface-muted px-6 py-10 text-center">
                      <p className="text-lg font-semibold">No output yet</p>
                      <p className="mt-2 text-sm text-muted-foreground">Choose a tool, add your brief, and generate your first result.</p>
                    </div>
                  )
                ) : activeTab === "history" ? (
                  history.length ? (
                    <div className="space-y-4">
                      {history.map((item) => (
                        <div key={item.id} className="surface-card p-5">
                          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                            <div>
                              <p className="text-sm font-medium text-foreground">{outputNames[item.id] ?? item.tool_name}</p>
                              <p className="mt-1 text-xs text-muted-foreground">{formatGlobalDateTime(item.created_at)} • {item.credits_consumed} credits</p>
                              <div className="mt-3 flex flex-wrap gap-2">
                                {item.exports.map((file) => (
                                  <span key={file.id} className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-muted-foreground">
                                    {String(file.file_type).toUpperCase()}
                                  </span>
                                ))}
                                {savedOutputIds.includes(item.id) ? <span className="rounded-full bg-primary/15 px-2.5 py-1 text-[11px] text-primary">Saved</span> : null}
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              <Button variant="outline" size="sm" onClick={() => renameOutput(item.id, item.tool_name)}>Rename</Button>
                              <Button variant="outline" size="sm" onClick={() => reopenHistoryItem(item)}>Reopen</Button>
                              <Button variant="outline" size="sm" onClick={() => duplicateGeneration(item)}>Duplicate</Button>
                              <Button variant="outline" size="sm" onClick={() => toggleSavedOutput(item.id)}>
                                {savedOutputIds.includes(item.id) ? "Unsave" : "Save"}
                              </Button>
                        <Button variant="outline" size="sm" onClick={() => void quickDownload(item, primaryDownloadFormat)} disabled={isExporting}>Download</Button>
                              <Button variant="outline" size="sm" onClick={() => void deleteGeneration(item.id)}>Delete</Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="surface-muted px-6 py-10 text-center">
                      <p className="text-lg font-semibold">No generations yet</p>
                      <p className="mt-2 text-sm text-muted-foreground">Your recent runs will appear here after the first generation.</p>
                    </div>
                  )
                ) : savedHistoryItems.length ? (
                  <div className="space-y-4">
                    {savedHistoryItems.map((item) => (
                      <div key={item.id} className="surface-card p-5">
                        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                          <div>
                            <p className="text-sm font-medium text-foreground">{outputNames[item.id] ?? item.tool_name}</p>
                            <p className="mt-1 text-xs text-muted-foreground">Saved from {formatGlobalDateTime(item.created_at)}</p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Button variant="outline" size="sm" onClick={() => renameOutput(item.id, item.tool_name)}>Rename</Button>
                            <Button variant="outline" size="sm" onClick={() => reopenHistoryItem(item)}>Open</Button>
                            <Button variant="outline" size="sm" onClick={() => duplicateGeneration(item)}>Duplicate</Button>
                            <Button variant="outline" size="sm" onClick={() => toggleSavedOutput(item.id)}>Remove</Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="surface-muted px-6 py-10 text-center">
                    <p className="text-lg font-semibold">No saved outputs yet</p>
                    <p className="mt-2 text-sm text-muted-foreground">Save your strongest results here for quick reuse and export.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
