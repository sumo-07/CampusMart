const { getGmailClient } = require("./gmailAuth");

/**
 * Encodes header values (like Subject or Name) to RFC 2047 base64 encoded-word format
 * if they contain non-ASCII characters or emojis.
 */
const encodeHeader = (str) => {
    if (!str) return "";
    const hasNonAscii = /[^\x20-\x7E]/.test(str);
    if (!hasNonAscii) return str;
    return `=?UTF-8?B?${Buffer.from(str, "utf-8").toString("base64")}?=`;
};

/**
 * Resolves and formats the RFC 2822 From header.
 */
const resolveFromHeader = (customFrom) => {
    if (customFrom) {
        const match = customFrom.match(/^["']?([^"<']+)["']?\s*<([^>]+)>/);
        if (match) {
            const name = match[1].trim();
            const email = match[2].trim();
            return `"${encodeHeader(name)}" <${email}>`;
        }
        return customFrom;
    }

    const fromName = (process.env.GMAIL_FROM_NAME || "Cartsy").trim();
    const fromEmail = (process.env.GMAIL_FROM_EMAIL || process.env.EMAIL_USER || "").trim();

    if (fromEmail) {
        return `"${encodeHeader(fromName)}" <${fromEmail}>`;
    }
    return "";
};

/**
 * Builds an RFC 2822 MIME multipart message string.
 */
const buildMimeMessage = ({ to, from, replyTo, subject, text, html, headers = {} }) => {
    const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    const lines = [];

    // Core MIME headers
    lines.push(`MIME-Version: 1.0`);
    if (to) lines.push(`To: ${to}`);
    if (from) lines.push(`From: ${from}`);
    if (replyTo) lines.push(`Reply-To: ${replyTo}`);
    if (subject) lines.push(`Subject: ${encodeHeader(subject)}`);
    lines.push(`Date: ${new Date().toUTCString()}`);

    // Custom headers (e.g. X-Entity-Ref-ID, X-Order-Status)
    for (const [key, value] of Object.entries(headers)) {
        if (value !== undefined && value !== null) {
            lines.push(`${key}: ${value}`);
        }
    }

    if (text && html) {
        lines.push(`Content-Type: multipart/alternative; boundary="${boundary}"`);
        lines.push(``); // Empty line separating headers from body

        // Plain text part
        lines.push(`--${boundary}`);
        lines.push(`Content-Type: text/plain; charset=UTF-8`);
        lines.push(`Content-Transfer-Encoding: base64`);
        lines.push(``);
        lines.push(Buffer.from(text, "utf-8").toString("base64"));
        lines.push(``);

        // HTML part
        lines.push(`--${boundary}`);
        lines.push(`Content-Type: text/html; charset=UTF-8`);
        lines.push(`Content-Transfer-Encoding: base64`);
        lines.push(``);
        lines.push(Buffer.from(html, "utf-8").toString("base64"));
        lines.push(``);

        lines.push(`--${boundary}--`);
    } else if (html) {
        lines.push(`Content-Type: text/html; charset=UTF-8`);
        lines.push(`Content-Transfer-Encoding: base64`);
        lines.push(``);
        lines.push(Buffer.from(html, "utf-8").toString("base64"));
    } else {
        lines.push(`Content-Type: text/plain; charset=UTF-8`);
        lines.push(`Content-Transfer-Encoding: base64`);
        lines.push(``);
        lines.push(Buffer.from(text || "", "utf-8").toString("base64"));
    }

    return lines.join("\r\n");
};

/**
 * Base64url encodes an RFC 2822 MIME message for Google Gmail API.
 */
const encodeBase64Url = (messageString) => {
    return Buffer.from(messageString, "utf-8")
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
};

/**
 * Sends an email via Google Gmail API.
 * 
 * @param {Object} options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject line
 * @param {string} [options.html] - HTML body
 * @param {string} [options.text] - Plain text fallback
 * @param {string} [options.from] - Custom from address
 * @param {string} [options.replyTo] - Reply-to email
 * @param {Object} [options.headers] - Custom headers
 * @returns {Promise<{success: boolean, messageId?: string, threadId?: string, error?: string, details?: any}>}
 */
const sendEmail = async ({ to, subject, html, text, from, replyTo, headers = {} }) => {
    try {
        const gmail = getGmailClient();
        if (!gmail) {
            const errorMsg = "Gmail API credentials (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN) not configured in .env";
            console.warn(`[GmailSender] ${errorMsg}`);
            return {
                success: false,
                error: errorMsg,
            };
        }

        if (!to) {
            const errorMsg = "Recipient email address ('to') is required";
            console.warn(`[GmailSender] ${errorMsg}`);
            return {
                success: false,
                error: errorMsg,
            };
        }

        const fromAddress = resolveFromHeader(from);
        const resolvedReplyTo = replyTo || process.env.EMAIL_REPLY_TO || process.env.GMAIL_FROM_EMAIL || process.env.EMAIL_USER;

        const mimeMessage = buildMimeMessage({
            to,
            from: fromAddress,
            replyTo: resolvedReplyTo,
            subject,
            text,
            html,
            headers,
        });

        const raw = encodeBase64Url(mimeMessage);

        const response = await gmail.users.messages.send({
            userId: "me",
            requestBody: {
                raw,
            },
        });

        return {
            success: true,
            messageId: response.data.id,
            threadId: response.data.threadId,
            data: response.data,
        };
    } catch (error) {
        const errMsg = error.response?.data?.error?.message || error.message;
        console.error("[GmailSender] Error sending email via Gmail API:", errMsg);
        return {
            success: false,
            error: errMsg,
            details: error.response?.data || null,
        };
    }
};

module.exports = {
    sendEmail,
    buildMimeMessage,
    encodeBase64Url,
    resolveFromHeader,
};
