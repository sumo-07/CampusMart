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
                                CAMPUS MARKETPLACE &bull; OFFICIAL RECEIPT
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
                                    ${shipping.address || "Campus Address"}<br>
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
                                Questions or need support? Reply to this email or visit our campus desk.<br>
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
    generateOrderReceiptHtml,
    generateOrderReceiptText,
    verifySmtpConnection,
};
