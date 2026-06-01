const router    = require('express').Router();
const Anthropic = require('@anthropic-ai/sdk');
const { z }     = require('zod');
const { v4: uuid } = require('uuid');
const prisma    = require('../config/database');
const { auth }  = require('../middleware/auth');
const logger    = require('../utils/logger');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ─── Knowledge base (RAG chunks) ─────────────────────────────────────────────
const KB = [
  { id:'vomit',   kw:['vomit','vomiting','sick','throwing','nausea','puke','hanqaaqaa','እያስለቀቀ'],
    title:'Vomiting in pets',
    body:'Keep the pet calm. Remove food 1–2 hrs but allow small sips of water. NEVER give human anti-nausea medication. Seek urgent help if: vomiting more than 3 times, blood in vomit, bloated abdomen, or lethargy.' },
  { id:'lethargy', kw:['lethargic','lethargy','tired','weak','dull','not moving','slow','dadhabaa','ደካማ'],
    title:'Lethargy & weakness',
    body:'Place pet in quiet area with fresh water. Feel ears/paws for unusual coldness. Do not force activity. Urgent if: pet cannot stand, pale/blue gums, or lethargy lasting over 24 hours.' },
  { id:'noteat',  kw:['not eating',"won't eat",'no appetite','refusing food','nyaachaa','አይበላም'],
    title:'Loss of appetite',
    body:'Offer fresh water and small amount of usual food. Do not force-feed. Concerning if: not eating >24h (cats) or >48h (dogs), combined with vomiting, diarrhea, or signs of pain.' },
  { id:'limp',    kw:['limp','limping','lame','leg','paw','hurt','not walking','miila','እየጠመዘዘ'],
    title:'Limping & lameness',
    body:'Restrict movement and keep pet calm. Check paw for cuts, thorns, or swelling gently. NEVER give ibuprofen, aspirin, or paracetamol — toxic to pets. Apply clean cloth if bleeding. Urgent: unable to bear weight, deformed limb, significant swelling.' },
  { id:'breath',  kw:['breathing','breath','panting','gasping','choking','coughing','fast breath','sigaataa','እየተነፈሰ'],
    title:'Breathing difficulties',
    body:'EMERGENCY. Keep pet calm, do not restrain tightly. Provide fresh air, keep cool. Do NOT place anything in the mouth. Emergency: blue/grey gums, open-mouth breathing in cats, neck extended, loss of consciousness.' },
  { id:'wound',   kw:['wound','bleeding','cut','scratch','bite','blood','injury','madaa','ቁስለት'],
    title:'Wounds & bleeding',
    body:'Apply gentle pressure with clean cloth. Do NOT use hydrogen peroxide or alcohol. Do not remove embedded objects. Cover with clean bandage. Urgent: bleeding does not stop in 5 minutes, deep wound, animal bite, near eye or neck.' },
  { id:'poison',  kw:['poison','toxic','swallowed','ingested','ate','chocolate','plant','chemical','rat','xylitol','zenya','መርዝ'],
    title:'Suspected poisoning',
    body:'EMERGENCY. Note what was ingested and when. Do NOT induce vomiting unless vet instructs. Common toxins: chocolate, grapes/raisins, xylitol, onions, human medications, cleaning products, rat poison. Always requires immediate vet attention.' },
  { id:'seizure', kw:['seizure','convulsion','shaking','tremor','fitting','collapse','unconscious','miira','ቁርጥምጥም'],
    title:'Seizures',
    body:'EMERGENCY. Do NOT put hands near the mouth. Clear area of sharp objects. Time the seizure. Keep on flat surface, stay calm. After seizure: keep warm and quiet. Never offer food/water immediately. Always requires immediate vet.' },
  { id:'cat',     kw:['cat','kitten','feline','meow','adurree','ድመት'],
    title:'Cat-specific care',
    body:'Cats hide pain well. Warning: hiding, not grooming, vocalising when touched, litter changes, open-mouth breathing (always emergency in cats), jaundice. Paracetamol/acetaminophen is FATAL to cats — even one tablet.' },
  { id:'young',   kw:['puppy','kitten','young','baby','newborn','weeks old'],
    title:'Young animal emergencies',
    body:'Any illness in animals under 8 weeks requires IMMEDIATE vet. Keep warm — hypothermia is serious risk. Signs: constant crying, not nursing, cold to touch, pale gums, labored breathing.' },
];

