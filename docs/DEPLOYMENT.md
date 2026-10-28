# KijiTalk Deployment Guide

Deploy all three platforms using free-tier services.

---

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  Vercel     │────▶│  Railway /   │────▶│  Postgres   │
│  (Web App)  │     │  Render      │     │  (Neon /    │
│  Next.js 15 │     │  (Backend)   │     │  Supabase)  │
└─────────────┘     └──────────────┘     └─────────────┘
                           │
                    ┌──────┴───────┐
                    │ Speech Svc   │
                    │ (Railway)    │
                    └──────────────┘

┌─────────────┐
│  Expo EAS   │
│  (Mobile)   │
└─────────────┘
```

Auth is self-hosted (JWT signed with `JWT_SECRET`, passwords hashed with bcrypt) —
no Firebase. Google Sign-In is optional and verified against `GOOGLE_CLIENT_ID`.

---

## 1. Provision Postgres (Neon / Supabase / Railway — Free)

1. Create a free Postgres instance on [neon.tech](https://neon.tech), [supabase.com](https://supabase.com), or a Railway Postgres plugin.
2. Copy the connection string into `DATABASE_URL` (include `?schema=public`, and `?sslmode=require` if the provider requires TLS).
3. Run migrations against it once before first deploy:
   ```bash
   cd backend
   DATABASE_URL="postgresql://..." npm run db:deploy
   ```
4. Optionally seed lessons (the backend also does this automatically on boot — see `src/index.ts`):
   ```bash
   DATABASE_URL="postgresql://..." npm run db:seed
   ```

---

## 2. Deploy Backend (Railway — Free $5/month credit)

### Option A: Railway

1. Push code to GitHub
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Set root directory: `backend`
4. Add environment variables from `backend/.env.example`
5. Railway auto-detects Node.js, runs `npm install && npm run build`, then `npm start`
6. Note your URL: `https://kijitalk-api.up.railway.app`

### Option B: Render

1. [render.com](https://render.com) → New Web Service
2. Connect GitHub repo, root: `backend`
3. Build: `npm install && npm run build`
4. Start: `npm start`
5. Add all env vars

### Backend env for production:
```
NODE_ENV=production
PORT=4001
CORS_ORIGIN=https://your-app.vercel.app

# Postgres (from step 1)
DATABASE_URL=postgresql://USER:PASS@host:5432/kijitalk?schema=public

# AI
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-1.5-pro
ANTHROPIC_API_KEY=            # optional — powers the Premium tutor tier if set
CLAUDE_MODEL=claude-sonnet-5-5

# Self-hosted auth — generate a fresh secret for production, do not reuse the dev one
JWT_SECRET=<node -e "console.log(require('crypto').randomBytes(48).toString('hex'))">

GOOGLE_CLIENT_ID=             # optional — enables the Google Sign-In button
SPEECH_SERVICE_URL=https://your-speech.railway.app   # optional
LOG_LEVEL=info
```

> ⚠️ `JWT_SECRET` must be a new random value in production, not the one committed to your local `backend/.env`. Rotating it invalidates all existing login sessions.

---

## 3. Deploy Web Frontend (Vercel — Free)

1. Push to GitHub
2. Go to [vercel.com](https://vercel.com) → Import Project
3. Set root directory: `frontend`
4. Framework: Next.js (auto-detected)
5. Add environment variables:

```
NEXT_PUBLIC_API_URL=https://kijitalk-api.up.railway.app
NEXT_PUBLIC_GOOGLE_CLIENT_ID=   # optional — must match backend's GOOGLE_CLIENT_ID
```

6. Deploy → get URL like `https://kijitalk.vercel.app`

### Update backend CORS:
Set `CORS_ORIGIN=https://kijitalk.vercel.app` in backend env.

> Note: the repo's root `vercel.json` only builds/routes the `frontend` workspace — it does not deploy the Express backend. Deploy the backend separately (Railway/Render, step 2).

---

## 4. Deploy Speech Service (Railway — Optional)

1. New Railway service, root: `speech-service`
2. Use Python buildpack
3. Start command: `python main.py`
4. Env: `WHISPER_MODEL=base`, `SPEECH_PORT=5001`
5. Note URL and set `SPEECH_SERVICE_URL` in backend

> First deploy takes longer — Whisper downloads model on startup. Voice pronunciation scoring degrades gracefully but won't work fully without this running.

---

## 5. Deploy Mobile (Expo — Free)

### Development (Expo Go)
```bash
cd mobile
npx expo start
```
Update `EXPO_PUBLIC_API_URL` (`mobile/.env`) to your production backend URL.

### Production (EAS Build — Free tier)

```bash
npm install -g eas-cli
eas login
cd mobile
eas build:configure
```

Edit `eas.json`:
```json
{
  "build": {
    "preview": {
      "distribution": "internal"
    },
    "production": {
      "autoIncrement": true
    }
  }
}
```

Build:
```bash
# Android APK (free)
eas build --platform android --profile preview

# iOS (requires Apple Developer account for App Store)
eas build --platform ios --profile production
```

Submit to stores:
```bash
eas submit --platform android
eas submit --platform ios
```

### Expo env for production:
Set in EAS secrets or `app.json` extra:
```
EXPO_PUBLIC_API_URL=https://kijitalk-api.up.railway.app
```

---

## 6. Custom Domain (Optional)

### Vercel
Project Settings → Domains → Add `kijitalk.com`

### Railway
Service Settings → Networking → Custom Domain

---

## Known Gaps Before a Real Launch

- **No payment gateway wired up.** `backend/src/routes/subscription.routes.ts` only exposes a `dev-set-tier`
  endpoint, and it's disabled whenever `NODE_ENV=production`. Selling the Premium tier for real needs a
  provider (Razorpay/Stripe/etc.) integrated before launch.
- **Speech service is optional and unhosted by default** — decide whether voice pronunciation scoring is
  in scope for launch before skipping step 4.

---

## Deployment Checklist

- [ ] Postgres provisioned and `npm run db:deploy` applied
- [ ] Backend deployed and `/health` returns OK
- [ ] Backend logs show `✅ PostgreSQL connected`
- [ ] Fresh `JWT_SECRET` set in production (not the dev value)
- [ ] Frontend env vars set with production API URL
- [ ] CORS_ORIGIN includes Vercel domain
- [ ] Gemini API key active
- [ ] Speech service running (optional)
- [ ] Mobile app points to production API
- [ ] Payment gateway wired up, if selling Premium
- [ ] Test signup, login, chat, voice, roleplay, debate end-to-end

---

## Estimated Monthly Cost (Free Stack)

| Service | Cost |
|---------|------|
| Vercel | $0 |
| Railway | $0 (within $5 credit) |
| Neon/Supabase Postgres | $0 (free tier) |
| Gemini API | $0 (free tier) |
| Expo EAS | $0 (limited builds) |
| **Total** | **$0/month** |
