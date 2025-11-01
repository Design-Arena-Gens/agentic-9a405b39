import { NextResponse } from "next/server";
import { findDueRetry, markAsScheduled, markAsUploaded } from "@lib/sheets";
import { applyTemplate } from "@lib/template";
import { uploadOrScheduleVideo } from "@lib/youtube";
import { sendAlert } from "@lib/alerts";

export const dynamic = "force-dynamic";

export async function GET() {
  const now = new Date();
  try {
    const row = await findDueRetry(now);
    if (!row) {
      return NextResponse.json({ ok: true, message: "No due retries" });
    }

    const { title, description, tags } = applyTemplate({
      title: row.title,
      description: row.description,
      tags: row.tags
    }, row.publishAt);

    const privacy = (row.privacy as any) || "private";
    const publishAtIso = row.publishAt && new Date(row.publishAt).toISOString();

    try {
      const upload = await uploadOrScheduleVideo({
        sourceUrl: row.source.startsWith("http") ? row.source : undefined,
        filePath: row.source.startsWith("http") ? undefined : row.source,
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

      return NextResponse.json({ ok: true, retried: true, videoId: upload.videoId, url: upload.url });
    } catch (err: any) {
      await sendAlert(`Retry failed: ${err?.message || err}`);
      return NextResponse.json({ ok: false, error: err?.message || String(err) }, { status: 500 });
    }
  } catch (outer: any) {
    await sendAlert(`Retry cron fatal error: ${outer?.message || outer}`);
    return NextResponse.json({ ok: false, error: outer?.message || String(outer) }, { status: 500 });
  }
}
