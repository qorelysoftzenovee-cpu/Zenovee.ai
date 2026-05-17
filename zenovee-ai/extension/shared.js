import { EXTENSION_CONFIG } from "./config.js";

export const QUICK_TOOLS = [
  { id: "browser-rewrite", label: "Rewrite Text", icon: "✍️" },
  { id: "browser-summarize", label: "Summarize", icon: "🧾" },
  { id: "browser-improve-writing", label: "Improve Writing", icon: "✨" },
  { id: "browser-seo-helper", label: "SEO Helper", icon: "🔎" },
  { id: "browser-ad-copy", label: "Ad Copy", icon: "📣" }
];

export async function getStorage(keys) {
  return chrome.storage.local.get(keys);
}

export async function setStorage(values) {
  return chrome.storage.local.set(values);
}

export async function getSession() {
  const store = await getStorage([EXTENSION_CONFIG.storageKeys.session]);
  return store[EXTENSION_CONFIG.storageKeys.session] ?? null;
}

export async function setSession(session) {
  await setStorage({ [EXTENSION_CONFIG.storageKeys.session]: session });
}

export async function clearSession() {
  await chrome.storage.local.remove(EXTENSION_CONFIG.storageKeys.session);
}

export async function getPreferences() {
  const store = await getStorage([EXTENSION_CONFIG.storageKeys.preferences]);
  return (
    store[EXTENSION_CONFIG.storageKeys.preferences] ?? {
      theme: "light",
      preferredAction: "browser-rewrite",
      keyboardShortcut: "Alt+Shift+Z",
      notifications: true,
    }
  );
}

export async function setPreferences(preferences) {
  await setStorage({ [EXTENSION_CONFIG.storageKeys.preferences]: preferences });
}

export function applyTheme(theme) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
}

export async function refreshSessionIfNeeded(session) {
  if (!session?.refresh_token || !session?.expires_at) {
    return session;
  }

  const shouldRefresh = Date.now() > session.expires_at - 60_000;
  if (!shouldRefresh) return session;

  const response = await fetch(`${EXTENSION_CONFIG.supabaseUrl}/auth/v1/token?grant_type=refresh_token`, {
    method: "POST",
    headers: {
      apikey: EXTENSION_CONFIG.supabaseAnonKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refresh_token: session.refresh_token }),
  });

  if (!response.ok) {
    await clearSession();
    throw new Error("Your session expired. Please sign in again.");
  }

  const data = await response.json();
  const nextSession = normalizeSession(data);
  await setSession(nextSession);
  return nextSession;
}

export function normalizeSession(payload) {
  return {
    access_token: payload.access_token,
    refresh_token: payload.refresh_token,
    expires_at: Date.now() + (payload.expires_in ?? 3600) * 1000,
    user: payload.user,
  };
}

export async function signIn(email, password) {
  const response = await fetch(`${EXTENSION_CONFIG.supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      apikey: EXTENSION_CONFIG.supabaseAnonKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error_description || data.msg || "Unable to sign in.");
  }

  const session = normalizeSession(data);
  await setSession(session);
  return session;
}

export async function apiFetch(path, init = {}) {
  let session = await getSession();
  session = await refreshSessionIfNeeded(session);

  if (!session?.access_token) {
    throw new Error("Please sign in to Zenovee AI.");
  }

  const response = await fetch(`${EXTENSION_CONFIG.backendBaseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
      ...(init.headers || {}),
    },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || "Request failed.");
  }

  return data;
}

export async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

export async function getTabContext() {
  const tab = await getActiveTab();
  if (!tab?.id) {
    throw new Error("No active tab found.");
  }

  const [{ result }] = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => {
      const selection = window.getSelection()?.toString().trim() || "";
      const pageContext = (document.body?.innerText || "").replace(/\s+/g, " ").slice(0, 2500);
      return {
        selectedText: selection,
        pageTitle: document.title || "",
        pageUrl: location.href,
        pageContext,
      };
    },
  });

  return result;
}

export function showToast(message, type = "info") {
  const el = document.createElement("div");
  el.className = `floating-toast ${type === "error" ? "error" : ""}`;
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2600);
}