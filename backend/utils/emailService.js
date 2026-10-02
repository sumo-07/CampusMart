const nodemailer = require("nodemailer");
const dns = require("dns");
const User = require("../models/User");
const Order = require("../models/Order");
const { getGmailClient } = require("./gmail/gmailAuth");
const { sendEmail: sendGmailEmail } = require("./gmail/gmailSender");

// Ensure Node resolves IPv4 addresses before IPv6 to prevent ENETUNREACH on cloud environments like Render
if (dns.setDefaultResultOrder) {
    dns.setDefaultResultOrder("ipv4first");
}

/**
 * Creates and returns a Nodemailer transporter instance.
 * Returns null if credentials are not configured in .env.
 */
const getTransporter = () => {
    const service = (process.env.EMAIL_SERVICE || "gmail").trim().toLowerCase();
    const user = process.env.EMAIL_USER ? process.env.EMAIL_USER.trim() : null;
    const pass = process.env.EMAIL_PASS ? process.env.EMAIL_PASS.trim() : null;

    if (!user || !pass) {
        return null;
    }

    if (service === "gmail") {
        return nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 587,
            secure: false, // Use STARTTLS on 587 (port 465 SSL is blocked or times out on cloud hosts like Render)
            family: 4,     // Force IPv4 to eliminate connect ENETUNREACH 2607:f8b0... on Render
            auth: {
                user,
                pass,
            },
            tls: {
                rejectUnauthorized: false,
            },
            connectionTimeout: 10000,
            greetingTimeout: 10000,
            socketTimeout: 15000,
        });
    }

    // Generic SMTP configuration fallback
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port: Number(process.env.SMTP_PORT) || 587,
        secure: Number(process.env.SMTP_PORT) === 465,
        family: 4, // Force IPv4
        auth: {
            user,
            pass,
        },
        tls: {
            rejectUnauthorized: false,
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000,
    });
};

/**
 * Resolves active email provider ('gmail_api' vs 'nodemailer').
 * Defaults to 'gmail_api'.
 */
const getEmailProvider = () => {
    return (process.env.EMAIL_PROVIDER || "gmail_api").trim().toLowerCase();
};

/**
 * Dispatches an email using the active provider:
 * - 'gmail_api' (default): Official Google Gmail API via OAuth 2.0
 * - 'nodemailer': Custom SMTP / Gmail App Password
 */
const dispatchEmail = async ({
    to,
    subject,
    html,
    text,
    from,
    replyTo,
    headers = {},
    contextName = "Email",
}) => {
    const provider = getEmailProvider();

    if (provider === "nodemailer") {
        const transporter = getTransporter();
        if (!transporter) {
            console.warn(`[EmailService] Nodemailer credentials (EMAIL_USER/EMAIL_PASS) not configured in .env. ${contextName} skipped.`);
            return { success: false, skipped: true, provider };
        }

        const info = await transporter.sendMail({
            from,
            replyTo,
            to,
            subject,
            text,
            html,
            headers,
        });

        return {
            success: true,
            messageId: info.messageId,
            provider,
        };
    }

    // Default: gmail_api
    const gmail = getGmailClient();
    if (!gmail) {
        console.warn(`[EmailService] Gmail API credentials (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN) not configured in .env. ${contextName} skipped.`);
        return { success: false, skipped: true, provider };
    }

    const result = await sendGmailEmail({
        to,
        subject,
        html,
        text,
        from,
        replyTo,
        headers,
    });

    if (!result.success) {
        throw new Error(result.error || "Gmail API send failed");
    }

    return {
        success: true,
        messageId: result.messageId,
        provider,
    };
};

/**
 * Format date to standard readable string (IST or local)
 */
const formatOrderDate = (date) => {
    try {
        return new Intl.DateTimeFormat("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
        }).format(new Date(date || Date.now()));
    } catch {
        return new Date().toLocaleString();
    }
};

/**
 * Generates clean plain-text fallback for email clients and spam filter compliance
 */
const generateOrderReceiptText = (order, customerName, clientUrl) => {
    const isOnline = order.paymentMethod === "Razorpay";
    const paymentLabel = isOnline ? "Razorpay (Online Paid)" : "Cash on Delivery (Pay on Arrival)";
    const shortId = String(order._id).slice(-8).toUpperCase();
    const formattedDate = formatOrderDate(order.createdAt);
    const shipping = order.shippingAddress || {};

    const itemsText = (order.orderItems || [])
        .map(
            (item, index) =>
                `${index + 1}. ${item.title || "Item"} x ${item.quantity} - Rs. ${(Number(item.price) * Number(item.quantity)).toFixed(2)}`
        )
        .join("\n");

    const total = Number(order.totalPrice || order.amount || 0).toFixed(2);
    const baseUrl = (process.env.URL || process.env.CLIENT_URL || clientUrl || "http://localhost:5173").trim();
    const trackOrderUrl = `${baseUrl.replace(/\/$/, "")}/orders`;

    return `CARTSY - ORDER RECEIPT
==========================================
Thank you for your order, ${customerName}!
${isOnline ? "Your payment was received successfully." : "Your cash on delivery order has been placed."}

Order Ref: #${shortId}
Date: ${formattedDate}
Payment Mode: ${paymentLabel}
${order.razorpayOrderId ? `Razorpay ID: ${order.razorpayOrderId}\n` : ""}
ITEMS ORDERED:
------------------------------------------
${itemsText}

Grand Total: Rs. ${total}

DELIVERY ADDRESS:
------------------------------------------
${shipping.fullName || customerName}
${shipping.address || "Delivery Address"}
${shipping.city || ""}${shipping.pincode ? " - " + shipping.pincode : ""}
${shipping.phone ? `Phone: ${shipping.phone}` : ""}

Track your order anytime at:
${trackOrderUrl}

Questions? Reply to this email or contact our support team.
(C) ${new Date().getFullYear()} CARTSY. All rights reserved.
`;
};

/**
 * Generates an itemized, responsive HTML digital receipt for an order
 */
