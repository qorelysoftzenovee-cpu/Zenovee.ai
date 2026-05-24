export type PremiumRenderSection = {
  id: string;
  heading: string;
  body: string;
  bullets: string[];
};

export type PremiumToolOutput = {
  version: "v2";
  title: string;
  summary: string;
  sections: PremiumRenderSection[];
  raw: Record<string, unknown>;
  actions: {
    copy: boolean;
    export: boolean;
    regenerate: boolean;
    improve: boolean;
  };
};

function toText(value: unknown) {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map((item) => String(item ?? "")).join("\n");
  if (value && typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value ?? "");
}

function toBullets(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 8).map((item) => String(item ?? "").trim()).filter(Boolean);
}

export class ToolFormattingService {
  static formatPremiumOutput(toolName: string, output: Record<string, unknown>): PremiumToolOutput {
    const entries = Object.entries(output);
    const sections: PremiumRenderSection[] = entries.map(([key, value], index) => ({
      id: `section-${index + 1}`,
      heading: key.replace(/([A-Z])/g, " $1").replace(/[_-]/g, " ").replace(/^\w/, (c) => c.toUpperCase()),
      body: toText(value),
      bullets: toBullets(value),
    }));

    const summary = sections[0]?.body.slice(0, 220) ?? "Generated successfully.";

    return {
      version: "v2",
      title: toolName,
      summary,
      sections,
      raw: output,
      actions: {
        copy: true,
        export: true,
        regenerate: true,
        improve: true,
      },
    };
  }
}
