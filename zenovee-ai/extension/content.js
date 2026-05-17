const PANEL_ID = "zenovee-inline-panel";

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "zenovee-inline-result") {
    renderInlinePanel(message.payload);
    sendResponse({ ok: true });
  }
});

function renderInlinePanel(payload) {
  const existing = document.getElementById(PANEL_ID);
  if (existing) existing.remove();

  const panel = document.createElement("div");
  panel.id = PANEL_ID;
  panel.style.position = "fixed";
  panel.style.top = "20px";
  panel.style.right = "20px";
  panel.style.width = "360px";
  panel.style.maxHeight = "70vh";
  panel.style.overflow = "auto";
  panel.style.zIndex = "2147483647";
  panel.style.background = "#ffffff";
  panel.style.color = "#0f172a";
  panel.style.border = "1px solid rgba(15,23,42,.12)";
  panel.style.borderRadius = "18px";
  panel.style.boxShadow = "0 24px 60px rgba(15,23,42,.18)";
  panel.style.padding = "16px";
  panel.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:10px;">
      <strong>${payload?.title || "Zenovee AI"}</strong>
      <button id="zenovee-close-inline" style="border:0;background:#eef2ff;color:#4338ca;border-radius:999px;padding:6px 10px;cursor:pointer;">Close</button>
    </div>
    <div style="font-size:13px;line-height:1.6;white-space:pre-wrap;">${escapeHtml(payload?.result || "")}</div>
    <div style="margin-top:12px;display:grid;gap:8px;">
      ${(payload?.suggestions || []).map((item) => `<div style="padding:10px;border-radius:12px;background:#f8fafc;">• ${escapeHtml(item)}</div>`).join("")}
    </div>
  `;

  document.body.appendChild(panel);
  document.getElementById("zenovee-close-inline")?.addEventListener("click", () => panel.remove());
}

function escapeHtml(input) {
  return String(input)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}