const generateOrderReceiptHtml = (order, customerName, clientUrl) => {
    const isOnline = order.paymentMethod === "Razorpay";
    const paymentLabel = isOnline ? "Razorpay (Online Paid)" : "Cash on Delivery (Pay on Arrival)";
    const statusBadgeText = isOnline ? "PAYMENT SUCCESSFUL" : "ORDER CONFIRMED";
    const statusBadgeBg = isOnline ? "#00F59B" : "#FFE600";
    const statusBadgeColor = "#0A0A0A";
    const statusBadgeBorder = "#0A0A0A";

    const formattedDate = formatOrderDate(order.createdAt);
    const orderRef = String(order._id);
    const shortOrderRef = orderRef.length > 8 ? orderRef.slice(-8).toUpperCase() : orderRef;

    const itemsRows = (order.orderItems || [])
        .map((item) => {
            const itemTotal = (Number(item.price) * Number(item.quantity)).toFixed(2);
            return `
            <tr style="border-bottom: 1.5px solid #0A0A0A;">
                <td style="padding: 12px 14px; color: #0A0A0A; font-size: 14px; font-weight: 700;">
                    ${item.title || "Item"}
                </td>
                <td style="padding: 12px 14px; color: #0A0A0A; font-size: 14px; font-weight: 800; text-align: center;">
                    ${item.quantity}
                </td>
                <td style="padding: 12px 14px; color: #383838; font-size: 14px; text-align: right; font-weight: 600;">
                    ₹${Number(item.price).toFixed(2)}
                </td>
                <td style="padding: 12px 14px; color: #0A0A0A; font-size: 14px; font-weight: 800; text-align: right;">
                    ₹${itemTotal}
                </td>
            </tr>
            `;
        })
        .join("");

    const totalAmount = Number(order.totalPrice || order.amount || 0).toFixed(2);
    const shipping = order.shippingAddress || {};
    
    const baseUrl = (process.env.URL || process.env.CLIENT_URL || clientUrl || "http://localhost:5173").trim();
    const trackOrderUrl = `${baseUrl.replace(/\/$/, "")}/orders`;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Order Receipt - CARTSY</title>
</head>
<body style="margin: 0; padding: 0; background-color: #FFFDF9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #FFFDF9; padding: 32px 10px;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; background-color: #ffffff; border: 2.5px solid #0A0A0A; border-radius: 14px; overflow: hidden; box-shadow: 6px 6px 0px #0A0A0A;">
                    
                    <!-- BRAND HEADER -->
                    <tr>
                        <td style="background-color: #FFE600; border-bottom: 2.5px solid #0A0A0A; padding: 28px 24px; text-align: center;">
                            <div style="font-size: 30px; font-weight: 900; color: #0A0A0A; letter-spacing: -1px; text-transform: uppercase;">
                                🛒 CARTSY
                            </div>
                            <div style="display: inline-block; background-color: #FF6EA7; color: #0A0A0A; font-size: 11px; font-weight: 900; padding: 4px 12px; border-radius: 20px; border: 1.5px solid #0A0A0A; margin-top: 8px; letter-spacing: 0.5px; text-transform: uppercase;">
                                OFFICIAL ORDER RECEIPT • NO CAP
                            </div>
                        </td>
                    </tr>

                    <!-- STATUS BADGE & GREETING -->
                    <tr>
                        <td style="padding: 28px 28px 18px 28px; text-align: center;">
                            <div style="display: inline-block; background-color: ${statusBadgeBg}; color: ${statusBadgeColor}; border: 2px solid ${statusBadgeBorder}; box-shadow: 2px 2px 0px #0A0A0A; font-size: 12px; font-weight: 900; padding: 6px 16px; border-radius: 20px; letter-spacing: 0.8px; margin-bottom: 16px;">
                                ${statusBadgeText}
                            </div>
                            <h2 style="margin: 0; color: #0A0A0A; font-size: 22px; font-weight: 900; text-transform: uppercase;">
                                Thank You for Your Order, ${customerName}!
                            </h2>
                            <p style="margin: 8px 0 0 0; color: #383838; font-size: 14px; line-height: 1.5; font-weight: 500;">
                                ${
                                    isOnline
                                        ? "Your payment was received successfully and your drip is currently being prepared."
                                        : "Your cash on delivery order has been placed and stock has been reserved for you."
                                }
                            </p>
                        </td>
                    </tr>

                    <!-- ORDER METADATA -->
                    <tr>
                        <td style="padding: 0 28px 20px 28px;">
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #FFFDF0; border: 2px solid #0A0A0A; border-radius: 10px; box-shadow: 3px 3px 0px #0A0A0A; padding: 16px;">
                                <tr>
                                    <td style="padding: 4px 8px; font-size: 13px; color: #0A0A0A;">
                                        <strong>Order Ref:</strong> #${shortOrderRef}
                                    </td>
                                    <td style="padding: 4px 8px; font-size: 13px; color: #0A0A0A; text-align: right;">
                                        <strong>Date:</strong> ${formattedDate}
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 4px 8px; font-size: 13px; color: #0A0A0A;" colspan="2">
                                        <strong>Payment Mode:</strong> <span style="color: #0A0A0A; font-weight: 800;">${paymentLabel}</span>
                                    </td>
                                </tr>
                                ${
                                    order.razorpayOrderId
                                        ? `
                                <tr>
                                    <td style="padding: 4px 8px; font-size: 12px; color: #666666;" colspan="2">
                                        <strong>Razorpay ID:</strong> ${order.razorpayOrderId}
                                    </td>
                                </tr>`
                                        : ""
                                }
                            </table>
                        </td>
                    </tr>

                    <!-- ITEMIZED PRODUCTS TABLE -->
                    <tr>
                        <td style="padding: 0 28px 20px 28px;">
                            <h3 style="margin: 0 0 10px 0; color: #0A0A0A; font-size: 15px; font-weight: 900; text-transform: uppercase;">
                                Items Ordered
                            </h3>
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse: collapse; border: 2px solid #0A0A0A; border-radius: 10px; overflow: hidden;">
                                <thead>
                                    <tr style="background-color: #FFE600; border-bottom: 2px solid #0A0A0A;">
                                        <th style="padding: 12px 14px; font-size: 12px; font-weight: 900; color: #0A0A0A; text-align: left; text-transform: uppercase;">Item</th>
                                        <th style="padding: 12px 14px; font-size: 12px; font-weight: 900; color: #0A0A0A; text-align: center; text-transform: uppercase;">Qty</th>
                                        <th style="padding: 12px 14px; font-size: 12px; font-weight: 900; color: #0A0A0A; text-align: right; text-transform: uppercase;">Price</th>
                                        <th style="padding: 12px 14px; font-size: 12px; font-weight: 900; color: #0A0A0A; text-align: right; text-transform: uppercase;">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${itemsRows}
                                </tbody>
                                <tfoot>
                                    <tr style="background-color: #FFFDF0; border-top: 2px solid #0A0A0A;">
                                        <td colspan="3" style="padding: 14px 16px; text-align: right; font-size: 14px; font-weight: 900; color: #0A0A0A; text-transform: uppercase;">
                                            Grand Total:
                                        </td>
                                        <td style="padding: 14px 16px; text-align: right; font-size: 18px; font-weight: 900; color: #FF2A85;">
                                            ₹${totalAmount}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </td>
                    </tr>

                    <!-- DELIVERY ADDRESS BLOCK -->
                    <tr>
                        <td style="padding: 0 28px 22px 28px;">
                            <div style="background-color: #F0FFF7; border: 2px solid #0A0A0A; border-radius: 10px; box-shadow: 3px 3px 0px #0A0A0A; padding: 18px;">
                                <div style="font-size: 12px; font-weight: 900; color: #0A0A0A; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">
                                    📍 Delivery Information
                                </div>
                                <div style="font-size: 15px; font-weight: 800; color: #0A0A0A; margin-bottom: 4px;">
                                    ${shipping.fullName || customerName}
                                </div>
                                <div style="font-size: 14px; color: #383838; line-height: 1.5; font-weight: 500;">
                                    ${shipping.address || "Delivery Address"}<br>
                                    ${shipping.city || ""}${shipping.pincode ? " - " + shipping.pincode : ""}
                                </div>
                                ${
                                    shipping.phone
                                        ? `<div style="font-size: 14px; color: #383838; margin-top: 6px; font-weight: 600;">
                                            <strong>Phone:</strong> ${shipping.phone}
                                           </div>`
                                        : ""
                                }
                            </div>
                        </td>
                    </tr>

                    <!-- CALL TO ACTION BUTTON -->
                    <tr>
                        <td style="padding: 10px 28px 28px 28px; text-align: center;">
                            <a href="${trackOrderUrl}" target="_blank" style="display: inline-block; background-color: #FFE600; color: #0A0A0A; text-decoration: none; font-size: 15px; font-weight: 900; text-transform: uppercase; padding: 14px 34px; border-radius: 8px; border: 2.5px solid #0A0A0A; box-shadow: 4px 4px 0px #0A0A0A; letter-spacing: 0.5px;">
                                View Your Order &rarr;
                            </a>
                            <div style="margin-top: 10px; font-size: 12px; color: #666666; font-weight: 600;">
                                Track status, view order timeline, or print receipt anytime.
                            </div>
                            <p style="margin: 14px 0 0 0; font-size: 12px; color: #666666; line-height: 1.5; text-align: center; word-break: break-all;">
                                If the button above does not work, copy and paste this link into your browser:<br/>
                                <a href="${trackOrderUrl}" target="_blank" rel="noopener noreferrer" style="color: #0A0A0A; font-weight: 700; text-decoration: underline;">${trackOrderUrl}</a>
                            </p>
                        </td>
                    </tr>

                    <!-- FOOTER -->
                    <tr>
                        <td style="background-color: #0A0A0A; padding: 22px 28px; text-align: center; border-top: 2.5px solid #0A0A0A;">
                            <div style="font-size: 14px; font-weight: 900; color: #FFE600; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px;">
                                CARTSY
                            </div>
                            <p style="margin: 0; font-size: 12px; color: #CCCCCC; line-height: 1.5;">
                                Questions or need support? Reply directly to this email.<br>
                                &copy; ${new Date().getFullYear()} CARTSY. All rights reserved.
                            </p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `;
};

/**
 * Sends order confirmation email in a non-blocking background operation.
 * Guarantees duplicate prevention via `confirmationEmailSent` flag.
 */
const sendOrderConfirmationEmail = async (orderInput) => {
    try {
        if (!orderInput) return false;

        // Resolve latest order document if only ID is passed or needs reload
        let order = orderInput;
        if (!order.orderItems || !order.shippingAddress || typeof order.save !== "function") {
            const freshOrder = await Order.findById(order._id || order);
            if (freshOrder) order = freshOrder;
        }

        // 1. Duplicate check: Never send twice for the same order
        if (order.confirmationEmailSent) {
            console.log(`[EmailService] Confirmation email already sent for order #${order._id}. Skipping.`);
            return false;
        }

        // 2. Resolve customer email and name
        let recipientEmail = null;
        let customerName = order.shippingAddress?.fullName || "Valued Student";

        if (order.user) {
            if (typeof order.user === "object" && order.user.email) {
                recipientEmail = order.user.email;
                if (order.user.name) customerName = order.user.name;
            } else {
                const userDoc = await User.findById(order.user).select("name email");
                if (userDoc) {
                    recipientEmail = userDoc.email;
                    if (userDoc.name) customerName = userDoc.name;
                }
            }
        }

        if (!recipientEmail) {
            console.warn(`[EmailService] No recipient email found for order #${order._id}. Skipping email.`);
            return false;
        }

        const clientUrl = (process.env.URL || process.env.CLIENT_URL || "http://localhost:5173").trim();
        const shortId = String(order._id).slice(-8).toUpperCase();
        const isOnline = order.paymentMethod === "Razorpay";
        const subject = isOnline
            ? `Payment Received & Order Confirmed #${shortId} - CARTSY`
            : `Order Confirmed #${shortId} (Cash on Delivery) - CARTSY`;

        // Ensure From address uses brand name and authenticated email address
        const fallbackEmail = (process.env.GMAIL_FROM_EMAIL || process.env.EMAIL_USER || "").trim();
        let fromAddress = `"CARTSY" <${fallbackEmail}>`;
        if (process.env.EMAIL_FROM) {
            const nameMatch = process.env.EMAIL_FROM.match(/^["']?([^"<']+)["']?/);
            const displayName = nameMatch ? nameMatch[1].trim() : "CARTSY";
            fromAddress = `"${displayName}" <${fallbackEmail}>`;
        }

        const html = generateOrderReceiptHtml(order, customerName, clientUrl);
        const text = generateOrderReceiptText(order, customerName, clientUrl);

        const dispatchResult = await dispatchEmail({
            to: recipientEmail,
            from: fromAddress,
            replyTo: process.env.EMAIL_REPLY_TO || process.env.GMAIL_FROM_EMAIL || process.env.EMAIL_USER,
            subject,
            text,
            html,
            headers: {
                "X-Entity-Ref-ID": String(order._id),
            },
            contextName: `Order receipt (#${order._id})`,
        });

        if (!dispatchResult.success) {
            return false;
        }

        console.log(`[EmailService] Order receipt sent to ${recipientEmail} for order #${order._id} (Provider: ${dispatchResult.provider}, Message ID: ${dispatchResult.messageId})`);

        // 3. Update idempotency flag
        if (typeof order.save === "function") {
            order.confirmationEmailSent = true;
            await order.save();
        } else {
            await Order.findByIdAndUpdate(order._id, { confirmationEmailSent: true });
        }

        return true;
    } catch (error) {
        console.error(`[EmailService] Error sending confirmation email for order #${orderInput?._id || "unknown"}:`, error.message);
        return false;
    }
};

/**
 * Resolves messaging, badges, and campus delivery instructions based on order status
 */
