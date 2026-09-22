require("dotenv").config();
const {
    verifySmtpConnection,
    getTransporter,
    generateAdminNewOrderAlertHtml,
    generateAdminNewOrderAlertText,
} = require("../utils/emailService");

async function runTest() {
    console.log("=================================================");
    console.log("    CampusMart Admin New Order Alert Diagnostic  ");
    console.log("=================================================");
    console.log("EMAIL_SERVICE:", process.env.EMAIL_SERVICE || "gmail");
    console.log("EMAIL_USER:   ", process.env.EMAIL_USER ? process.env.EMAIL_USER.replace(/(.{3})(.*)(@.*)/, "$1***$3") : "NOT SET");
    console.log("ADMIN_EMAIL:  ", process.env.ADMIN_EMAIL || process.env.EMAIL_USER || "NOT SET");
    console.log("URL:          ", process.env.URL || process.env.CLIENT_URL || "http://localhost:5173");
    console.log("-------------------------------------------------");

    const targetAdminEmail = process.argv[2] || process.env.ADMIN_EMAIL || process.env.EMAIL_USER;

    if (!targetAdminEmail) {
        console.error("❌ No admin email provided. Usage: node testAdminOrderAlertEmail.js [admin_email]");
        process.exit(1);
    }

    console.log("1. Verifying SMTP Connection...");
    const check = await verifySmtpConnection();
    if (!check.success) {
        console.error("❌ SMTP Verification Failed:", check.message);
        process.exit(1);
    }
    console.log("✅ SMTP Server Connected Successfully!");

    const transporter = getTransporter();
    const clientUrl = (process.env.URL || process.env.CLIENT_URL || "http://localhost:5173").trim();

    // Mock Order Document
    const mockOrder = {
        _id: "68c5ef92a104b281f94c9821",
        paymentMethod: "COD",
        status: "CONFIRMED",
        createdAt: new Date(),
        totalPrice: 1249.00,
        amount: 1249.00,
        shippingAddress: {
            fullName: "Aarav Sharma",
            address: "Room 402, Block B, Campus Boys Hostel",
            city: "North Campus",
            pincode: "110007",
            phone: "+91 98765 43210",
        },
        orderItems: [
            {
                productId: "prod-1",
                title: "Data Structures & Algorithms in Java (6th Edition)",
                price: 499.00,
                quantity: 1,
            },
            {
                productId: "prod-2",
                title: "Scientific Calculator FX-991EX",
                price: 750.00,
                quantity: 1,
            },
        ],
    };

    const mockCustomer = {
        customerName: "Aarav Sharma",
        customerEmail: "aarav.sharma@campus.edu",
    };

    console.log(`2. Generating Admin New Order Alert Preview for: ${targetAdminEmail}...`);
    const html = generateAdminNewOrderAlertHtml(mockOrder, mockCustomer, clientUrl);
    const text = generateAdminNewOrderAlertText(mockOrder, mockCustomer, clientUrl);

    const shortId = String(mockOrder._id).slice(-8).toUpperCase();
    const total = Number(mockOrder.totalPrice).toFixed(2);
    const subject = `New Order #${shortId} received from ${mockCustomer.customerName} (Rs. ${total}) [TEST]`;

    try {
        let fromAddress = `"CampusMart System" <${process.env.EMAIL_USER}>`;
        if (process.env.EMAIL_FROM) {
            const nameMatch = process.env.EMAIL_FROM.match(/^["']?([^"<']+)["']?/);
            const displayName = nameMatch ? nameMatch[1].trim() : "CampusMart";
            fromAddress = `"${displayName}" <${process.env.EMAIL_USER}>`;
        }

        console.log("3. Sending Test Admin Order Alert Email...");
        const info = await transporter.sendMail({
            from: fromAddress,
            replyTo: mockCustomer.customerEmail,
            to: targetAdminEmail,
            subject,
            text,
            html,
            headers: {
                "X-Entity-Ref-ID": `admin-alert-test-${Date.now()}`,
            },
        });

        console.log("✅ Admin Order Alert Email Sent Successfully!");
        console.log("   Message ID:", info.messageId);
        console.log("   Admin Email:", targetAdminEmail);
        console.log("   Subject    :", subject);
        console.log("   Admin URL  :", `${clientUrl.replace(/\/$/, "")}/admin/orders/${mockOrder._id}`);
        console.log("=================================================");
        console.log("Check your admin inbox to preview the Alert Email!");
    } catch (err) {
        console.error("❌ Failed to send admin order alert email:", err.message);
        process.exit(1);
    }
}

runTest();
