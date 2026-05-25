import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  createExportForToolUsage,
  deleteExportForUser,
  deleteGenerationForUser,
  getSignedExportForUser,
} from "@/services/export-system";
import { safeErrorMessage } from "@/lib/runtime";

function classifyExportError(error: unknown) {
  const message = safeErrorMessage(error, "Unable to process export request.");
  const normalized = message.toLowerCase();

  if (normalized.includes("not found")) {
    return { message: "Requested export record was not found.", code: "EXPORT_NOT_FOUND", status: 404 };
  }
  if (normalized.includes("permission") || normalized.includes("unauthorized") || normalized.includes("forbidden")) {
    return { message: "You do not have access to this export resource.", code: "EXPORT_FORBIDDEN", status: 403 };
  }

  return { message, code: "EXPORT_OPERATION_FAILED", status: 400 };
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { toolUsageId, format } = await req.json();
    const data = await createExportForToolUsage({ userId: user.id, toolUsageId, format });
    return NextResponse.json({ success: true, data });
  } catch (error) {
    const classified = classifyExportError(error);
    return NextResponse.json({ success: false, error: classified.message, code: classified.code }, { status: classified.status });
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
    const classified = classifyExportError(error);
    return NextResponse.json({ success: false, error: classified.message, code: classified.code }, { status: classified.status });
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
    const classified = classifyExportError(error);
    return NextResponse.json({ success: false, error: classified.message, code: classified.code }, { status: classified.status });
  }
}