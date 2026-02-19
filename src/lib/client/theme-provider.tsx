"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  applyThemeMode,
  getThemeEventName,
  getThemeMode,
  setThemeMode,
  type ThemeMode,
} from "@/lib/client/theme";

type ThemePreferenceContextValue = {
  themeMode: ThemeMode;
  setThemePreference: (mode: ThemeMode) => void;
  toggleThemePreference: () => void;
};

const ThemePreferenceContext =
  createContext<ThemePreferenceContextValue | null>(null);

type ThemePreferenceProviderProps = {
  children: ReactNode;
};

export function ThemePreferenceProvider({
  children,
}: ThemePreferenceProviderProps) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() =>
    getThemeMode(),
  );

  useEffect(() => {
    const syncThemeMode = () => {
      const mode = getThemeMode();
      setThemeModeState(mode);
      applyThemeMode(mode);
    };

    syncThemeMode();

    const themeEvent = getThemeEventName();
    window.addEventListener(themeEvent, syncThemeMode);
    window.addEventListener("storage", syncThemeMode);

    return () => {
      window.removeEventListener(themeEvent, syncThemeMode);
      window.removeEventListener("storage", syncThemeMode);
    };
  }, []);

  const setThemePreference = useCallback((mode: ThemeMode) => {
    setThemeModeState(mode);
    setThemeMode(mode);
  }, []);

  const toggleThemePreference = useCallback(() => {
    const nextMode = themeMode === "dark" ? "light" : "dark";
    setThemePreference(nextMode);
  }, [setThemePreference, themeMode]);

  const value = useMemo(
    () => ({
      themeMode,
      setThemePreference,
      toggleThemePreference,
    }),
    [setThemePreference, themeMode, toggleThemePreference],
  );

  return (
    <ThemePreferenceContext.Provider value={value}>
      {children}
    </ThemePreferenceContext.Provider>
  );
}

export function useThemePreference() {
  const context = useContext(ThemePreferenceContext);
  if (!context) {
    throw new Error(
      "useThemePreference must be used within ThemePreferenceProvider",
    );
  }

  return context;
}
