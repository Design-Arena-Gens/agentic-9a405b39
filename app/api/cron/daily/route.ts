import { NextResponse } from "next/server";
import { findNextPending, markAsScheduled, markAsUploaded, QueueRow, markErrorWithRetry, markError } from "@lib/sheets";
import { applyTemplate } from "@lib/template";
import { uploadOrScheduleVideo } from "@lib/youtube";
import { sendAlert } from "@lib/alerts";

function parseSource(row: QueueRow): { sourceUrl?: string; filePath?: string } {
  const src = row.source.trim();
  if (src.startsWith("http://") || src.startsWith("https://")) return { sourceUrl: src };
  return { filePath: src };
}

function toPrivacy(p?: string): "public" | "unlisted" | "private" {
  const v = (p || process.env.DEFAULT_PRIVACY || "private").toLowerCase();
  if (v === "public" || v === "unlisted" || v === "private") return v;
  return "private";
}

export const dynamic = "force-dynamic";

export async function GET() {
  const now = new Date();
  try {
    const row = await findNextPending(now);
    if (!row) {
      return NextResponse.json({ ok: true, message: "No pending items" });
    }

    const { title, description, tags } = applyTemplate({
      title: row.title,
      description: row.description,
      tags: row.tags
    }, row.publishAt);

    const publishAtIso = row.publishAt && new Date(row.publishAt).toISOString();
    const privacy = toPrivacy(row.privacy);

    try {
      const upload = await uploadOrScheduleVideo({
        ...parseSource(row),
        title,
        description,
        tags,
        privacy,
        publishAt: publishAtIso
      });

      if (privacy === "private" && publishAtIso) {
        await markAsScheduled(row, upload.videoId, upload.url);
      } else {
        await markAsUploaded(row, upload.videoId, upload.url);
      }

      return NextResponse.json({ ok: true, videoId: upload.videoId, url: upload.url });
    } catch (err: any) {
      const delayMin = Number(process.env.RETRY_DELAY_MINUTES || 10);
      const retryAt = new Date(Date.now() + delayMin * 60_000);
      await markErrorWithRetry(row, err?.message || String(err), retryAt.toISOString());
      await sendAlert(`Daily upload failed; will retry at ${retryAt.toISOString()}\nError: ${err?.message || err}`);
      return NextResponse.json({ ok: false, error: err?.message || String(err), retryAt: retryAt.toISOString() }, { status: 500 });
    }
  } catch (outer: any) {
    await sendAlert(`Daily cron fatal error: ${outer?.message || outer}`);
    return NextResponse.json({ ok: false, error: outer?.message || String(outer) }, { status: 500 });
  }
}
