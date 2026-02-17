import { beforeEach, describe, expect, it, vi } from "vitest";

const { apiRequestMock, unwrapApiResponseMock } = vi.hoisted(() => ({
  apiRequestMock: vi.fn(),
  unwrapApiResponseMock: vi.fn(),
}));

vi.mock("@/lib/client/api", () => ({
  apiRequest: apiRequestMock,
  unwrapApiResponse: unwrapApiResponseMock,
}));

import { getNotificationsQuery } from "../get-notifications.query";
import { getNotificationsUnreadCountQuery } from "../get-notifications-unread-count.query";
import { markNotificationReadMutation } from "../mark-notification-read.mutation";
import { markAllNotificationsReadMutation } from "../mark-all-notifications-read.mutation";
import { decideNotificationMembershipMutation } from "../decide-notification-membership.mutation";

const session = { accessToken: "access-token" };

beforeEach(() => {
  vi.clearAllMocks();
  unwrapApiResponseMock.mockImplementation(
    (response: { data: unknown }) => response.data,
  );
});

describe("notifications queries", () => {
  it("loads notifications with default limit", async () => {
    const response = { data: [{ id: "n1" }], error: null, status: 200 };
    apiRequestMock.mockResolvedValueOnce(response);

    await expect(getNotificationsQuery(session)).resolves.toEqual(
      response.data,
    );
    expect(apiRequestMock).toHaveBeenCalledWith(
      "/api/notifications?limit=100",
      { session },
    );
    expect(unwrapApiResponseMock).toHaveBeenCalledWith(
      response,
      "Failed to load notifications",
    );
  });

  it("loads notifications with explicit limit", async () => {
    const response = { data: [{ id: "n1" }], error: null, status: 200 };
    apiRequestMock.mockResolvedValueOnce(response);

    await expect(
      getNotificationsQuery(session, { limit: 10 }),
    ).resolves.toEqual(response.data);
    expect(apiRequestMock).toHaveBeenCalledWith("/api/notifications?limit=10", {
      session,
    });
  });

  it("loads unread notification count", async () => {
    const response = { data: { unreadCount: 3 }, error: null, status: 200 };
    apiRequestMock.mockResolvedValueOnce(response);

    await expect(getNotificationsUnreadCountQuery(session)).resolves.toEqual({
      unreadCount: 3,
    });
    expect(apiRequestMock).toHaveBeenCalledWith(
      "/api/notifications/unread-count",
      {
        session,
      },
    );
    expect(unwrapApiResponseMock).toHaveBeenCalledWith(
      response,
      "Failed to load unread notification count",
    );
  });

  it("marks a single notification as read", async () => {
    const response = { data: { read: true }, error: null, status: 200 };
    apiRequestMock.mockResolvedValueOnce(response);

    await expect(markNotificationReadMutation(session, "n1")).resolves.toEqual({
      read: true,
    });
    expect(apiRequestMock).toHaveBeenCalledWith("/api/notifications/n1/read", {
      method: "POST",
      session,
    });
    expect(unwrapApiResponseMock).toHaveBeenCalledWith(
      response,
      "Failed to mark notification as read",
    );
  });

  it("marks all notifications as read", async () => {
    const response = {
      data: { readAll: true, updated: 4 },
      error: null,
      status: 200,
    };
    apiRequestMock.mockResolvedValueOnce(response);

    await expect(markAllNotificationsReadMutation(session)).resolves.toEqual(
      response.data,
    );
    expect(apiRequestMock).toHaveBeenCalledWith("/api/notifications/read-all", {
      method: "POST",
      session,
    });
    expect(unwrapApiResponseMock).toHaveBeenCalledWith(
      response,
      "Failed to mark all notifications as read",
    );
  });

  it("decides campaign membership from notification context", async () => {
    const response = { data: { decided: true }, error: null, status: 200 };
    apiRequestMock.mockResolvedValueOnce(response);

    await expect(
      decideNotificationMembershipMutation(session, {
        campaignId: "c1",
        membershipId: "m1",
        state: "accepted",
      }),
    ).resolves.toEqual({ decided: true });

    expect(apiRequestMock).toHaveBeenCalledWith(
      "/api/campaigns/c1/memberships/m1/decision",
      {
        method: "POST",
        session,
        body: { state: "accepted" },
      },
    );
    expect(unwrapApiResponseMock).toHaveBeenCalledWith(
      response,
      "Failed to decide membership",
    );
  });
});
