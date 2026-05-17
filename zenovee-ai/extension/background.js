import { QUICK_TOOLS, apiFetch, getPreferences, getSession, getTabContext } from "./shared.js";

const MENU_ROOT = "zenovee-root";

chrome.runtime.onInstalled.addListener(async () => {
  chrome.contextMenus.create({ id: MENU_ROOT, title: "Zenovee AI", contexts: ["selection"] });

  QUICK_TOOLS.forEach((tool) => {
    chrome.contextMenus.create({
      id: tool.id,
      parentId: MENU_ROOT,
      title: tool.label,
      contexts: ["selection"],
    });
  });

  chrome.runtime.openOptionsPage();
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!QUICK_TOOLS.some((tool) => tool.id === info.menuItemId)) {
    return;
  }

  try {
    const session = await getSession();
    if (!session?.access_token) {
      chrome.notifications.create({
        type: "basic",
        iconUrl: "icons/icon-48.png",
        title: "Zenovee AI",
        message: "Please sign in from the extension popup first.",
      });
      return;
    }

    const context = await getTabContext();
    const preferences = await getPreferences();
    const payload = {
      toolId: info.menuItemId,
      input: {
        selectedText: info.selectionText || context.selectedText,
        pageTitle: tab?.title || context.pageTitle,
        pageUrl: tab?.url || context.pageUrl,
        pageContext: context.pageContext,
        tone: "Professional",
        audience: "General audience",
        objective: preferences.preferredAction,
        platform: "Web",
      },
    };

    const response = await apiFetch("/api/extension/generate", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    await chrome.storage.local.set({ zenovee_last_generation: response });

    if (preferences.notifications) {
      chrome.notifications.create({
        type: "basic",
        iconUrl: "icons/icon-48.png",
        title: `${payload.toolId} complete`,
        message: `Generation succeeded. Credits left: ${response.metrics.creditsAfter}`,
      });
    }
  } catch (error) {
    chrome.notifications.create({
      type: "basic",
      iconUrl: "icons/icon-48.png",
      title: "Zenovee AI error",
      message: error instanceof Error ? error.message : "Generation failed.",
    });
  }
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== "zenovee-generate") {
    return undefined;
  }

  (async () => {
    try {
      const response = await apiFetch("/api/extension/generate", {
        method: "POST",
        body: JSON.stringify(message.payload),
      });
      sendResponse({ ok: true, data: response });
    } catch (error) {
      sendResponse({ ok: false, error: error instanceof Error ? error.message : "Generation failed." });
    }
  })();

  return true;
});