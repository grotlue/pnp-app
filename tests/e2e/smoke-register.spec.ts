import { expect, test } from "@playwright/test";

test("FLOW-AUTH-REGISTER-ENTRY @smoke @auth register page renders expected controls", async ({
  page,
}) => {
  await page.goto("/register");

  await expect(page.locator("main input[type='email']")).toBeVisible();
  await expect(page.locator("main input[type='password']")).toBeVisible();
  await expect(page.locator("main button")).toBeVisible();
  await expect(page.locator("main a[href='/']")).toBeVisible();
});
