import axios from "axios";

interface SmsConfig {
  apiKey: string;
  senderId: string;
  baseUrl: string;
}

const getSmsConfig = (): SmsConfig => {
  return {
    apiKey: process.env.SMS_API_KEY || "",
    senderId: process.env.SMS_SENDER_ID || "SCHOOL",
    baseUrl: process.env.SMS_API_URL || "https://api.sms-provider.com",
  };
};

export const sendSms = async (
  phone: string,
  message: string,
  templateId?: string
): Promise<{ messageId: string }> => {
  const config = getSmsConfig();

  if (!config.apiKey) {
    throw new Error("SMS API key not configured");
  }

  // Format phone number (ensure country code)
  const formattedPhone = phone.startsWith("+91") ? phone : `+91${phone.replace(/^0/, "")}`;

  try {
    const response = await axios.post(`${config.baseUrl}/send`, {
      apiKey: config.apiKey,
      senderId: config.senderId,
      to: formattedPhone,
      message,
      templateId,
    });

    return { messageId: response.data?.messageId || "sent" };
  } catch (error: any) {
    throw new Error(`SMS sending failed: ${error.response?.data?.message || error.message}`);
  }
};

export const checkSmsBalance = async (): Promise<{ balance: number; currency: string }> => {
  const config = getSmsConfig();

  const response = await axios.get(`${config.baseUrl}/balance`, {
    headers: { Authorization: `Bearer ${config.apiKey}` },
  });

  return response.data;
};

export const getSmsDeliveryStatus = async (messageId: string): Promise<{ status: string }> => {
  const config = getSmsConfig();

  const response = await axios.get(`${config.baseUrl}/status/${messageId}`, {
    headers: { Authorization: `Bearer ${config.apiKey}` },
  });

  return response.data;
};
