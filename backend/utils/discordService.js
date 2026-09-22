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
    const baseUrl = (process.env.URL || "http://localhost:5173").trim();
    const catalogUrl = `${baseUrl.replace(/\/$/, "")}/product/${product._id}`;
    const adminUrl = `${baseUrl.replace(/\/$/, "")}/admin?tab=products`;

    // 🔴 Vibrant Red for Out of Stock, 🟡 Amber for Low Stock (< 3)
    const color = isOutOfStock ? 15548997 : 16098827; // 0xED4245 (Discord Red) or 0xF59E0B (Amber)

    const title = `${isOutOfStock ? "🚨" : "⚠️"} ${product.title || "Product"}`;

    const description = isOutOfStock
        ? `> 🚨 **Critical Alert:** Product is completely **sold out** (0 units remaining).\n> Immediate restocking required to resume customer orders.`
        : `> ⚠️ **Stock Warning:** Remaining inventory has dropped to **${product.stock} ${product.stock === 1 ? "unit" : "units"} left**.\n> Consider restocking soon to prevent order interruptions.`;

    const formatCategory = (cat) => {
        if (!cat) return "General";
        return String(cat)
            .split(/[-_\s]+/)
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(" ");
    };

    const formattedPrice = `₹${Number(product.price || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const priceDisplay = product.discountPercentage
        ? `**${formattedPrice}**\n*(${product.discountPercentage}% off)*`
        : `**${formattedPrice}**`;

    const stockPill = isOutOfStock
        ? `\`🔴 0 Units (SOLD OUT)\`${previousStock !== undefined ? `\n*(was ${previousStock})*` : ""}`
        : `\`🟡 ${product.stock} ${product.stock === 1 ? "Unit" : "Units"} Left\`${previousStock !== undefined ? `\n*(was ${previousStock})*` : ""}`;

    // Resolve thumbnail image
    let imageUrl = null;
    if (product.thumbnail && product.thumbnail.startsWith("http")) {
        imageUrl = product.thumbnail;
    } else if (product.uploadedThumbnail && product.uploadedThumbnail.startsWith("http")) {
        imageUrl = product.uploadedThumbnail;
    } else if (Array.isArray(product.images) && product.images[0] && product.images[0].startsWith("http")) {
        imageUrl = product.images[0];
    }

    const statusValue = isOutOfStock
        ? "`🚨 Critical (Empty)`"
        : "`⚠️ Low Stock (<\u00A03)`";

    const fields = [
        {
            name: "📦 Stock Status",
            value: stockPill,
            inline: true,
        },
        {
            name: "💰 Unit Price",
            value: priceDisplay,
            inline: true,
        },
        {
            name: "🏷️ Category",
            value: `**${formatCategory(product.category)}**`,
            inline: true,
        },
        {
            name: "🏢 Brand / Seller",
            value: `**${product.brand || "CampusMart"}**`,
            inline: true,
        },
        {
            name: "⚡ Status",
            value: statusValue,
            inline: true,
        },
        {
            name: "🆔 Product SKU",
            value: `\`${product._id}\``,
            inline: false,
        },
        {
            name: "🔗 Quick Actions",
            value: `[📦 View in Store](${catalogUrl})  •  [🛠️ Restock in Admin](${adminUrl})\n-# 💡 *Tip: Click SKU above to copy for admin catalog search.*`,
            inline: false,
        },
    ];

    const embed = {
        author: {
            name: isOutOfStock ? "ECOMMART • CRITICAL INVENTORY ALERT" : "ECOMMART • INVENTORY MONITOR",
        },
        title,
        url: catalogUrl,
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
