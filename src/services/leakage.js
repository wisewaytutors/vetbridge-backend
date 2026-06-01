const { v4: uuid }  = require('uuid');
const prisma         = require('../config/database');
const notifService   = require('./notifications');
const logger         = require('../utils/logger');

const THRESHOLD      = parseFloat(process.env.LEAKAGE_CHECK_THRESHOLD || 0.30);
const MIN_SUSPICIOUS = parseInt(process.env.LEAKAGE_MIN_SUSPICIOUS || 3);
const CHAT_MSG_MIN   = 8;   // min messages in chat before cancel to flag
const CANCEL_HOURS   = 3;   // cancelled within N hours of booking creation

/**
 * Run leakage detection for all vets.
 * Called nightly via cron job.
 */
const runDetection = async () => {
  logger.info('[Leakage] Starting nightly leakage detection scan...');

  // Get all vets with bookings in last 30 days
  const vets = await prisma.vetProfile.findMany({
    where: { isVerified: true },
    select: { id: true, userId: true },
  });

  let flaggedCount = 0;

  for (const vet of vets) {
    const score = await scoreVet(vet.id);
    if (score && score.suspiciousCount >= MIN_SUSPICIOUS && score.leakageScore >= THRESHOLD) {
      await flagVet(vet, score);
      flaggedCount++;
    }
  }

  logger.info(`[Leakage] Scan complete. ${flaggedCount} vets flagged.`);
};

/**
 * Calculate leakage score for a single vet.
 */
const scoreVet = async (vetId) => {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const bookings = await prisma.booking.findMany({
    where: { vetId, createdAt: { gte: thirtyDaysAgo } },
    include: { chatMessages: { select: { id: true } } },
  });

  if (bookings.length < 5) return null; // not enough data

  const suspicious = bookings.filter(b => {
    if (b.status !== 'CANCELLED') return false;
    if (!b.cancelledAt) return false;

    const hoursSinceCreate = (b.cancelledAt - b.createdAt) / 3_600_000;
    const chatCount = b.chatMessages.length;

    // Flag: cancelled within CANCEL_HOURS AND had long conversation
    return hoursSinceCreate <= CANCEL_HOURS && chatCount >= CHAT_MSG_MIN;
  });

  const leakageScore = suspicious.length / bookings.length;

  return {
    suspiciousCount: suspicious.length,
    totalBookings:   bookings.length,
    leakageScore:    parseFloat((leakageScore * 100).toFixed(1)),
  };
};

/**
 * Create or update a leakage flag for a vet and escalate accordingly.
 */
const flagVet = async (vet, score) => {
  const existing = await prisma.leakageFlag.findFirst({
    where:   { vetId: vet.id, status: { in: ['WARNING'] } },
    orderBy: { flaggedAt: 'desc' },
  });

  const warningsSent = (existing?.warningsSent || 0) + 1;
  let newStatus = 'WARNING';

  if (warningsSent >= 3 || score.leakageScore >= 70) {
    newStatus = 'SUSPENDED';
    // Suspend vet profile
    await prisma.vetProfile.update({
      where: { id: vet.id },
      data:  { isOnline: false },
    });
    logger.warn(`[Leakage] SUSPENDED vet ${vet.id} — score: ${score.leakageScore}%`);
  }

  if (existing) {
    await prisma.leakageFlag.update({
      where: { id: existing.id },
      data:  { leakageScore: score.leakageScore, suspiciousCount: score.suspiciousCount, warningsSent, status: newStatus },
    });
  } else {
    await prisma.leakageFlag.create({
      data: {
        id:              uuid(),
        vetId:           vet.id,
        leakageScore:    score.leakageScore,
        suspiciousCount: score.suspiciousCount,
        totalBookings:   score.totalBookings,
        status:          newStatus,
        warningsSent:    1,
      },
    });
  }

  // Notify vet
  const messages = {
    WARNING:   `⚠️ We noticed an unusual cancellation pattern on your account (${score.leakageScore}% suspicious rate). Please ensure all bookings are completed on-platform.`,
    SUSPENDED: `🔴 Your PawCare account has been temporarily suspended due to repeated off-platform activity. Contact support to resolve.`,
  };

  await notifService.send(vet.userId, {
    type:  `LEAKAGE_${newStatus}`,
    title: newStatus === 'SUSPENDED' ? 'Account suspended' : 'Account warning',
    body:  messages[newStatus],
    data:  { leakageScore: score.leakageScore },
  });
};

module.exports = { runDetection, scoreVet };
