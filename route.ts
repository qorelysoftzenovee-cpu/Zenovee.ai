import { NextRequest, NextResponse } from 'next/server';
import { ToolEngine } from '@/engine'; // Adjust path as needed
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const body = await req.json();
    const { toolId, input } = body;

    const engine = new ToolEngine(session.user.id);
    const result = await engine.executeTool(toolId, input);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json(
      { 
        error: error.message || "An error occurred during tool execution",
        details: error.stack 
      }, 
      { status: 500 }
    );
  }
}