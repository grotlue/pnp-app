import { expect, test } from "@playwright/test";

test("home page renders login form for logged-out users", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator("main input[type='email']").first()).toBeVisible();
  await expect(
    page.locator("main input[type='password']").first(),
  ).toBeVisible();
  await expect(page.locator("main button").first()).toBeVisible();
  await expect(page.locator("main a[href='/password-reset']")).toBeVisible();
});
