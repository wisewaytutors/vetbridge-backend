const prisma = require('../config/prisma');
const logger = require('../utils/logger');

/**
 * Save notification to DB and send push via Firebase FCM.
 */
async function send(userId, { type, title, body, data = {} }) {
  // Save to DB
  await prisma.notification.create({ data: { userId, type, title, body, data } });

  // Firebase FCM push (stub — wire up firebase-admin in production)
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { fcmToken: true } });
  if (user?.fcmToken) {
    logger.info(`FCM push → ${userId}: ${title}`);
    // TODO: await admin.messaging().send({ token: user.fcmToken, notification: { title, body }, data })
  }
}

/**
 * Send push to multiple users.
 */
async function broadcast(userIds, payload) {
  await Promise.allSettled(userIds.map((id) => send(id, payload)));
}

module.exports = { send, broadcast };