const retrieve = (query) => {
  const q = query.toLowerCase();
  return KB
    .map(chunk => ({ chunk, hits: chunk.kw.filter(k => q.includes(k)).length }))
    .filter(x => x.hits > 0)
    .sort((a,b) => b.hits - a.hits)
    .slice(0,2)
    .map(x => x.chunk);
};

const SYSTEM_PROMPT = (lang, ragCtx) => `
You are PawCare Assistant — a compassionate AI triage companion on a mobile veterinary platform.
A professional vet is already booked or on the way.

RULES:
- Calm and reassure the owner. They may be anxious.
- Ask gentle questions about species, age, symptoms, duration, severity.
- Provide ONLY basic comfort care (keep calm, water access, warm/cool).
- NEVER recommend, name, or suggest any medication, drug, or dosage.
- NEVER diagnose. Acknowledge symptoms only.
- Keep responses 2–4 short sentences. Do not overwhelm.
- Respond in the SAME LANGUAGE as the user. Amharic → Amharic, Oromoo → Oromoo.
- Language setting: ${lang}

USE [ESCALATE] token (alone on its own line) when: seizures, collapse, breathing difficulty,
suspected poisoning, uncontrolled bleeding, animal under 8 weeks, any medication question,
symptoms over 24 hours, or high distress. Write a warm explanation BEFORE [ESCALATE].

VERIFIED KNOWLEDGE BASE (cite from this):
${ragCtx || 'Use general safe first-aid principles.'}
`;

// ─── POST /ai/chat ────────────────────────────────────────────────────────────
router.post('/chat', auth, async (req, res, next) => {
  try {
    const schema = z.object({
      message:   z.string().min(1).max(1000),
      bookingId: z.string().uuid().optional(),
      sessionId: z.string().uuid().optional(),
    });
    const { message, bookingId, sessionId } = schema.parse(req.body);

    // Load or create AI session
    let session = sessionId
      ? await prisma.aiSession.findUnique({ where: { id: sessionId } })
      : null;

    if (!session) {
      session = await prisma.aiSession.create({
        data: {
          id:        uuid(),
          userId:    req.user.id,
          bookingId: bookingId || null,
          messages:  [],
          language:  req.user.language || 'en',
        },
      });
    }

    // RAG retrieval
    const sources  = retrieve(message);
    const ragCtx   = sources.map(s => `[${s.title}]: ${s.body}`).join('\n\n');

    // Build message history for Claude
    const history = (session.messages || []).map(m => ({
      role: m.role, content: m.content,
    }));
    history.push({ role: 'user', content: message });

    // Call Claude
    const response = await client.messages.create({
      model:      'claude-sonnet-4-20250514',
      max_tokens: 500,
      system:     SYSTEM_PROMPT(session.language, ragCtx),
      messages:   history,
    });

    const reply     = response.content[0]?.text || 'I had trouble responding. Please contact a vet directly.';
    const escalated = reply.includes('[ESCALATE]');

    // Append to session messages
    const updatedMessages = [
      ...(session.messages || []),
      { role: 'user',      content: message, ts: new Date().toISOString(), sources: sources.map(s=>s.id) },
      { role: 'assistant', content: reply,   ts: new Date().toISOString(), sources: sources.map(s=>s.id) },
    ];

    await prisma.aiSession.update({
      where: { id: session.id },
      data:  {
        messages:   updatedMessages,
        escalated:  escalated || session.escalated,
        ragSources: [...new Set([...session.ragSources, ...sources.map(s=>s.id)])],
      },
    });

    res.json({
      sessionId:  session.id,
      reply:      reply.replace('[ESCALATE]','').trim(),
      escalated,
      sources:    sources.map(s => ({ id: s.id, title: s.title })),
    });
  } catch (err) { next(err); }
});

// ─── GET /ai/session/:bookingId — vet reads triage log ────────────────────────
router.get('/session/:bookingId', auth, async (req, res, next) => {
  try {
    const session = await prisma.aiSession.findUnique({
      where: { bookingId: req.params.bookingId },
    });
    if (!session) return res.status(404).json({ error: 'No AI session for this booking' });
    res.json(session);
  } catch (err) { next(err); }
});

module.exports = router;
