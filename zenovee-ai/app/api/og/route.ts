import { ImageResponse } from "next/og";
import { createElement } from "react";

export const runtime = "edge";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get("title") || "Zenovee AI";
  const subtitle = searchParams.get("subtitle") || "AI tools platform";

  return new ImageResponse(
    createElement(
      "div",
      {
        style: {
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #0f172a 0%, #1d4ed8 50%, #7c3aed 100%)",
          color: "white",
          padding: "64px",
          fontFamily: "sans-serif",
        },
      },
      createElement("div", { style: { fontSize: 28, opacity: 0.9 } }, "Zenovee AI"),
      createElement(
        "div",
        { style: { display: "flex", flexDirection: "column", gap: 20 } },
        createElement("div", { style: { fontSize: 68, lineHeight: 1.08, fontWeight: 700 } }, title),
        createElement("div", { style: { fontSize: 28, opacity: 0.88, maxWidth: "85%" } }, subtitle),
      ),
      createElement(
        "div",
        { style: { fontSize: 22, opacity: 0.7 } },
        "AI tools for SEO, marketing, SaaS growth, and productivity",
      ),
    ),
    { width: 1200, height: 630 },
  );
}