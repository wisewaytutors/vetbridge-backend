const { v4: uuid } = require('uuid');
const prisma  = require('../config/database');
const logger  = require('../utils/logger');

// Lazy-init Firebase Admin
let firebaseAdmin = null;
const getFirebase = () => {
  if (!firebaseAdmin && process.env.FIREBASE_PROJECT_ID) {
    firebaseAdmin = require('firebase-admin');
    if (!firebaseAdmin.apps.length) {
      firebaseAdmin.initializeApp({
        credential: firebaseAdmin.credential.cert({
          projectId:   process.env.FIREBASE_PROJECT_ID,
          privateKey:  process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        }),
      });
    }
  }
  return firebaseAdmin;
};

/**
 * Send notification to a user.
 * Saves to DB (in-app) and pushes via FCM if token available.
 */
const send = async (userId, { type, title, body, data = {} }) => {
  try {
    // Save in-app notification
    await prisma.notification.create({
      data: { id: uuid(), userId, type, title, body, data },
    });

    // Push via Firebase FCM
    const user = await prisma.user.findUnique({
      where:  { id: userId },
      select: { fcmToken: true },
    });

    if (user?.fcmToken) {
      const fb = getFirebase();
      if (fb) {
        await fb.messaging().send({
          token:        user.fcmToken,
          notification: { title, body },
          data:         Object.fromEntries(Object.entries(data).map(([k,v]) => [k, String(v)])),
          android:      { priority: 'high' },
          apns:         { payload: { aps: { sound: 'default', badge: 1 } } },
        }).catch(err => logger.warn(`[FCM] Push failed for user ${userId}: ${err.message}`));
      }
    }
  } catch (err) {
    logger.error(`[Notifications] Failed to send to ${userId}: ${err.message}`);
  }
};

/**
 * Send to multiple users at once.
 */
const sendBulk = async (userIds, payload) => {
  await Promise.allSettled(userIds.map(id => send(id, payload)));
};

module.exports = { send, sendBulk };
