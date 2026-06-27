import nodemailer from "nodemailer";
import env from "./env";

/**
 * Nodemailer transporter configuration
 * Supports Gmail, custom SMTP, and test accounts
 */

let transporter: nodemailer.Transporter | null = null;

export const getEmailTransporter = (): nodemailer.Transporter => {
  if (transporter) return transporter;

  const isProduction = env.NODE_ENV === "production";

  if (isProduction && env.SMTP_USER && env.SMTP_PASS) {
    // Production SMTP
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: parseInt(env.SMTP_PORT),
      secure: env.SMTP_SECURE === "true",
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
      pool: true, // Use pooled connections
      maxConnections: 5,
      maxMessages: 100,
      rateLimit: 10, // 10 messages per second
    });
  } else if (env.SMTP_USER && env.SMTP_PASS) {
    // Development with real SMTP (e.g., Gmail)
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: parseInt(env.SMTP_PORT),
      secure: env.SMTP_SECURE === "true",
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    });
  } else {
    // Fallback: Ethereal test account (for development)
    transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: "test@ethereal.email",
        pass: "testpassword",
      },
    });
    console.warn("⚠️ Using Ethereal test email account. Emails won't be delivered.");
  }

  return transporter;
};

/**
 * Verify SMTP connection
 */
export const verifyEmailConnection = async (): Promise<boolean> => {
  try {
    const transport = getEmailTransporter();
    await transport.verify();
    console.log("✅ SMTP connection verified");
    return true;
  } catch (error: any) {
    console.error("❌ SMTP connection failed:", error.message);
    return false;
  }
};

/**
 * Email defaults
 */
export const emailDefaults = {
  from: `"${env.SMTP_FROM_NAME}" <${env.SMTP_USER || "noreply@school-erp.com"}>`,
  replyTo: env.SMTP_USER || undefined,
};

export default { getEmailTransporter, verifyEmailConnection, emailDefaults };
