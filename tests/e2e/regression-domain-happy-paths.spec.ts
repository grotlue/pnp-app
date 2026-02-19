import { expect, test } from "@playwright/test";
import { loginAsFixtureUser } from "./support/auth";
import {
  E2E_CAMPAIGNS,
  E2E_CHARACTERS,
  E2E_USERS,
  uniqueSmokeName,
} from "./support/fixture-users";

test("FLOW-RELATIONSHIPS-CREATE-EDIT-VIEW @regression @relationships creates, updates, and views an external relationship from the character detail flow", async ({
  page,
}) => {
  await loginAsFixtureUser(page, E2E_USERS.playerOne);
  await page.goto("/characters");

  await expect(page).toHaveURL("/characters");
  await page
    .getByRole("link", {
      name: E2E_CHARACTERS.playerOneCampaignCharacter,
    })
    .first()
    .click();
  await expect(page).toHaveURL(/\/characters\/[0-9a-f-]+$/);

  await page.getByRole("button", { name: "Add relationship" }).click();

  const relationshipTargetName = uniqueSmokeName("Regression External");
  const updatedDescription = uniqueSmokeName(
    "Updated relationship description",
  );
  const createModal = page.locator("[data-slot='modal-popup']").first();

  await createModal.getByRole("button", { name: "External name" }).click();
  await createModal
    .getByPlaceholder("External character name")
    .fill(relationshipTargetName);
  await createModal
    .getByPlaceholder("Description")
    .fill("Initial regression relationship description");
  await createModal
    .getByPlaceholder("First timeline entry")
    .fill("Regression timeline entry");
  await createModal.getByRole("button", { name: "Create" }).click();

  await expect(page.getByText("Created successfully.").first()).toBeVisible();

  const relationshipDetailButton = page
    .getByRole("button", {
      name: new RegExp(`^${relationshipTargetName}`),
    })
    .first();
  await expect(relationshipDetailButton).toBeVisible();

  const relationshipEditButton = relationshipDetailButton.locator(
    "xpath=following::button[@aria-label='Edit'][1]",
  );
  await relationshipEditButton.click();
  const editModal = page.locator("[data-slot='modal-popup']").first();
  await expect(editModal.getByText("Edit relationship")).toBeVisible();
  await editModal.getByPlaceholder("Description").fill(updatedDescription);
  await editModal.getByRole("button", { name: "Save" }).click();

  await expect(page.getByText("Saved successfully.").first()).toBeVisible();

  await relationshipDetailButton.click();
  const detailModal = page.locator("[data-slot='modal-popup']").first();
  await expect(detailModal.getByText("Relationship detail")).toBeVisible();
  await expect(detailModal.getByText(updatedDescription)).toBeVisible();
  await detailModal.getByRole("button", { name: "Close" }).click();
});

test("FLOW-CAMPAIGNS-REQUEST-JOIN @regression @campaigns requests to join a campaign and shows pending state", async ({
  page,
}) => {
  await loginAsFixtureUser(page, E2E_USERS.smokePlayer);
  await page.goto("/");

  await expect(page).toHaveURL("/");
  await page
    .getByRole("link", { name: E2E_CAMPAIGNS.fixtureCampaignTitle })
    .first()
    .click();
  await expect(page).toHaveURL(/\/campaigns\/[0-9a-f-]+$/);

  const mainContent = page.getByRole("main");
  const requestJoinButton = page.getByRole("button", {
    name: "Request to join",
  });
  const joinPendingMessage = mainContent.getByText(
    "Your join request is pending.",
  );

  await expect
    .poll(async () => {
      const canRequest = await requestJoinButton.count();
      const alreadyPending = await joinPendingMessage.count();
      return canRequest + alreadyPending;
    })
    .toBeGreaterThan(0);

  if ((await requestJoinButton.count()) > 0) {
    await requestJoinButton.first().click();
    const joinModal = page.locator("[data-slot='modal-popup']").first();
    await joinModal.getByRole("button", { name: "Confirm" }).click();
    await expect(page.getByText("Sent successfully.").first()).toBeVisible();
  }

  await expect(joinPendingMessage).toBeVisible();
});
