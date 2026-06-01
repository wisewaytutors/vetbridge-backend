const prisma  = require('../config/prisma');
const logger  = require('../utils/logger');
const notificationService = require('./notification.service');

const LEAKAGE_THRESHOLD     = 0.30; // 30% suspicious cancellation rate
const MIN_SUSPICIOUS_COUNT  = 3;    // at least 3 suspicious bookings
const CHAT_MSGS_THRESHOLD   = 8;    // long conversation = potential contact exchange
const CANCEL_HOURS_WINDOW   = 3;    // cancelled within 3h of booking creation

/**
 * Run the leakage detection algorithm for all active vets.
 * Called by the nightly cron job.
 */
async function runLeakageDetection() {
  logger.info('Running leakage detection...');

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const bookings = await prisma.booking.findMany({
    where:   { createdAt: { gte: thirtyDaysAgo } },
    include: { _count: { select: { chatMessages: true } } },
  });

  // Group by vet
  const vetMap = {};
  for (const b of bookings) {
    if (!vetMap[b.vetId]) vetMap[b.vetId] = { total: 0, suspicious: 0 };
    vetMap[b.vetId].total++;

    const cancelledEarly =
      b.status === 'CANCELLED' &&
      b.cancelledAt &&
      (b.cancelledAt - b.createdAt) / 3600000 <= CANCEL_HOURS_WINDOW;

    const hadLongChat = b._count.chatMessages >= CHAT_MSGS_THRESHOLD;

    if (cancelledEarly && hadLongChat) vetMap[b.vetId].suspicious++;
  }

  for (const [vetId, stats] of Object.entries(vetMap)) {
    if (stats.suspicious < MIN_SUSPICIOUS_COUNT) continue;
    const score = stats.suspicious / stats.total;
    if (score < LEAKAGE_THRESHOLD) continue;

    await flagVet(vetId, score, stats.suspicious, stats.total);
  }

  logger.info('Leakage detection complete');
}

async function flagVet(vetId, score, suspiciousCount, totalBookings) {
  const pct = Math.round(score * 100);

  const flag = await prisma.leakageFlag.upsert({
    where:  { vetId_flaggedAt: undefined },  // creates new flag each run
    update: {},
    create: { vetId, leakageScore: score, suspiciousCount, totalBookings, status: 'flagged' },
  }).catch(() => prisma.leakageFlag.create({
    data: { vetId, leakageScore: score, suspiciousCount, totalBookings, status: 'flagged' },
  }));

  const vet = await prisma.vetProfile.findUnique({
    where:   { id: vetId },
    include: { user: true },
  });

  if (pct >= 70) {
    // Suspend
    await prisma.vetProfile.update({ where: { id: vetId }, data: { isOnline: false } });
    await notificationService.send(vet.userId, {
      type:  'leakage',
      title: '⚠️ Account suspended',
      body:  'Your account has been suspended due to unusual cancellation patterns. Contact support.',
      data:  { flagId: flag.id },
    });
    logger.warn(`Vet ${vetId} suspended — leakage score ${pct}%`);
  } else if (pct >= 50) {
    await notificationService.send(vet.userId, {
      type:  'leakage',
      title: '🔶 Warning — unusual cancellations',
      body:  'We\'ve noticed a pattern of cancellations after long chats. Ensure all business stays on VetBridge.',
      data:  { flagId: flag.id },
    });
  } else {
    await notificationService.send(vet.userId, {
      type:  'leakage',
      title: 'ℹ️ Platform reminder',
      body:  'Please ensure all bookings and payments are completed through VetBridge.',
      data:  { flagId: flag.id },
    });
  }
}

module.exports = { runLeakageDetection };
