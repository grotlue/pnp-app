import { expect, test } from "@playwright/test";
import {
  expectClientSessionSet,
  loginAsUser,
  logoutFromHeader,
} from "./support/auth";
import { E2E_USERS } from "./support/fixture-users";
import { clearMailpitMessages, waitForMailpitLink } from "./support/mailpit";

test.describe.configure({ mode: "serial" });

function uniqueEmail() {
  return `e2e.auth.${Date.now()}@pnp.test`;
}

test("FLOW-auth-user-registration-login-logout @smoke @auth user registration, login, logout, and session lifecycle work end-to-end", async ({
  page,
}) => {
  const registeredUser = {
    email: uniqueEmail(),
    password: "RegisteredUser123",
    username: `e2e-user-${Date.now()}`,
  };
  const registrationRequestedAt = Date.now();

  await clearMailpitMessages();
  await page.goto("/register");
  await page.locator("main input").nth(0).fill(registeredUser.username);
  await page.locator("main input[type='email']").fill(registeredUser.email);
  await page
    .locator("main input[type='password']")
    .fill(registeredUser.password);
  await page.locator("main button").first().click();

  await expect(page).toHaveURL(/\/(\?registered=1)?$/);

  const confirmationLink = await waitForMailpitLink({
    recipient: registeredUser.email,
    subjectIncludes: "confirm",
    afterUnixMs: registrationRequestedAt,
  });

  await page.goto(confirmationLink);
  await expect(page).toHaveURL(/\/$/);

  const logoutButtons = page.getByRole("button", { name: /logout|abmelden/i });
  const hasLogoutButton = await logoutButtons
    .first()
    .isVisible()
    .catch(() => false);
  if (!hasLogoutButton) {
    await loginAsUser(page, {
      email: registeredUser.email,
      password: registeredUser.password,
    });
  }

  await expectClientSessionSet(page);
  await logoutFromHeader(page);
});

test("FLOW-auth-user-password-reset @smoke @auth user password reset issues valid recovery link and allows login with new password", async ({
  page,
}) => {
  const resetPassword = "PlayerReset12345";
  const resetRequestedAt = Date.now();

  await clearMailpitMessages();
  await page.goto("/password-reset");
  await page
    .locator("main input[type='email']")
    .fill(E2E_USERS.playerOne.email);
  await page.locator("main button").first().click();

  const resetLink = await waitForMailpitLink({
    recipient: E2E_USERS.playerOne.email,
    subjectIncludes: "reset",
    afterUnixMs: resetRequestedAt,
  });

  await page.goto(resetLink);
  await expect(page).toHaveURL(/\/auth\/reset-password/);

  await page.locator("main input[type='password']").first().fill(resetPassword);
  await page.locator("main button").first().click();
  await expect(page).toHaveURL(/\/$/);

  const logoutButtons = page.getByRole("button", { name: /logout|abmelden/i });
  const hasActiveSession = await logoutButtons
    .first()
    .isVisible()
    .catch(() => false);

  if (hasActiveSession) {
    await expectClientSessionSet(page);
    await logoutFromHeader(page);
  }

  await loginAsUser(page, {
    email: E2E_USERS.playerOne.email,
    password: resetPassword,
  });
  await expect(
    page.getByRole("button", { name: /logout|abmelden/i }).first(),
  ).toBeVisible();

  await page.goto("/settings");
  await page
    .locator("main input[type='password']")
    .first()
    .fill(E2E_USERS.playerOne.password);
  await page
    .getByRole("button", { name: /change password|passwort ändern/i })
    .click();
  await expect(
    page.getByText(/saved successfully|erfolgreich gespeichert/i).first(),
  ).toBeVisible();

  await logoutFromHeader(page);
});
