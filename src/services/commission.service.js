const prisma = require('../config/prisma');
const config = require('../config');

/**
 * Returns the commission rate for a vet based on completed bookings.
 * Tier:   0-49 → 15%  |  50-99 → 12%  |  100-499 → 10%
 *       500-999 →  8%  |  1000+ →  6%
 */
async function getCommissionRate(vetId) {
  const vet = await prisma.vetProfile.findUnique({
    where: { id: vetId },
    select: { completedBookings: true },
  });
  const count = vet?.completedBookings ?? 0;
  if (count >= 1000) return 0.06;
  if (count >= 500)  return 0.08;
  if (count >= 100)  return 0.10;
  if (count >= 50)   return 0.12;
  return config.platform.commissionRate; // 0.15 default
}

/**
 * Returns the current tier label for a vet.
 */
async function getCommissionTier(vetId) {
  const rate = await getCommissionRate(vetId);
  const tiers = {
    0.06: { label: '🏆 Legend',  pct: '6%'  },
    0.08: { label: '💎 Elite',   pct: '8%'  },
    0.10: { label: '🥇 Partner', pct: '10%' },
    0.12: { label: '🥈 Rising',  pct: '12%' },
    0.15: { label: '🥉 Starter', pct: '15%' },
  };
  return tiers[rate] ?? tiers[0.15];
}

/**
 * Calculate platform fee and net amount for a booking.
 */
async function calculateFees(vetId, grossAmount) {
  const rate       = await getCommissionRate(vetId);
  const platformFee = parseFloat((grossAmount * rate).toFixed(2));
  const netToVet    = parseFloat((grossAmount - platformFee).toFixed(2));
  return { platformFee, netToVet, commissionRate: rate };
}

module.exports = { getCommissionRate, getCommissionTier, calculateFees };
