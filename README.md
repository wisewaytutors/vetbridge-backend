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

This repo ships `railway.toml` so Railway builds with **Docker** (schema is embedded in the `Dockerfile`).

1. Push the repo to GitHub and connect it in Railway.
2. In the service **Settings → Build**, confirm **Builder** is `Dockerfile` (not Nixpacks-only unless you use `nixpacks.toml`).
3. Add **PostgreSQL** and **Redis** plugins; set `DATABASE_URL` and `REDIS_URL`.
4. Set other env vars from `.env.example` (`JWT_SECRET`, etc.).
5. Deploy. On first boot, `start.sh` runs `prisma db push` to create tables, then starts the API.

```bash
railway up   # optional, if using CLI
```

---

## Deploy to Render

Use the included **Blueprint** (`render.yaml`) or configure manually:

1. Push to GitHub.
2. **New → Blueprint** and select this repo (applies `render.yaml`), **or** New Web Service with:
   - **Runtime:** Docker
   - **Dockerfile path:** `./Dockerfile`
3. Attach PostgreSQL and Redis; link `DATABASE_URL` / `REDIS_URL`.
4. Set env vars from `.env.example`.
5. Deploy. The container runs `prisma db push` then `node src/server.js`.

**Important:** If the service was created earlier with **Node** runtime and build `npx prisma generate`, switch it to **Docker** or the Dockerfile fix will not run.

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
