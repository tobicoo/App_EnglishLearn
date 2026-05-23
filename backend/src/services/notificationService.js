const prisma = require("../lib/prisma");
const ApiError = require("../utils/apiError");

async function listNotifications(userId, { type } = {}) {
  const where = { userId };
  if (type && ["system", "exam"].includes(type)) where.type = type;

  const notifications = await prisma.notification.findMany({
    where,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: 50,
  });

  const unreadCount = await prisma.notification.count({ where: { userId, isRead: false } });

  return {
    notifications: notifications.map((n) => ({
      id: n.id,
      type: n.type,
      icon: n.icon,
      title: n.title,
      body: n.body,
      isRead: n.isRead,
      createdAt: n.createdAt,
    })),
    unreadCount,
  };
}

async function markRead(userId, notificationId) {
  const id = Number(notificationId);
  if (!Number.isInteger(id) || id < 1) {
    throw new ApiError(404, "NOTIFICATION_NOT_FOUND", "Notification not found");
  }

  try {
    const notification = await prisma.notification.update({
      where: { id, userId },
      data: { isRead: true },
    });
    return notification;
  } catch (error) {
    if (error.code === "P2025") throw new ApiError(404, "NOTIFICATION_NOT_FOUND", "Notification not found");
    throw error;
  }
}

async function markAllRead(userId) {
  const result = await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
  return { updated: result.count };
}

async function createNotification(userId, { type, icon, title, body }) {
  return prisma.notification.create({
    data: { userId, type: type || "system", icon: icon || "🔔", title, body },
  });
}

module.exports = { createNotification, listNotifications, markAllRead, markRead };
