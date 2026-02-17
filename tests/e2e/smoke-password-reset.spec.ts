import { expect, test } from "@playwright/test";

test("password reset page renders expected controls", async ({ page }) => {
  await page.goto("/password-reset");

  await expect(page.locator("main input[type='email']")).toBeVisible();
  await expect(page.locator("main button")).toBeVisible();
  await expect(page.locator("main a[href='/']")).toBeVisible();
});
