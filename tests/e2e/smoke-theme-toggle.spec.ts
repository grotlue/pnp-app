import { expect, test } from "@playwright/test";
import { loginAsFixtureUser } from "./support/auth";

test("FLOW-UI-THEME-TOGGLE-PERSISTENCE @smoke @ui theme toggle persists across reload", async ({
  page,
}) => {
  await loginAsFixtureUser(page);

  const root = page.locator("html");
  await expect(root).toHaveAttribute("data-theme", "light");
  await expect(
    page.evaluate(() => window.localStorage.getItem("pnp.theme.mode")),
  ).resolves.toBeNull();

  await page.getByTestId("theme-toggle").dispatchEvent("click");

  await expect(root).toHaveAttribute("data-theme", "dark");
  await expect
    .poll(() =>
      page.evaluate(() => window.localStorage.getItem("pnp.theme.mode")),
    )
    .toBe("dark");

  await page.reload();
  await expect(page.getByTestId("theme-toggle")).toBeVisible();
  await expect(root).toHaveAttribute("data-theme", "dark");
  await expect
    .poll(() =>
      page.evaluate(() => window.localStorage.getItem("pnp.theme.mode")),
    )
    .toBe("dark");
});
