const path = require("path");
const fs = require("fs");
const readline = require("readline");
const { google } = require("googleapis");

// Load backend/.env
const envPath = path.resolve(__dirname, "../.env");
require("dotenv").config({ path: envPath });

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

const askQuestion = (query) => new Promise((resolve) => rl.question(query, resolve));

async function main() {
    console.log("========================================================");
    console.log("       Cartsy Gmail API OAuth 2.0 Setup Helper          ");
    console.log("========================================================");
    console.log("This script helps you generate a GOOGLE_REFRESH_TOKEN to");
    console.log("send emails using the official Gmail API via OAuth 2.0.\n");

    let clientId = (process.env.GMAIL_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || "").trim();
    let clientSecret = (process.env.GMAIL_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET || "").trim();
    let redirectUri = (process.env.GMAIL_REDIRECT_URI || process.env.GOOGLE_REDIRECT_URI || "https://developers.google.com/oauthplayground").trim();

    if (!clientId) {
        console.log("ℹ️  GOOGLE_CLIENT_ID / GMAIL_CLIENT_ID not found in backend/.env");
        clientId = (await askQuestion("Enter your Google Client ID: ")).trim();
    } else {
        console.log(`✓ Using Google Client ID: ${clientId.substring(0, 18)}...`);
    }

    if (!clientSecret) {
        console.log("ℹ️  GOOGLE_CLIENT_SECRET not found in backend/.env");
        clientSecret = (await askQuestion("Enter your Google Client Secret: ")).trim();
    } else {
        console.log(`✓ Using Google Client Secret: ${clientSecret.substring(0, 8)}...`);
    }

    if (!clientId || !clientSecret) {
        console.error("\n❌ Error: Both Google Client ID and Client Secret are required.");
        console.log("\nQuick Guide to get credentials:");
        console.log("1. Visit https://console.cloud.google.com/");
        console.log("2. Enable the 'Gmail API' under APIs & Services > Library");
        console.log("3. Configure OAuth Consent Screen (User Type: External, Testing mode)");
        console.log("4. Add your email (e.g. ecommart77@gmail.com) under 'Test users'");
        console.log("5. Go to Credentials > Create Credentials > OAuth client ID (Web application)");
        console.log("6. Add Authorized Redirect URI: https://developers.google.com/oauthplayground");
        rl.close();
        process.exit(1);
    }

    console.log(`\n✓ Redirect URI: ${redirectUri}`);

    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

    const scopes = [
        "https://mail.google.com/",
        "https://www.googleapis.com/auth/gmail.send",
        "https://www.googleapis.com/auth/userinfo.email",
    ];

    const authUrl = oauth2Client.generateAuthUrl({
        access_type: "offline",
        scope: scopes,
        prompt: "consent", // Force Google to issue a refresh_token
    });

    console.log("\n--------------------------------------------------------");
    console.log("STEP 1: Authorize Application in Browser");
    console.log("--------------------------------------------------------");
    console.log("Open this URL in your web browser:\n");
    console.log(authUrl);
    console.log("\n🚨 CRITICAL STEP ON GOOGLE'S CONSENT SCREEN:");
    console.log("Google will show permission checkboxes.");
    console.log("👉 YOU MUST CHECK THE BOX:");
    console.log("   ☑ 'Read, compose, send, and permanently delete all your email from Gmail'");
    console.log("   or ☑ 'Send email on your behalf'");
    console.log("If you click 'Continue' without checking the box, Gmail permissions will be denied!\n");
    console.log("--------------------------------------------------------");
    console.log("STEP 2: Enter Authorization Code");
    console.log("--------------------------------------------------------");
    console.log("If using OAuth Playground, you will see the authorization code.");
    console.log("If using a redirect URI, copy the 'code' parameter from the URL after authorization.\n");

    const code = (await askQuestion("Paste authorization code here: ")).trim();

    if (!code) {
        console.error("❌ No authorization code provided. Aborting.");
        rl.close();
        process.exit(1);
    }

    try {
        console.log("\nExchanging code for tokens...");
        const { tokens } = await oauth2Client.getToken(code);

        // Verify granted scopes
        if (tokens.access_token) {
            try {
                const tokenInfoRes = await fetch("https://oauth2.googleapis.com/tokeninfo?access_token=" + tokens.access_token);
                const tokenInfo = await tokenInfoRes.json();
                const grantedScope = tokenInfo.scope || "";
                console.log(`\nGranted Scopes: ${grantedScope}`);

                if (!grantedScope.includes("mail.google.com") && !grantedScope.includes("gmail.send")) {
                    console.error("\n❌ ERROR: The granted token does NOT have Gmail send permissions!");
                    console.error("Reason: The permission checkbox was not checked during consent.");
                    console.error("Solution: Please re-run 'npm run auth:gmail' and be sure to CHECK the Gmail permission box.");
                    rl.close();
                    process.exit(1);
                }
            } catch (err) {
                // Ignore tokeninfo fetch error and proceed
            }
        }

        if (!tokens.refresh_token) {
            console.warn("\n⚠️  No refresh_token returned by Google.");
            console.warn("Reason: Google only returns a refresh token on the first consent.");
            console.warn("Tip: Re-run with prompt=consent or revoke app permissions in Google Account Settings and try again.");
            if (tokens.access_token) {
                console.log("Access Token received:", tokens.access_token.substring(0, 16) + "...");
            }
        } else {
            console.log("\n✅ SUCCESS! Google Refresh Token with Gmail permissions received:");
            console.log("--------------------------------------------------------");
            console.log(`GMAIL_REFRESH_TOKEN=${tokens.refresh_token}`);
            console.log("--------------------------------------------------------\n");

            const saveChoice = (await askQuestion("Do you want to automatically save this to backend/.env? (Y/n): ")).trim().toLowerCase();
            if (saveChoice !== "n") {
                let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf-8") : "";

                // Update or append GMAIL_REFRESH_TOKEN / GOOGLE_REFRESH_TOKEN
                if (envContent.includes("GMAIL_REFRESH_TOKEN=")) {
                    envContent = envContent.replace(/GMAIL_REFRESH_TOKEN=.*/g, `GMAIL_REFRESH_TOKEN=${tokens.refresh_token}`);
                } else if (envContent.includes("GOOGLE_REFRESH_TOKEN=")) {
                    envContent = envContent.replace(/GOOGLE_REFRESH_TOKEN=.*/g, `GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`);
                } else {
                    envContent += `\nGMAIL_REFRESH_TOKEN=${tokens.refresh_token}\n`;
                }

                // Update or append EMAIL_PROVIDER=gmail_api
                if (envContent.includes("EMAIL_PROVIDER=")) {
                    envContent = envContent.replace(/EMAIL_PROVIDER=.*/g, `EMAIL_PROVIDER=gmail_api`);
                } else {
                    envContent += `EMAIL_PROVIDER=gmail_api\n`;
                }

                // Ensure GOOGLE_REDIRECT_URI is in .env
                if (!envContent.includes("GOOGLE_REDIRECT_URI=")) {
                    envContent += `GOOGLE_REDIRECT_URI=${redirectUri}\n`;
                }

                fs.writeFileSync(envPath, envContent, "utf-8");
                console.log("✅ Updated backend/.env successfully with GOOGLE_REFRESH_TOKEN and EMAIL_PROVIDER=gmail_api!");
            }
        }
    } catch (error) {
        console.error("\n❌ Token exchange failed:", error.response?.data?.error_description || error.message);
    } finally {
        rl.close();
    }
}

main().catch((err) => {
    console.error("Unexpected error:", err);
    rl.close();
    process.exit(1);
});
