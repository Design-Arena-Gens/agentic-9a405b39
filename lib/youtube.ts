import { getYouTubeClient } from "@lib/googleAuth";
import { Readable } from "node:stream";

export type UploadOptions = {
  sourceUrl?: string; // preferred in serverless
  filePath?: string; // for local dev
  title: string;
  description: string;
  tags: string[];
  privacy: "public" | "unlisted" | "private";
  publishAt?: string; // ISO
  categoryId?: string;
};

function readableFromWeb(webStream: ReadableStream<Uint8Array>): Readable {
  // @ts-ignore - Node 18 has fromWeb
  return Readable.fromWeb(webStream as any) as unknown as Readable;
}

export async function uploadOrScheduleVideo(opts: UploadOptions): Promise<{ videoId: string; url: string }>
{
  const youtube = getYouTubeClient();

  let mediaBody: Readable | undefined;

  if (opts.sourceUrl) {
    const resp = await fetch(opts.sourceUrl);
    if (!resp.ok || !resp.body) {
      throw new Error(`Failed to fetch video from URL (${resp.status})`);
    }
    mediaBody = readableFromWeb(resp.body as any);
  } else if (opts.filePath) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const fs = require("fs");
    mediaBody = fs.createReadStream(opts.filePath);
  } else {
    throw new Error("Missing sourceUrl or filePath for upload");
  }

  const status: any = { privacyStatus: opts.privacy };
  if (opts.publishAt && opts.privacy === "private") {
    const d = new Date(opts.publishAt);
    if (!isNaN(d.getTime())) {
      status.publishAt = d.toISOString();
      status.selfDeclaredMadeForKids = false;
    }
  }

  const insertResp = await youtube.videos.insert({
    part: ["snippet", "status"],
    requestBody: {
      snippet: {
        title: opts.title,
        description: opts.description,
        tags: opts.tags,
        categoryId: opts.categoryId || "22" // People & Blogs
      },
      status
    },
    media: { body: mediaBody as any }
  } as any);

  const videoId = insertResp.data.id as string;
  if (!videoId) throw new Error("Upload succeeded but no video ID returned");

  const url = `https://www.youtube.com/watch?v=${videoId}`;
  return { videoId, url };
}
