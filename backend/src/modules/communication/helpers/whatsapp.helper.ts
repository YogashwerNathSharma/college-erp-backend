import axios from "axios";

interface WhatsAppConfig {
  apiToken: string;
  phoneNumberId: string;
  baseUrl: string;
}

const getWhatsAppConfig = (): WhatsAppConfig => {
  return {
    apiToken: process.env.WHATSAPP_API_TOKEN || "",
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || "",
    baseUrl: process.env.WHATSAPP_API_URL || "https://graph.facebook.com/v17.0",
  };
};

export const sendWhatsApp = async (
  phone: string,
  message: string,
  templateName?: string,
  mediaUrl?: string
): Promise<{ messageId: string }> => {
  const config = getWhatsAppConfig();

  if (!config.apiToken) {
    throw new Error("WhatsApp API token not configured");
  }

  const formattedPhone = phone.startsWith("91") ? phone : `91${phone.replace(/^0/, "")}`;

  const url = `${config.baseUrl}/${config.phoneNumberId}/messages`;

  let payload: any;

  if (templateName) {
    // Template message
    payload = {
      messaging_product: "whatsapp",
      to: formattedPhone,
      type: "template",
      template: {
        name: templateName,
        language: { code: "en" },
        components: [
          {
            type: "body",
            parameters: [{ type: "text", text: message }],
          },
        ],
      },
    };
  } else if (mediaUrl) {
    // Media message
    payload = {
      messaging_product: "whatsapp",
      to: formattedPhone,
      type: "image",
      image: { link: mediaUrl, caption: message },
    };
  } else {
    // Text message
    payload = {
      messaging_product: "whatsapp",
      to: formattedPhone,
      type: "text",
      text: { body: message },
    };
  }

  try {
    const response = await axios.post(url, payload, {
      headers: {
        Authorization: `Bearer ${config.apiToken}`,
        "Content-Type": "application/json",
      },
    });

    return { messageId: response.data?.messages?.[0]?.id || "sent" };
  } catch (error: any) {
    throw new Error(`WhatsApp sending failed: ${error.response?.data?.error?.message || error.message}`);
  }
};

export const getWhatsAppMessageStatus = async (messageId: string): Promise<{ status: string }> => {
  const config = getWhatsAppConfig();

  const response = await axios.get(
    `${config.baseUrl}/${config.phoneNumberId}/messages/${messageId}`,
    { headers: { Authorization: `Bearer ${config.apiToken}` } }
  );

  return { status: response.data?.status || "unknown" };
};
