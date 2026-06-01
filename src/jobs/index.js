const cron         = require('node-cron');
const Bull         = require('bull');
const { v4: uuid } = require('uuid');
const dayjs        = require('dayjs');
const prisma       = require('../config/database');
const notifService = require('../services/notifications');
const leakageSvc   = require('../services/leakage');
const logger       = require('../utils/logger');

// ─── Bull queues ──────────────────────────────────────────────────────────────
const reminderQueue = new Bull('vaccine-reminders', {
  redis: process.env.REDIS_URL || 'redis://localhost:6379',
  defaultJobOptions: { attempts: 3, backoff: { type: 'exponential', delay: 5000 } },
});

// ─── Queue processor: send the actual reminder ────────────────────────────────
reminderQueue.process(async (job) => {
  const { reminderJobId } = job.data;

  const reminder = await prisma.reminderJob.findUnique({
    where:   { id: reminderJobId },
    include: { vaccination: true, pet: true },
  });

  if (!reminder || reminder.bookingCreated) return; // already acted on

  const daysUntilDue = dayjs(reminder.dueDate).diff(dayjs(), 'day');
  const petName  = reminder.pet.name;
  const vaccine  = reminder.vaccination.vaccineName;

  let title, body;

  if (daysUntilDue === 7) {
    title = `⏰ ${petName}'s vaccine due in 7 days`;
    body  = `${petName}'s ${vaccine} vaccine is due ${dayjs(reminder.dueDate).format('MMM D')}. Book your vet now.`;
  } else if (daysUntilDue === 1) {
    title = `⚠️ ${petName}'s vaccine is tomorrow!`;
    body  = `Don't forget — ${petName}'s ${vaccine} is due tomorrow. Tap to book.`;
  } else {
    title = `🔴 ${petName}'s vaccine is overdue`;
    body  = `${petName}'s ${vaccine} was due ${dayjs(reminder.dueDate).format('MMM D')}. Please book a vet.`;
  }

  await notifService.send(reminder.ownerId, {
    type: 'VACCINE_REMINDER',
    title,
    body,
    data: {
      petId:          reminder.petId,
      vaccinationId:  reminder.vaccinationId,
      preferredVetId: reminder.preferredVetId || '',
    },
  });

  await prisma.reminderJob.update({
    where: { id: reminderJobId },
    data:  { sentAt: new Date() },
  });

  // Mark vaccination reminder sent
  await prisma.vaccination.update({
    where: { id: reminder.vaccinationId },
    data:  { reminderSent: true },
  });

  logger.info(`[Jobs] Vaccine reminder sent for pet ${reminder.petId}`);
});

// ─── Cron: schedule upcoming reminders daily at 7 AM ─────────────────────────
const scheduleVaccineReminders = async () => {
  const today     = dayjs().startOf('day');
  const in7days   = today.add(7, 'day').toDate();
  const in1day    = today.add(1, 'day').toDate();
  const yesterday = today.subtract(1, 'day').toDate();

  // Find vaccinations due in 7 days, 1 day, and overdue (yesterday)
  const targetDates = [
    { date: in7days,   daysOut: 7 },
    { date: in1day,    daysOut: 1 },
    { date: yesterday, daysOut: -1 },
  ];

  for (const { date } of targetDates) {
    const start = dayjs(date).startOf('day').toDate();
    const end   = dayjs(date).endOf('day').toDate();

    const vaccinations = await prisma.vaccination.findMany({
      where: {
        nextDue:      { gte: start, lte: end },
        reminderSent: false,
      },
      include: {
        pet: {
          include: {
            patientRelations: {
              where:   { isPrimaryVet: true },
              select:  { vetId: true },
              take:    1,
            },
          },
        },
      },
    });

    for (const vax of vaccinations) {
      const preferredVetId = vax.pet.patientRelations[0]?.vetId || null;

      const existing = await prisma.reminderJob.findFirst({
        where: { vaccinationId: vax.id, sentAt: null },
      });
      if (existing) continue; // already queued

      const job = await prisma.reminderJob.create({
        data: {
          id:             uuid(),
          vaccinationId:  vax.id,
          petId:          vax.petId,
          ownerId:        vax.pet.ownerId,
          preferredVetId,
          dueDate:        vax.nextDue,
          remindAt:       new Date(),
        },
      });

      await reminderQueue.add({ reminderJobId: job.id }, { delay: 0 });
    }
  }

  logger.info('[Jobs] Vaccine reminder scheduling complete');
};

// ─── Start all background jobs ────────────────────────────────────────────────
const startJobs = () => {
  // Vaccine reminders: every day at 7:00 AM
  cron.schedule('0 7 * * *', () => {
    logger.info('[Jobs] Running vaccine reminder scheduler...');
    scheduleVaccineReminders().catch(err =>
      logger.error(`[Jobs] Vaccine scheduler error: ${err.message}`)
    );
  });

  // Leakage detection: every night at 2:00 AM
  cron.schedule('0 2 * * *', () => {
    logger.info('[Jobs] Running leakage detection scan...');
    leakageSvc.runDetection().catch(err =>
      logger.error(`[Jobs] Leakage scan error: ${err.message}`)
    );
  });

  logger.info('[Jobs] Background jobs started (vaccine reminders @ 7AM, leakage scan @ 2AM)');
};

module.exports = { startJobs, reminderQueue };
