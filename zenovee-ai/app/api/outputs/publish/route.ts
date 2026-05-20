import { NextResponse } from "next/server";

export async function POST(req: Request) {
  void req;
  return NextResponse.json(
    { error: "Public publishing is unavailable in the current launch MVP." },
    { status: 410 }
  );
}