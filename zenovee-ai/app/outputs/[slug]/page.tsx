import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { OutputRenderer } from "@/components/tools/output-renderer";

type OutputPageParams = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return [];
}

export default async function PublishedOutputPage({ params }: OutputPageParams) {
  const user = await requireUser();
  const { slug } = await params;
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("tool_usage")
    .select("id,tool_name,output,credits_consumed,created_at")
    .eq("id", slug)
    .eq("user_id", user.id)
    .maybeSingle<{
      id: string;
      tool_name: string;
      output: unknown;
      credits_consumed: number;
      created_at: string;
    }>();

  if (!data) {
    notFound();
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 md:px-8">
      <section className="rounded-2xl border border-border bg-card p-5 md:p-7">
        <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Generated Output</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">{data.tool_name}</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          {new Date(data.created_at).toLocaleString("en-IN")} • {data.credits_consumed} credits
        </p>
      </section>

      <section className="mt-4 rounded-2xl border border-border bg-card p-5 md:p-7">
        <OutputRenderer value={data.output} />
      </section>
    </main>
  );
}