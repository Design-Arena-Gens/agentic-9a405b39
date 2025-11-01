import { google } from "googleapis";

export function getOAuth2Client() {
  const clientId = process.env.GOOGLE_CLIENT_ID as string;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET as string;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN as string;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("Missing Google OAuth2 env vars (client id/secret/refresh token)");
  }

  const oauth2Client = new google.auth.OAuth2({
    clientId,
    clientSecret,
    redirectUri: "urn:ietf:wg:oauth:2.0:oob"
  });
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  return oauth2Client;
}

export function getSheetsClient() {
  const auth = getOAuth2Client();
  return google.sheets({ version: "v4", auth });
}

export function getYouTubeClient() {
  const auth = getOAuth2Client();
  return google.youtube({ version: "v3", auth });
}
