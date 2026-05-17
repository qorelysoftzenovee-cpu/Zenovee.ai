import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  createExportForToolUsage,
  deleteExportForUser,
  deleteGenerationForUser,
  getSignedExportForUser,
} from "@/services/export-system";

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unexpected error occurred.";
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { toolUsageId, format } = await req.json();
    const data = await createExportForToolUsage({ userId: user.id, toolUsageId, format });
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 400 });
  }
}

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const exportId = searchParams.get("id");
    if (!exportId) return NextResponse.json({ error: "Export id is required." }, { status: 400 });

    const data = await getSignedExportForUser({ userId: user.id, exportId });
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id, kind } = await req.json();
    if (kind === "generation") {
      await deleteGenerationForUser({ userId: user.id, generationId: id });
    } else {
      await deleteExportForUser({ userId: user.id, exportId: id });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 400 });
  }
}