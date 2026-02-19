import { expect, test, type Page } from "@playwright/test";
import {
  expectClientSessionSet,
  loginAsUser,
  logoutFromHeader,
} from "./support/auth";
import { E2E_USERS } from "./support/fixture-users";
import { clearMailpitMessages, waitForMailpitLink } from "./support/mailpit";
import { extractTotpSecretFromUri, generateTotpCode } from "./support/totp";

test.describe.configure({ mode: "serial" });

const ADMIN_MFA_CHALLENGE_URL = /\/admin\/mfa-challenge/;
const SETUP_MFA_LABEL = /start mfa setup|mfa-setup starten/i;
const VERIFY_MFA_LABEL = /verify mfa code|mfa-code prüfen/i;
const MFA_CODE_PLACEHOLDER = /authenticator code|authenticator-code/i;

let adminTotpSecret: string | null = null;

async function completeAdminChallenge(page: Page, secret: string) {
  await page
    .getByPlaceholder(MFA_CODE_PLACEHOLDER)
    .fill(generateTotpCode(secret));
  await page.getByRole("button", { name: VERIFY_MFA_LABEL }).click();
  await expect(page).toHaveURL("/admin/users");
}

test("FLOW-auth-admin-mfa-and-dashboard @smoke @auth admin login enforces MFA and grants dashboard access after OTP challenge", async ({
  page,
}) => {
  await loginAsUser(page, E2E_USERS.admin);
  await expect(page).toHaveURL(ADMIN_MFA_CHALLENGE_URL);
  await expect(page.locator("a[href='/settings'] button")).toBeVisible();
  await expectClientSessionSet(page);

  await page.locator("a[href='/settings'] button").click();
  await expect(page).toHaveURL("/settings");

  await page.getByRole("button", { name: SETUP_MFA_LABEL }).click();
  const setupUriLocator = page.getByText(/otpauth:\/\/totp\//i).first();
  await expect(setupUriLocator).toBeVisible();
  const setupUri = await setupUriLocator.textContent();
  expect(setupUri).toBeTruthy();

  adminTotpSecret = extractTotpSecretFromUri(setupUri ?? "");
  await page
    .getByPlaceholder(MFA_CODE_PLACEHOLDER)
    .fill(generateTotpCode(adminTotpSecret));
  await page.getByRole("button", { name: VERIFY_MFA_LABEL }).click();
  await expect(
    page
      .getByText(/mfa enabled successfully|mfa erfolgreich aktiviert/i)
      .first(),
  ).toBeVisible();

  await page.goto("/admin/users");
  await expect(page).toHaveURL("/admin/users");
  await expect(
    page.getByRole("button", { name: /abmelden|logout/i }),
  ).toBeVisible();
  await logoutFromHeader(page);

  await loginAsUser(page, E2E_USERS.admin);
  await expect(page).toHaveURL(ADMIN_MFA_CHALLENGE_URL);
  await expect(page.locator("a[href='/settings'] button")).toHaveCount(0);
  await completeAdminChallenge(page, adminTotpSecret);
  await logoutFromHeader(page);
});

test("FLOW-auth-admin-dashboard-permissions @smoke @auth non-admin users are blocked from admin dashboard routes", async ({
  page,
}) => {
  await loginAsUser(page, E2E_USERS.smokePlayer);
  await page.goto("/admin/users");
  await expect(page).toHaveURL("/");
  await expect(
    page.getByRole("button", { name: /logout|abmelden/i }).first(),
  ).toBeVisible();
  await logoutFromHeader(page);
});

test("FLOW-auth-admin-password-reset @smoke @auth admin password reset works and still enforces OTP challenge on login", async ({
  page,
}) => {
  expect(adminTotpSecret).toBeTruthy();

  const resetPassword = "AdminReset12345";
  const resetRequestedAt = Date.now();

  await clearMailpitMessages();
  await page.goto("/password-reset");
  await page
    .locator("main input[type='email']")
    .first()
    .fill(E2E_USERS.admin.email);
  await page.locator("main button").first().click();

  const resetLink = await waitForMailpitLink({
    recipient: E2E_USERS.admin.email,
    subjectIncludes: "reset",
    afterUnixMs: resetRequestedAt,
  });

  await page.goto(resetLink);
  await expect(page).toHaveURL(/\/auth\/reset-password/);
  await page.locator("main input[type='password']").first().fill(resetPassword);
  await page.locator("main button").first().click();
  await expect(page).toHaveURL(/\/$/);

  await loginAsUser(page, {
    email: E2E_USERS.admin.email,
    password: resetPassword,
  });
  await expect(page).toHaveURL(ADMIN_MFA_CHALLENGE_URL);
  await completeAdminChallenge(page, adminTotpSecret ?? "");

  await page.goto("/settings");
  await page
    .locator("main input[type='password']")
    .first()
    .fill(E2E_USERS.admin.password);
  await page
    .getByRole("button", { name: /change password|passwort ändern/i })
    .click();
  await expect(
    page.getByText(/saved successfully|erfolgreich gespeichert/i).first(),
  ).toBeVisible();

  await logoutFromHeader(page);

  await loginAsUser(page, E2E_USERS.admin);
  await expect(page).toHaveURL(ADMIN_MFA_CHALLENGE_URL);
  await completeAdminChallenge(page, adminTotpSecret ?? "");
  await logoutFromHeader(page);
});
