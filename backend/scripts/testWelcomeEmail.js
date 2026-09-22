require("dotenv").config();
const {
    verifySmtpConnection,
    getTransporter,
    generateWelcomeEmailHtml,
    generateWelcomeEmailText,
} = require("../utils/emailService");

async function runTest() {
    console.log("=================================================");
    console.log("       CampusMart Welcome Email Diagnostic       ");
    console.log("=================================================");
    console.log("EMAIL_SERVICE:", process.env.EMAIL_SERVICE || "gmail");
    console.log("EMAIL_USER:   ", process.env.EMAIL_USER ? process.env.EMAIL_USER.replace(/(.{3})(.*)(@.*)/, "$1***$3") : "NOT SET");
    console.log("URL:          ", process.env.URL || process.env.CLIENT_URL || "http://localhost:5173");
    console.log("-------------------------------------------------");

    const targetEmail = process.argv[2] || process.env.EMAIL_USER;

    if (!targetEmail) {
        console.error("❌ No target email provided. Usage: node testWelcomeEmail.js [recipient_email]");
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
    const mockCustomerName = "Campus Student";
    const clientUrl = (process.env.URL || process.env.CLIENT_URL || "http://localhost:5173").trim();

    console.log(`2. Generating Welcome Email Preview for: ${targetEmail}...`);
    const html = generateWelcomeEmailHtml({
        customerName: mockCustomerName,
        clientUrl,
        recipientEmail: targetEmail,
    });
    const text = generateWelcomeEmailText({
        customerName: mockCustomerName,
        clientUrl,
        recipientEmail: targetEmail,
    });

    try {
        let fromAddress = `"CampusMart" <${process.env.EMAIL_USER}>`;
        if (process.env.EMAIL_FROM) {
            const nameMatch = process.env.EMAIL_FROM.match(/^["']?([^"<']+)["']?/);
            const displayName = nameMatch ? nameMatch[1].trim() : "CampusMart";
            fromAddress = `"${displayName}" <${process.env.EMAIL_USER}>`;
        }

        console.log("3. Sending Test Welcome Email...");
        const info = await transporter.sendMail({
            from: fromAddress,
            replyTo: process.env.EMAIL_REPLY_TO || process.env.EMAIL_USER,
            to: targetEmail,
            subject: `Welcome to CampusMart, ${mockCustomerName}! 🎓 (Test)`,
            text,
            html,
            headers: {
                "X-Entity-Ref-ID": `welcome-test-${Date.now()}`,
            },
        });

        console.log("✅ Welcome Email Sent Successfully!");
        console.log("   Message ID:", info.messageId);
        console.log("   Recipient :", targetEmail);
        console.log("   Browse URL:", `${clientUrl.replace(/\/$/, "")}/product`);
        console.log("=================================================");
        console.log("Check your inbox to preview the Welcome Email!");
    } catch (err) {
        console.error("❌ Failed to send welcome email:", err.message);
        process.exit(1);
    }
}

runTest();
