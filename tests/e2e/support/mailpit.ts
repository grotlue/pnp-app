const DEFAULT_MAILPIT_BASE_URL = "http://127.0.0.1:54324";
const DEFAULT_TIMEOUT_MS = 20_000;
const POLL_INTERVAL_MS = 500;

type MailpitMessageAddress = {
  Address?: string;
};

type MailpitMessageSummary = {
  ID: string;
  Subject?: string;
  Created?: string;
  To?: MailpitMessageAddress[];
};

type MailpitMessageListResponse = {
  messages: MailpitMessageSummary[];
};

type MailpitMessageDetails = {
  Text?: string;
  HTML?: string;
};

const getMailpitBaseUrl = () => {
  return process.env.E2E_MAILPIT_BASE_URL ?? DEFAULT_MAILPIT_BASE_URL;
};

const fetchMailpitJson = async <T>(path: string): Promise<T> => {
  const response = await fetch(`${getMailpitBaseUrl()}${path}`);
  if (!response.ok) {
    throw new Error(`Mailpit request failed: ${response.status}`);
  }

  return (await response.json()) as T;
};

const parseCreatedTimestamp = (created?: string): number => {
  if (!created) {
    return 0;
  }

  const timestamp = Date.parse(created);
  return Number.isFinite(timestamp) ? timestamp : 0;
};

const extractFirstUrl = (text: string): string | null => {
  const match = text.match(/https?:\/\/[^\s)]+/i);
  if (!match) {
    return null;
  }

  return match[0].replace(/&amp;/g, "&");
};

const delay = (ms: number): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

const clearMailpitMessages = async () => {
  const response = await fetch(`${getMailpitBaseUrl()}/api/v1/messages`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error(`Mailpit clear failed: ${response.status}`);
  }
};

const waitForMailpitLink = async (input: {
  recipient: string;
  subjectIncludes: string;
  afterUnixMs: number;
  timeoutMs?: number;
}): Promise<string> => {
  const timeoutMs = input.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const recipient = input.recipient.toLowerCase();
  const subjectIncludes = input.subjectIncludes.toLowerCase();
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const list =
      await fetchMailpitJson<MailpitMessageListResponse>("/api/v1/messages");

    const candidate = (list.messages ?? [])
      .filter((message) => {
        const subject = message.Subject?.toLowerCase() ?? "";
        const created = parseCreatedTimestamp(message.Created);
        const recipients = (message.To ?? [])
          .map((entry) => entry.Address?.toLowerCase() ?? "")
          .filter(Boolean);

        return (
          created >= input.afterUnixMs &&
          subject.includes(subjectIncludes) &&
          recipients.includes(recipient)
        );
      })
      .sort(
        (left, right) =>
          parseCreatedTimestamp(right.Created) -
          parseCreatedTimestamp(left.Created),
      )[0];

    if (candidate) {
      const details = await fetchMailpitJson<MailpitMessageDetails>(
        `/api/v1/message/${candidate.ID}`,
      );

      const urlFromText = details.Text ? extractFirstUrl(details.Text) : null;
      if (urlFromText) {
        return urlFromText;
      }

      const urlFromHtml = details.HTML
        ? details.HTML.match(/href="([^"]+)"/i)?.[1]?.replace(/&amp;/g, "&")
        : null;
      if (urlFromHtml) {
        return urlFromHtml;
      }

      throw new Error(
        `Mailpit message ${candidate.ID} does not contain a link`,
      );
    }

    await delay(POLL_INTERVAL_MS);
  }

  throw new Error("Timed out waiting for email link in Mailpit");
};

export { clearMailpitMessages, waitForMailpitLink };
