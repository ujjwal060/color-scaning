import nodemailer from "nodemailer";
import { loadConfig } from "../config/loadConfig.js";

let secretsCache = null;

async function init() {
  if (!secretsCache) {
    secretsCache = await loadConfig();
  }
}

const sendEmail = async (to, subject, html) => {
  try {
    await init();

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: secretsCache.EMAIL_USER,
        pass: secretsCache.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    const mailOptions = {
      from: `"Color Scanning" <${secretsCache.EMAIL_USER}>`,
      to,
      subject,
      html,
    };

    await transporter.sendMail(mailOptions);

    return { success: true, message: "Email sent successfully" };
    console.log(`✅ Email sent to ${to}`);
  } catch (error) {
    console.error("❌ Error sending email:", error);
  }
};

export default sendEmail;
