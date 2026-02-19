export type ThemeMode = "light" | "dark";

const THEME_STORAGE_KEY = "pnp.theme.mode";
const THEME_EVENT = "pnp-theme-changed";
const DEFAULT_THEME_MODE: ThemeMode = "light";

function isThemeMode(value: string): value is ThemeMode {
  return value === "light" || value === "dark";
}

export function getThemeMode(): ThemeMode {
  if (typeof window === "undefined") {
    return DEFAULT_THEME_MODE;
  }

  try {
    const storedMode = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (storedMode && isThemeMode(storedMode)) {
      return storedMode;
    }
  } catch {
    // Ignore browser storage access errors and fall back to default mode.
  }

  return DEFAULT_THEME_MODE;
}

export function applyThemeMode(mode: ThemeMode) {
  if (typeof document === "undefined") {
    return;
  }

  const root = document.documentElement;
  root.classList.toggle("dark", mode === "dark");
  root.dataset.theme = mode;
}

export function initializeThemeMode() {
  applyThemeMode(getThemeMode());
}

export function setThemeMode(mode: ThemeMode) {
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch {
      // Ignore browser storage access errors and still apply the mode.
    }
  }

  applyThemeMode(mode);

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(THEME_EVENT));
  }
}

export function getThemeEventName() {
  return THEME_EVENT;
}
