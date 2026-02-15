import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AppProviders } from "../providers";
import HomePage from "../page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

describe("Home page", () => {
  it("renders logged-out login form", async () => {
    const ui = await HomePage({
      searchParams: Promise.resolve({}),
    });
    render(<AppProviders>{ui}</AppProviders>);

    expect(await screen.findByRole("button", { name: "Login" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Register" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Forgot password?" })).toBeInTheDocument();
  });

  it("hides register link when self-registration is disabled", async () => {
    process.env.APP_ENV = "production";
    try {
      const ui = await HomePage({
        searchParams: Promise.resolve({}),
      });
      render(<AppProviders>{ui}</AppProviders>);

      expect(await screen.findByRole("button", { name: "Login" })).toBeInTheDocument();
      expect(screen.queryByRole("link", { name: "Register" })).not.toBeInTheDocument();
    } finally {
      delete process.env.APP_ENV;
    }
  });
});
