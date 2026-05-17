import { QUICK_TOOLS, applyTheme, getPreferences, setPreferences, showToast } from "./shared.js";

const theme = document.getElementById("theme");
const preferredAction = document.getElementById("preferred-action");
const shortcut = document.getElementById("shortcut");
const notifications = document.getElementById("notifications");

QUICK_TOOLS.forEach((tool) => {
  const option = document.createElement("option");
  option.value = tool.id;
  option.textContent = tool.label;
  preferredAction.appendChild(option);
});

initialize();

async function initialize() {
  const preferences = await getPreferences();
  theme.value = preferences.theme;
  preferredAction.value = preferences.preferredAction;
  shortcut.value = preferences.keyboardShortcut;
  notifications.checked = Boolean(preferences.notifications);
  applyTheme(preferences.theme);
}

document.getElementById("save-settings").addEventListener("click", async () => {
  const preferences = {
    theme: theme.value,
    preferredAction: preferredAction.value,
    keyboardShortcut: shortcut.value.trim() || "Alt+Shift+Z",
    notifications: notifications.checked,
  };

  await setPreferences(preferences);
  applyTheme(preferences.theme);
  showToast("Preferences saved.");
});