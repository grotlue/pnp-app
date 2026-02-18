import { expect, test } from "@playwright/test";
import { E2E_USERS } from "./support/fixture-users";

test("FLOW-AUTH-ADMIN-MFA-SETUP-REDIRECT @smoke @auth admin login reaches MFA challenge and shows setup path when no verified factor exists", async ({
  page,
}) => {
  await page.goto("/");

  await page
    .locator("main input[type='email']")
    .first()
    .fill(E2E_USERS.admin.email);
  await page
    .locator("main input[type='password']")
    .first()
    .fill(E2E_USERS.admin.password);
  await page.locator("main button").first().click();

  await expect(page).toHaveURL(/\/admin\/mfa-challenge/);
  await expect(page.locator("a[href='/settings'] button")).toBeVisible();
});
