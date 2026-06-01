const logger = require('../utils/logger');

module.exports = (error, req, res, _next) => {
  logger.error(error.message, { stack: error.stack, path: req.path });

  if (error.name === 'PrismaClientKnownRequestError') {
    if (error.code === 'P2002')
      return res.status(409).json({ success: false, message: 'Record already exists' });
    if (error.code === 'P2025')
      return res.status(404).json({ success: false, message: 'Record not found' });
  }

  if (error.name === 'ValidationError')
    return res.status(400).json({ success: false, message: error.message });

  return res.status(error.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message,
  });
};
