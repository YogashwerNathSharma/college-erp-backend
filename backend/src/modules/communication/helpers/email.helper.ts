import nodemailer from "nodemailer";

interface EmailOptions {
  to: string;
  subject: string;
  body: string;
  isHtml?: boolean;
  attachments?: Array<{ filename: string; path: string }>;
  from?: string;
  replyTo?: string;
}

const getTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER || "",
      pass: process.env.SMTP_PASS || "",
    },
  });
};

export const sendEmail = async (options: EmailOptions): Promise<{ messageId: string }> => {
  const transporter = getTransporter();

  if (!process.env.SMTP_USER) {
    throw new Error("SMTP credentials not configured");
  }

  const mailOptions: any = {
    from: options.from || `"${process.env.SMTP_FROM_NAME || "School ERP"}" <${process.env.SMTP_USER}>`,
    to: options.to,
    subject: options.subject,
    replyTo: options.replyTo,
  };

  if (options.isHtml) {
    mailOptions.html = options.body;
  } else {
    mailOptions.text = options.body;
  }

  if (options.attachments?.length) {
    mailOptions.attachments = options.attachments;
  }

  try {
    const info = await transporter.sendMail(mailOptions);
    return { messageId: info.messageId };
  } catch (error: any) {
    throw new Error(`Email sending failed: ${error.message}`);
  }
};

export const sendBulkEmails = async (
  recipients: Array<{ email: string; name?: string }>,
  subject: string,
  body: string,
  isHtml: boolean = false
): Promise<Array<{ email: string; status: string; error?: string }>> => {
  const results = [];

  for (const recipient of recipients) {
    try {
      await sendEmail({ to: recipient.email, subject, body, isHtml });
      results.push({ email: recipient.email, status: "sent" });
    } catch (err: any) {
      results.push({ email: recipient.email, status: "failed", error: err.message });
    }
  }

  return results;
};

export const verifySmtpConnection = async (): Promise<boolean> => {
  const transporter = getTransporter();
  try {
    await transporter.verify();
    return true;
  } catch {
    return false;
  }
};
