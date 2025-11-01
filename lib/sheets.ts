import { getSheetsClient } from "@lib/googleAuth";

export type QueueRow = {
  rowIndex: number; // 1-based index in the sheet
  source: string; // URL or local path
  title: string;
  description: string;
  tags: string[];
  privacy: "public" | "unlisted" | "private";
  publishAt?: string; // ISO string
  status?: string; // pending | uploaded | scheduled | retry_pending | error
  videoId?: string;
  publishedUrl?: string;
  lastError?: string;
  retryAt?: string; // ISO string
};

const DEFAULT_RANGE = process.env.GOOGLE_SHEETS_QUEUE_RANGE || "Queue!A2:K";
const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID as string;

export async function readQueue(): Promise<QueueRow[]> {
  if (!SPREADSHEET_ID) throw new Error("Missing GOOGLE_SHEETS_SPREADSHEET_ID");
  const sheets = getSheetsClient();
  const resp = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: DEFAULT_RANGE
  });
  const rows = (resp.data.values || []) as string[][];
  const results: QueueRow[] = [];

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const [source, title, description, tags, privacy, publishAt, status, videoId, publishedUrl, lastError, retryAt] = r;
    results.push({
      rowIndex: i + 2, // since A2 corresponds to row 2
      source: source || "",
      title: title || "",
      description: description || "",
      tags: (tags || "").split(",").map((t) => t.trim()).filter(Boolean),
      privacy: (privacy as any) || "private",
      publishAt: publishAt || undefined,
      status: status || undefined,
      videoId: videoId || undefined,
      publishedUrl: publishedUrl || undefined,
      lastError: lastError || undefined,
      retryAt: retryAt || undefined
    });
  }
  return results;
}

export async function findNextPending(now: Date): Promise<QueueRow | null> {
  const queue = await readQueue();
  for (const item of queue) {
    if (!item.source) continue;
    const status = (item.status || "").toLowerCase();
    if (!status || status === "pending") {
      return item;
    }
  }
  return null;
}

export async function findDueRetry(now: Date): Promise<QueueRow | null> {
  const queue = await readQueue();
  for (const item of queue) {
    if ((item.status || "").toLowerCase() === "retry_pending" && item.retryAt) {
      const retry = new Date(item.retryAt);
      if (!isNaN(retry.getTime()) && retry <= now) {
        return item;
      }
    }
  }
  return null;
}

export async function markAsScheduled(row: QueueRow, videoId: string, publishedUrl: string) {
  const sheets = getSheetsClient();
  const range = `Queue!G${row.rowIndex}:I${row.rowIndex}`; // status, videoId, publishedUrl
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range,
    valueInputOption: "RAW",
    requestBody: {
      values: [["scheduled", videoId, publishedUrl]]
    }
  });
}

export async function markAsUploaded(row: QueueRow, videoId: string, publishedUrl: string) {
  const sheets = getSheetsClient();
  const range = `Queue!G${row.rowIndex}:I${row.rowIndex}`; // status, videoId, publishedUrl
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range,
    valueInputOption: "RAW",
    requestBody: {
      values: [["uploaded", videoId, publishedUrl]]
    }
  });
}

export async function markErrorWithRetry(row: QueueRow, errorMessage: string, retryAtIso: string) {
  const sheets = getSheetsClient();
  const range = `Queue!G${row.rowIndex}:K${row.rowIndex}`; // status..retryAt
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range,
    valueInputOption: "RAW",
    requestBody: {
      values: [["retry_pending", row.videoId || "", row.publishedUrl || "", errorMessage, retryAtIso]]
    }
  });
}

export async function markError(row: QueueRow, errorMessage: string) {
  const sheets = getSheetsClient();
  const range = `Queue!G${row.rowIndex}:J${row.rowIndex}`; // status..lastError
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range,
    valueInputOption: "RAW",
    requestBody: {
      values: [["error", row.videoId || "", row.publishedUrl || "", errorMessage]]
    }
  });
}
