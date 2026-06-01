const cron = require('node-cron');
const config = require('../config');
const { runLeakageDetection } = require('../services/leakage.service');
const logger = require('../utils/logger');

module.exports = function startLeakageJob() {
  cron.schedule(config.crons.leakageCheck, async () => {
    try { await runLeakageDetection(); }
    catch (e) { logger.error('Leakage job failed', e); }
  });
  logger.info(`Leakage cron: ${config.crons.leakageCheck}`);
};
