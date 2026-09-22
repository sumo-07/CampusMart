require("dotenv").config();
const { buildStockAlertEmbed } = require("../utils/discordService");

async function runTest() {
    console.log("=================================================");
    console.log("    CampusMart Discord Webhook Alert Diagnostic  ");
    console.log("=================================================");

    const webhookUrl = (
        process.env.DISCORD_STOCK_WEBHOOK_URL ||
        process.env.DISCORD_WEBHOOK_URL ||
        process.argv[2] ||
        ""
    ).trim();

    console.log("DISCORD_STOCK_WEBHOOK_URL:", process.env.DISCORD_STOCK_WEBHOOK_URL ? "CONFIGURED" : "NOT SET");
    console.log("DISCORD_WEBHOOK_URL:      ", process.env.DISCORD_WEBHOOK_URL ? "CONFIGURED" : "NOT SET");
    console.log("Effective Target Webhook: ", webhookUrl ? webhookUrl.replace(/(https:\/\/discord\.com\/api\/webhooks\/\d+\/)(.+)/, "$1***") : "NONE");
    console.log("-------------------------------------------------");

    if (!webhookUrl) {
        console.error("❌ No Discord Webhook URL found!");
        console.log("Usage: node testDiscordAlert.js [webhook_url]");
        console.log("Or add DISCORD_STOCK_WEBHOOK_URL=https://discord.com/api/webhooks/... to backend/.env");
        process.exit(1);
    }

    const mockLowStockProduct = {
        _id: "65fab1234567890abcdef101",
        title: "Introduction to Algorithms (CLRS 4th Edition)",
        price: 899.00,
        discountPercentage: 10,
        stock: 2,
        brand: "MIT Press",
        category: "Computer Science Textbooks",
        thumbnail: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop&q=60",
    };

    const mockOutOfStockProduct = {
        _id: "65fab9876543210fedcba202",
        title: "Casio Scientific Calculator FX-991CW",
        price: 1250.00,
        stock: 0,
        brand: "Casio",
        category: "Electronics",
        thumbnail: "https://images.unsplash.com/photo-1587145820266-a5951ee6f620?w=500&auto=format&fit=crop&q=60",
    };

    console.log("1. Sending Sample Low Stock Alert (Remaining: 2 units)...");
    const lowStockEmbed = buildStockAlertEmbed(mockLowStockProduct, 3);

    try {
        const res1 = await fetch(webhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                username: "CampusMart Inventory Alert",
                avatar_url: "https://res.cloudinary.com/dyt4a3p2j/image/upload/v1/campusmart/logo.png",
                embeds: [lowStockEmbed],
            }),
        });

        if (res1.ok || res1.status === 204) {
            console.log("✅ Low Stock Embed delivered successfully!");
        } else {
            console.error(`❌ Discord returned HTTP ${res1.status}:`, await res1.text());
        }

        console.log("2. Sending Sample Out of Stock Alert (Remaining: 0 units)...");
        const outOfStockEmbed = buildStockAlertEmbed(mockOutOfStockProduct, 1);

        const res2 = await fetch(webhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                username: "CampusMart Inventory Alert",
                avatar_url: "https://res.cloudinary.com/dyt4a3p2j/image/upload/v1/campusmart/logo.png",
                embeds: [outOfStockEmbed],
            }),
        });

        if (res2.ok || res2.status === 204) {
            console.log("✅ Out-of-Stock Embed delivered successfully!");
        } else {
            console.error(`❌ Discord returned HTTP ${res2.status}:`, await res2.text());
        }

        console.log("=================================================");
        console.log("🎉 Test completed! Check your Discord channel to view the formatted embed cards.");
    } catch (err) {
        console.error("❌ Network error connecting to Discord Webhook:", err.message);
        process.exit(1);
    }
}

runTest();
