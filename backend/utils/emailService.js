const nodemailer = require("nodemailer");
const User = require("../models/User");
const Order = require("../models/Order");

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
            service: "gmail",
            auth: {
                user,
                pass,
            },
        });
    }

    // Generic SMTP configuration fallback
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port: Number(process.env.SMTP_PORT) || 587,
        secure: Number(process.env.SMTP_PORT) === 465,
        auth: {
            user,
            pass,
        },
    });
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
                `${index + 1}. ${item.title || "Campus Item"} x ${item.quantity} - Rs. ${(Number(item.price) * Number(item.quantity)).toFixed(2)}`
        )
        .join("\n");

    const total = Number(order.totalPrice || order.amount || 0).toFixed(2);
    const baseUrl = process.env.CLIENT_URL || clientUrl || "http://localhost:5173";
    const trackOrderUrl = process.env.ORDERS_URL || `${baseUrl.replace(/\/$/, "")}/orders`;

    return `CAMPUSMART - ORDER RECEIPT
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
${shipping.address || "Campus Address"}
${shipping.city || ""}${shipping.pincode ? " - " + shipping.pincode : ""}
${shipping.phone ? `Phone: ${shipping.phone}` : ""}

Track your order anytime at:
${trackOrderUrl}

Questions? Reply to this email or visit our campus desk.
(C) ${new Date().getFullYear()} CampusMart. All rights reserved.
`;
};

/**
 * Generates an itemized, responsive HTML digital receipt for an order
 */
