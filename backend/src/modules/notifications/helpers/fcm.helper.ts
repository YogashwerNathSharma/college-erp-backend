import admin from "firebase-admin";

// Initialize Firebase Admin SDK (should be done once at app startup)
let firebaseApp: admin.app.App;

const getFirebaseApp = (): admin.app.App => {
  if (firebaseApp) return firebaseApp;

  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (!serviceAccount) {
    throw new Error("Firebase service account key not configured");
  }

  try {
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(serviceAccount)),
    });
  } catch (err) {
    // App might already be initialized
    firebaseApp = admin.app();
  }

  return firebaseApp;
};

interface NotificationPayload {
  title: string;
  body: string;
  imageUrl?: string;
  data?: Record<string, string>;
}

/**
 * Send notification to a single device token
 */
export const sendFCMNotification = async (
  token: string,
  payload: NotificationPayload
): Promise<{ success: boolean; messageId?: string; error?: string }> => {
  try {
    const app = getFirebaseApp();
    const messaging = app.messaging();

    const message: admin.messaging.Message = {
      token,
      notification: {
        title: payload.title,
        body: payload.body,
        imageUrl: payload.imageUrl,
      },
      data: payload.data,
      android: {
        priority: "high",
        notification: {
          sound: "default",
          channelId: "school_erp_notifications",
        },
      },
      apns: {
        payload: {
          aps: {
            sound: "default",
            badge: 1,
          },
        },
      },
    };

    const response = await messaging.send(message);
    return { success: true, messageId: response };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

/**
 * Send notification to multiple device tokens (up to 500)
 */
export const sendFCMMulticast = async (
  tokens: string[],
  payload: NotificationPayload
): Promise<{ successCount: number; failureCount: number; errors: string[] }> => {
  try {
    const app = getFirebaseApp();
    const messaging = app.messaging();

    // FCM allows max 500 tokens per multicast
    const batchSize = 500;
    let successCount = 0;
    let failureCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < tokens.length; i += batchSize) {
      const batch = tokens.slice(i, i + batchSize);

      const message: admin.messaging.MulticastMessage = {
        tokens: batch,
        notification: {
          title: payload.title,
          body: payload.body,
          imageUrl: payload.imageUrl,
        },
        data: payload.data,
        android: {
          priority: "high",
          notification: {
            sound: "default",
            channelId: "school_erp_notifications",
          },
        },
        apns: {
          payload: {
            aps: {
              sound: "default",
              badge: 1,
            },
          },
        },
      };

      const response = await messaging.sendEachForMulticast(message);
      successCount += response.successCount;
      failureCount += response.failureCount;

      response.responses.forEach((resp, idx) => {
        if (!resp.success && resp.error) {
          errors.push(`Token ${batch[idx]}: ${resp.error.message}`);
        }
      });
    }

    return { successCount, failureCount, errors };
  } catch (error: any) {
    throw new Error(`FCM multicast failed: ${error.message}`);
  }
};

/**
 * Send notification to a topic
 */
export const sendFCMToTopic = async (
  topic: string,
  payload: NotificationPayload
): Promise<{ success: boolean; messageId?: string; error?: string }> => {
  try {
    const app = getFirebaseApp();
    const messaging = app.messaging();

    const message: admin.messaging.Message = {
      topic,
      notification: {
        title: payload.title,
        body: payload.body,
        imageUrl: payload.imageUrl,
      },
      data: payload.data,
    };

    const response = await messaging.send(message);
    return { success: true, messageId: response };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

/**
 * Subscribe tokens to a topic
 */
export const subscribeToTopic = async (tokens: string[], topic: string) => {
  const app = getFirebaseApp();
  const messaging = app.messaging();

  const response = await messaging.subscribeToTopic(tokens, topic);
  return { successCount: response.successCount, failureCount: response.failureCount };
};

/**
 * Unsubscribe tokens from a topic
 */
export const unsubscribeFromTopic = async (tokens: string[], topic: string) => {
  const app = getFirebaseApp();
  const messaging = app.messaging();

  const response = await messaging.unsubscribeFromTopic(tokens, topic);
  return { successCount: response.successCount, failureCount: response.failureCount };
};
