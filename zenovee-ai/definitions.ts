import { z } from "zod";
import type { ToolDefinition } from "@/types/tools";

const textInput = z.object({
  prompt: z.string().min(10, "Please enter at least 10 characters."),
});

const textOutput = z.object({
  generatedText: z.string().min(1),
});

const codeInput = z.object({
  description: z.string().min(10, "Please describe the code task in more detail."),
  language: z.string().min(2).default("typescript"),
});

const codeOutput = z.object({
  generatedCode: z.string().min(1),
  explanation: z.string().min(1),
});

const textGenerationTool: ToolDefinition<z.infer<typeof textInput>, z.infer<typeof textOutput>> = {
  id: "text-generation",
  metadata: {
    name: "Text Generator",
    description: "Generate polished copy, summaries, or messaging from a prompt.",
    category: "Writing",
    icon: "sparkles",
  },
  fields: [{ name: "prompt", label: "Prompt", type: "textarea", required: true }],
  inputSchema: textInput,
  outputSchema: textOutput,
  creditCost: 10,
  aiModel: "gemini-2.0-flash",
  promptTemplate: ({ prompt }) =>
    `You are a premium SaaS AI writer. Generate a concise, high-quality response for this prompt:\n\n${prompt}`,
  outputFormatter: (response) => ({ generatedText: response.trim() }),
};

const codeGenerationTool: ToolDefinition<z.infer<typeof codeInput>, z.infer<typeof codeOutput>> = {
  id: "code-generation",
  metadata: {
    name: "Code Generator",
    description: "Create implementation-ready code with a short explanation.",
    category: "Development",
    icon: "code",
  },
  fields: [
    { name: "description", label: "Requirements", type: "textarea", required: true },
    {
      name: "language",
      label: "Language",
      type: "select",
      required: true,
      options: [
        { label: "TypeScript", value: "typescript" },
        { label: "JavaScript", value: "javascript" },
        { label: "Python", value: "python" },
      ],
    },
  ],
  inputSchema: codeInput,
  outputSchema: codeOutput,
  creditCost: 20,
  aiModel: "gemini-1.5-pro",
  promptTemplate: ({ description, language }) =>
    `You are an expert ${language} engineer. Produce production-ready ${language} code for the following request:\n\n${description}\n\nReturn plain text with the code first, then a short explanation.`,
  outputFormatter: (response) => {
    const [first, ...rest] = response.trim().split(/\n\n+/);
    return {
      generatedCode: first?.trim() || response.trim(),
      explanation: rest.join("\n\n").trim() || "Generated successfully.",
    };
  },
};

export const toolRegistry: Record<string, ToolDefinition> = {
  "text-generation": textGenerationTool as ToolDefinition,
  "code-generation": codeGenerationTool as ToolDefinition,
};

export const getToolDefinition = (toolId: string): ToolDefinition | undefined => toolRegistry[toolId];
export const listToolDefinitions = () => Object.values(toolRegistry);