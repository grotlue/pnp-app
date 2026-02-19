import {
  expect,
  type Page,
  type Response as PlaywrightResponse,
} from "@playwright/test";
import { E2E_USERS } from "./fixture-users";

type LoginCredentials = {
  email: string;
  password: string;
};

const SESSION_STORAGE_KEY = "pnp.session";
const LOGIN_API_PATH = "/api/auth/login";

type TimeoutOptions = {
  timeoutMs?: number;
};

export async function expectClientSessionSet(
  page: Page,
  options?: TimeoutOptions,
) {
  await expect
    .poll(
      async () =>
        page.evaluate((storageKey) => {
          const raw = window.localStorage.getItem(storageKey);
          if (!raw) {
            return false;
          }

          try {
            const parsed = JSON.parse(raw) as { accessToken?: string };
            return (
              typeof parsed.accessToken === "string" &&
              parsed.accessToken.length > 0
            );
          } catch {
            return false;
          }
        }, SESSION_STORAGE_KEY),
      {
        timeout: options?.timeoutMs ?? 15_000,
      },
    )
    .toBe(true);
}

export async function expectClientSessionCleared(page: Page) {
  await expect
    .poll(async () =>
      page.evaluate(
        (storageKey) => window.localStorage.getItem(storageKey),
        SESSION_STORAGE_KEY,
      ),
    )
    .toBeNull();
}

async function readResponseMessage(
  response: PlaywrightResponse,
): Promise<string> {
  try {
    const payload = (await response.json()) as {
      error?: { message?: string } | null;
    };
    return payload.error?.message ?? `HTTP ${response.status()}`;
  } catch {
    return `HTTP ${response.status()}`;
  }
}

async function expectApiSessionUsable(page: Page, options?: TimeoutOptions) {
  await expect
    .poll(
      async () =>
        page.evaluate(async (storageKey) => {
          const raw = window.localStorage.getItem(storageKey);
          if (!raw) {
            return false;
          }

          try {
            const parsed = JSON.parse(raw) as { accessToken?: string };
            if (!parsed.accessToken) {
              return false;
            }

            const response = await fetch("/api/me", {
              headers: {
                Authorization: `Bearer ${parsed.accessToken}`,
              },
            });

            return response.ok;
          } catch {
            return false;
          }
        }, SESSION_STORAGE_KEY),
      {
        timeout: options?.timeoutMs ?? 15_000,
      },
    )
    .toBe(true);
}

async function expectLoggedInUi(page: Page, options?: TimeoutOptions) {
  await expect(
    page.getByRole("button", { name: /logout|abmelden/i }).first(),
  ).toBeVisible({ timeout: options?.timeoutMs ?? 15_000 });
}

export async function loginAsUser(
  page: Page,
  credentials: LoginCredentials,
  options?: TimeoutOptions,
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

  const loginResponsePromise = page.waitForResponse((response) => {
    if (response.request().method() !== "POST") {
      return false;
    }

    const url = new URL(response.url());
    return url.pathname === LOGIN_API_PATH;
  });

  await page
    .getByRole("button", { name: /login|anmelden/i })
    .first()
    .click();
  const loginResponse = await loginResponsePromise;
  if (!loginResponse.ok()) {
    throw new Error(await readResponseMessage(loginResponse));
  }

  await expectClientSessionSet(page, options);
  await expectApiSessionUsable(page, options);
  await expectLoggedInUi(page, options);
}

export async function loginAsFixtureUser(
  page: Page,
  credentials: LoginCredentials = E2E_USERS.smokePlayer,
) {
  await loginAsUser(page, credentials);
}

export async function logoutFromHeader(page: Page) {
  await page
    .getByRole("button", { name: /logout|abmelden/i })
    .first()
    .click();
  await expect(page).toHaveURL(/\/$/);
  await expectClientSessionCleared(page);
}