const getStatusConfig = (status, order, customerName) => {
    const isPaid = order.status === "PAID" || order.paymentStatus === "Paid";
    const totalAmount = Number(order.totalPrice || order.amount || 0).toFixed(2);
    const shipping = order.shippingAddress || {};

    switch (status) {
        case "Shipped":
            return {
                badgeText: "📦 SHIPPED & ON THE WAY",
                badgeBg: "#54B5FF",
                badgeBorder: "#0A0A0A",
                badgeColor: "#0A0A0A",
                headline: "Your Order Has Shipped!",
                subheadline: "Your package has been dispatched and is making its way to you.",
                instructionTitle: "📍 Delivery & Handover Details",
                instructionBody: `
                    &bull; Delivery partner will deliver this package to: <strong>${shipping.address || "your delivery address"}</strong>.<br>
                    &bull; Please keep your contact reachable at <strong>${shipping.phone || "the phone number provided"}</strong>.<br>
                    &bull; If you are away, ensure someone is authorized to receive your delivery.
                `,
                textInstructions: `Delivery Note: Your order has been dispatched and is on its way to ${shipping.address || "your delivery address"}. Contact: ${shipping.phone || "the phone number provided"}.`,
                subject: `📦 Shipped! Order #${String(order._id).slice(-8).toUpperCase()} is on its way - CARTSY`,
            };

        case "Delivered":
            return {
                badgeText: "✅ DELIVERED SUCCESSFULLY",
                badgeBg: "#00F59B",
                badgeBorder: "#0A0A0A",
                badgeColor: "#0A0A0A",
                headline: "Your Order Has Arrived!",
                subheadline: "We hope you love your new gear. Thank you for shopping with Cartsy!",
                instructionTitle: "📍 Delivery Confirmation",
                instructionBody: `
                    &bull; Delivered to: <strong>${shipping.fullName || customerName}</strong> at <strong>${shipping.address || "your delivery address"}</strong>.<br>
                    &bull; Have questions or need an exchange? Simply reply directly to this email anytime.
                `,
                textInstructions: `Delivered to ${shipping.fullName || customerName} at ${shipping.address || "your delivery address"}. If you have any questions, reply directly to this email.`,
                subject: `✅ Delivered! Order #${String(order._id).slice(-8).toUpperCase()} - CARTSY`,
            };

        case "Processing":
            return {
                badgeText: "⚙️ ORDER IN PROCESSING",
                badgeBg: "#FFE600",
                badgeBorder: "#0A0A0A",
                badgeColor: "#0A0A0A",
                headline: "We're Packing Your Order!",
                subheadline: "Our warehouse squad is picking, packing, and prepping your items.",
                instructionTitle: "📍 What's Next?",
                instructionBody: `
                    &bull; Items are inspected and packed with care.<br>
                    &bull; You will get an instant notification as soon as courier tracking is assigned.
                `,
                textInstructions: `Our team is verifying and packing your items. You will receive another update when your package is dispatched.`,
                subject: `⚙️ Processing: Order #${String(order._id).slice(-8).toUpperCase()} is being prepared - CARTSY`,
            };

        case "Cancelled":
            return {
                badgeText: "❌ ORDER CANCELLED",
                badgeBg: "#FF6EA7",
                badgeBorder: "#0A0A0A",
                badgeColor: "#0A0A0A",
                headline: `Order #${String(order._id).slice(-8).toUpperCase()} Cancelled`,
                subheadline: "This order has been cancelled and will not be dispatched.",
                instructionTitle: "📍 Cancellation Details",
                instructionBody: isPaid
                    ? `&bull; A full refund of <strong>₹${totalAmount}</strong> has been initiated to your original payment method (3–5 business days).<br>&bull; Questions? Reply to this email anytime.`
                    : `&bull; Cash on Delivery order: No charge was incurred.<br>&bull; Changed your mind? Place a new order on Cartsy anytime!`,
                textInstructions: isPaid
                    ? `A refund of Rs. ${totalAmount} has been initiated to your original payment method (3-5 business days).`
                    : `Since this was Cash on Delivery, no payment was collected. Feel free to re-order anytime.`,
                subject: `Order Cancelled: #${String(order._id).slice(-8).toUpperCase()} - CARTSY`,
            };

        default:
            return {
                badgeText: `ORDER STATUS: ${status.toUpperCase()}`,
                badgeBg: "#FFE600",
                badgeBorder: "#0A0A0A",
                badgeColor: "#0A0A0A",
                headline: `Order #${String(order._id).slice(-8).toUpperCase()} is now ${status}`,
                subheadline: "Your order status has been updated by our team.",
                instructionTitle: "📍 Order Details",
                instructionBody: `Your order status is now <strong>${status}</strong>. Track live progress in your Cartsy account.`,
                textInstructions: `Your order status is now ${status}. Track current progress in your CARTSY account.`,
                subject: `Update: Order #${String(order._id).slice(-8).toUpperCase()} is ${status} - CARTSY`,
            };
    }
};

/**
 * Generates an itemized HTML status update notification email
 */
const generateStatusUpdateHtml = (order, customerName, clientUrl, newStatus) => {
    const config = getStatusConfig(newStatus, order, customerName);
    const formattedDate = formatOrderDate(order.createdAt);
    const orderRef = String(order._id);
    const shortOrderRef = orderRef.length > 8 ? orderRef.slice(-8).toUpperCase() : orderRef;
    const shipping = order.shippingAddress || {};
    const totalAmount = Number(order.totalPrice || order.amount || 0).toFixed(2);

    const baseUrl = (process.env.URL || process.env.CLIENT_URL || clientUrl || "http://localhost:5173").trim();
    const trackOrderUrl = `${baseUrl.replace(/\/$/, "")}/orders`;

    const itemsRows = (order.orderItems || [])
        .map((item) => {
            const itemTotal = (Number(item.price) * Number(item.quantity)).toFixed(2);
            return `
            <tr style="border-bottom: 1.5px solid #0A0A0A;">
                <td style="padding: 12px 14px; color: #0A0A0A; font-size: 13px; font-weight: 700;">
                    ${item.title || "Item"}
                </td>
                <td style="padding: 12px 14px; color: #0A0A0A; font-size: 13px; text-align: center; font-weight: 800;">
                    ${item.quantity}
                </td>
                <td style="padding: 12px 14px; color: #0A0A0A; font-size: 13px; font-weight: 800; text-align: right;">
                    ₹${itemTotal}
                </td>
            </tr>
            `;
        })
        .join("");

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Order Update - CARTSY</title>
</head>
<body style="margin: 0; padding: 0; background-color: #FFFDF9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #FFFDF9; padding: 32px 10px;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; background-color: #ffffff; border: 2.5px solid #0A0A0A; border-radius: 14px; overflow: hidden; box-shadow: 6px 6px 0px #0A0A0A;">
                    
                    <!-- BRAND HEADER -->
                    <tr>
                        <td style="background-color: #FFE600; border-bottom: 2.5px solid #0A0A0A; padding: 28px 24px; text-align: center;">
                            <div style="font-size: 30px; font-weight: 900; color: #0A0A0A; letter-spacing: -1px; text-transform: uppercase;">
                                🛒 CARTSY
                            </div>
                            <div style="display: inline-block; background-color: #54B5FF; color: #0A0A0A; font-size: 11px; font-weight: 900; padding: 4px 12px; border-radius: 20px; border: 1.5px solid #0A0A0A; margin-top: 8px; letter-spacing: 0.5px; text-transform: uppercase;">
                                ORDER STATUS UPDATE • LIVE DISPATCH
                            </div>
                        </td>
                    </tr>

                    <!-- STATUS BADGE & GREETING -->
                    <tr>
                        <td style="padding: 28px 28px 18px 28px; text-align: center;">
                            <div style="display: inline-block; background-color: ${config.badgeBg}; color: ${config.badgeColor}; border: 2px solid ${config.badgeBorder}; box-shadow: 2px 2px 0px #0A0A0A; font-size: 12px; font-weight: 900; padding: 6px 16px; border-radius: 20px; letter-spacing: 0.8px; margin-bottom: 16px;">
                                ${config.badgeText}
                            </div>
                            <h2 style="margin: 0; color: #0A0A0A; font-size: 22px; font-weight: 900; text-transform: uppercase;">
                                ${config.headline}
                            </h2>
                            <p style="margin: 8px 0 0 0; color: #383838; font-size: 14px; line-height: 1.5; font-weight: 500;">
                                Hi ${customerName}, ${config.subheadline}
                            </p>
                        </td>
                    </tr>

                    <!-- INSTRUCTION CARD -->
                    <tr>
                        <td style="padding: 0 28px 20px 28px;">
                            <div style="background-color: #FFFDF0; border: 2px solid #0A0A0A; border-radius: 10px; box-shadow: 3px 3px 0px #0A0A0A; padding: 18px 20px;">
                                <div style="font-size: 13px; font-weight: 900; color: #0A0A0A; margin-bottom: 6px; text-transform: uppercase;">
                                    ${config.instructionTitle}
                                </div>
                                <div style="font-size: 13px; color: #1f2937; line-height: 1.6; font-weight: 500;">
                                    ${config.instructionBody}
                                </div>
                            </div>
                        </td>
                    </tr>

                    <!-- ORDER SUMMARY -->
                    <tr>
                        <td style="padding: 0 28px 20px 28px;">
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse: collapse; border: 2px solid #0A0A0A; border-radius: 10px; overflow: hidden; background: #ffffff; box-shadow: 3px 3px 0px #0A0A0A;">
                                <thead>
                                    <tr style="background-color: #0A0A0A;">
                                        <th style="padding: 10px 14px; font-size: 11px; font-weight: 900; color: #ffffff; text-align: left; text-transform: uppercase; letter-spacing: 0.8px;">Item</th>
                                        <th style="padding: 10px 14px; font-size: 11px; font-weight: 900; color: #ffffff; text-align: center; text-transform: uppercase; letter-spacing: 0.8px;">Qty</th>
                                        <th style="padding: 10px 14px; font-size: 11px; font-weight: 900; color: #ffffff; text-align: right; text-transform: uppercase; letter-spacing: 0.8px;">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${itemsRows}
                                </tbody>
                                <tfoot>
                                    <tr style="background-color: #FFFDF0; border-top: 2px solid #0A0A0A;">
                                        <td colspan="2" style="padding: 12px 14px; text-align: right; font-size: 13px; font-weight: 900; color: #0A0A0A;">
                                            Order Total:
                                        </td>
                                        <td style="padding: 12px 14px; text-align: right; font-size: 15px; font-weight: 900; color: #0A0A0A;">
                                            ₹${totalAmount}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </td>
                    </tr>

                    <!-- DELIVERY ADDRESS CARD -->
                    <tr>
                        <td style="padding: 0 28px 20px 28px;">
                            <div style="background-color: #FFFDF0; border: 2px solid #0A0A0A; border-radius: 10px; box-shadow: 3px 3px 0px #0A0A0A; padding: 14px 18px; font-size: 13px; color: #0A0A0A; line-height: 1.5;">
                                <strong style="text-transform: uppercase;">Delivery Location:</strong> ${shipping.fullName || customerName}, ${shipping.address || "Delivery Address"}, ${shipping.city || ""} ${shipping.pincode ? "- " + shipping.pincode : ""} ${shipping.phone ? " (Phone: " + shipping.phone + ")" : ""}
                            </div>
                        </td>
                    </tr>

                    <!-- CALL TO ACTION BUTTON -->
                    <tr>
                        <td style="padding: 10px 28px 28px 28px; text-align: center;">
                            <a href="${trackOrderUrl}" target="_blank" style="display: inline-block; background-color: #FFE600; color: #0A0A0A; text-decoration: none; font-size: 14px; font-weight: 900; padding: 14px 32px; border-radius: 8px; border: 2.5px solid #0A0A0A; box-shadow: 4px 4px 0px #0A0A0A; text-transform: uppercase; letter-spacing: 0.5px;">
                                Track Your Order &rarr;
                            </a>
                            <div style="margin-top: 10px; font-size: 12px; color: #666666; font-weight: 600;">
                                View live order status and delivery updates on CARTSY.
                            </div>
                            <p style="margin: 14px 0 0 0; font-size: 12px; color: #666666; line-height: 1.5; text-align: center; word-break: break-all;">
                                Direct link: <a href="${trackOrderUrl}" target="_blank" rel="noopener noreferrer" style="color: #0A0A0A; font-weight: 700; text-decoration: underline;">${trackOrderUrl}</a>
                            </p>
                        </td>
                    </tr>

                    <!-- FOOTER -->
                    <tr>
                        <td style="background-color: #0A0A0A; padding: 22px 30px; text-align: center; border-top: 2.5px solid #0A0A0A;">
                            <p style="margin: 0; font-size: 12px; color: #999999; line-height: 1.5;">
                                Questions about this order? Reply directly to this email.<br>
                                &copy; ${new Date().getFullYear()} CARTSY. All rights reserved.
                            </p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `;
};

/**
 * Generates a clean plain-text status update email
 */
const generateStatusUpdateText = (order, customerName, clientUrl, newStatus) => {
    const config = getStatusConfig(newStatus, order, customerName);
    const shortId = String(order._id).slice(-8).toUpperCase();
    const formattedDate = formatOrderDate(order.createdAt);
    const shipping = order.shippingAddress || {};
    const total = Number(order.totalPrice || order.amount || 0).toFixed(2);

    const baseUrl = (process.env.URL || process.env.CLIENT_URL || clientUrl || "http://localhost:5173").trim();
    const trackOrderUrl = `${baseUrl.replace(/\/$/, "")}/orders`;

    const itemsText = (order.orderItems || [])
        .map((item, index) => `${index + 1}. ${item.title || "Item"} x ${item.quantity} - Rs. ${(Number(item.price) * Number(item.quantity)).toFixed(2)}`)
        .join("\n");

    return `CARTSY - ORDER UPDATE
==========================================
Status: ${config.badgeText}
Hi ${customerName}, ${config.subheadline}

Order Ref: #${shortId}
Date: ${formattedDate}
Total Amount: Rs. ${total}

${config.instructionTitle}:
------------------------------------------
${config.textInstructions}

ITEMS:
------------------------------------------
${itemsText}

DELIVERY LOCATION:
${shipping.fullName || customerName}
${shipping.address || "Delivery Address"}
${shipping.city || ""}${shipping.pincode ? " - " + shipping.pincode : ""}
${shipping.phone ? `Phone: ${shipping.phone}` : ""}

Track live order status anytime:
${trackOrderUrl}

Questions? Reply directly to this email.
(C) ${new Date().getFullYear()} CARTSY. All rights reserved.
`;
};

/**
 * Sends order status update email (Shipped / Delivered / Processing / Cancelled)
 * Executes asynchronously in background without blocking response.
 */
const sendOrderStatusEmail = async (orderInput, newStatus) => {
    try {
        if (!orderInput || !newStatus || newStatus === "Pending") return false;

        let order = orderInput;
        if (!order.orderItems || !order.shippingAddress || typeof order.save !== "function") {
            const freshOrder = await Order.findById(order._id || order);
            if (freshOrder) order = freshOrder;
        }

        let recipientEmail = null;
        let customerName = order.shippingAddress?.fullName || "Valued Student";

        if (order.user) {
            if (typeof order.user === "object" && order.user.email) {
                recipientEmail = order.user.email;
                if (order.user.name) customerName = order.user.name;
            } else {
                const userDoc = await User.findById(order.user).select("name email");
                if (userDoc) {
                    recipientEmail = userDoc.email;
                    if (userDoc.name) customerName = userDoc.name;
                }
            }
        }

        if (!recipientEmail) {
            console.warn(`[EmailService] No recipient email found for order #${order._id}. Skipping status email.`);
            return false;
        }

        const clientUrl = (process.env.URL || process.env.CLIENT_URL || "http://localhost:5173").trim();
        const config = getStatusConfig(newStatus, order, customerName);

        const fallbackEmail = (process.env.GMAIL_FROM_EMAIL || process.env.EMAIL_USER || "").trim();
        let fromAddress = `"CARTSY" <${fallbackEmail}>`;
        if (process.env.EMAIL_FROM) {
            const nameMatch = process.env.EMAIL_FROM.match(/^["']?([^"<']+)["']?/);
            const displayName = nameMatch ? nameMatch[1].trim() : "CARTSY";
            fromAddress = `"${displayName}" <${fallbackEmail}>`;
        }

        const html = generateStatusUpdateHtml(order, customerName, clientUrl, newStatus);
        const text = generateStatusUpdateText(order, customerName, clientUrl, newStatus);

        const dispatchResult = await dispatchEmail({
            to: recipientEmail,
            from: fromAddress,
            replyTo: process.env.EMAIL_REPLY_TO || process.env.GMAIL_FROM_EMAIL || process.env.EMAIL_USER,
            subject: config.subject,
            text,
            html,
            headers: {
                "X-Entity-Ref-ID": String(order._id),
                "X-Order-Status": newStatus,
            },
            contextName: `Status update email (${newStatus})`,
        });

        if (!dispatchResult.success) {
            return false;
        }

        console.log(`[EmailService] Status update email (${newStatus}) sent to ${recipientEmail} for order #${order._id} (Provider: ${dispatchResult.provider}, Message ID: ${dispatchResult.messageId})`);
        return true;
    } catch (error) {
        console.error(`[EmailService] Error sending status email for order #${orderInput?._id || "unknown"}:`, error.message);
        return false;
    }
};