const generateOrderReceiptHtml = (order, customerName, clientUrl) => {
    const isOnline = order.paymentMethod === "Razorpay";
    const paymentLabel = isOnline ? "Razorpay (Online Paid)" : "Cash on Delivery (Pay on Arrival)";
    const statusBadgeText = isOnline ? "PAYMENT SUCCESSFUL" : "ORDER CONFIRMED";
    const statusBadgeBg = isOnline ? "#ecfdf5" : "#fffbeb";
    const statusBadgeColor = isOnline ? "#047857" : "#b45309";
    const statusBadgeBorder = isOnline ? "#a7f3d0" : "#fde68a";

    const formattedDate = formatOrderDate(order.createdAt);
    const orderRef = String(order._id);
    const shortOrderRef = orderRef.length > 8 ? orderRef.slice(-8).toUpperCase() : orderRef;

    const itemsRows = (order.orderItems || [])
        .map((item) => {
            const itemTotal = (Number(item.price) * Number(item.quantity)).toFixed(2);
            return `
            <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 12px 16px; color: #1e293b; font-size: 14px; font-weight: 500;">
                    ${item.title || "Campus Item"}
                </td>
                <td style="padding: 12px 16px; color: #64748b; font-size: 14px; text-align: center;">
                    ${item.quantity}
                </td>
                <td style="padding: 12px 16px; color: #64748b; font-size: 14px; text-align: right;">
                    ₹${Number(item.price).toFixed(2)}
                </td>
                <td style="padding: 12px 16px; color: #0f172a; font-size: 14px; font-weight: 600; text-align: right;">
                    ₹${itemTotal}
                </td>
            </tr>
            `;
        })
        .join("");

    const totalAmount = Number(order.totalPrice || order.amount || 0).toFixed(2);
    const shipping = order.shippingAddress || {};
    
    const baseUrl = process.env.CLIENT_URL || clientUrl || "http://localhost:5173";
    const trackOrderUrl = process.env.ORDERS_URL || `${baseUrl.replace(/\/$/, "")}/orders`;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Order Receipt - CampusMart</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f1f5f9; padding: 30px 10px;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 620px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04);">
                    
                    <!-- BRAND HEADER -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 32px 30px; text-align: center;">
                            <div style="font-size: 26px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">
                                🎓 CampusMart
                            </div>
                            <div style="font-size: 13px; color: #e0e7ff; margin-top: 4px; font-weight: 500; letter-spacing: 0.5px;">
                                ONLINE STORE &bull; OFFICIAL RECEIPT
                            </div>
                        </td>
                    </tr>

                    <!-- STATUS BADGE & GREETING -->
                    <tr>
                        <td style="padding: 30px 30px 20px 30px; text-align: center;">
                            <div style="display: inline-block; background-color: ${statusBadgeBg}; color: ${statusBadgeColor}; border: 1px solid ${statusBadgeBorder}; font-size: 12px; font-weight: 700; padding: 6px 14px; border-radius: 20px; letter-spacing: 0.8px; margin-bottom: 16px;">
                                ${statusBadgeText}
                            </div>
                            <h2 style="margin: 0; color: #0f172a; font-size: 22px; font-weight: 700;">
                                Thank You for Your Order, ${customerName}!
                            </h2>
                            <p style="margin: 8px 0 0 0; color: #64748b; font-size: 14px; line-height: 1.5;">
                                ${
                                    isOnline
                                        ? "Your payment was received successfully and your order is currently being prepared."
                                        : "Your cash on delivery order has been placed and stock has been reserved for you."
                                }
                            </p>
                        </td>
                    </tr>

                    <!-- ORDER METADATA -->
                    <tr>
                        <td style="padding: 0 30px 24px 30px;">
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px;">
                                <tr>
                                    <td style="padding: 4px 8px; font-size: 13px; color: #64748b;">
                                        <strong>Order Ref:</strong> #${shortOrderRef}
                                    </td>
                                    <td style="padding: 4px 8px; font-size: 13px; color: #64748b; text-align: right;">
                                        <strong>Date:</strong> ${formattedDate}
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 4px 8px; font-size: 13px; color: #64748b;" colspan="2">
                                        <strong>Payment Mode:</strong> <span style="color: #0f172a; font-weight: 600;">${paymentLabel}</span>
                                    </td>
                                </tr>
                                ${
                                    order.razorpayOrderId
                                        ? `
                                <tr>
                                    <td style="padding: 4px 8px; font-size: 12px; color: #94a3b8;" colspan="2">
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
                        <td style="padding: 0 30px 24px 30px;">
                            <h3 style="margin: 0 0 12px 0; color: #0f172a; font-size: 16px; font-weight: 700;">
                                Items Ordered
                            </h3>
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse: collapse; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
                                <thead>
                                    <tr style="background-color: #f8fafc; border-bottom: 2px solid #e2e8f0;">
                                        <th style="padding: 12px 16px; font-size: 12px; font-weight: 600; color: #64748b; text-align: left; text-transform: uppercase; letter-spacing: 0.5px;">Item</th>
                                        <th style="padding: 12px 16px; font-size: 12px; font-weight: 600; color: #64748b; text-align: center; text-transform: uppercase; letter-spacing: 0.5px;">Qty</th>
                                        <th style="padding: 12px 16px; font-size: 12px; font-weight: 600; color: #64748b; text-align: right; text-transform: uppercase; letter-spacing: 0.5px;">Price</th>
                                        <th style="padding: 12px 16px; font-size: 12px; font-weight: 600; color: #64748b; text-align: right; text-transform: uppercase; letter-spacing: 0.5px;">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${itemsRows}
                                </tbody>
                                <tfoot>
                                    <tr>
                                        <td colspan="3" style="padding: 16px; text-align: right; font-size: 15px; font-weight: 700; color: #0f172a;">
                                            Grand Total:
                                        </td>
                                        <td style="padding: 16px; text-align: right; font-size: 18px; font-weight: 800; color: #4f46e5;">
                                            ₹${totalAmount}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </td>
                    </tr>

                    <!-- DELIVERY ADDRESS BLOCK -->
                    <tr>
                        <td style="padding: 0 30px 24px 30px;">
                            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px;">
                                <div style="font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">
                                    📍 Delivery Information
                                </div>
                                <div style="font-size: 15px; font-weight: 600; color: #0f172a; margin-bottom: 4px;">
                                    ${shipping.fullName || customerName}
                                </div>
                                <div style="font-size: 14px; color: #475569; line-height: 1.5;">
                                    ${shipping.address || "Delivery Address"}<br>
                                    ${shipping.city || ""}${shipping.pincode ? " - " + shipping.pincode : ""}
                                </div>
                                ${
                                    shipping.phone
                                        ? `<div style="font-size: 14px; color: #475569; margin-top: 6px;">
                                            <strong>Phone:</strong> ${shipping.phone}
                                           </div>`
                                        : ""
                                }
                            </div>
                        </td>
                    </tr>

                    <!-- CALL TO ACTION BUTTON -->
                    <tr>
                        <td style="padding: 10px 30px 32px 30px; text-align: center;">
                            <a href="${trackOrderUrl}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 700; padding: 14px 32px; border-radius: 10px; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.35);">
                                View Your Order
                            </a>
                            <div style="margin-top: 10px; font-size: 12px; color: #94a3b8;">
                                Track status, view order timeline, or print receipt anytime.
                            </div>
                        </td>
                    </tr>

                    <!-- FOOTER -->
                    <tr>
                        <td style="background-color: #0f172a; padding: 24px 30px; text-align: center;">
                            <p style="margin: 0; font-size: 13px; color: #94a3b8; line-height: 1.5;">
                                Questions or need support? Reply directly to this email.<br>
                                &copy; ${new Date().getFullYear()} CampusMart. All rights reserved.
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

        // 2. Transporter check: Fail gracefully if credentials are not configured
        const transporter = getTransporter();
        if (!transporter) {
            console.warn("[EmailService] EMAIL_USER or EMAIL_PASS not configured in backend/.env. Email dispatch skipped.");
            return false;
        }

        // 3. Resolve customer email and name
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

        const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
        const shortId = String(order._id).slice(-8).toUpperCase();
        const isOnline = order.paymentMethod === "Razorpay";
        const subject = isOnline
            ? `Payment Received & Order Confirmed #${shortId} - CampusMart`
            : `Order Confirmed #${shortId} (Cash on Delivery) - CampusMart`;

        // Ensure From address uses the authenticated Gmail address for 100% SPF/DKIM alignment
        let fromAddress = `"CampusMart" <${process.env.EMAIL_USER}>`;
        if (process.env.EMAIL_FROM) {
            const nameMatch = process.env.EMAIL_FROM.match(/^["']?([^"<']+)["']?/);
            const displayName = nameMatch ? nameMatch[1].trim() : "CampusMart";
            fromAddress = `"${displayName}" <${process.env.EMAIL_USER}>`;
        }

        const html = generateOrderReceiptHtml(order, customerName, clientUrl);
        const text = generateOrderReceiptText(order, customerName, clientUrl);

        const info = await transporter.sendMail({
            from: fromAddress,
            replyTo: process.env.EMAIL_REPLY_TO || process.env.EMAIL_USER,
            to: recipientEmail,
            subject,
            text,
            html,
            headers: {
                "X-Entity-Ref-ID": String(order._id),
            },
        });

        console.log(`[EmailService] Order receipt sent to ${recipientEmail} for order #${order._id} (Message ID: ${info.messageId})`);

        // 4. Update idempotency flag
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
                badgeBg: "#eff6ff",
                badgeBorder: "#bfdbfe",
                badgeColor: "#1d4ed8",
                headline: "Good news! Your order has been shipped!",
                subheadline: "Your package has been dispatched and is on its way to your delivery address.",
                instructionTitle: "📍 Delivery & Handover Instructions",
                instructionBody: `
                    &bull; Our delivery partner will deliver this package to <strong>${shipping.address || "your delivery address"}</strong>.<br>
                    &bull; Please keep your phone reachable at <strong>${shipping.phone || "the contact number provided"}</strong> for delivery coordination.<br>
                    &bull; If you are unavailable, please ensure someone is authorized to receive the package on your behalf.
                `,
                textInstructions: `Delivery Note: Your order has been dispatched and is on its way to ${shipping.address || "your delivery address"}. Please keep your phone reachable at ${shipping.phone || "the contact number provided"} for delivery coordination.`,
                subject: `📦 Shipped! Order #${String(order._id).slice(-8).toUpperCase()} is on its way - CampusMart`,
            };

        case "Delivered":
            return {
                badgeText: "✅ DELIVERED SUCCESSFULLY",
                badgeBg: "#ecfdf5",
                badgeBorder: "#a7f3d0",
                badgeColor: "#047857",
                headline: "Your order has been delivered!",
                subheadline: "We hope you enjoy your items. Thank you for shopping with us!",
                instructionTitle: "📍 Delivery Confirmation",
                instructionBody: `
                    &bull; Delivered to <strong>${shipping.fullName || customerName}</strong> at <strong>${shipping.address || "your delivery address"}</strong>.<br>
                    &bull; If you have not received this package or have any questions, please reply directly to this email for support.
                `,
                textInstructions: `Delivered to ${shipping.fullName || customerName} at ${shipping.address || "your delivery address"}. If you have any questions, reply directly to this email.`,
                subject: `✅ Delivered! Order #${String(order._id).slice(-8).toUpperCase()} - CampusMart`,
            };

        case "Processing":
            return {
                badgeText: "⚙️ ORDER IN PROCESSING",
                badgeBg: "#fffbeb",
                badgeBorder: "#fde68a",
                badgeColor: "#b45309",
                headline: "We're packing your order!",
                subheadline: "Our team is currently picking and verifying your items for dispatch.",
                instructionTitle: "📍 What Happens Next?",
                instructionBody: `
                    &bull; Items are being verified for quality and packaged safely.<br>
                    &bull; You will receive another notification with tracking details as soon as your package is dispatched.
                `,
                textInstructions: `Our team is verifying and packing your items. You will receive another update when your package is dispatched.`,
                subject: `⚙️ Processing: Order #${String(order._id).slice(-8).toUpperCase()} is being prepared - CampusMart`,
            };

        case "Cancelled":
            return {
                badgeText: "❌ ORDER CANCELLED",
                badgeBg: "#fef2f2",
                badgeBorder: "#fecaca",
                badgeColor: "#b91c1c",
                headline: `Order #${String(order._id).slice(-8).toUpperCase()} has been cancelled`,
                subheadline: "This order has been cancelled and will not be delivered.",
                instructionTitle: "📍 Cancellation Details",
                instructionBody: isPaid
                    ? `&bull; A refund of <strong>₹${totalAmount}</strong> has been initiated to your original payment method. It will reflect in your account within 3–5 business days.<br>&bull; If you have any questions, reply to this email anytime.`
                    : `&bull; Since this was a Cash on Delivery order, no amount was charged.<br>&bull; If you cancelled by mistake, feel free to place a new order on CampusMart anytime.`,
                textInstructions: isPaid
                    ? `A refund of Rs. ${totalAmount} has been initiated to your original payment method (3-5 business days).`
                    : `Since this was Cash on Delivery, no payment was collected. Feel free to re-order anytime.`,
                subject: `Order Cancelled: #${String(order._id).slice(-8).toUpperCase()} - CampusMart`,
            };

        default:
            return {
                badgeText: `ORDER STATUS: ${status.toUpperCase()}`,
                badgeBg: "#f8fafc",
                badgeBorder: "#e2e8f0",
                badgeColor: "#475569",
                headline: `Order #${String(order._id).slice(-8).toUpperCase()} is now ${status}`,
                subheadline: "Your order status has been updated by our store team.",
                instructionTitle: "📍 Order Details",
                instructionBody: `Your order status is now <strong>${status}</strong>. You can track current progress in your account.`,
                textInstructions: `Your order status is now ${status}. Track current progress in your CampusMart account.`,
                subject: `Update: Order #${String(order._id).slice(-8).toUpperCase()} is ${status} - CampusMart`,
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

    const baseUrl = process.env.CLIENT_URL || clientUrl || "http://localhost:5173";
    const trackOrderUrl = process.env.ORDERS_URL || `${baseUrl.replace(/\/$/, "")}/orders`;

    const itemsRows = (order.orderItems || [])
        .map((item) => {
            const itemTotal = (Number(item.price) * Number(item.quantity)).toFixed(2);
            return `
            <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 10px 14px; color: #1e293b; font-size: 13px; font-weight: 500;">
                    ${item.title || "Campus Item"}
                </td>
                <td style="padding: 10px 14px; color: #64748b; font-size: 13px; text-align: center;">
                    ${item.quantity}
                </td>
                <td style="padding: 10px 14px; color: #0f172a; font-size: 13px; font-weight: 600; text-align: right;">
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
    <title>Order Update - CampusMart</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f1f5f9; padding: 30px 10px;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 620px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08);">
                    
                    <!-- BRAND HEADER -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 28px 30px; text-align: center;">
                            <div style="font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">
                                🎓 CampusMart
                            </div>
                            <div style="font-size: 12px; color: #e0e7ff; margin-top: 4px; font-weight: 500; letter-spacing: 0.5px;">
                                ONLINE STORE &bull; ORDER STATUS UPDATE
                            </div>
                        </td>
                    </tr>

                    <!-- STATUS BADGE & GREETING -->
                    <tr>
                        <td style="padding: 28px 30px 18px 30px; text-align: center;">
                            <div style="display: inline-block; background-color: ${config.badgeBg}; color: ${config.badgeColor}; border: 1px solid ${config.badgeBorder}; font-size: 12px; font-weight: 700; padding: 6px 14px; border-radius: 20px; letter-spacing: 0.8px; margin-bottom: 14px;">
                                ${config.badgeText}
                            </div>
                            <h2 style="margin: 0; color: #0f172a; font-size: 22px; font-weight: 700;">
                                ${config.headline}
                            </h2>
                            <p style="margin: 8px 0 0 0; color: #64748b; font-size: 14px; line-height: 1.5;">
                                Hi ${customerName}, ${config.subheadline}
                            </p>
                        </td>
                    </tr>

                    <!-- CAMPUS INSTRUCTION CARD -->
                    <tr>
                        <td style="padding: 0 30px 20px 30px;">
                            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #4f46e5; border-radius: 8px; padding: 16px 20px;">
                                <div style="font-size: 13px; font-weight: 700; color: #0f172a; margin-bottom: 6px;">
                                    ${config.instructionTitle}
                                </div>
                                <div style="font-size: 13px; color: #475569; line-height: 1.6;">
                                    ${config.instructionBody}
                                </div>
                            </div>
                        </td>
                    </tr>

                    <!-- ORDER SUMMARY -->
                    <tr>
                        <td style="padding: 0 30px 20px 30px;">
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse: collapse; border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden;">
                                <thead>
                                    <tr style="background-color: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                                        <th style="padding: 10px 14px; font-size: 11px; font-weight: 600; color: #64748b; text-align: left; text-transform: uppercase;">Item</th>
                                        <th style="padding: 10px 14px; font-size: 11px; font-weight: 600; color: #64748b; text-align: center; text-transform: uppercase;">Qty</th>
                                        <th style="padding: 10px 14px; font-size: 11px; font-weight: 600; color: #64748b; text-align: right; text-transform: uppercase;">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${itemsRows}
                                </tbody>
                                <tfoot>
                                    <tr style="background-color: #f8fafc;">
                                        <td colspan="2" style="padding: 12px 14px; text-align: right; font-size: 13px; font-weight: 700; color: #0f172a;">
                                            Order Total:
                                        </td>
                                        <td style="padding: 12px 14px; text-align: right; font-size: 15px; font-weight: 800; color: #4f46e5;">
                                            ₹${totalAmount}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </td>
                    </tr>

                    <!-- DELIVERY ADDRESS CARD -->
                    <tr>
                        <td style="padding: 0 30px 20px 30px;">
                            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px 18px; font-size: 13px; color: #475569; line-height: 1.5;">
                                <strong>Delivery Location:</strong> ${shipping.fullName || customerName}, ${shipping.address || "Delivery Address"}, ${shipping.city || ""} ${shipping.pincode ? "- " + shipping.pincode : ""} ${shipping.phone ? " (Phone: " + shipping.phone + ")" : ""}
                            </div>
                        </td>
                    </tr>

                    <!-- CALL TO ACTION BUTTON -->
                    <tr>
                        <td style="padding: 10px 30px 28px 30px; text-align: center;">
                            <a href="${trackOrderUrl}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 700; padding: 12px 28px; border-radius: 8px; box-shadow: 0 4px 10px rgba(79, 70, 229, 0.3);">
                                Track Your Order
                            </a>
                            <div style="margin-top: 8px; font-size: 12px; color: #94a3b8;">
                                View live order status and delivery timeline on CampusMart.
                            </div>
                        </td>
                    </tr>

                    <!-- FOOTER -->
                    <tr>
                        <td style="background-color: #0f172a; padding: 20px 30px; text-align: center;">
                            <p style="margin: 0; font-size: 12px; color: #94a3b8; line-height: 1.5;">
                                Questions about this order? Reply directly to this email.<br>
                                &copy; ${new Date().getFullYear()} CampusMart. All rights reserved.
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

    const baseUrl = process.env.CLIENT_URL || clientUrl || "http://localhost:5173";
    const trackOrderUrl = process.env.ORDERS_URL || `${baseUrl.replace(/\/$/, "")}/orders`;

    const itemsText = (order.orderItems || [])
        .map((item, index) => `${index + 1}. ${item.title || "Campus Item"} x ${item.quantity} - Rs. ${(Number(item.price) * Number(item.quantity)).toFixed(2)}`)
        .join("\n");

    return `CAMPUSMART - ORDER UPDATE
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
${shipping.address || "Campus Address"}
${shipping.city || ""}${shipping.pincode ? " - " + shipping.pincode : ""}
${shipping.phone ? `Phone: ${shipping.phone}` : ""}

Track live order status anytime:
${trackOrderUrl}

Questions? Reply directly to this email.
(C) ${new Date().getFullYear()} CampusMart. All rights reserved.
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

        const transporter = getTransporter();
        if (!transporter) {
            console.warn("[EmailService] EMAIL_USER or EMAIL_PASS not configured. Skipping status update email.");
            return false;
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

        const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
        const config = getStatusConfig(newStatus, order, customerName);

        let fromAddress = `"CampusMart" <${process.env.EMAIL_USER}>`;
        if (process.env.EMAIL_FROM) {
            const nameMatch = process.env.EMAIL_FROM.match(/^["']?([^"<']+)["']?/);
            const displayName = nameMatch ? nameMatch[1].trim() : "CampusMart";
            fromAddress = `"${displayName}" <${process.env.EMAIL_USER}>`;
        }

        const html = generateStatusUpdateHtml(order, customerName, clientUrl, newStatus);
        const text = generateStatusUpdateText(order, customerName, clientUrl, newStatus);

        const info = await transporter.sendMail({
            from: fromAddress,
            replyTo: process.env.EMAIL_REPLY_TO || process.env.EMAIL_USER,
            to: recipientEmail,
            subject: config.subject,
            text,
            html,
            headers: {
                "X-Entity-Ref-ID": String(order._id),
                "X-Order-Status": newStatus,
            },
        });

        console.log(`[EmailService] Status update email (${newStatus}) sent to ${recipientEmail} for order #${order._id} (Message ID: ${info.messageId})`);
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

module.exports = {
    getTransporter,
    sendOrderConfirmationEmail,
    sendOrderStatusEmail,
    generateOrderReceiptHtml,
    generateOrderReceiptText,
    generateStatusUpdateHtml,
    generateStatusUpdateText,
    verifySmtpConnection,
};
