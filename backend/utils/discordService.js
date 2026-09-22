/**
 * Discord Webhook Service for CampusMart
 * Lightweight notification handler using native Node.js fetch()
 */

const getStockWebhookUrl = () => {
    return (
        process.env.DISCORD_STOCK_WEBHOOK_URL ||
        ""
    ).trim();
};

/**
 * Builds a rich Discord Embed payload for inventory events
 */
const buildStockAlertEmbed = (product, previousStock, clientUrl) => {
    const isOutOfStock = product.stock === 0;
    const baseUrl = (clientUrl || process.env.URL || process.env.CLIENT_URL || "http://localhost:5173").trim();
    const catalogUrl = `${baseUrl.replace(/\/$/, "")}/product/${product._id}`;
    const adminUrl = `${baseUrl.replace(/\/$/, "")}/admin`;

    // 🔴 Red for Out of Stock, 🟡 Amber for Low Stock (< 3)
    const color = isOutOfStock ? 15680580 : 16098827; // 0xEF4444 (Red) or 0xF59E0B (Amber)

    const title = isOutOfStock
        ? `🚨 OUT OF STOCK: ${product.title}`
        : `⚠️ LOW STOCK ALERT: ${product.title}`;

    const description = isOutOfStock
        ? `**Product is completely sold out!** Immediate restocking required.\n\n[🔍 View in Catalog](${catalogUrl}) • [⚙️ Restock in Admin Panel](${adminUrl})`
        : `**Product is almost sold out!** Remaining units have dropped to a critical level.\n\n[🔍 View in Catalog](${catalogUrl}) • [⚙️ Restock in Admin Panel](${adminUrl})`;

    const remainingStockValue = isOutOfStock
        ? `**0 units (SOLD OUT)**`
        : `**${product.stock} units left** (was ${previousStock !== undefined ? previousStock : product.stock + 1})`;

    // Resolve thumbnail image
    let imageUrl = null;
    if (product.thumbnail && product.thumbnail.startsWith("http")) {
        imageUrl = product.thumbnail;
    } else if (product.uploadedThumbnail && product.uploadedThumbnail.startsWith("http")) {
        imageUrl = product.uploadedThumbnail;
    } else if (Array.isArray(product.images) && product.images[0] && product.images[0].startsWith("http")) {
        imageUrl = product.images[0];
    }

    const fields = [
        {
            name: "📦 Remaining Stock",
            value: remainingStockValue,
            inline: true,
        },
        {
            name: "💰 Price",
            value: `₹${Number(product.price || 0).toFixed(2)}${product.discountPercentage ? ` (${product.discountPercentage}% off)` : ""}`,
            inline: true,
        },
        {
            name: "🏷️ Category",
            value: product.category || "General",
            inline: true,
        },
        {
            name: "🏢 Brand / Seller",
            value: product.brand || "CampusMart Seller",
            inline: true,
        },
        {
            name: "🆔 Product ID (SKU for Catalog Search)",
            value: `\`${product._id}\``,
            inline: true,
        },
    ];

    const embed = {
        title,
        description,
        color,
        fields,
        footer: {
            text: "EcomMart Automated Inventory Monitor",
        },
        timestamp: new Date().toISOString(),
    };

    if (imageUrl) {
        embed.thumbnail = { url: imageUrl };
    }

    return embed;
};

/**
 * Evaluates product inventory and dispatches Discord alert if critical.
 * Lifecycle:
 * - stock >= 3: healthy, 0 notifications
 * - stock drops to 2: low stock notification
 * - stock drops to 1: low stock update notification
 * - stock drops to 0: out of stock critical notification
 * - stock is 0: purchases blocked, 0 further notifications
 */
const sendDiscordStockAlert = async (product, previousStock) => {
    try {
        if (!product || typeof product.stock !== "number") {
            return false;
        }

        // Only alert if stock is below 3 units
        if (product.stock >= 3) {
            return false;
        }

        const webhookUrl = getStockWebhookUrl();
        if (!webhookUrl) {
            // Webhook not configured in .env; silently return without crashing
            return false;
        }

        const embed = buildStockAlertEmbed(product, previousStock);

        const payload = {
            username: "CampusMart Inventory Alert",
            avatar_url: "https://res.cloudinary.com/dyt4a3p2j/image/upload/v1/campusmart/logo.png",
            embeds: [embed],
        };

        const response = await fetch(webhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.warn(`[DiscordService] Failed to send Discord stock alert: HTTP ${response.status} - ${errorText}`);
            return false;
        }

        console.log(`[DiscordService] Discord ${product.stock === 0 ? "Out-of-Stock" : "Low Stock"} alert sent for "${product.title}" (Remaining: ${product.stock})`);
        return true;
    } catch (error) {
        console.error(`[DiscordService] Error sending stock alert for product ${product?._id || "unknown"}:`, error.message);
        return false;
    }
};

module.exports = {
    getStockWebhookUrl,
    buildStockAlertEmbed,
    sendDiscordStockAlert,
};
