const { google } = require("googleapis");

/**
 * Creates and returns an OAuth2 client configured with credentials from .env.
 * Returns null if required credentials (CLIENT_ID, CLIENT_SECRET, REFRESH_TOKEN) are missing.
 */
const getOAuth2Client = () => {
    const clientId = (process.env.GMAIL_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || "").trim();
    const clientSecret = (process.env.GMAIL_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET || "").trim();
    const redirectUri = (process.env.GMAIL_REDIRECT_URI || process.env.GOOGLE_REDIRECT_URI || "https://developers.google.com/oauthplayground").trim();
    const refreshToken = (process.env.GMAIL_REFRESH_TOKEN || process.env.GOOGLE_REFRESH_TOKEN || "").trim();

    if (!clientId || !clientSecret || !refreshToken) {
        return null;
    }

    const oAuth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
    oAuth2Client.setCredentials({ refresh_token: refreshToken });

    return oAuth2Client;
};

/**
 * Returns an authenticated Gmail API v1 client.
 * Returns null if credentials are not configured.
 */
const getGmailClient = () => {
    const auth = getOAuth2Client();
    if (!auth) {
        return null;
    }
    return google.gmail({ version: "v1", auth });
};

module.exports = {
    getOAuth2Client,
    getGmailClient,
};
