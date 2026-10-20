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

export const notifyMunicipalOfficers = async ({ complaintId = null, title, message, type = 'OFFICER_ALERT' }) => {
  try {
    const officers = await prisma.user.findMany({
      where: { role: { in: ['MUNICIPAL_OFFICER', 'ADMIN'] } },
      select: { id: true },
    });

    for (const officer of officers) {
      await createNotification({
        userId: officer.id,
        complaintId,
        title,
        message,
        type,
      });
    }
  } catch (error) {
    console.error('[Notify Municipal Officers Error]:', error);
  }
};

export const notifyCollectorOffice = async ({ complaintId = null, title, message, type = 'COLLECTOR_ALERT' }) => {
  try {
    const collectorUsers = await prisma.user.findMany({
      where: { role: { in: ['COLLECTOR_OFFICE', 'ADMIN'] } },
      select: { id: true },
    });

    for (const u of collectorUsers) {
      await createNotification({
        userId: u.id,
        complaintId,
        title,
        message,
        type,
      });
    }
  } catch (error) {
    console.error('[Notify Collector Office Error]:', error);
  }
};
