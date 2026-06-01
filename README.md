# 🐾 VetBridge Backend API
> Ethiopia's mobile veterinary platform — connecting pet owners, vet professionals & clinics.

## Stack
- **Runtime**: Node.js 20 + Express
- **Database**: PostgreSQL + Prisma ORM
- **Cache / Queues**: Redis + Bull
- **Real-time**: Socket.io (live GPS tracking)
- **Auth**: Phone OTP + JWT
- **Payments**: Telebirr + CBE Birr (escrow)
- **AI**: Anthropic Claude (triage assistant)
- **Storage**: Cloudflare R2
- **Push**: Firebase FCM

---

## Quick start (local)

```bash
# 1. Clone & install
git clone https://github.com/your-org/vetbridge-backend
cd vetbridge-backend
npm install

# 2. Configure env
cp .env.example .env
# Edit .env with your credentials

# 3. Start PostgreSQL + Redis (Docker)
docker-compose up postgres redis -d

# 4. Run migrations
npx prisma migrate dev --name init

# 5. Seed sample data
npm run seed

# 6. Start dev server
npm run dev
# API: http://localhost:3000
# Health: http://localhost:3000/health
```

---

## Deploy to Railway (recommended)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Create project
railway init

# Add PostgreSQL
railway add postgresql

# Add Redis
railway add redis

# Set env variables (from .env)
railway variables set JWT_SECRET=... ANTHROPIC_API_KEY=... (etc)

# Deploy
railway up

# Run migrations on Railway
railway run npx prisma migrate deploy
```

---

## Deploy to Render

1. Push to GitHub
2. Go to https://render.com → New Web Service
3. Connect repo → Runtime: Node → Build: `npm install && npx prisma generate` → Start: `npm start`
4. Add PostgreSQL and Redis services
5. Set all env vars from `.env.example`
6. Deploy → Run `npx prisma migrate deploy` in Shell

---

## API Reference

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/register` | Register + send OTP |
| POST | `/api/auth/request-otp` | Request OTP (login) |
| POST | `/api/auth/verify-otp` | Verify OTP → JWT |
| GET | `/api/vets` | Browse vet marketplace |
| GET | `/api/vets/:id` | Vet profile |
| PUT | `/api/vets/me/online` | Toggle online status |
| GET | `/api/vets/me/earnings` | Vet earnings |
| GET | `/api/pets` | My pets |
| POST | `/api/pets` | Add pet |
| GET | `/api/pets/:id/passport` | Health passport |
| POST | `/api/bookings` | Create booking |
| GET | `/api/bookings` | My bookings |
| PUT | `/api/bookings/:id/accept` | Accept booking |
| PUT | `/api/bookings/:id/cancel` | Cancel booking |
| POST | `/api/records` | Submit visit notes |
| POST | `/api/reviews` | Submit verified review |
| GET | `/api/marketplace` | Browse listings |
| POST | `/api/marketplace` | Create listing |
| POST | `/api/marketplace/:id/offer` | Make an offer |
| POST | `/api/payments/payout` | Vet withdrawal |
| POST | `/api/sos` | Emergency SOS |
| POST | `/api/ai/chat` | AI triage chat |
| GET | `/api/notifications` | My notifications |

## WebSocket Events (tracking)

Connect to `ws://host/tracking` with `auth: { token: JWT }`.

| Emit | Payload | Description |
|------|---------|-------------|
| `join_room` | `{ bookingId }` | Join tracking room |
| `update_location` | `{ lat, lng, etaMinutes }` | Vet pushes GPS |
| `mark_arrived` | — | Vet marks arrived |
| `complete_visit` | — | End visit + release escrow |

| Listen | Payload | Description |
|--------|---------|-------------|
| `location_update` | `{ lat, lng, etaMinutes }` | Live vet position |
| `status_update` | `{ status }` | Booking status changed |
| `tracking_ended` | `{ bookingId }` | Visit complete |
