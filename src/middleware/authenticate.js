const { verify } = require('../utils/jwt');
const { err }    = require('../utils/response');
const prisma     = require('../config/prisma');

module.exports = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer '))
      return err(res, 'No token provided', 401);

    const token   = header.split(' ')[1];
    const payload = verify(token);

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, phone: true, name: true, role: true, language: true, isActive: true },
    });

    if (!user || !user.isActive)
      return err(res, 'User not found or deactivated', 401);

    req.user = user;
    next();
  } catch {
    return err(res, 'Invalid or expired token', 401);
  }
};