/**
 * Diagnostic tool: Verifies SMTP credentials and transporter readiness
 */
const verifySmtpConnection = async () => {
    const transporter = getTransporter();
    if (!transporter) {
        return { success: false, message: "Missing EMAIL_USER or EMAIL_PASS in .env" };
    }

    try {
        await transporter.verify();
        return { success: true, message: "SMTP server is ready to send emails" };
    } catch (error) {
        return { success: false, message: error.message };
    }
};

/**
 * Diagnostic tool: Verifies Google OAuth2 credentials and Gmail API profile
 */
const verifyGmailConnection = async () => {
    try {
        const { getOAuth2Client } = require("./gmail/gmailAuth");
        const auth = getOAuth2Client();
        if (!auth) {
            return {
                success: false,
                message: "Missing Gmail API OAuth2 credentials in .env",
            };
        }

        const { token } = await auth.getAccessToken();
        const tokenInfoRes = await fetch("https://oauth2.googleapis.com/tokeninfo?access_token=" + token);
        const tokenInfo = await tokenInfoRes.json();

        const hasSendScope = (tokenInfo.scope || "").includes("gmail.send") || (tokenInfo.scope || "").includes("mail.google.com");
        if (!hasSendScope) {
            return {
                success: false,
                message: "Insufficient scopes: Token lacks 'https://www.googleapis.com/auth/gmail.send'. Re-run 'npm run auth:gmail' and check the permission box.",
            };
        }

        return {
            success: true,
            emailAddress: tokenInfo.email,
            message: `Gmail API ready. Authenticated as ${tokenInfo.email || "OK"}`,
        };
    } catch (error) {
        return {
            success: false,
            message: error.response?.data?.error?.message || error.message,
        };
    }
};

/**
 * Diagnostic tool: Verifies connection for currently active email provider
 */
const verifyEmailConnection = async () => {
    const provider = getEmailProvider();
    if (provider === "nodemailer") {
        return await verifySmtpConnection();
    }
    return await verifyGmailConnection();
};

/**
 * Generates an accessible, clean plain-text password reset email fallback
 */
const generatePasswordResetText = ({ customerName, otp, resetToken, clientUrl, recipientEmail }) => {
    const baseUrl = (process.env.URL || process.env.CLIENT_URL || clientUrl || "http://localhost:5173").trim();
    const resetUrl = `${baseUrl.replace(/\/$/, "")}/reset-password?token=${resetToken}&email=${encodeURIComponent(recipientEmail)}`;

    return `CARTSY - PASSWORD RESET REQUEST
==========================================
Hello ${customerName || "there"},

We received a request to reset the password for your CARTSY account (${recipientEmail}).

YOUR 6-DIGIT VERIFICATION CODE:
------------------------------------------
${otp}

This code is valid for 15 minutes.

DIRECT RESET LINK:
------------------------------------------
Alternatively, reset your password directly using this secure link:
${resetUrl}

SECURITY WARNING:
------------------------------------------
If you didn't request this, you can safely ignore this email.
Your password will remain unchanged and your account is secure.

Best regards,
The CARTSY Team
`;
};

/**
 * Generates a modern, responsive HTML email template for password reset
 */
