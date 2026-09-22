const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
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
        _id: "6aa30edffa010770486ac3f2",
        title: "Dolce Shine Eau de",
        price: 69.99,
        discountPercentage: 0.62,
        stock: 2,
        brand: "Dolce & Gabbana",
        category: "fragrances",
        thumbnail: "https://cdn.dummyjson.com/products/images/fragrances/Dolce%20Shine%20Eau%20de/thumbnail.png",
    };

    const mockOutOfStockProduct = {
        _id: "65fab9876543210fedcba202",
        title: "Casio Scientific Calculator FX-991CW",
        price: 1250.00,
        stock: 0,
        brand: "Casio",
        category: "electronics",
        thumbnail: "https://images.unsplash.com/photo-1587145820266-a5951ee6f620?w=500&auto=format&fit=crop&q=60",
    };

    console.log("1. Sending Sample Low Stock Alert (Remaining: 2 units)...");
    const lowStockEmbed = buildStockAlertEmbed(mockLowStockProduct, 6);

    try {
        const res1 = await fetch(webhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                username: "CampusMart Inventory Alert",
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
