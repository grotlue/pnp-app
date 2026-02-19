import { beforeEach, describe, expect, it } from "vitest";
import {
  getThemeMode,
  initializeThemeMode,
  setThemeMode,
} from "@/lib/client/theme";

describe("client theme mode", () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.classList.remove("dark");
    delete document.documentElement.dataset.theme;
  });

  it("defaults to light when no preference is stored", () => {
    expect(getThemeMode()).toBe("light");

    initializeThemeMode();
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(document.documentElement.dataset.theme).toBe("light");
  });

  it("persists and applies dark mode", () => {
    setThemeMode("dark");

    expect(getThemeMode()).toBe("dark");
    expect(window.localStorage.getItem("pnp.theme.mode")).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(document.documentElement.dataset.theme).toBe("dark");
  });

  it("initializes from stored preference on reload", () => {
    window.localStorage.setItem("pnp.theme.mode", "dark");

    initializeThemeMode();
    expect(getThemeMode()).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(document.documentElement.dataset.theme).toBe("dark");
  });
});