const generatePasswordResetHtml = ({ customerName, otp, resetToken, clientUrl, recipientEmail }) => {
    const baseUrl = (process.env.URL || process.env.CLIENT_URL || clientUrl || "http://localhost:5173").trim();
    const resetUrl = `${baseUrl.replace(/\/$/, "")}/reset-password?token=${resetToken}&email=${encodeURIComponent(recipientEmail)}`;

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset Request - CARTSY</title>
</head>
<body style="margin: 0; padding: 0; background-color: #FFFDF9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #FFFDF9; padding: 32px 10px;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 580px; background-color: #ffffff; border: 2.5px solid #0A0A0A; border-radius: 14px; overflow: hidden; box-shadow: 6px 6px 0px #0A0A0A;">
                    
                    <!-- BRAND HEADER -->
                    <tr>
                        <td style="background-color: #FFE600; border-bottom: 2.5px solid #0A0A0A; padding: 28px 24px; text-align: center;">
                            <div style="font-size: 30px; font-weight: 900; color: #0A0A0A; letter-spacing: -1px; text-transform: uppercase;">
                                🛒 CARTSY
                            </div>
                            <div style="display: inline-block; background-color: #FF6EA7; color: #0A0A0A; font-size: 11px; font-weight: 900; padding: 4px 12px; border-radius: 20px; border: 1.5px solid #0A0A0A; margin-top: 8px; letter-spacing: 0.5px; text-transform: uppercase;">
                                ACCOUNT SECURITY • PASSWORD RESET
                            </div>
                        </td>
                    </tr>

                    <!-- MAIN CONTENT -->
                    <tr>
                        <td style="padding: 32px 28px 24px 28px;">
                            <h1 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 900; color: #0A0A0A; line-height: 1.3; text-transform: uppercase;">
                                Reset Your Password
                            </h1>
                            <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #383838; font-weight: 500;">
                                Hello <strong style="color: #0A0A0A; font-weight: 800;">${customerName || "Cartsy Shopper"}</strong>,
                            </p>
                            <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #383838; font-weight: 500;">
                                We received a request to reset the password for your Cartsy account (<span style="color: #0A0A0A; font-weight: 800;">${recipientEmail}</span>). Use the 6-digit verification code below or tap the direct button.
                            </p>

                            <!-- OTP CODE CARD -->
                            <div style="background: #FFFDF0; border: 2.5px dashed #0A0A0A; border-radius: 12px; box-shadow: 3px 3px 0px #0A0A0A; padding: 22px; text-align: center; margin: 24px 0;">
                                <div style="font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 1.5px; color: #0A0A0A; margin-bottom: 8px;">
                                    YOUR 6-DIGIT VERIFICATION CODE
                                </div>
                                <div style="font-size: 38px; font-weight: 900; letter-spacing: 10px; color: #0A0A0A; font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace; padding: 6px 0;">
                                    ${otp}
                                </div>
                                <div style="font-size: 12px; color: #666666; font-weight: 600; margin-top: 6px;">
                                    ⏱️ Code expires in <strong style="color: #0A0A0A;">15 minutes</strong>
                                </div>
                            </div>

                            <!-- DIVIDER -->
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 24px 0 20px 0;">
                                <tr>
                                    <td style="border-top: 2px solid #0A0A0A;"></td>
                                    <td style="padding: 0 14px; color: #0A0A0A; font-size: 11px; font-weight: 900; letter-spacing: 1px; text-transform: uppercase; white-space: nowrap;">
                                        OR USE DIRECT LINK
                                    </td>
                                    <td style="border-top: 2px solid #0A0A0A;"></td>
                                </tr>
                            </table>

                            <!-- DIRECT ACTION BUTTON -->
                            <div style="text-align: center; margin: 24px 0 18px 0;">
                                <a href="${resetUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; background-color: #FFE600; color: #0A0A0A; text-decoration: none; font-size: 15px; font-weight: 900; padding: 14px 34px; border-radius: 8px; border: 2.5px solid #0A0A0A; box-shadow: 4px 4px 0px #0A0A0A; text-transform: uppercase; letter-spacing: 0.5px;">
                                    Reset My Password &rarr;
                                </a>
                            </div>

                            <p style="margin: 0 0 24px 0; font-size: 12px; color: #666666; line-height: 1.5; text-align: center; word-break: break-all;">
                                If the button above does not work, copy and paste this link:<br/>
                                <a href="${resetUrl}" target="_blank" rel="noopener noreferrer" style="color: #0A0A0A; font-weight: 700; text-decoration: underline;">${resetUrl}</a>
                            </p>

                            <!-- SECURITY WARNING -->
                            <div style="background: #FFFDF0; border: 2px solid #0A0A0A; border-left: 6px solid #FF6EA7; border-radius: 8px; box-shadow: 3px 3px 0px #0A0A0A; padding: 14px 18px; margin: 24px 0;">
                                <div style="font-size: 13px; font-weight: 900; color: #0A0A0A; margin-bottom: 4px; text-transform: uppercase;">
                                    🛡️ Security Notice
                                </div>
                                <div style="font-size: 12px; line-height: 1.5; color: #383838; font-weight: 500;">
                                    <strong>If you didn't request this, you can safely ignore this email.</strong> Your password will remain unchanged and your account is completely safe.
                                </div>
                            </div>
                        </td>
                    </tr>

                    <!-- FOOTER -->
                    <tr>
                        <td style="background-color: #0A0A0A; padding: 20px 30px; text-align: center; border-top: 2.5px solid #0A0A0A;">
                            <div style="font-size: 12px; color: #999999; line-height: 1.5;">
                                Need assistance? Reach out to our customer support squad.<br/>
                                &copy; ${new Date().getFullYear()} CARTSY. All rights reserved.
                            </div>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>
`;
};

/**
 * Dispatches a password reset email containing a 6-digit OTP and direct reset link
 */
const sendPasswordResetEmail = async ({ recipientEmail, customerName, otp, resetToken, clientUrl }) => {
    try {
        const resolvedClientUrl = (process.env.URL || process.env.CLIENT_URL || clientUrl || "http://localhost:5173").trim();

        const fallbackEmail = (process.env.GMAIL_FROM_EMAIL || process.env.EMAIL_USER || "").trim();
        let fromAddress = `"CARTSY" <${fallbackEmail}>`;
        if (process.env.EMAIL_FROM) {
            const nameMatch = process.env.EMAIL_FROM.match(/^["']?([^"<']+)["']?/);
            const displayName = nameMatch ? nameMatch[1].trim() : "CARTSY";
            fromAddress = `"${displayName}" <${fallbackEmail}>`;
        }

        const html = generatePasswordResetHtml({
            customerName,
            otp,
            resetToken,
            clientUrl: resolvedClientUrl,
            recipientEmail,
        });
        const text = generatePasswordResetText({
            customerName,
            otp,
            resetToken,
            clientUrl: resolvedClientUrl,
            recipientEmail,
        });

        const dispatchResult = await dispatchEmail({
            to: recipientEmail,
            from: fromAddress,
            replyTo: process.env.EMAIL_REPLY_TO || process.env.GMAIL_FROM_EMAIL || process.env.EMAIL_USER,
            subject: "CARTSY Password Reset - Verification Code & Link",
            text,
            html,
            headers: {
                "X-Entity-Ref-ID": `pwd-reset-${Date.now()}`,
            },
            contextName: `Password reset email for ${recipientEmail}`,
        });

        if (!dispatchResult.success) {
            return false;
        }

        console.log(`[EmailService] Password reset email sent to ${recipientEmail} (Provider: ${dispatchResult.provider}, Message ID: ${dispatchResult.messageId})`);
        return true;
    } catch (error) {
        console.error(`[EmailService] Error sending password reset email to ${recipientEmail}:`, error.message);
        return false;
    }
};

/**
 * Generates plain-text content for password reset success email
 */
const generatePasswordResetSuccessText = ({ customerName, clientUrl, recipientEmail, changedAt }) => {
    const baseUrl = (process.env.URL || process.env.CLIENT_URL || clientUrl || "http://localhost:5173").trim();
    const loginUrl = `${baseUrl.replace(/\/$/, "")}/login`;
    const forgotUrl = `${baseUrl.replace(/\/$/, "")}/forgot-password`;
    const formattedDate = formatOrderDate(changedAt || Date.now());

    return `CARTSY - PASSWORD CHANGED SUCCESSFULLY
==========================================
Hello ${customerName || "there"},

This email confirms that the password for your CARTSY account (${recipientEmail}) was successfully updated on ${formattedDate}.

You can now log in using your new password:
${loginUrl}

SECURITY NOTICE:
------------------------------------------
If you did not make this change, please reset your password immediately to secure your account:
${forgotUrl}

Or contact our support team if you suspect unauthorized activity.

Best regards,
The CARTSY Team
(C) ${new Date().getFullYear()} CARTSY. All rights reserved.
`;
};

/**
 * Generates modern, responsive HTML email template for password reset success notification
 */
const generatePasswordResetSuccessHtml = ({ customerName, clientUrl, recipientEmail, changedAt }) => {
    const baseUrl = (process.env.URL || process.env.CLIENT_URL || clientUrl || "http://localhost:5173").trim();
    const loginUrl = `${baseUrl.replace(/\/$/, "")}/login`;
    const forgotUrl = `${baseUrl.replace(/\/$/, "")}/forgot-password`;
    const formattedDate = formatOrderDate(changedAt || Date.now());

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Changed Successfully - CARTSY</title>
</head>
<body style="margin: 0; padding: 0; background-color: #FFFDF9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #FFFDF9; padding: 32px 10px;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 580px; background-color: #ffffff; border: 2.5px solid #0A0A0A; border-radius: 14px; overflow: hidden; box-shadow: 6px 6px 0px #0A0A0A;">
                    
                    <!-- BRAND HEADER -->
                    <tr>
                        <td style="background-color: #FFE600; border-bottom: 2.5px solid #0A0A0A; padding: 28px 24px; text-align: center;">
                            <div style="font-size: 30px; font-weight: 900; color: #0A0A0A; letter-spacing: -1px; text-transform: uppercase;">
                                🛒 CARTSY
                            </div>
                            <div style="display: inline-block; background-color: #00F59B; color: #0A0A0A; font-size: 11px; font-weight: 900; padding: 4px 12px; border-radius: 20px; border: 1.5px solid #0A0A0A; margin-top: 8px; letter-spacing: 0.5px; text-transform: uppercase;">
                                ACCOUNT SECURITY • PASSWORD UPDATED
                            </div>
                        </td>
                    </tr>

                    <!-- MAIN CONTENT -->
                    <tr>
                        <td style="padding: 32px 28px 24px 28px;">
                            <div style="text-align: center; margin-bottom: 20px;">
                                <div style="display: inline-block; width: 64px; height: 64px; line-height: 60px; border-radius: 50%; background: #00F59B; border: 2.5px solid #0A0A0A; box-shadow: 3px 3px 0px #0A0A0A; font-size: 32px; font-weight: 900; color: #0A0A0A;">
                                    &#10003;
                                </div>
                            </div>

                            <h1 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 900; color: #0A0A0A; line-height: 1.3; text-align: center; text-transform: uppercase;">
                                Password Successfully Reset
                            </h1>
                            <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #383838; text-align: center; font-weight: 500;">
                                Hello <strong style="color: #0A0A0A; font-weight: 800;">${customerName || "Cartsy Shopper"}</strong>,
                            </p>
                            <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #383838; text-align: center; font-weight: 500;">
                                Your Cartsy account (<span style="color: #0A0A0A; font-weight: 800;">${recipientEmail}</span>) password was successfully updated on <strong style="color: #0A0A0A;">${formattedDate}</strong>.
                            </p>

                            <!-- DETAILS CARD -->
                            <div style="background: #FFFDF0; border: 2px solid #0A0A0A; border-radius: 10px; box-shadow: 3px 3px 0px #0A0A0A; padding: 18px 20px; margin: 24px 0;">
                                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                                    <tr>
                                        <td style="padding: 6px 0; font-size: 13px; color: #666666; font-weight: 700; text-transform: uppercase;">Account:</td>
                                        <td style="padding: 6px 0; font-size: 13px; color: #0A0A0A; text-align: right; font-weight: 800;">${recipientEmail}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 6px 0; font-size: 13px; color: #666666; font-weight: 700; text-transform: uppercase;">Date &amp; Time:</td>
                                        <td style="padding: 6px 0; font-size: 13px; color: #0A0A0A; text-align: right; font-weight: 800;">${formattedDate}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 6px 0; font-size: 13px; color: #666666; font-weight: 700; text-transform: uppercase;">Security Status:</td>
                                        <td style="padding: 6px 0; font-size: 13px; color: #0A0A0A; text-align: right; font-weight: 900;">
                                            <span style="display: inline-block; background-color: #00F59B; color: #0A0A0A; font-size: 11px; font-weight: 900; padding: 2px 10px; border-radius: 20px; border: 1.5px solid #0A0A0A;">COMPLETED</span>
                                        </td>
                                    </tr>
                                </table>
                            </div>

                            <!-- ACTION BUTTON -->
                            <div style="text-align: center; margin: 26px 0 18px 0;">
                                <a href="${loginUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; background-color: #FFE600; color: #0A0A0A; text-decoration: none; font-size: 15px; font-weight: 900; padding: 14px 34px; border-radius: 8px; border: 2.5px solid #0A0A0A; box-shadow: 4px 4px 0px #0A0A0A; text-transform: uppercase; letter-spacing: 0.5px;">
                                    Log In to CARTSY &rarr;
                                </a>
                            </div>

                            <p style="margin: 0 0 24px 0; font-size: 12px; color: #666666; line-height: 1.5; text-align: center; word-break: break-all;">
                                If the button above does not work, copy and paste this link:<br/>
                                <a href="${loginUrl}" target="_blank" rel="noopener noreferrer" style="color: #0A0A0A; font-weight: 700; text-decoration: underline;">${loginUrl}</a>
                            </p>

                            <!-- SECURITY WARNING -->
                            <div style="background: #FFFDF0; border: 2px solid #0A0A0A; border-left: 6px solid #FF3366; border-radius: 8px; box-shadow: 3px 3px 0px #0A0A0A; padding: 14px 18px; margin: 24px 0;">
                                <div style="font-size: 13px; font-weight: 900; color: #0A0A0A; margin-bottom: 4px; text-transform: uppercase;">
                                    🛡️ Didn't request this change?
                                </div>
                                <div style="font-size: 12px; line-height: 1.5; color: #383838; font-weight: 500;">
                                    If you did not perform this password reset, please <a href="${forgotUrl}" target="_blank" rel="noopener noreferrer" style="color: #0A0A0A; text-decoration: underline; font-weight: 800;">reset your password immediately</a> to secure your account, or contact our support team.
                                </div>
                            </div>
                        </td>
                    </tr>

                    <!-- FOOTER -->
                    <tr>
                        <td style="background-color: #0A0A0A; padding: 20px 30px; text-align: center; border-top: 2.5px solid #0A0A0A;">
                            <div style="font-size: 12px; color: #999999; line-height: 1.5;">
                                Need assistance? Reach out to our customer support squad.<br/>
                                &copy; ${new Date().getFullYear()} CARTSY. All rights reserved.
                            </div>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>
`;
};

