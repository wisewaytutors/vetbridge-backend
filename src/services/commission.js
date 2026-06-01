const prisma = require('../config/database');
const logger = require('../utils/logger');

const TIERS = [
  { min: 1000, tier: 'LEGEND',  rate: 0.06 },
  { min: 500,  tier: 'ELITE',   rate: 0.08 },
  { min: 100,  tier: 'PARTNER', rate: 0.10 },
  { min: 50,   tier: 'RISING',  rate: 0.12 },
  { min: 0,    tier: 'STARTER', rate: 0.15 },
];

/**
 * Get commission rate for a vet based on their completed bookings count.
 */
const getRate = async (vetId) => {
  const vet = await prisma.vetProfile.findUnique({
    where:  { id: vetId },
    select: { completedCount: true, commissionTier: true },
  });
  if (!vet) return 0.15;

  const found = TIERS.find(t => vet.completedCount >= t.min);
  return found ? found.rate : 0.15;
};

/**
 * Recalculate and persist tier after each completed booking.
 */
const recalculateTier = async (vetId) => {
  const vet = await prisma.vetProfile.findUnique({
    where:  { id: vetId },
    select: { completedCount: true, commissionTier: true },
  });
  if (!vet) return;

  const newTier = TIERS.find(t => vet.completedCount >= t.min)?.tier || 'STARTER';
  if (newTier !== vet.commissionTier) {
    await prisma.vetProfile.update({
      where: { id: vetId },
      data:  { commissionTier: newTier },
    });
    logger.info(`[Commission] Vet ${vetId} promoted to ${newTier} tier (${vet.completedCount} bookings)`);
  }
};

/**
 * Get full tier breakdown for display on vet dashboard.
 */
const getTierInfo = async (vetId) => {
  const vet = await prisma.vetProfile.findUnique({
    where:  { id: vetId },
    select: { completedCount: true, commissionTier: true },
  });

  const currentTier = TIERS.find(t => vet.completedCount >= t.min) || TIERS[TIERS.length - 1];
  const nextTier    = TIERS.find(t => t.min > vet.completedCount);

  return {
    currentTier:    currentTier.tier,
    currentRate:    currentTier.rate,
    completedCount: vet.completedCount,
    nextTier:       nextTier?.tier || null,
    nextTierAt:     nextTier?.min  || null,
    remaining:      nextTier ? nextTier.min - vet.completedCount : 0,
  };
};

module.exports = { getRate, recalculateTier, getTierInfo, TIERS };
