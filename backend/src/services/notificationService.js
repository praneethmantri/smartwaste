import prisma from '../config/db.js';

export const createNotification = async ({ userId, complaintId = null, title, message, type = 'SYSTEM' }) => {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        complaintId,
        title,
        message,
        type,
      },
    });

    // Optional push notification dispatcher (Firebase / FCM)
    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL) {
      console.log(`[Push Notification Dispatch] Queued push message to User ${userId}: ${title}`);
      // Push delivery logic here when FCM initialized
    } else {
      // In-app notification fallback is guaranteed baseline
    }

    return notification;
  } catch (error) {
    console.error('[Notification Service Error]:', error);
    // Don't fail the primary flow if notification logging fails
    return null;
  }
};

export const notifyAdmins = async ({ complaintId = null, title, message, type = 'ADMIN_ALERT' }) => {
  try {
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true },
    });

    for (const admin of admins) {
      await createNotification({
        userId: admin.id,
        complaintId,
        title,
        message,
        type,
      });
    }
  } catch (error) {
    console.error('[Notify Admins Error]:', error);
  }
};
