# YouTube Auto Poster

Automated daily upload/schedule of videos to YouTube using Next.js API routes, Vercel Cron, Google Sheets queue, and Google APIs.

## Queue Sheet Columns (sheet tab: `Queue`)

From row 2 (A2):

1. A `source` - URL (https/http) or local file path
2. B `title`
3. C `description`
4. D `tags` - comma-separated
5. E `privacy` - public | unlisted | private
6. F `publishAt` - ISO (for scheduled publish, keep privacy=private)
7. G `status` - managed by app
8. H `videoId` - managed by app
9. I `publishedUrl` - managed by app
10. J `lastError` - managed by app
11. K `retryAt` - managed by app

## Environment

Copy `.env.example` to `.env.local` and set values. Deploy env vars in Vercel project settings.

- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`
- `GOOGLE_SHEETS_SPREADSHEET_ID`
- `GOOGLE_SHEETS_QUEUE_RANGE` (default `Queue!A2:K`)
- `DAILY_PUBLISH_TIME` (default 09:00) and `DAILY_PUBLISH_TZ` (default Asia/Kolkata)
- `DEFAULT_PRIVACY` (default private)
- `RETRY_DELAY_MINUTES` (default 10)
- `ALERT_WEBHOOK_URL` (optional)

## Scheduling

Vercel cron is configured in `vercel.json`:

- Daily run: `30 3 * * *` (03:30 UTC ≈ 09:00 IST)
- Retry worker: `*/5 * * * *` (every 5 minutes)

## Notes

- Requires YouTube Data API v3 and Google Sheets API enabled.
- OAuth2 refresh token must belong to the target channel owner.
- Large uploads rely on Vercel Background Function timeout (maxDuration set to 900s).
