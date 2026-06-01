const router  = require('express').Router();
const bcrypt  = require('bcryptjs');
const Joi     = require('joi');
const prisma  = require('../config/prisma');
const { sign } = require('../utils/jwt');
const { ok, err } = require('../utils/response');
const validate = require('../middleware/validate');
const config  = require('../config');
const logger  = require('../utils/logger');

const registerSchema = Joi.object({
  phone: Joi.string().pattern(/^\+?[0-9]{10,15}$/).required(),
  name:  Joi.string().min(2).max(100).required(),
  role:  Joi.string().valid('OWNER','VET','CLINIC_ADMIN').required(),
});

const otpSchema = Joi.object({
  phone: Joi.string().required(),
  code:  Joi.string().length(6).required(),
});

// Generate a random 6-digit OTP
function generateOtp() { return Math.floor(100000 + Math.random() * 900000).toString(); }

// POST /auth/register — create user + send OTP
router.post('/register', validate(registerSchema), async (req, res, next) => {
  try {
    const { phone, name, role } = req.body;

    const existing = await prisma.user.findUnique({ where: { phone } });
    if (existing) return err(res, 'Phone already registered', 409);

    const user = await prisma.user.create({ data: { phone, name, role } });

    const otp     = generateOtp();
    const hashed  = await bcrypt.hash(otp, 10);
    const expires = new Date(Date.now() + config.otp.expiresMinutes * 60 * 1000);

    await prisma.otpCode.create({ data: { userId: user.id, phone, code: hashed, expiresAt: expires } });

    // In production: send via AfricasTalking SMS
    // await smsService.send(phone, `Your VetBridge OTP: ${otp}`)
    if (config.env !== 'production') logger.info(`DEV OTP for ${phone}: ${otp}`);

    return ok(res, { userId: user.id }, 'OTP sent to ' + phone, 201);
  } catch (e) { next(e); }
});

// POST /auth/request-otp — existing user login
router.post('/request-otp', async (req, res, next) => {
  try {
    const { phone } = req.body;
    const user = await prisma.user.findUnique({ where: { phone } });
    if (!user) return err(res, 'Phone not registered. Please sign up.', 404);

    const otp     = generateOtp();
    const hashed  = await bcrypt.hash(otp, 10);
    const expires = new Date(Date.now() + config.otp.expiresMinutes * 60 * 1000);

    await prisma.otpCode.create({ data: { userId: user.id, phone, code: hashed, expiresAt: expires } });

    if (config.env !== 'production') logger.info(`DEV OTP for ${phone}: ${otp}`);

    return ok(res, {}, 'OTP sent');
  } catch (e) { next(e); }
});

// POST /auth/verify-otp — verify OTP → return JWT
router.post('/verify-otp', validate(otpSchema), async (req, res, next) => {
  try {
    const { phone, code } = req.body;

    const otpRecord = await prisma.otpCode.findFirst({
      where: { phone, usedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) return err(res, 'OTP expired or not found', 400);

    const valid = await bcrypt.compare(code, otpRecord.code);
    if (!valid) return err(res, 'Invalid OTP', 400);

    await prisma.otpCode.update({ where: { id: otpRecord.id }, data: { usedAt: new Date() } });

    const user = await prisma.user.findUnique({
      where:   { id: otpRecord.userId },
      include: { vetProfile: { select: { id: true, isVerified: true } },
                 clinicProfile: { select: { id: true } } },
    });

    const token = sign({ userId: user.id, role: user.role });

    return ok(res, { token, user: { id: user.id, name: user.name, role: user.role,
      language: user.language, vetProfile: user.vetProfile, clinicProfile: user.clinicProfile } }, 'Login successful');
  } catch (e) { next(e); }
});

module.exports = router;
