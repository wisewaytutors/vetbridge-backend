# PostgreSQL on Render (VetBridge)

You do **not** need a `.sql` file. Tables are created automatically by **Prisma** on startup (`prisma db push` in `docker-entrypoint.sh`).

---

## Option A — Blueprint (uses `render.yaml` in this repo)

1. Push `render.yaml` to GitHub (`main`).
2. Render Dashboard → **New +** → **Blueprint**.
3. Connect **wisewaytutors/vetbridge-backend**.
4. Render creates:
   - `vetbridge-postgres` (PostgreSQL)
   - `vetbridge-redis` (Redis)
   - `vetbridge-api` (Docker web) with `DATABASE_URL` already linked
5. Wait for all services to deploy.

---

## Option B — Manual (no Blueprint)

### 1. Create PostgreSQL

1. **New +** → **PostgreSQL**
2. Name: `vetbridge-postgres` (any unique name)
3. Database: `vetbridge_db`
4. User: `vetbridge_user`
5. Region: same as your web service (e.g. Oregon)
6. Plan: **Free**
7. **Create Database**

### 2. Link to your web service

1. Open the **PostgreSQL** service → copy **Internal Database URL**
2. Open your **web** service → **Environment**
3. Add:

   | Key | Value |
   |-----|--------|
   | `DATABASE_URL` | Internal Database URL from step 1 |

4. **Save Changes** (redeploys)

### 3. Optional env vars

| Key | Value |
|-----|--------|
| `JWT_SECRET` | random 32+ character string |
| `REDIS_URL` | Internal URL from a Render Redis service (if you use queues) |
| `NODE_ENV` | `production` |

---

## Verify

After deploy, logs should show:

```
Applying database schema...
Starting VetBridge API...
```

Health check: `https://YOUR-SERVICE.onrender.com/health`
