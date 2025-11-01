import { formatInTimeZone } from "date-fns-tz";

export type MetadataInput = {
  title: string;
  description: string;
  tags: string[];
};

export function applyTemplate(input: MetadataInput, publishAt?: string) {
  const tz = process.env.DAILY_PUBLISH_TZ || "UTC";
  const when = publishAt ? new Date(publishAt) : new Date();
  const whenStr = formatInTimeZone(when, tz, "yyyy-MM-dd HH:mm zzz");

  const title = input.title || `Daily Video - ${whenStr}`;
  const description = input.description || `Scheduled video for ${whenStr}.\n\n#autopost`;
  const tags = input.tags && input.tags.length ? input.tags : ["daily", "autopost", "automation"];

  return { title, description, tags };
}
