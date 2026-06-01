const router = require('express').Router();
const prisma = require('../config/prisma');
const auth   = require('../middleware/authenticate');
const { ok } = require('../utils/response');
const axios  = require('axios');
const config = require('../config');

router.use(auth);

const SYSTEM = `You are VetBridge Assistant — a compassionate AI triage companion.
Rules: Never recommend medication. Never diagnose. Keep responses under 4 sentences.
Calm the owner. If serious (seizure/poisoning/collapse/breathing issues): output [ESCALATE].
Respond in the user's language (English/Amharic/Oromo).`;

// POST /ai/chat
router.post('/chat', async (req, res, next) => {
  try {
    const { message, sessionId, language } = req.body;

    let session = sessionId
      ? await prisma.aiSession.findUnique({ where: { id: sessionId } })
      : null;

    if (!session) {
      session = await prisma.aiSession.create({
        data: { userId: req.user.id, messages: [], language: language || 'EN' },
      });
    }

    const history = Array.isArray(session.messages) ? session.messages : [];
    history.push({ role: 'user', content: message });

    const response = await axios.post('https://api.anthropic.com/v1/messages', {
      model:      'claude-sonnet-4-20250514',
      max_tokens: 500,
      system:     SYSTEM,
      messages:   history,
    }, {
      headers: { 'x-api-key': config.anthropic.apiKey, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
    });

    const reply = response.data.content[0]?.text || 'I am here to help. Please describe what is happening.';
    history.push({ role: 'assistant', content: reply });

    await prisma.aiSession.update({ where: { id: session.id }, data: { messages: history, escalated: reply.includes('[ESCALATE]') } });

    return ok(res, { reply, sessionId: session.id, escalated: reply.includes('[ESCALATE]') });
  } catch (e) { next(e); }
});

module.exports = router;
