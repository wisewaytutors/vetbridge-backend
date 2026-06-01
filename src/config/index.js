require('dotenv').config();

module.exports = {
  env:      process.env.NODE_ENV || 'development',
  port:     parseInt(process.env.PORT) || 3000,
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:19006',

  jwt: {
    secret:         process.env.JWT_SECRET || 'vetbridge-dev-secret',
    expiresIn:      process.env.JWT_EXPIRES_IN || '7d',
    refreshExpires: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },

  otp: {
    expiresMinutes: parseInt(process.env.OTP_EXPIRES_MINUTES) || 10,
  },

  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },

  platform: {
    name:       process.env.PLATFORM_NAME || 'VetBridge',
    email:      process.env.PLATFORM_EMAIL || 'support@vetbridge.et',
    domain:     process.env.PLATFORM_DOMAIN || 'vetbridge.et',
    commissionRate:     parseFloat(process.env.DEFAULT_COMMISSION_RATE) || 0.15,
    escrowReleaseHours: parseInt(process.env.ESCROW_RELEASE_DELAY_HOURS) || 1,
  },

  sms: {
    apiKey:   process.env.AT_API_KEY,
    username: process.env.AT_USERNAME || 'sandbox',
    senderId: process.env.AT_SENDER_ID || 'VetBridge',
  },

  telebirr: {
    appId:     process.env.TELEBIRR_APP_ID,
    appKey:    process.env.TELEBIRR_APP_KEY,
    publicKey: process.env.TELEBIRR_PUBLIC_KEY,
    baseUrl:   process.env.TELEBIRR_BASE_URL,
    notifyUrl: process.env.TELEBIRR_NOTIFY_URL,
  },

  cbe: {
    apiKey:     process.env.CBE_API_KEY,
    merchantId: process.env.CBE_MERCHANT_ID,
    baseUrl:    process.env.CBE_BASE_URL,
    callbackUrl: process.env.CBE_CALLBACK_URL,
  },

  r2: {
    accountId:  process.env.R2_ACCOUNT_ID,
    accessKey:  process.env.R2_ACCESS_KEY_ID,
    secretKey:  process.env.R2_SECRET_ACCESS_KEY,
    bucket:     process.env.R2_BUCKET_NAME || 'vetbridge-uploads',
    publicUrl:  process.env.R2_PUBLIC_URL || 'https://files.vetbridge.et',
  },

  firebase: {
    projectId:   process.env.FIREBASE_PROJECT_ID,
    privateKey:  process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  },

  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY,
  },

  google: {
    mapsKey: process.env.GOOGLE_MAPS_API_KEY,
  },

  crons: {
    leakageCheck: process.env.LEAKAGE_CHECK_CRON || '0 2 * * *',
    reminders:    process.env.REMINDER_CRON || '0 8 * * *',
  },
};
