import {
  QUICK_TOOLS,
  apiFetch,
  applyTheme,
  clearSession,
  getPreferences,
  getSession,
  getTabContext,
  setSession,
  showToast,
  signIn,
} from "./shared.js";

const authView = document.getElementById("auth-view");
const appView = document.getElementById("app-view");
const authMessage = document.getElementById("auth-message");
const toolGrid = document.getElementById("tool-grid");
const historyList = document.getElementById("history-list");
const creditsValue = document.getElementById("credits-value");
const userEmail = document.getElementById("user-email");
const resultTitle = document.getElementById("result-title");
const resultBody = document.getElementById("result-body");

let latestResult = null;

initialize();

async function initialize() {
  const preferences = await getPreferences();
  applyTheme(preferences.theme);

  document.getElementById("open-settings").addEventListener("click", () => chrome.runtime.openOptionsPage());
  document.getElementById("login-button").addEventListener("click", handleLogin);
  document.getElementById("logout-button").addEventListener("click", handleLogout);
  document.getElementById("copy-result").addEventListener("click", async () => {
    if (!latestResult?.result) return;
    await navigator.clipboard.writeText(latestResult.result);
    showToast("Copied to clipboard.");
  });

  const session = await getSession();
  if (!session?.access_token) {
    showAuth();
    return;
  }

  await hydrateApp();
}

function showAuth() {
  authView.classList.remove("hidden");
  appView.classList.add("hidden");
}

function showApp() {
  authView.classList.add("hidden");
  appView.classList.remove("hidden");
}

async function handleLogin() {
  authMessage.textContent = "Signing you in...";
  try {
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    await signIn(email, password);
    authMessage.textContent = "";
    await hydrateApp();
  } catch (error) {
    authMessage.textContent = error instanceof Error ? error.message : "Unable to sign in.";
  }
}

async function handleLogout() {
  await clearSession();
  await setSession(null);
  showAuth();
}

async function hydrateApp() {
  showApp();
  const response = await apiFetch("/api/extension/session");
  const { user, credits, tools, history } = response.data;
  creditsValue.textContent = String(credits);
  userEmail.textContent = user.email;
  toolGrid.innerHTML = "";
  historyList.innerHTML = "";

  tools.forEach((tool) => {
    const button = document.createElement("button");
    button.className = "tool-btn";
    button.innerHTML = `<div>${tool.metadata.icon}</div><strong>${tool.metadata.name}</strong><div class="muted" style="font-size:12px;margin-top:4px;">${tool.creditCost} credits</div>`;
    button.addEventListener("click", () => runTool(tool.id));
    toolGrid.appendChild(button);
  });

  if (!tools.length) {
    QUICK_TOOLS.forEach((tool) => {
      const button = document.createElement("button");
      button.className = "tool-btn";
      button.textContent = tool.label;
      toolGrid.appendChild(button);
    });
  }

  history.forEach((item) => {
    const el = document.createElement("div");
    el.className = "history-item";
    const output = typeof item.output === "string" ? item.output : JSON.stringify(item.output);
    el.innerHTML = `<strong>${item.tool_name}</strong><div class="muted" style="font-size:12px; margin:4px 0 8px;">${new Date(item.created_at).toLocaleString()}</div><div style="font-size:13px; line-height:1.5;">${escapeHtml(output.slice(0, 140))}</div>`;
    historyList.appendChild(el);
  });
}

async function runTool(toolId) {
  try {
    const context = await getTabContext();
    if (!context.selectedText) {
      showToast("Select text on the page first.", "error");
      return;
    }

    const response = await apiFetch("/api/extension/generate", {
      method: "POST",
      body: JSON.stringify({
        toolId,
        input: {
          ...context,
          tone: "Professional",
          audience: "General audience",
          objective: "Improve browser workflow",
          platform: "Web",
        },
      }),
    });

    latestResult = response.data;
    resultTitle.textContent = response.data.title || "Generation complete";
    resultBody.textContent = response.data.result || JSON.stringify(response.data, null, 2);
    creditsValue.textContent = String(response.metrics.creditsAfter);

    const tab = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab[0]?.id) {
      chrome.tabs.sendMessage(tab[0].id, { type: "zenovee-inline-result", payload: response.data });
    }

    showToast(`Done. ${response.metrics.creditsAfter} credits remaining.`);
    await hydrateApp();
  } catch (error) {
    showToast(error instanceof Error ? error.message : "Generation failed.", "error");
  }
}

function escapeHtml(input) {
  return String(input)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}