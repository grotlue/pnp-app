import { expect, test } from "@playwright/test";
import { loginAsFixtureUser } from "./support/auth";
import {
  E2E_NOTIFICATIONS,
  E2E_USERS,
  uniqueSmokeName,
} from "./support/fixture-users";

test.describe.configure({ mode: "serial" });

test("FLOW-CAMPAIGNS-CREATE @smoke @campaigns creates a new campaign from the campaigns screen", async ({
  page,
}) => {
  await loginAsFixtureUser(page, E2E_USERS.smokePlayer);
  await page.goto("/campaigns");

  await expect(page).toHaveURL("/campaigns");
  await page.getByRole("button", { name: "Create new campaign" }).click();

  const campaignTitle = uniqueSmokeName("Smoke Campaign");
  const campaignDescription = "Smoke flow campaign description";
  const modal = page.getByRole("dialog").first();
  await expect(modal).toBeVisible();

  await modal.getByPlaceholder("Campaign title").fill(campaignTitle);
  await modal
    .getByPlaceholder("Campaign description")
    .fill(campaignDescription);
  await modal.getByRole("button", { name: "Create" }).click({ force: true });

  await expect(
    page
      .getByRole("main")
      .getByText("Created successfully.", { exact: true })
      .first(),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: campaignTitle })).toBeVisible();
});

test("FLOW-CHARACTERS-CREATE-EDIT @smoke @characters creates and edits a character from user flows", async ({
  page,
}) => {
  await loginAsFixtureUser(page, E2E_USERS.smokePlayer);
  await page.goto("/characters");

  await expect(page).toHaveURL("/characters");
  await page.getByRole("button", { name: "Create new character" }).click();

  const characterName = uniqueSmokeName("Smoke Character");
  const updatedCharacterName = `${characterName} Updated`;
  const modal = page.getByRole("dialog").first();
  await expect(modal).toBeVisible();

  await modal.getByPlaceholder("Character name").fill(characterName);
  await modal.getByRole("button", { name: "Create" }).click({ force: true });

  await expect(
    page
      .getByRole("main")
      .getByText("Created successfully.", { exact: true })
      .first(),
  ).toBeVisible();
  await page.getByRole("link", { name: characterName }).first().click();

  await expect(page).toHaveURL(/\/characters\/[0-9a-f-]+$/);
  await page.getByRole("link", { name: "Edit" }).first().click();
  await expect(page).toHaveURL(/\/characters\/[0-9a-f-]+\/edit$/);

  await page.getByPlaceholder("Character name").fill(updatedCharacterName);
  await page.getByRole("button", { name: "Save" }).click();

  await expect(page).toHaveURL(/\/characters\/[0-9a-f-]+$/);
  await expect(
    page.getByText(updatedCharacterName, { exact: true }).first(),
  ).toBeVisible();
});

test("FLOW-NOTIFICATIONS-MARK-READ @smoke @notifications marks an unread notification as read", async ({
  page,
}) => {
  await loginAsFixtureUser(page, E2E_USERS.smokePlayer);
  await page.goto("/notifications");

  await expect(page).toHaveURL("/notifications");
  await expect(
    page.getByText(E2E_NOTIFICATIONS.smokeRelationshipTitle),
  ).toBeVisible();

  const markReadButtons = page.getByRole("button", { name: "Mark as read" });
  const unreadBefore = await markReadButtons.count();
  expect(unreadBefore).toBeGreaterThan(0);

  await markReadButtons.first().click();
  await expect
    .poll(async () =>
      page.getByRole("button", { name: "Mark as read" }).count(),
    )
    .toBeLessThan(unreadBefore);
});
