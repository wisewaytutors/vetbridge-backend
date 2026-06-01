const cron = require('node-cron');
const config = require('../config');
const { sendVaccineReminders } = require('../services/reminder.service');
const logger = require('../utils/logger');

module.exports = function startReminderJob() {
  cron.schedule(config.crons.reminders, async () => {
    try { await sendVaccineReminders(); }
    catch (e) { logger.error('Reminder job failed', e); }
  });
  logger.info(`Reminder cron: ${config.crons.reminders}`);
};
