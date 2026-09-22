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
            value: `**${product.brand || "EcomMart"}**`,
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
            username: "EcomMart Inventory Alert",
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


/**
 * Resolves the Discord Webhook URL for order events
 */
const getOrderWebhookUrl = () => {
    return (
        process.env.DISCORD_ORDER_WEBHOOK_URL ||
        process.env.DISCORD_WEBHOOK_URL ||
        ""
    ).trim();
};

/**
 * Builds a rich Discord Embed payload for new successful order events
 */
const buildOrderAlertEmbed = (order, customerDetails, clientUrl) => {
    const baseUrl = (clientUrl || process.env.URL || "http://localhost:5173").trim();
    const adminOrderUrl = `${baseUrl.replace(/\/$/, "")}/admin/orders/${order._id}`;

    const shortId = String(order._id).slice(-8).toUpperCase();
    const total = Number(order.totalPrice || order.amount || 0);
    const formattedTotal = `₹${total.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const customerName = customerDetails?.customerName || order.shippingAddress?.fullName || "Campus Customer";
    const customerEmail = customerDetails?.customerEmail || "N/A";
    const shipping = order.shippingAddress || {};

    const isPaid = order.status === "PAID";
    const paymentMethodDisplay = order.paymentMethod === "COD"
        ? "Cash on Delivery (Pending Collection)"
        : isPaid ? "Razorpay (Paid Online)" : (order.paymentMethod || "Online Payment");

    const items = Array.isArray(order.orderItems) ? order.orderItems : [];
    const itemsCount = items.reduce((acc, item) => acc + (item.quantity || item.qty || 1), 0);

    const title = `🛍️ Order #${shortId} received from ${customerName} (${formattedTotal})`;

    const description = `> 💰 **Payment:** \`${paymentMethodDisplay}\`\n> 📦 **Total Amount:** **${formattedTotal}** • **${itemsCount} ${itemsCount === 1 ? "item" : "items"}**`;

    // Format ordered items (preview up to 5 items cleanly)
    let itemsText = "";
    if (items.length > 0) {
        const previewItems = items.slice(0, 5);
        itemsText = previewItems
            .map((item) => {
                const qty = item.quantity || item.qty || 1;
                const price = Number(item.price || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 });
                return `• **${qty}x** ${item.title || item.name || "Product"} — *₹${price}*`;
            })
            .join("\n");

        if (items.length > 5) {
            itemsText += `\n*+ ${items.length - 5} more items...*`;
        }
    } else {
        itemsText = "*No items listed*";
    }

    // Resolve thumbnail from first product
    let imageUrl = null;
    if (items[0]) {
        if (items[0].thumbnail && items[0].thumbnail.startsWith("http")) {
            imageUrl = items[0].thumbnail;
        } else if (items[0].image && items[0].image.startsWith("http")) {
            imageUrl = items[0].image;
        }
    }

    const fields = [
        {
            name: "👤 Customer",
            value: `**${customerName}**\n${customerEmail}`,
            inline: true,
        },
        {
            name: "📞 Contact Phone",
            value: `**${shipping.phone || "Not provided"}**`,
            inline: true,
        },
        {
            name: "💳 Payment Status",
            value: isPaid ? "`✅ PAID (Online)`" : "`⏳ COD (Cash on Delivery)`",
            inline: true,
        },
        {
            name: "📍 Delivery Location",
            value: `**${shipping.city || "Campus"}${shipping.pincode ? ` - ${shipping.pincode}` : ""}**\n*${shipping.address || "Campus Address"}*`,
            inline: true,
        },
        {
            name: "⚡ Order Status",
            value: `\`${order.orderStatus || "Processing"}\``,
            inline: true,
        },
        {
            name: "🛒 Items Summary",
            value: itemsText,
            inline: false,
        },
        {
            name: "🔗 Quick Actions",
            value: `[📋 View Full Order in Admin Dashboard](${adminOrderUrl})\n-# 💡 Order ID: \`${order._id}\``,
            inline: false,
        },
    ];

    const embed = {
        author: {
            name: "ECOMMART • NEW ORDER RECEIVED",
        },
        title,
        url: adminOrderUrl,
        description,
        color: 3066993, // 0x2ECC71 (Emerald Green)
        fields,
        footer: {
            text: "EcomMart Automated Order Dispatcher",
        },
        timestamp: order.createdAt ? new Date(order.createdAt).toISOString() : new Date().toISOString(),
    };

    if (imageUrl) {
        embed.thumbnail = { url: imageUrl };
    }

    return embed;
};

/**
 * Dispatches an instant New Order alert to the designated Discord channel.
 * Only sends for confirmed COD or successfully PAID Razorpay orders.
 */
