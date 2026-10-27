# KijiTalk Deployment Guide

Deploy all three platforms using free-tier services.

---

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  Vercel     │────▶│  Railway /   │────▶│  MongoDB    │
│  (Web App)  │     │  Render      │     │  Atlas      │
│  Next.js 15 │     │  (Backend)   │     │  (Free M0)  │
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

---

## 1. Deploy Backend (Railway — Free $5/month credit)

### Option A: Railway

1. Push code to GitHub
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Set root directory: `backend`
4. Add environment variables from `backend/.env.example`
5. Railway auto-detects Node.js and runs `npm start`
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
PORT=4000
CORS_ORIGIN=https://your-app.vercel.app
MONGODB_URI=mongodb+srv://...
GEMINI_API_KEY=...
FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY="..."
SPEECH_SERVICE_URL=https://your-speech.railway.app
```

---

## 2. Deploy Web Frontend (Vercel — Free)

1. Push to GitHub
2. Go to [vercel.com](https://vercel.com) → Import Project
3. Set root directory: `frontend`
4. Framework: Next.js (auto-detected)
5. Add environment variables:

```
NEXT_PUBLIC_API_URL=https://kijitalk-api.up.railway.app
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

6. Deploy → get URL like `https://kijitalk.vercel.app`

### Update Firebase authorized domains:
Firebase Console → Authentication → Settings → Authorized domains → Add your Vercel domain.

### Update backend CORS:
Set `CORS_ORIGIN=https://kijitalk.vercel.app` in backend env.

---

## 3. Deploy Speech Service (Railway — Optional)

1. New Railway service, root: `speech-service`
2. Use Python buildpack
3. Start command: `python main.py`
4. Env: `WHISPER_MODEL=base`, `SPEECH_PORT=5001`
5. Note URL and set `SPEECH_SERVICE_URL` in backend

> First deploy takes longer — Whisper downloads model on startup.

---

## 4. Deploy Mobile (Expo — Free)

### Development (Expo Go)
```bash
cd mobile
npx expo start
```
Update `EXPO_PUBLIC_API_URL` to your production backend URL.

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
EXPO_PUBLIC_FIREBASE_*=...
```

---

## 5. MongoDB Atlas Production

1. Use same free M0 cluster (512MB — sufficient for MVP)
2. Network Access → add Railway/Render IP ranges
3. Enable backup (paid) only when needed

---

## 6. Custom Domain (Optional)

### Vercel
Project Settings → Domains → Add `kijitalk.com`

### Railway
Service Settings → Networking → Custom Domain

---

## Deployment Checklist

- [ ] Backend deployed and `/health` returns OK
- [ ] MongoDB connected (check Railway logs)
- [ ] Firebase authorized domains updated
- [ ] Frontend env vars set with production API URL
- [ ] CORS_ORIGIN includes Vercel domain
- [ ] Gemini API key active
- [ ] Speech service running (optional)
- [ ] Mobile app points to production API
- [ ] Test login, chat, voice, roleplay end-to-end

---

## Estimated Monthly Cost (Free Stack)

| Service | Cost |
|---------|------|
| Vercel | $0 |
| Railway | $0 (within $5 credit) |
| MongoDB Atlas M0 | $0 |
| Firebase Spark | $0 |
| Gemini API | $0 (free tier) |
| Expo EAS | $0 (limited builds) |
| **Total** | **$0/month** |
