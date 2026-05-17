import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/json-ld";
import { createArticleSchema, createMetadata } from "@/lib/seo/site";
import { supabaseAdmin } from "@/lib/supabase/admin";

function safeParseOutput(value: string | null) {
  if (!value) return null;
  try {
    return JSON.parse(value) as Record<string, unknown>;
  } catch {
    return { result: value };
  }
}

function renderValue(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map((item) => renderValue(item)).join("\n• ");
  return Object.entries(value as Record<string, unknown>)
    .map(([key, item]) => `${key}: ${renderValue(item)}`)
    .join("\n");
}

async function getPublishedOutput(slug: string) {
  const { data } = await supabaseAdmin
    .from("generation_history")
    .select("id,tool_id,tool_usage_id,output,metadata,created_at")
    .filter("metadata->>publicSlug", "eq", slug)
    .filter("metadata->>isPublic", "eq", "true")
    .limit(1)
    .maybeSingle();

  return data;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const output = await getPublishedOutput(slug);
  if (!output) return {};
  const metadata = (output.metadata as Record<string, unknown> | null) ?? {};

  return createMetadata({
    title: String(metadata.publishedTitle || `${output.tool_id} published output`),
    description: String(metadata.publishedDescription || `Public AI output generated with ${output.tool_id}.`),
    path: `/outputs/${slug}`,
    type: "article",
  });
}

export default async function PublishedOutputPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const output = await getPublishedOutput(slug);
  if (!output) notFound();

  const metadata = (output.metadata as Record<string, unknown> | null) ?? {};
  const parsed = safeParseOutput(output.output);
  const title = String(metadata.publishedTitle || `Published output from ${output.tool_id}`);
  const description = String(metadata.publishedDescription || `Public AI output generated with ${output.tool_id}.`);

  return (
    <main className="min-h-screen bg-background">
      <JsonLd data={createArticleSchema({ title, description, path: `/outputs/${slug}`, publishedTime: String(metadata.publishedAt || output.created_at), category: "Published Output" })} />
      <section className="section-shell py-16 md:py-20 space-y-8">
        <div className="max-w-3xl space-y-4">
          <p className="text-sm text-accent">Public output</p>
          <h1 className="text-4xl font-semibold tracking-tight">{title}</h1>
          <p className="text-lg text-muted-foreground">{description}</p>
        </div>

        <div className="rounded-3xl border bg-card p-6 md:p-8">
          {parsed && typeof parsed === "object" ? (
            <div className="grid gap-6">
              {Object.entries(parsed).map(([key, value]) => (
                <section key={key} className="rounded-2xl border p-5">
                  <h2 className="text-xl font-semibold capitalize">{key.replace(/([a-z])([A-Z])/g, "$1 $2")}</h2>
                  <pre className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">{renderValue(value)}</pre>
                </section>
              ))}
            </div>
          ) : (
            <pre className="whitespace-pre-wrap text-sm text-muted-foreground">{renderValue(parsed)}</pre>
          )}
        </div>
      </section>
    </main>
  );
}