require("dotenv").config();
const {
    verifySmtpConnection,
    getTransporter,
    generatePasswordResetSuccessHtml,
    generatePasswordResetSuccessText,
} = require("../utils/emailService");

async function runTest() {
    console.log("=================================================");
    console.log("  CampusMart Password Reset Success Email Test   ");
    console.log("=================================================");
    console.log("EMAIL_SERVICE:", process.env.EMAIL_SERVICE || "gmail");
    console.log("EMAIL_USER:   ", process.env.EMAIL_USER ? process.env.EMAIL_USER.replace(/(.{3})(.*)(@.*)/, "$1***$3") : "NOT SET");
    console.log("URL:          ", process.env.URL || process.env.CLIENT_URL || "http://localhost:5173");
    console.log("-------------------------------------------------");

    const targetEmail = process.argv[2] || process.env.EMAIL_USER;

    if (!targetEmail) {
        console.error("❌ No target email provided. Usage: node testPasswordResetSuccessEmail.js [recipient_email]");
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
    const mockCustomerName = "CampusMart Student";
    const clientUrl = (process.env.URL || process.env.CLIENT_URL || "http://localhost:5173").trim();

    console.log(`2. Generating Password Reset Success Preview for: ${targetEmail}...`);
    const html = generatePasswordResetSuccessHtml({
        customerName: mockCustomerName,
        clientUrl,
        recipientEmail: targetEmail,
        changedAt: Date.now(),
    });
    const text = generatePasswordResetSuccessText({
        customerName: mockCustomerName,
        clientUrl,
        recipientEmail: targetEmail,
        changedAt: Date.now(),
    });

    try {
        let fromAddress = `"CampusMart" <${process.env.EMAIL_USER}>`;
        if (process.env.EMAIL_FROM) {
            const nameMatch = process.env.EMAIL_FROM.match(/^["']?([^"<']+)["']?/);
            const displayName = nameMatch ? nameMatch[1].trim() : "CampusMart";
            fromAddress = `"${displayName}" <${process.env.EMAIL_USER}>`;
        }

        console.log("3. Sending Test Password Reset Success Email...");
        const info = await transporter.sendMail({
            from: fromAddress,
            replyTo: process.env.EMAIL_REPLY_TO || process.env.EMAIL_USER,
            to: targetEmail,
            subject: "CampusMart - Your Password Was Successfully Reset (Test)",
            text,
            html,
            headers: {
                "X-Entity-Ref-ID": `pwd-success-test-${Date.now()}`,
            },
        });

        console.log("✅ Password Reset Success Email Sent Successfully!");
        console.log("   Message ID:", info.messageId);
        console.log("   Recipient :", targetEmail);
        console.log("=================================================");
        console.log("Check your inbox to preview the confirmation email!");
    } catch (err) {
        console.error("❌ Failed to send password reset success email:", err.message);
        process.exit(1);
    }
}

runTest();
