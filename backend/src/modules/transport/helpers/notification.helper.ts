
// ============================================
// TRANSPORT NOTIFICATION HELPER
// ============================================
// Handles sending notifications related to transport tracking.
// Integrates with SMS/Push notification service.
// Replace the sendNotification implementation with your actual provider.

interface NotificationPayload {
  to: string;
  title: string;
  body: string;
  type: "SMS" | "PUSH" | "BOTH";
  data?: Record<string, any>;
}

/**
 * Internal notification dispatch.
 * Replace with actual SMS gateway / push notification service.
 */
async function sendNotification(payload: NotificationPayload): Promise<boolean> {
  try {
    // TODO: Integrate with actual notification service (e.g., Twilio, Firebase, AWS SNS)
    console.log(`[Transport Notification] Sending ${payload.type} to ${payload.to}:`, payload.title);
    console.log(`  Body: ${payload.body}`);

    // Simulate sending — replace with actual API call
    // Example with Twilio:
    // await twilioClient.messages.create({ to: payload.to, body: payload.body, from: TWILIO_NUMBER });

    return true;
  } catch (error) {
    console.error("[Transport Notification] Failed to send:", error);
    return false;
  }
}

/**
 * Notify parent when their child is picked up.
 * @param parentPhone - Parent's phone number
 * @param studentName - Student's name
 * @param vehicleName - Vehicle number/name
 */
export async function sendPickupNotification(
  parentPhone: string,
  studentName: string,
  vehicleName: string
): Promise<boolean> {
  return sendNotification({
    to: parentPhone,
    title: "Student Picked Up",
    body: `${studentName} has been picked up by vehicle ${vehicleName}. They are on their way to school.`,
    type: "BOTH",
    data: { event: "PICKUP", studentName, vehicleName },
  });
}

/**
 * Notify parent when their child is dropped off.
 * @param parentPhone - Parent's phone number
 * @param studentName - Student's name
 */
export async function sendDropNotification(
  parentPhone: string,
  studentName: string
): Promise<boolean> {
  return sendNotification({
    to: parentPhone,
    title: "Student Dropped Off",
    body: `${studentName} has been safely dropped off at the designated stop.`,
    type: "BOTH",
    data: { event: "DROP", studentName },
  });
}

/**
 * Notify parent with estimated time of arrival.
 * @param parentPhone - Parent's phone number
 * @param studentName - Student's name
 * @param eta - ETA in seconds
 */
export async function sendETANotification(
  parentPhone: string,
  studentName: string,
  eta: number
): Promise<boolean> {
  const etaMinutes = Math.ceil(eta / 60);
  const etaText = etaMinutes <= 1 ? "less than a minute" : `approximately ${etaMinutes} minutes`;

  return sendNotification({
    to: parentPhone,
    title: "Bus Arriving Soon",
    body: `The bus carrying ${studentName} will arrive in ${etaText}.`,
    type: "BOTH",
    data: { event: "ETA", studentName, etaSeconds: eta, etaMinutes },
  });
}

/**
 * Send SOS alert to admin when an emergency is triggered.
 * @param adminPhone - Admin's phone number
 * @param vehicleName - Vehicle number/name
 * @param location - Formatted location string
 */
export async function sendSOSAlert(
  adminPhone: string,
  vehicleName: string,
  location: string
): Promise<boolean> {
  return sendNotification({
    to: adminPhone,
    title: "🚨 SOS ALERT - Transport Emergency",
    body: `EMERGENCY: Vehicle ${vehicleName} has triggered an SOS alert at ${location}. Immediate action required.`,
    type: "BOTH",
    data: { event: "SOS", vehicleName, location, priority: "CRITICAL" },
  });
}

/**
 * Send speed violation alert to admin.
 * @param adminPhone - Admin's phone number
 * @param vehicleName - Vehicle number/name
 * @param speed - Current speed in km/h
 * @param limit - Speed limit in km/h
 */
export async function sendSpeedAlert(
  adminPhone: string,
  vehicleName: string,
  speed: number,
  limit: number
): Promise<boolean> {
  return sendNotification({
    to: adminPhone,
    title: "⚠️ Speed Violation Alert",
    body: `Vehicle ${vehicleName} is travelling at ${speed} km/h, exceeding the limit of ${limit} km/h.`,
    type: "BOTH",
    data: { event: "SPEED_VIOLATION", vehicleName, speed, limit, excess: speed - limit },
  });
}

/**
 * Send route deviation alert to admin.
 * @param adminPhone - Admin's phone number
 * @param vehicleName - Vehicle number/name
 * @param deviationKm - Deviation distance in km
 */
export async function sendRouteDeviationAlert(
  adminPhone: string,
  vehicleName: string,
  deviationKm: number
): Promise<boolean> {
  return sendNotification({
    to: adminPhone,
    title: "⚠️ Route Deviation Alert",
    body: `Vehicle ${vehicleName} has deviated from its route by ${deviationKm.toFixed(2)} km.`,
    type: "BOTH",
    data: { event: "ROUTE_DEVIATION", vehicleName, deviationKm },
  });
}

/**
 * Send geofence breach alert.
 * @param adminPhone - Admin's phone number
 * @param vehicleName - Vehicle number/name
 * @param geofenceName - Name of the geofence
 * @param action - "ENTERED" or "EXITED"
 */
export async function sendGeofenceAlert(
  adminPhone: string,
  vehicleName: string,
  geofenceName: string,
  action: "ENTERED" | "EXITED"
): Promise<boolean> {
  const actionText = action === "ENTERED" ? "entered" : "exited";
  return sendNotification({
    to: adminPhone,
    title: "Geofence Alert",
    body: `Vehicle ${vehicleName} has ${actionText} the geofence: ${geofenceName}.`,
    type: "BOTH",
    data: { event: "GEOFENCE", vehicleName, geofenceName, action },
  });
}

export default {
  sendPickupNotification,
  sendDropNotification,
  sendETANotification,
  sendSOSAlert,
  sendSpeedAlert,
  sendRouteDeviationAlert,
  sendGeofenceAlert,
};