/**
 * Dispatches a password reset success confirmation email
 */
const sendPasswordResetSuccessEmail = async ({ recipientEmail, customerName, clientUrl }) => {
    try {
        const resolvedClientUrl = (process.env.URL || process.env.CLIENT_URL || clientUrl || "http://localhost:5173").trim();

        const fallbackEmail = (process.env.GMAIL_FROM_EMAIL || process.env.EMAIL_USER || "").trim();
        let fromAddress = `"CARTSY" <${fallbackEmail}>`;
        if (process.env.EMAIL_FROM) {
            const nameMatch = process.env.EMAIL_FROM.match(/^["']?([^"<']+)["']?/);
            const displayName = nameMatch ? nameMatch[1].trim() : "CARTSY";
            fromAddress = `"${displayName}" <${fallbackEmail}>`;
        }

        const html = generatePasswordResetSuccessHtml({
            customerName,
            clientUrl: resolvedClientUrl,
            recipientEmail,
            changedAt: Date.now(),
        });
        const text = generatePasswordResetSuccessText({
            customerName,
            clientUrl: resolvedClientUrl,
            recipientEmail,
            changedAt: Date.now(),
        });

        const dispatchResult = await dispatchEmail({
            to: recipientEmail,
            from: fromAddress,
            replyTo: process.env.EMAIL_REPLY_TO || process.env.GMAIL_FROM_EMAIL || process.env.EMAIL_USER,
            subject: "CARTSY - Your Password Was Successfully Reset",
            text,
            html,
            headers: {
                "X-Entity-Ref-ID": `pwd-success-${Date.now()}`,
            },
            contextName: `Password reset success email for ${recipientEmail}`,
        });

        if (!dispatchResult.success) {
            return false;
        }

        console.log(`[EmailService] Password reset success email sent to ${recipientEmail} (Provider: ${dispatchResult.provider}, Message ID: ${dispatchResult.messageId})`);
        return true;
    } catch (error) {
        console.error(`[EmailService] Error sending password reset success email to ${recipientEmail}:`, error.message);
        return false;
    }
};

/**
 * Generates plain-text content for the welcome email
 */
const generateWelcomeEmailText = ({ customerName, clientUrl, recipientEmail }) => {
    const baseUrl = (process.env.URL || process.env.CLIENT_URL || clientUrl || "http://localhost:5173").trim();
    const catalogUrl = `${baseUrl.replace(/\/$/, "")}/product`;
    const displayName = customerName || "Shopper";

    return `CARTSY - WELCOME TO THE COMMUNITY!
==========================================
Welcome to CARTSY, ${displayName}!

We're thrilled to have you join Cartsy! CARTSY makes it easy, affordable, and fun to discover aesthetic fits, trending gear, room essentials, and daily lifestyle drops with fast doorstep delivery.

WHAT YOU CAN DO ON CARTSY:
------------------------------------------
* BUY & SAVE: Discover curated room aesthetics, streetwear fits, gadgets, and everyday lifestyle essentials at steal prices.
* SELL QUICKLY: Turn your pre-loved gear, fits, and collectibles into cash with zero hassle.
* FAST & SECURE: Enjoy encrypted checkouts and lightning doorstep delivery right to your door.

EXPLORE FRESH DROPS:
------------------------------------------
Browse the catalog right now at:
${catalogUrl}

Questions or feedback? Reply directly to this email or reach out to our support team.

Happy shopping,
The CARTSY Team
(C) ${new Date().getFullYear()} CARTSY. All rights reserved.
`;
};

/**
 * Generates modern, responsive HTML email template for welcome email
 */
