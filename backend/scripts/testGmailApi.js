const path = require("path");
const envPath = path.resolve(__dirname, "../.env");
require("dotenv").config({ path: envPath });

const { getGmailClient } = require("../utils/gmail/gmailAuth");
const { sendEmail } = require("../utils/gmail/gmailSender");
const {
    generateOrderReceiptHtml,
    generateOrderReceiptText,
} = require("../utils/emailService");

async function runTest() {
    console.log("=================================================");
    console.log("      Cartsy Gmail API (OAuth 2.0) Diagnostic    ");
    console.log("=================================================");
    const resolvedClientId = process.env.GMAIL_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
    const resolvedSecret = process.env.GMAIL_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET;
    const resolvedRefreshToken = process.env.GMAIL_REFRESH_TOKEN || process.env.GOOGLE_REFRESH_TOKEN;

    console.log("EMAIL_PROVIDER:       ", process.env.EMAIL_PROVIDER || "gmail_api");
    console.log("CLIENT_ID:            ", resolvedClientId ? resolvedClientId.substring(0, 16) + "..." : "NOT SET");
    console.log("CLIENT_SECRET:        ", resolvedSecret ? "****" + resolvedSecret.slice(-4) : "NOT SET");
    console.log("REFRESH_TOKEN:        ", resolvedRefreshToken ? "****" + resolvedRefreshToken.slice(-6) : "NOT SET");
    console.log("GMAIL_FROM_EMAIL:     ", process.env.GMAIL_FROM_EMAIL || process.env.EMAIL_USER || "NOT SET");
    console.log("-------------------------------------------------");

    const targetEmail = process.argv[2] || process.env.GMAIL_FROM_EMAIL || process.env.EMAIL_USER;

    console.log("1. Checking Gmail API Client...");
    const gmail = getGmailClient();
    if (!gmail) {
        console.error("❌ Gmail Client initialization failed. Missing OAuth2 credentials in .env.");
        console.log("Run 'npm run auth:gmail' to authorize and set your GOOGLE_REFRESH_TOKEN.");
        process.exit(1);
    }

    try {
        console.log("2. Verifying OAuth Token & Gmail Permissions...");
        const { getOAuth2Client } = require("../utils/gmail/gmailAuth");
        const auth = getOAuth2Client();
        const { token } = await auth.getAccessToken();
        const tokenInfoRes = await fetch("https://oauth2.googleapis.com/tokeninfo?access_token=" + token);
        const tokenInfo = await tokenInfoRes.json();

        console.log(`✅ Authenticated Google Account: ${tokenInfo.email || "OK"}`);
        console.log(`   Granted Scopes: ${tokenInfo.scope || "N/A"}`);

        const hasSendScope = (tokenInfo.scope || "").includes("gmail.send") || (tokenInfo.scope || "").includes("mail.google.com");
        if (!hasSendScope) {
            console.error("\n❌ Gmail API Error: Request had insufficient authentication scopes.");
            console.error("The token does not have permission to send emails ('https://www.googleapis.com/auth/gmail.send').");
            console.error("👉 Solution: Re-run 'npm run auth:gmail' and be sure to CHECK the permission box on Google's consent screen.");
            process.exit(1);
        }

        if (!targetEmail) {
            console.log("\n⚠️ No target email provided. Specify a recipient to send a test message:");
            console.log("   node scripts/testGmailApi.js your_email@example.com");
            process.exit(0);
        }

        console.log(`\n3. Sending Test Order Confirmation to: ${targetEmail}...`);

        const mockOrder = {
            _id: "65f2a1b94c" + Math.floor(10000000000000 + Math.random() * 90000000000000).toString(16),
            createdAt: new Date(),
            paymentMethod: "Razorpay",
            amount: 999,
            totalPrice: 999,
            status: "PAID",
            paymentStatus: "Paid",
            razorpayOrderId: "order_mock_" + Math.random().toString(36).substring(7),
            orderItems: [
                {
                    title: "Neon Cyber Hoodie (Oversized)",
                    quantity: 1,
                    price: 999,
                },
            ],
            shippingAddress: {
                fullName: "Test Customer",
                address: "Room 404, Tech Block Hostel",
                city: "Campus City",
                pincode: "110001",
                phone: "+91 9876543210",
            },
        };

        const clientUrl = process.env.URL || process.env.CLIENT_URL || "http://localhost:5173";
        const html = generateOrderReceiptHtml(mockOrder, "Test Customer", clientUrl);
        const text = generateOrderReceiptText(mockOrder, "Test Customer", clientUrl);

        const result = await sendEmail({
            to: targetEmail,
            subject: `[Gmail API Test] Order Confirmed #${String(mockOrder._id).slice(-8).toUpperCase()} - CARTSY`,
            html,
            text,
            headers: {
                "X-Entity-Ref-ID": String(mockOrder._id),
                "X-Test-Source": "GmailApiTestScript",
            },
        });

        if (result.success) {
            console.log(`\n🎉 SUCCESS! Test email delivered via Gmail API!`);
            console.log(`   Message ID: ${result.messageId}`);
            console.log(`   Thread ID:  ${result.threadId}`);
        } else {
            console.error(`\n❌ Send Failed: ${result.error}`);
            if (result.details) {
                console.error("Details:", JSON.stringify(result.details, null, 2));
            }
            process.exit(1);
        }
    } catch (err) {
        console.error("❌ Gmail API Error:", err.response?.data?.error?.message || err.message);
        process.exit(1);
    }
}

runTest();
