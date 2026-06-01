const { createLogger, format, transports } = require('winston');
const config = require('../config');

const logger = createLogger({
  level: config.env === 'production' ? 'info' : 'debug',
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.errors({ stack: true }),
    config.env === 'production'
      ? format.json()
      : format.combine(format.colorize(), format.printf(
          ({ timestamp, level, message, ...meta }) =>
            `${timestamp} [${level}] ${message}${Object.keys(meta).length ? ' ' + JSON.stringify(meta) : ''}`
        ))
  ),
  transports: [new transports.Console()],
});

module.exports = logger;
