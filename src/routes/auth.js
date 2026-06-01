const router  = require('express').Router();
const jwt     = require('jsonwebtoken');
const { v4: uuid } = require('uuid');
const { z }   = require('zod');
const prisma  = require('../config/database');
const redis   = require('../config/redis');
const logger  = require('../utils/logger');

// ─── Helpers ──────────────────────────────────────────────────────────────────
const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000));

const sendOtpSms = async (phone, code) => {
  // TODO: integrate AfricasTalking SMS
  // const AT = require('africastalking')({ apiKey: process.env.AT_API_KEY, username: process.env.AT_USERNAME });
  // await AT.SMS.send({ to: [phone], message: `Your PawCare code: ${code}`, from: process.env.AT_SENDER_ID });
  logger.info(`[OTP] ${phone} → ${code}`); // dev log
};

const signToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

const signRefresh = (userId) =>
  jwt.sign({ userId, type: 'refresh' }, process.env.JWT_SECRET, { expiresIn: '30d' });

// ─── POST /auth/send-otp ──────────────────────────────────────────────────────
router.post('/send-otp', async (req, res, next) => {
  try {
    const { phone } = z.object({ phone: z.string().min(10) }).parse(req.body);
    const code      = generateOtp();
    const key       = `otp:${phone}`;
    const expMin    = parseInt(process.env.OTP_EXPIRY_MINUTES || 5);

    await redis.set(key, code, 'EX', expMin * 60);
    await sendOtpSms(phone, code);

    res.json({ message: `OTP sent to ${phone}`, expiresIn: expMin * 60 });
  } catch (err) { next(err); }
});

// ─── POST /auth/verify-otp ────────────────────────────────────────────────────
router.post('/verify-otp', async (req, res, next) => {
  try {
    const schema = z.object({
      phone: z.string().min(10),
      code:  z.string().length(6),
      name:  z.string().optional(),
      role:  z.enum(['OWNER','VET','CLINIC']).optional(),
    });
    const { phone, code, name, role } = schema.parse(req.body);

    const key     = `otp:${phone}`;
    const stored  = await redis.get(key);

    if (!stored || stored !== code) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }
    await redis.del(key);

    // Upsert user
    let user = await prisma.user.findUnique({ where: { phone } });
    if (!user) {
      if (!name || !role) {
        return res.status(400).json({ error: 'name and role required for new accounts' });
      }
      user = await prisma.user.create({
        data: { id: uuid(), phone, name, role },
      });
    }

    const accessToken  = signToken(user.id);
    const refreshToken = signRefresh(user.id);

    res.json({
      accessToken,
      refreshToken,
      user: { id: user.id, phone: user.phone, name: user.name, role: user.role, language: user.language },
      isNewUser: !user,
    });
  } catch (err) { next(err); }
});

// ─── POST /auth/refresh ───────────────────────────────────────────────────────
router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: 'Refresh token required' });

    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    if (decoded.type !== 'refresh') return res.status(401).json({ error: 'Invalid token type' });

    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user || !user.isActive) return res.status(401).json({ error: 'Account not found' });

    res.json({ accessToken: signToken(user.id) });
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired refresh token' });
  }
});

module.exports = router;
