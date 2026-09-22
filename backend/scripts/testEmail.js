require("dotenv").config();
const {
    verifySmtpConnection,
    getTransporter,
    generateOrderReceiptHtml,
    generateOrderReceiptText,
    generateStatusUpdateHtml,
    generateStatusUpdateText,
    getStatusConfig,
} = require("../utils/emailService");

async function runTest() {
    console.log("==========================================");
    console.log("   CampusMart Nodemailer Diagnostic Test  ");
    console.log("==========================================");
    console.log("EMAIL_SERVICE:", process.env.EMAIL_SERVICE || "gmail");
    console.log("EMAIL_USER:   ", process.env.EMAIL_USER ? process.env.EMAIL_USER.replace(/(.{3})(.*)(@.*)/, "$1***$3") : "NOT SET");
    console.log("EMAIL_PASS:   ", process.env.EMAIL_PASS ? "****" + process.env.EMAIL_PASS.slice(-4) : "NOT SET");
    console.log("URL:          ", process.env.URL || process.env.CLIENT_URL || "http://localhost:5173");
    console.log("------------------------------------------");

    const targetEmail = process.argv[2] || process.env.EMAIL_USER;
    const testStatus = process.argv[3]; // Optional: e.g. "Shipped", "Delivered", "Processing", "Cancelled"

    if (!targetEmail) {
        console.error("❌ No target email provided. Usage: node testEmail.js [recipient_email] [optional_status]");
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

    // Mock order for template test
    const mockOrder = {
        _id: "65f2a1b94c" + Math.floor(10000000000000 + Math.random() * 90000000000000).toString(16),
        createdAt: new Date(),
        paymentMethod: "Razorpay",
        amount: 1250,
        totalPrice: 1250,
        status: "PAID",
        paymentStatus: "Paid",
        razorpayOrderId: "order_mock_" + Math.random().toString(36).substring(7),
        orderItems: [
            {
                title: "Engineering Physics Textbook (Semester 1)",
                quantity: 1,
                price: 450,
            },
            {
                title: "Scientific Calculator FX-991EX",
                quantity: 1,
                price: 800,
            },
        ],
        shippingAddress: {
            fullName: "CampusMart Test Student",
            address: "Hostel Block B, Room 304, Campus",
            city: "Campus City",
            pincode: "110001",
            phone: "+91 9876543210",
        },
    };

    const clientUrl = (process.env.URL || process.env.CLIENT_URL || "http://localhost:5173").trim();
    let subject = "";
    let html = "";
    let text = "";

    if (testStatus) {
        console.log(`2. Sending Test Order Status Update (${testStatus}) to: ${targetEmail}...`);
        html = generateStatusUpdateHtml(mockOrder, "Test Student", clientUrl, testStatus);
        text = generateStatusUpdateText(mockOrder, "Test Student", clientUrl, testStatus);
        subject = `[Test ${testStatus}] Order #${mockOrder._id.slice(-8).toUpperCase()} - CampusMart`;
    } else {
        console.log(`2. Sending Test Order Confirmation Receipt to: ${targetEmail}...`);
        html = generateOrderReceiptHtml(mockOrder, "Test Student", clientUrl);
        text = generateOrderReceiptText(mockOrder, "Test Student", clientUrl);
        subject = `Payment Received & Order Confirmed #${mockOrder._id.slice(-8).toUpperCase()} - CampusMart`;
    }

    try {
        let fromAddress = `"CampusMart" <${process.env.EMAIL_USER}>`;
        if (process.env.EMAIL_FROM) {
            const nameMatch = process.env.EMAIL_FROM.match(/^["']?([^"<']+)["']?/);
            const displayName = nameMatch ? nameMatch[1].trim() : "CampusMart";
            fromAddress = `"${displayName}" <${process.env.EMAIL_USER}>`;
        }

        const info = await transporter.sendMail({
            from: fromAddress,
            replyTo: process.env.EMAIL_REPLY_TO || process.env.EMAIL_USER,
            to: targetEmail,
            subject,
            text,
            html,
            headers: {
                "X-Entity-Ref-ID": String(mockOrder._id),
                ...(testStatus ? { "X-Order-Status": testStatus } : {}),
            },
        });

        console.log("✅ Test Email Sent Successfully!");
        console.log("   Message ID:", info.messageId);
        console.log("   Recipient :", targetEmail);
        if (testStatus) console.log("   Status    :", testStatus);
        console.log("==========================================");
        console.log("Check your inbox to preview the email!");
    } catch (err) {
        console.error("❌ Failed to send email:", err.message);
        process.exit(1);
    }
}

runTest();
