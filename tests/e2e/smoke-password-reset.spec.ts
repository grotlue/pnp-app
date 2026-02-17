import { expect, test } from "@playwright/test";

test("password reset page renders expected controls", async ({ page }) => {
  await page.goto("/password-reset");

  await expect(
    page.getByRole("heading", { name: "Password Reset" }),
  ).toBeVisible();
  await expect(page.getByPlaceholder("Email")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Send reset email" }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Back to login" })).toBeVisible();
});
