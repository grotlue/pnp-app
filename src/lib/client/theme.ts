type ThemeMode = "light" | "dark";

const THEME_STORAGE_KEY = "pnp.theme.mode";
const THEME_EVENT = "pnp-theme-changed";
const DEFAULT_THEME_MODE: ThemeMode = "light";

const isThemeMode = (value: string): value is ThemeMode => {
  return value === "light" || value === "dark";
};

const getThemeMode = (): ThemeMode => {
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
};

const applyThemeMode = (mode: ThemeMode) => {
  if (typeof document === "undefined") {
    return;
  }

  const root = document.documentElement;
  root.classList.toggle("dark", mode === "dark");
  root.dataset.theme = mode;
};

const initializeThemeMode = () => {
  applyThemeMode(getThemeMode());
};

const setThemeMode = (mode: ThemeMode) => {
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
};

const getThemeEventName = () => {
  return THEME_EVENT;
};

export type { ThemeMode };
export {
  applyThemeMode,
  getThemeEventName,
  getThemeMode,
  initializeThemeMode,
  setThemeMode,
};
