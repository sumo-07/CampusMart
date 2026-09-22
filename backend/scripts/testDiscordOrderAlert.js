const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const { buildOrderAlertEmbed } = require("../utils/discordService");

async function runTest() {
    console.log("=================================================");
    console.log("    CampusMart Discord Order Alert Diagnostic    ");
    console.log("=================================================");

    const webhookUrl = (
        process.env.DISCORD_ORDER_WEBHOOK_URL ||
        process.env.DISCORD_WEBHOOK_URL ||
        process.argv[2] ||
        ""
    ).trim();

    console.log("DISCORD_ORDER_WEBHOOK_URL:", process.env.DISCORD_ORDER_WEBHOOK_URL ? "CONFIGURED" : "NOT SET");
    console.log("DISCORD_WEBHOOK_URL:      ", process.env.DISCORD_WEBHOOK_URL ? "CONFIGURED" : "NOT SET");
    console.log("Effective Target Webhook: ", webhookUrl ? webhookUrl.replace(/(https:\/\/discord(?:app)?\.com\/api\/webhooks\/\d+\/)(.+)/, "$1***") : "NONE");
    console.log("-------------------------------------------------");

    if (!webhookUrl) {
        console.error("❌ No Discord Order Webhook URL found!");
        console.log("Usage: node testDiscordOrderAlert.js [webhook_url]");
        console.log("Or add DISCORD_ORDER_WEBHOOK_URL=https://discord.com/api/webhooks/... to backend/.env");
        process.exit(1);
    }

    const mockOrderPaid = {
        _id: "66a30edffa010770486ac3f2",
        orderItems: [
            {
                productId: "6aa30edffa010770486ac3f2",
                title: "Dolce Shine Eau de",
                price: 69.99,
                quantity: 1,
                thumbnail: "https://cdn.dummyjson.com/products/images/fragrances/Dolce%20Shine%20Eau%20de/thumbnail.png",
            },
            {
                productId: "65fab9876543210fedcba202",
                title: "Casio Scientific Calculator FX-991CW",
                price: 1250.00,
                quantity: 2,
                thumbnail: "https://images.unsplash.com/photo-1587145820266-a5951ee6f620?w=500&auto=format&fit=crop&q=60",
            },
        ],
        shippingAddress: {
            fullName: "Rahul Sharma",
            address: "Room 304, Boys Hostel B, Campus",
            city: "Jaipur",
            pincode: "302017",
            phone: "+91 98765 43210",
        },
        paymentMethod: "Razorpay",
        status: "PAID",
        orderStatus: "Processing",
        totalPrice: 2569.99,
        createdAt: new Date().toISOString(),
    };

    const mockCustomerDetails = {
        customerName: "Rahul Sharma",
        customerEmail: "rahul.sharma@example.com",
    };

    console.log("Sending Sample New Paid Order Alert (Total: ₹2,569.99)...");
    const orderEmbed = buildOrderAlertEmbed(mockOrderPaid, mockCustomerDetails);

    try {
        const res = await fetch(webhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                username: "CampusMart Order Alert",
                embeds: [orderEmbed],
            }),
        });

        if (res.ok || res.status === 204) {
            console.log("✅ Discord New Order Embed delivered successfully!");
        } else {
            console.error(`❌ Discord returned HTTP ${res.status}:`, await res.text());
        }

        console.log("=================================================");
        console.log("🎉 Test completed! Check your Discord order channel to view the formatted card.");
    } catch (err) {
        console.error("❌ Network error connecting to Discord Webhook:", err.message);
        process.exit(1);
    }
}

runTest();
