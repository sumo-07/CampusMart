require("dotenv").config();
const {
    verifySmtpConnection,
    getTransporter,
    generatePasswordResetHtml,
    generatePasswordResetText,
} = require("../utils/emailService");

async function runTest() {
    console.log("=================================================");
    console.log("   CampusMart Password Reset Email Diagnostic    ");
    console.log("=================================================");
    console.log("EMAIL_SERVICE:", process.env.EMAIL_SERVICE || "gmail");
    console.log("EMAIL_USER:   ", process.env.EMAIL_USER ? process.env.EMAIL_USER.replace(/(.{3})(.*)(@.*)/, "$1***$3") : "NOT SET");
    console.log("URL:          ", process.env.URL || process.env.CLIENT_URL || "http://localhost:5173");
    console.log("-------------------------------------------------");

    const targetEmail = process.argv[2] || process.env.EMAIL_USER;

    if (!targetEmail) {
        console.error("❌ No target email provided. Usage: node testPasswordResetEmail.js [recipient_email]");
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
    const mockOtp = "482910";
    const mockToken = "a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890";
    const clientUrl = (process.env.URL || process.env.CLIENT_URL || "http://localhost:5173").trim();

    console.log(`2. Generating Password Reset Email Preview for: ${targetEmail}...`);
    const html = generatePasswordResetHtml({
        customerName: mockCustomerName,
        otp: mockOtp,
        resetToken: mockToken,
        clientUrl,
        recipientEmail: targetEmail,
    });
    const text = generatePasswordResetText({
        customerName: mockCustomerName,
        otp: mockOtp,
        resetToken: mockToken,
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

        console.log("3. Sending Test Password Reset Email...");
        const info = await transporter.sendMail({
            from: fromAddress,
            replyTo: process.env.EMAIL_REPLY_TO || process.env.EMAIL_USER,
            to: targetEmail,
            subject: "CampusMart Password Reset - Verification Code & Link (Test)",
            text,
            html,
            headers: {
                "X-Entity-Ref-ID": `pwd-reset-test-${Date.now()}`,
            },
        });

        console.log("✅ Password Reset Email Sent Successfully!");
        console.log("   Message ID:", info.messageId);
        console.log("   Recipient :", targetEmail);
        console.log("   Test OTP  :", mockOtp);
        console.log("=================================================");
        console.log("Check your inbox to preview the 6-digit OTP and Reset link!");
    } catch (err) {
        console.error("❌ Failed to send password reset email:", err.message);
        process.exit(1);
    }
}

runTest();