const generateWelcomeEmailHtml = ({ customerName, clientUrl, recipientEmail }) => {
    const baseUrl = (process.env.URL || process.env.CLIENT_URL || clientUrl || "http://localhost:5173").trim();
    const catalogUrl = `${baseUrl.replace(/\/$/, "")}/product`;
    const displayName = customerName || "Shopper";

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to CARTSY, ${displayName}!</title>
</head>
<body style="margin: 0; padding: 0; background-color: #FFFDF9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #FFFDF9; padding: 32px 10px;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 580px; background-color: #ffffff; border: 2.5px solid #0A0A0A; border-radius: 14px; overflow: hidden; box-shadow: 6px 6px 0px #0A0A0A;">
                    
                    <!-- BRAND HEADER -->
                    <tr>
                        <td style="background-color: #FFE600; border-bottom: 2.5px solid #0A0A0A; padding: 28px 24px; text-align: center;">
                            <div style="font-size: 30px; font-weight: 900; color: #0A0A0A; letter-spacing: -1px; text-transform: uppercase;">
                                🛍️ CARTSY
                            </div>
                            <div style="display: inline-block; background-color: #FF6EA7; color: #0A0A0A; font-size: 11px; font-weight: 900; padding: 4px 12px; border-radius: 20px; border: 1.5px solid #0A0A0A; margin-top: 8px; letter-spacing: 0.5px; text-transform: uppercase;">
                                YOUR DAILY DRIP &amp; LIFESTYLE MARKETPLACE
                            </div>
                        </td>
                    </tr>

                    <!-- MAIN CONTENT -->
                    <tr>
                        <td style="padding: 32px 28px 28px 28px;">
                            <h1 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 900; color: #0A0A0A; line-height: 1.3; text-align: center; text-transform: uppercase;">
                                Welcome to CARTSY, <span style="background-color: #FFE600; padding: 2px 8px; border: 1.5px solid #0A0A0A; border-radius: 6px;">${displayName}</span>! 🎉
                            </h1>
                            <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #383838; text-align: center; font-weight: 500;">
                                We're hyped to have you here! CARTSY is your ultimate destination to discover aesthetic room setups, streetwear fits, trending tech, and curated lifestyle essentials.
                            </p>

                            <!-- FEATURE CARDS -->
                            <div style="margin: 24px 0;">
                                <!-- Card 1: Buy & Save -->
                                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background: #FFFDF0; border: 2px solid #0A0A0A; border-radius: 10px; box-shadow: 3px 3px 0px #0A0A0A; margin-bottom: 12px;">
                                    <tr>
                                        <td style="padding: 14px; width: 44px; vertical-align: top; text-align: center; font-size: 24px;">
                                            🛒
                                        </td>
                                        <td style="padding: 14px 14px 14px 0; vertical-align: middle;">
                                            <div style="font-size: 14px; font-weight: 900; color: #0A0A0A; margin-bottom: 3px; text-transform: uppercase;">
                                                Buy &amp; Save Big
                                            </div>
                                            <div style="font-size: 13px; color: #383838; line-height: 1.5; font-weight: 500;">
                                                Find high-aura gear, tech accessories, room aesthetics, and fits at steal prices.
                                            </div>
                                        </td>
                                    </tr>
                                </table>

                                <!-- Card 2: Sell Easily -->
                                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background: #FFFDF0; border: 2px solid #0A0A0A; border-radius: 10px; box-shadow: 3px 3px 0px #0A0A0A; margin-bottom: 12px;">
                                    <tr>
                                        <td style="padding: 14px; width: 44px; vertical-align: top; text-align: center; font-size: 24px;">
                                            🏷️
                                        </td>
                                        <td style="padding: 14px 14px 14px 0; vertical-align: middle;">
                                            <div style="font-size: 14px; font-weight: 900; color: #0A0A0A; margin-bottom: 3px; text-transform: uppercase;">
                                                Sell Quickly for Cash
                                            </div>
                                            <div style="font-size: 13px; color: #383838; line-height: 1.5; font-weight: 500;">
                                                Declutter your space and turn pre-loved items and collectibles into cash with zero hassle.
                                            </div>
                                        </td>
                                    </tr>
                                </table>

                                <!-- Card 3: Safe & Fast Delivery -->
                                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background: #FFFDF0; border: 2px solid #0A0A0A; border-radius: 10px; box-shadow: 3px 3px 0px #0A0A0A;">
                                    <tr>
                                        <td style="padding: 14px; width: 44px; vertical-align: top; text-align: center; font-size: 24px;">
                                            🚀
                                        </td>
                                        <td style="padding: 14px 14px 14px 0; vertical-align: middle;">
                                            <div style="font-size: 14px; font-weight: 900; color: #0A0A0A; margin-bottom: 3px; text-transform: uppercase;">
                                                Fast &amp; Safe Delivery
                                            </div>
                                            <div style="font-size: 13px; color: #383838; line-height: 1.5; font-weight: 500;">
                                                Lightning-quick doorstep delivery and secure encrypted checkout.
                                            </div>
                                        </td>
                                    </tr>
                                </table>
                            </div>

                            <!-- ACTION BUTTON -->
                            <div style="text-align: center; margin: 28px 0 18px 0;">
                                <a href="${catalogUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; background-color: #FFE600; color: #0A0A0A; text-decoration: none; font-size: 15px; font-weight: 900; padding: 14px 36px; border-radius: 8px; border: 2.5px solid #0A0A0A; box-shadow: 4px 4px 0px #0A0A0A; text-transform: uppercase; letter-spacing: 0.5px;">
                                    Explore Fresh Drops &rarr;
                                </a>
                            </div>

                            <p style="margin: 0 0 24px 0; font-size: 12px; color: #666666; line-height: 1.5; text-align: center; word-break: break-all;">
                                If the button above does not work, copy and paste this link:<br/>
                                <a href="${catalogUrl}" target="_blank" rel="noopener noreferrer" style="color: #0A0A0A; font-weight: 700; text-decoration: underline;">${catalogUrl}</a>
                            </p>
                        </td>
                    </tr>

                    <!-- FOOTER -->
                    <tr>
                        <td style="background-color: #0A0A0A; padding: 22px 30px; text-align: center; border-top: 2.5px solid #0A0A0A;">
                            <div style="font-size: 12px; color: #999999; line-height: 1.6;">
                                Need help or have questions? Contact our support squad anytime.<br/>
                                &copy; ${new Date().getFullYear()} CARTSY. All rights reserved.
                            </div>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>
`;
};

/**
 * Dispatches a welcome email to a newly registered customer
 */
const sendWelcomeEmail = async ({ recipientEmail, customerName, clientUrl }) => {
    try {
        const resolvedClientUrl = (process.env.URL || process.env.CLIENT_URL || clientUrl || "http://localhost:5173").trim();

        const fallbackEmail = (process.env.GMAIL_FROM_EMAIL || process.env.EMAIL_USER || "").trim();
        let fromAddress = `"CARTSY" <${fallbackEmail}>`;
        if (process.env.EMAIL_FROM) {
            const nameMatch = process.env.EMAIL_FROM.match(/^["']?([^"<']+)["']?/);
            const displayName = nameMatch ? nameMatch[1].trim() : "CARTSY";
            fromAddress = `"${displayName}" <${fallbackEmail}>`;
        }

        const html = generateWelcomeEmailHtml({
            customerName,
            clientUrl: resolvedClientUrl,
            recipientEmail,
        });
        const text = generateWelcomeEmailText({
            customerName,
            clientUrl: resolvedClientUrl,
            recipientEmail,
        });

        const dispatchResult = await dispatchEmail({
            to: recipientEmail,
            from: fromAddress,
            replyTo: process.env.EMAIL_REPLY_TO || process.env.GMAIL_FROM_EMAIL || process.env.EMAIL_USER,
            subject: `Welcome to CARTSY, ${customerName || "Friend"}! 🛍️`,
            text,
            html,
            headers: {
                "X-Entity-Ref-ID": `welcome-${Date.now()}`,
            },
            contextName: `Welcome email for ${recipientEmail}`,
        });

        if (!dispatchResult.success) {
            return false;
        }

        console.log(`[EmailService] Welcome email sent to ${recipientEmail} (Provider: ${dispatchResult.provider}, Message ID: ${dispatchResult.messageId})`);
        return true;
    } catch (error) {
        console.error(`[EmailService] Error sending welcome email to ${recipientEmail}:`, error.message);
        return false;
    }
};

/**
 * Generates plain-text fallback content for the admin new order alert email
 */
const generateAdminNewOrderAlertText = (order, customerDetails, clientUrl) => {
    const baseUrl = (process.env.URL || process.env.CLIENT_URL || clientUrl || "http://localhost:5173").trim();
    const adminOrderUrl = `${baseUrl.replace(/\/$/, "")}/admin/orders/${order._id}`;
    const shortId = String(order._id).slice(-8).toUpperCase();
    const formattedDate = formatOrderDate(order.createdAt || Date.now());
    const shipping = order.shippingAddress || {};
    const isOnline = order.paymentMethod === "Razorpay";
    const paymentLabel = isOnline ? "Razorpay (Paid Online)" : "Cash on Delivery (To Collect on Delivery)";
    const total = Number(order.totalPrice || order.amount || 0).toFixed(2);

    const itemsText = (order.orderItems || [])
        .map(
            (item, index) =>
                `${index + 1}. ${item.title || "Item"} x ${item.quantity} @ Rs. ${Number(item.price).toFixed(2)} = Rs. ${(Number(item.price) * Number(item.quantity)).toFixed(2)}`
        )
        .join("\n");

    return `CARTSY - NEW ORDER ALERT FOR ADMIN
==========================================
New Order #${shortId} received from ${customerDetails.customerName} (Rs. ${total})

Date & Time : ${formattedDate}
Payment Mode: ${paymentLabel}
Order Status: ${order.status || "CONFIRMED"}
Order ID    : ${order._id}

CUSTOMER & DELIVERY DETAILS:
------------------------------------------
Customer Name   : ${customerDetails.customerName}
Registered Email: ${customerDetails.customerEmail}
Phone Number    : ${shipping.phone || "N/A"}
Delivery Address:
${shipping.fullName || customerDetails.customerName}
${shipping.address || "Delivery Address"}
${shipping.city || ""}${shipping.pincode ? " - " + shipping.pincode : ""}

ORDER ITEMS:
------------------------------------------
${itemsText}

Grand Total: Rs. ${total}

VIEW & MANAGE ORDER IN ADMIN DASHBOARD:
------------------------------------------
${adminOrderUrl}

(C) ${new Date().getFullYear()} CARTSY Administrator Portal.
`;
};

/**
 * Generates a modern, responsive HTML email template for admin new order alert
 */
const generateAdminNewOrderAlertHtml = (order, customerDetails, clientUrl) => {
    const baseUrl = (process.env.URL || process.env.CLIENT_URL || clientUrl || "http://localhost:5173").trim();
    const adminOrderUrl = `${baseUrl.replace(/\/$/, "")}/admin/orders/${order._id}`;
    const shortId = String(order._id).slice(-8).toUpperCase();
    const formattedDate = formatOrderDate(order.createdAt || Date.now());
    const shipping = order.shippingAddress || {};
    const isOnline = order.paymentMethod === "Razorpay";
    const paymentBadgeText = isOnline ? "PAID ONLINE (RAZORPAY)" : "CASH ON DELIVERY (COD)";
    const paymentBadgeBg = isOnline ? "#00F59B" : "#FFE600";
    const paymentBadgeColor = "#0A0A0A";
    const paymentBadgeBorder = "#0A0A0A";
    const total = Number(order.totalPrice || order.amount || 0).toFixed(2);

    const itemsRows = (order.orderItems || [])
        .map(
            (item) => `
            <tr style="border-bottom: 1.5px solid #0A0A0A;">
                <td style="padding: 12px 14px; color: #0A0A0A; font-size: 13px; font-weight: 700;">
                    ${item.title || "Item"}
                </td>
                <td style="padding: 12px 14px; color: #0A0A0A; font-size: 13px; text-align: center; font-weight: 800;">
                    ${item.quantity}
                </td>
                <td style="padding: 12px 14px; color: #383838; font-size: 13px; text-align: right; font-weight: 600;">
                    ₹${Number(item.price).toFixed(2)}
                </td>
                <td style="padding: 12px 14px; color: #0A0A0A; font-size: 13px; font-weight: 900; text-align: right;">
                    ₹${(Number(item.price) * Number(item.quantity)).toFixed(2)}
                </td>
            </tr>`
        )
        .join("");

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Order #${shortId} Received</title>
</head>
<body style="margin: 0; padding: 0; background-color: #FFFDF9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #FFFDF9; padding: 32px 10px;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; background-color: #ffffff; border: 2.5px solid #0A0A0A; border-radius: 14px; overflow: hidden; box-shadow: 6px 6px 0px #0A0A0A;">
                    
                    <!-- BRAND HEADER -->
                    <tr>
                        <td style="background-color: #FFE600; border-bottom: 2.5px solid #0A0A0A; padding: 28px 24px; text-align: center;">
                            <div style="font-size: 30px; font-weight: 900; color: #0A0A0A; letter-spacing: -1px; text-transform: uppercase;">
                                🛒 CARTSY ADMIN ALERT
                            </div>
                            <div style="display: inline-block; background-color: #00F59B; color: #0A0A0A; font-size: 11px; font-weight: 900; padding: 4px 12px; border-radius: 20px; border: 1.5px solid #0A0A0A; margin-top: 8px; letter-spacing: 0.5px; text-transform: uppercase;">
                                NEW ORDER DISPATCH • LIVE NOTIFICATION
                            </div>
                        </td>
                    </tr>

                    <!-- MAIN CONTENT -->
                    <tr>
                        <td style="padding: 30px 28px 24px 28px;">
                            
                            <!-- ORDER HIGHLIGHT BOX -->
                            <div style="background: #FFFDF0; border: 2px solid #0A0A0A; border-radius: 10px; box-shadow: 3px 3px 0px #0A0A0A; padding: 20px; margin-bottom: 22px;">
                                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                                    <tr>
                                        <td>
                                            <div style="font-size: 11px; font-weight: 900; color: #666666; text-transform: uppercase; letter-spacing: 1px;">
                                                ORDER REF
                                            </div>
                                            <div style="font-size: 22px; font-weight: 900; color: #0A0A0A; margin-top: 2px;">
                                                #${shortId}
                                            </div>
                                        </td>
                                        <td style="text-align: right;">
                                            <span style="display: inline-block; background: ${paymentBadgeBg}; color: ${paymentBadgeColor}; border: 1.5px solid ${paymentBadgeBorder}; font-size: 11px; font-weight: 900; padding: 5px 12px; border-radius: 20px; letter-spacing: 0.5px; text-transform: uppercase;">
                                                ${paymentBadgeText}
                                            </span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td colspan="2" style="padding-top: 14px; border-top: 1.5px solid #0A0A0A; margin-top: 14px;">
                                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                                                <tr>
                                                    <td style="font-size: 13px; color: #383838; font-weight: 600;">Order Date:</td>
                                                    <td style="font-size: 13px; color: #0A0A0A; text-align: right; font-weight: 700;">${formattedDate}</td>
                                                </tr>
                                                <tr>
                                                    <td style="font-size: 13px; color: #383838; font-weight: 600; padding-top: 6px;">Total Amount:</td>
                                                    <td style="font-size: 16px; color: #0A0A0A; text-align: right; font-weight: 900; padding-top: 6px;">₹${total}</td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                </table>
                            </div>

                            <!-- CUSTOMER & DELIVERY INFO -->
                            <div style="background: #FFFDF0; border: 2px solid #0A0A0A; border-radius: 10px; box-shadow: 3px 3px 0px #0A0A0A; padding: 20px; margin-bottom: 22px;">
                                <div style="font-size: 13px; font-weight: 900; color: #0A0A0A; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px;">
                                    👤 Customer &amp; Delivery Details
                                </div>
                                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                                    <tr>
                                        <td style="font-size: 13px; color: #666666; font-weight: 600; padding: 4px 0; width: 35%;">Customer Name:</td>
                                        <td style="font-size: 13px; color: #0A0A0A; padding: 4px 0; font-weight: 800;">${customerDetails.customerName}</td>
                                    </tr>
                                    <tr>
                                        <td style="font-size: 13px; color: #666666; font-weight: 600; padding: 4px 0;">Email Address:</td>
                                        <td style="font-size: 13px; color: #0A0A0A; padding: 4px 0; font-weight: 700;">${customerDetails.customerEmail}</td>
                                    </tr>
                                    <tr>
                                        <td style="font-size: 13px; color: #666666; font-weight: 600; padding: 4px 0;">Phone Number:</td>
                                        <td style="font-size: 13px; color: #0A0A0A; padding: 4px 0; font-weight: 800;">${shipping.phone || "Not provided"}</td>
                                    </tr>
                                    <tr>
                                        <td style="font-size: 13px; color: #666666; font-weight: 600; padding: 4px 0; vertical-align: top;">Delivery Address:</td>
                                        <td style="font-size: 13px; color: #0A0A0A; padding: 4px 0; line-height: 1.4; font-weight: 600;">
                                            ${shipping.address || "Delivery Address"}<br/>
                                            ${shipping.city || ""}${shipping.pincode ? " - " + shipping.pincode : ""}
                                        </td>
                                    </tr>
                                </table>
                            </div>

                            <!-- ORDER ITEMS TABLE -->
                            <div style="background: #ffffff; border: 2px solid #0A0A0A; border-radius: 10px; box-shadow: 3px 3px 0px #0A0A0A; overflow: hidden; margin-bottom: 22px;">
                                <div style="background-color: #0A0A0A; padding: 10px 14px; font-size: 12px; font-weight: 900; color: #ffffff; text-transform: uppercase; letter-spacing: 1px;">
                                    📦 Items Ordered
                                </div>
                                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse: collapse;">
                                    <thead>
                                        <tr style="background-color: #FFFDF0; border-bottom: 1.5px solid #0A0A0A;">
                                            <th style="font-size: 11px; font-weight: 800; color: #0A0A0A; text-align: left; padding: 10px 14px; text-transform: uppercase;">ITEM</th>
                                            <th style="font-size: 11px; font-weight: 800; color: #0A0A0A; text-align: center; padding: 10px 14px; text-transform: uppercase;">QTY</th>
                                            <th style="font-size: 11px; font-weight: 800; color: #0A0A0A; text-align: right; padding: 10px 14px; text-transform: uppercase;">PRICE</th>
                                            <th style="font-size: 11px; font-weight: 800; color: #0A0A0A; text-align: right; padding: 10px 14px; text-transform: uppercase;">TOTAL</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${itemsRows}
                                    </tbody>
                                    <tfoot>
                                        <tr style="background-color: #FFFDF0; border-top: 1.5px solid #0A0A0A;">
                                            <td colspan="3" style="padding: 12px 14px; font-size: 13px; font-weight: 900; color: #0A0A0A; text-align: right; text-transform: uppercase;">
                                                Grand Total:
                                            </td>
                                            <td style="padding: 12px 14px; font-size: 15px; font-weight: 900; color: #0A0A0A; text-align: right;">
                                                ₹${total}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>

                            <!-- ACTION BUTTON -->
                            <div style="text-align: center; margin: 26px 0 16px 0;">
                                <a href="${adminOrderUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; background-color: #FFE600; color: #0A0A0A; text-decoration: none; font-size: 15px; font-weight: 900; padding: 14px 34px; border-radius: 8px; border: 2.5px solid #0A0A0A; box-shadow: 4px 4px 0px #0A0A0A; text-transform: uppercase; letter-spacing: 0.5px;">
                                    View Order in Admin Dashboard &rarr;
                                </a>
                            </div>

                            <p style="margin: 0 0 20px 0; font-size: 12px; color: #666666; line-height: 1.5; text-align: center; word-break: break-all;">
                                Direct link: <a href="${adminOrderUrl}" target="_blank" rel="noopener noreferrer" style="color: #0A0A0A; font-weight: 700; text-decoration: underline;">${adminOrderUrl}</a>
                            </p>
                        </td>
                    </tr>

                    <!-- FOOTER -->
                    <tr>
                        <td style="background-color: #0A0A0A; padding: 20px 30px; text-align: center; border-top: 2.5px solid #0A0A0A;">
                            <div style="font-size: 12px; color: #999999; line-height: 1.5;">
                                CARTSY Store Management System<br/>
                                &copy; ${new Date().getFullYear()} CARTSY. All rights reserved.
                            </div>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>
`;
};

