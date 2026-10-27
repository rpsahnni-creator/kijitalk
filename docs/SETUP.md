# KijiTalk Setup Guide

Complete local development setup for the KijiTalk English speaking app.

## Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | **20.x LTS** | Backend, Frontend, Mobile |
| npm | 9+ | Package manager |
| Python | 3.10+ | Speech service (Whisper + Edge TTS) |
| MongoDB Atlas | Free tier | Database |
| Firebase | Free Spark plan | Authentication |
| Google AI Studio | Free | Gemini API key |

---

## 1. Clone & Install (Node 20)

Project **Node.js 20 LTS** ke liye configured hai. Version check:

```bash
node --version   # v20.x.x hona chahiye
npm --version    # v10.x.x
```

### Windows (recommended — ek hi script)

```powershell
cd e:\kijitalk
powershell -ExecutionPolicy Bypass -File scripts\install-all.ps1
```

### Manual install

```bash
cd kijitalk

# Backend
cd backend && npm install && cd ..

# Frontend (Web)
cd frontend && npm install && cd ..

# Mobile
cd mobile && npm install && cd ..

# Speech Service (Python 3.10+)
cd speech-service
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate
pip install -r requirements.txt
cd ..
```

---

## 2. Environment Setup

### Backend (`backend/.env`)
```bash
cp backend/.env.example backend/.env
```
Fill in:
- `MONGODB_URI` — from [MongoDB Atlas](https://cloud.mongodb.com) (free M0 cluster)
- `GEMINI_API_KEY` — from [Google AI Studio](https://aistudio.google.com/apikey)
- Firebase Admin credentials — from Firebase Console → Project Settings → Service Accounts

### Frontend (`frontend/.env.local`)
```bash
cp frontend/.env.example frontend/.env.local
```
Fill in Firebase web config from Firebase Console → Project Settings → Your apps → Web.

### Mobile (`mobile/.env`)
```bash
cp mobile/.env.example mobile/.env
```
Same Firebase config with `EXPO_PUBLIC_` prefix.

---

## 3. Firebase Setup (Free)

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create project "kijitalk"
3. Enable **Authentication** → Email/Password + Google
4. Add Web app → copy config to frontend `.env.local`
5. Project Settings → Service Accounts → Generate private key → use in backend `.env`

---

## 4. MongoDB Atlas Setup (Free)

1. Create free M0 cluster at [cloud.mongodb.com](https://cloud.mongodb.com)
2. Database Access → Add user with password
3. Network Access → Allow access from anywhere (0.0.0.0/0) for dev
4. Connect → Copy connection string to `MONGODB_URI`

---

## 5. Gemini API (Free)

1. Visit [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
2. Create API key
3. Add to `backend/.env` as `GEMINI_API_KEY`

Free tier: 15 requests/minute, 1M tokens/day for gemini-2.0-flash.

---

## 6. Run All Services

### Windows — alag PowerShell windows

```powershell
# Terminal 1 — Backend (port 4000)
powershell -File e:\kijitalk\scripts\start-backend.ps1

# Terminal 2 — Frontend (port 3000)
powershell -File e:\kijitalk\scripts\start-frontend.ps1

# Terminal 3 — Speech (optional, port 5001)
powershell -File e:\kijitalk\scripts\start-speech.ps1

# Terminal 4 — Mobile (optional)
powershell -File e:\kijitalk\scripts\start-mobile.ps1
```

### Manual (kisi bhi OS)

Open 4 terminals:

```bash
# Terminal 1 — Speech Service (optional, for Whisper + Edge TTS)
cd speech-service
venv\Scripts\activate   # Windows
python main.py
# Runs on http://localhost:5001

# Terminal 2 — Backend API
cd backend
npm run dev
# Runs on http://localhost:4000

# Terminal 3 — Web Frontend
cd frontend
npm run dev
# Runs on http://localhost:3000

# Terminal 4 — Mobile (optional)
cd mobile
npx expo start
# Scan QR with Expo Go app
```

> **Note:** Web app uses browser Web Speech API for STT/TTS without the Python service. The speech service is optional but recommended for server-side transcription.

---

## 7. Verify Installation

1. Open http://localhost:3000
2. Create account / Sign in
3. Visit http://localhost:4000/health — should return `{ "status": "ok" }`
4. Try AI Chat, Voice Practice, Roleplay

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| MongoDB connection failed | Check IP whitelist and connection string |
| Firebase auth error | Verify all `NEXT_PUBLIC_FIREBASE_*` vars |
| Gemini 429 error | Free tier rate limit — wait 1 minute |
| CORS error | Add your URL to `CORS_ORIGIN` in backend `.env` |
| Expo can't reach API | Use your machine's local IP instead of localhost |
| Whisper slow first run | First transcription downloads model (~150MB) |

---

## Project Structure

```
kijitalk/
├── backend/          # Express API (port 4000)
├── frontend/         # Next.js 15 Web (port 3000)
├── mobile/           # Expo React Native
├── speech-service/   # Python Whisper + Edge TTS (port 5001)
├── docs/             # Documentation
└── design/           # Design system specs
```
