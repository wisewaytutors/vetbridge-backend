const prisma = require('../config/prisma');
const logger = require('../utils/logger');
const notificationService = require('./notification.service');

/**
 * Find all vaccinations due in the next 7 days and 1 day,
 * send reminders to owners, routing back to the same vet.
 */
async function sendVaccineReminders() {
  logger.info('Running vaccine reminder job...');

  const now     = new Date();
  const in7days = new Date(now.getTime() + 7  * 24 * 3600 * 1000);
  const in1day  = new Date(now.getTime() + 1  * 24 * 3600 * 1000);

  // 7-day reminders
  const due7 = await prisma.vaccination.findMany({
    where: {
      reminderSent: false,
      nextDue: { gte: now, lte: in7days },
    },
    include: {
      pet: { include: { owner: true } },
      record: true,
    },
  });

  for (const vax of due7) {
    const { pet } = vax;
    const preferredVetId = vax.record?.vetId;

    await notificationService.send(pet.owner.id, {
      type:  'reminder',
      title: `💉 ${pet.name}'s ${vax.vaccineName} due in 7 days`,
      body:  `Don't forget to book ${pet.name}'s vaccination. Book with your regular vet now.`,
      data:  { petId: pet.id, vaccinationId: vax.id, preferredVetId },
    });

    await prisma.reminderJob.upsert({
      where:  { vaccinationId_ownerId: { vaccinationId: vax.id, ownerId: pet.owner.id } },
      update: { sentAt: new Date() },
      create: {
        vaccinationId:  vax.id,
        ownerId:        pet.owner.id,
        preferredVetId: preferredVetId || null,
        dueDate:        vax.nextDue,
        remindAt:       now,
        sentAt:         new Date(),
      },
    }).catch(() => null);

    await prisma.vaccination.update({
      where: { id: vax.id },
      data:  { reminderSent: true },
    });

    logger.info(`Reminder sent: pet=${pet.id} vaccine=${vax.vaccineName}`);
  }

  logger.info(`Vaccine reminders sent: ${due7.length} owners notified`);
}

module.exports = { sendVaccineReminders };