/**
 * Dispatches an instant New Order alert to the administrator.
 * Only sends for confirmed COD or successfully PAID Razorpay orders.
 */
const sendAdminNewOrderAlert = async (orderInput) => {
    try {
        if (!orderInput) return false;

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
            console.log(`[EmailService] Order #${order._id} is neither PAID nor COD. Skipping admin alert.`);
            return false;
        }

        // 2. Atomic duplicate prevention check (guarantees race condition immunity)
        const claimedOrder = await Order.findOneAndUpdate(
            { _id: order._id, adminAlertEmailSent: { $ne: true } },
            { $set: { adminAlertEmailSent: true } },
            { new: true }
        );

        if (!claimedOrder) {
            console.log(`[EmailService] Admin alert already claimed or sent for order #${order._id}. Skipping duplicate.`);
            return false;
        }

        order = claimedOrder;

        // 3. Resolve Admin Email
        let adminEmail = (process.env.ADMIN_EMAIL || "").trim();
        if (!adminEmail) {
            const adminUser = await User.findOne({ isAdmin: true }).select("email");
            if (adminUser && adminUser.email) {
                adminEmail = adminUser.email.trim();
            }
        }
        if (!adminEmail && (process.env.GMAIL_FROM_EMAIL || process.env.EMAIL_USER)) {
            adminEmail = (process.env.GMAIL_FROM_EMAIL || process.env.EMAIL_USER).trim();
        }

        if (!adminEmail) {
            console.warn(`[EmailService] No admin email could be resolved. Admin alert skipped for order #${order._id}.`);
            return false;
        }

        // 4. Resolve Customer Details
        let customerEmail = "N/A";
        let customerName = order.shippingAddress?.fullName || "CARTSY Student";

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

        const clientUrl = (process.env.URL || process.env.CLIENT_URL || "http://localhost:5173").trim();
        const shortId = String(order._id).slice(-8).toUpperCase();
        const total = Number(order.totalPrice || order.amount || 0).toFixed(2);
        const subject = `New Order #${shortId} received from ${customerName} (Rs. ${total})`;

        const fallbackEmail = (process.env.GMAIL_FROM_EMAIL || process.env.EMAIL_USER || "").trim();
        let fromAddress = `"CARTSY System" <${fallbackEmail}>`;
        if (process.env.EMAIL_FROM) {
            const nameMatch = process.env.EMAIL_FROM.match(/^["']?([^"<']+)["']?/);
            const displayName = nameMatch ? nameMatch[1].trim() : "CARTSY";
            fromAddress = `"${displayName}" <${fallbackEmail}>`;
        }

        const html = generateAdminNewOrderAlertHtml(order, { customerName, customerEmail }, clientUrl);
        const text = generateAdminNewOrderAlertText(order, { customerName, customerEmail }, clientUrl);

        const dispatchResult = await dispatchEmail({
            to: adminEmail,
            from: fromAddress,
            replyTo: customerEmail !== "N/A" ? customerEmail : (process.env.EMAIL_REPLY_TO || process.env.GMAIL_FROM_EMAIL || process.env.EMAIL_USER),
            subject,
            text,
            html,
            headers: {
                "X-Entity-Ref-ID": `admin-alert-${order._id}`,
                "X-Order-Status": order.status || "CONFIRMED",
            },
            contextName: `Admin new order alert for order #${order._id}`,
        });

        if (!dispatchResult.success) {
            const Order = require("../models/Order");
            await Order.findByIdAndUpdate(orderInput?._id, { adminAlertEmailSent: false }).catch(() => {});
            return false;
        }

        console.log(`[EmailService] Admin new order alert sent to ${adminEmail} for order #${order._id} (Provider: ${dispatchResult.provider}, Message ID: ${dispatchResult.messageId})`);
        return true;
    } catch (error) {
        console.error(`[EmailService] Error sending admin alert for order #${orderInput?._id || "unknown"}:`, error.message);
        const Order = require("../models/Order");
        await Order.findByIdAndUpdate(orderInput?._id, { adminAlertEmailSent: false }).catch(() => {});
        return false;
    }
};

module.exports = {
    getEmailProvider,
    getTransporter,
    getGmailClient,
    dispatchEmail,
    verifySmtpConnection,
    verifyGmailConnection,
    verifyEmailConnection,
    sendOrderConfirmationEmail,
    sendOrderStatusEmail,
    sendPasswordResetEmail,
    sendPasswordResetSuccessEmail,
    sendWelcomeEmail,
    sendAdminNewOrderAlert,
    generateOrderReceiptHtml,
    generateOrderReceiptText,
    generateStatusUpdateHtml,
    generateStatusUpdateText,
    generatePasswordResetHtml,
    generatePasswordResetText,
    generatePasswordResetSuccessHtml,
    generatePasswordResetSuccessText,
    generateWelcomeEmailHtml,
    generateWelcomeEmailText,
    generateAdminNewOrderAlertHtml,
    generateAdminNewOrderAlertText,
};


