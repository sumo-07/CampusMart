const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const { buildContactAlertEmbed } = require("../utils/discordService");

async function runTest() {
    console.log("=================================================");
    console.log("   CampusMart Discord Contact Alert Diagnostic   ");
    console.log("=================================================");

    const webhookUrl = (
        process.env.DISCORD_CONTACT_WEBHOOK_URL ||
        process.env.DISCORD_WEBHOOK_URL ||
        process.argv[2] ||
        ""
    ).trim();

    console.log("DISCORD_CONTACT_WEBHOOK_URL:", process.env.DISCORD_CONTACT_WEBHOOK_URL ? "CONFIGURED" : "NOT SET");
    console.log("DISCORD_WEBHOOK_URL:        ", process.env.DISCORD_WEBHOOK_URL ? "CONFIGURED" : "NOT SET");
    console.log("Effective Target Webhook:   ", webhookUrl ? webhookUrl.replace(/(https:\/\/discord(?:app)?\.com\/api\/webhooks\/\d+\/)(.+)/, "$1***") : "NONE");
    console.log("-------------------------------------------------");

    if (!webhookUrl) {
        console.error("❌ No Discord Contact Webhook URL found!");
        console.log("Usage: node testDiscordContactAlert.js [webhook_url]");
        console.log("Or add DISCORD_CONTACT_WEBHOOK_URL=https://discord.com/api/webhooks/... to backend/.env");
        process.exit(1);
    }

    const mockContact = {
        _id: "66a30edffa010770486ac999",
        name: "Aarav Gupta",
        email: "aarav.gupta@chitkara.edu.in",
        phone: "+91 98123 45678",
        subject: "Campus Delivery to Hostel Desk",
        message: "Hi CampusMart team, I ordered a book earlier today. Will it be delivered directly to Gandhi Hostel block reception after 5 PM? Thank you!",
        createdAt: new Date().toISOString(),
    };

    console.log(`Sending Sample Student Inquiry from "${mockContact.name}"...`);
    const embed = buildContactAlertEmbed(mockContact);

    try {
        const res = await fetch(webhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                username: "CampusMart Support Desk",
                embeds: [embed],
            }),
        });

        if (res.ok || res.status === 204) {
            console.log("✅ Discord Contact Inquiry Embed delivered successfully!");
        } else {
            console.error(`❌ Discord returned HTTP ${res.status}:`, await res.text());
        }

        console.log("=================================================");
        console.log("🎉 Test completed! Check your Discord contact channel to view the formatted card.");
    } catch (err) {
        console.error("❌ Network error connecting to Discord Webhook:", err.message);
        process.exit(1);
    }
}

runTest();