const sendDiscordOrderAlert = async (orderInput) => {
    try {
        if (!orderInput) return false;

        const Order = require("../models/Order");
        const User = require("../models/User");

        // Resolve latest order document if needed
        let order = orderInput;
        if (!order.orderItems || !order.shippingAddress || typeof order.save !== "function") {
            const freshOrder = await Order.findById(order._id || order);
            if (freshOrder) order = freshOrder;
        }

        // 1. Guard check: alert only for confirmed COD or PAID orders
        const isPaid = order.status === "PAID";
        const isCod = order.paymentMethod === "COD";
        if (!isPaid && !isCod) {
            console.log(`[DiscordService] Order #${order._id} is neither PAID nor COD. Skipping Discord order alert.`);
            return false;
        }

        const webhookUrl = getOrderWebhookUrl();
        if (!webhookUrl) {
            // Webhook not configured in .env; silently return without crashing
            return false;
        }

        // 2. Atomic duplicate prevention check (guarantees race condition immunity)
        const claimedOrder = await Order.findOneAndUpdate(
            { _id: order._id, adminAlertDiscordSent: { $ne: true } },
            { $set: { adminAlertDiscordSent: true } },
            { new: true }
        );

        if (!claimedOrder) {
            console.log(`[DiscordService] Discord order alert already claimed or sent for order #${order._id}. Skipping duplicate.`);
            return false;
        }

        order = claimedOrder;

        // 3. Resolve customer details
        let customerEmail = "N/A";
        let customerName = order.shippingAddress?.fullName || "Campus Customer";

        if (order.user) {
            if (typeof order.user === "object" && order.user.email) {
                customerEmail = order.user.email;
                if (order.user.name) customerName = order.user.name;
            } else {
                const userDoc = await User.findById(order.user).select("name email");
                if (userDoc) {
                    customerEmail = userDoc.email;
                    if (userDoc.name) customerName = userDoc.name;
                }
            }
        }

        const embed = buildOrderAlertEmbed(order, { customerName, customerEmail });

        const payload = {
            username: "CampusMart Order Alert",
            embeds: [embed],
        };

        const response = await fetch(webhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.warn(`[DiscordService] Failed to send Discord order alert: HTTP ${response.status} - ${errorText}`);
            // Revert claim on network failure
            await Order.findByIdAndUpdate(order._id, { adminAlertDiscordSent: false }).catch(() => { });
            return false;
        }

        console.log(`[DiscordService] Discord New Order alert sent for Order #${order._id} (${order.status === "PAID" ? "PAID" : "COD"})`);
        return true;
    } catch (error) {
        console.error(`[DiscordService] Error sending Discord order alert for order ${orderInput?._id || "unknown"}:`, error.message);
        return false;
    }
};


/**
 * Resolves the Discord Webhook URL for contact inquiry events
 */
const getContactWebhookUrl = () => {
    return (
        process.env.DISCORD_CONTACT_WEBHOOK_URL ||
        process.env.DISCORD_WEBHOOK_URL ||
        ""
    ).trim();
};

/**
 * Builds a rich Discord Embed payload for student contact form inquiries
 */
const buildContactAlertEmbed = (contact) => {
    const subject = contact.subject || "General Inquiry";
    const mailtoLink = `mailto:${contact.email}?subject=${encodeURIComponent(`Re: ${subject} - EcomMart Support`)}`;

    const title = `📬 New Inquiry from ${contact.name}`;
    const description = `> 💬 **Message:**\n> ${contact.message.length > 900 ? contact.message.slice(0, 900) + "..." : contact.message}`;

    const fields = [
        {
            name: "👤 Student Name",
            value: `**${contact.name}**`,
            inline: true,
        },
        {
            name: "📧 Email Address",
            value: `[${contact.email}](mailto:${contact.email})`,
            inline: true,
        },
        {
            name: "📞 Phone / Contact",
            value: `**${contact.phone || "Not provided"}**`,
            inline: true,
        },
        {
            name: "🏷️ Topic / Subject",
            value: `**${subject}**`,
            inline: true,
        },
        {
            name: "⚡ Status",
            value: "`⏳ Pending`",
            inline: true,
        },
        {
            name: "🔗 Direct Action",
            value: `[✉️ Click to Reply via Email](${mailtoLink})\n-# 💡 Inquiry ID: \`${contact._id}\``,
            inline: false,
        },
    ];

    const embed = {
        author: {
            name: "ECOMMART • CUSTOMER SUPPORT INQUIRY",
        },
        title,
        description,
        color: 5793266, // 0x5865F2 (Discord Blurple)
        fields,
        footer: {
            text: "EcomMart Automated Support Desk",
        },
        timestamp: contact.createdAt ? new Date(contact.createdAt).toISOString() : new Date().toISOString(),
    };

    return embed;
};

/**
 * Dispatches an inquiry alert to the designated Discord support channel.
 */
const sendDiscordContactAlert = async (contact) => {
    try {
        if (!contact) return false;

        const webhookUrl = getContactWebhookUrl();
        if (!webhookUrl) {
            // Webhook not configured in .env; silently return without crashing
            return false;
        }

        const embed = buildContactAlertEmbed(contact);

        const payload = {
            username: "EcomMart Support Desk",
            embeds: [embed],
        };

        const response = await fetch(webhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.warn(`[DiscordService] Failed to send Discord contact alert: HTTP ${response.status} - ${errorText}`);
            return false;
        }

        console.log(`[DiscordService] Discord contact inquiry alert sent for "${contact.name}" (${contact.email})`);
        return true;
    } catch (error) {
        console.error(`[DiscordService] Error sending contact alert:`, error.message);
        return false;
    }
};

module.exports = {
    getStockWebhookUrl,
    getOrderWebhookUrl,
    getContactWebhookUrl,
    buildStockAlertEmbed,
    buildOrderAlertEmbed,
    buildContactAlertEmbed,
    sendDiscordStockAlert,
    sendDiscordOrderAlert,
    sendDiscordContactAlert,
};
