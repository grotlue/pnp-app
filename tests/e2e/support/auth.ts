import { expect, type Page } from "@playwright/test";
import { E2E_USERS } from "./fixture-users";

type LoginCredentials = {
  email: string;
  password: string;
};

export async function loginAsFixtureUser(
  page: Page,
  credentials: LoginCredentials = E2E_USERS.smokePlayer,
) {
  await page.goto("/");

  await page
    .locator("main input[type='email']")
    .first()
    .fill(credentials.email);
  await page
    .locator("main input[type='password']")
    .first()
    .fill(credentials.password);
  await page.locator("main button").first().click();

  await expect(page.locator("header a[href='/campaigns']")).toBeVisible();
}
