# KijiTalk

**AI-powered English speaking practice app** — speak confidently with chat, voice, roleplay, and daily lessons.

Cross-platform: **Web** (Next.js 15) + **Mobile** (Expo) + **API** (Express)

Built entirely on **free-tier services** — no payment required to start.

---

## Features

- 🔐 **Firebase Auth** — Email/password + Google sign-in
- 💬 **AI Chat** — Grammar correction powered by Google Gemini
- 🎤 **Voice Practice** — Web Speech API + Whisper pronunciation scoring
- 🎭 **Roleplay** — 6 real-world conversation scenarios
- 📚 **Daily Lessons** — Structured vocabulary, phrases, exercises
- 📊 **Progress Dashboard** — Charts, streaks, activity tracking
- 🌙 **Dark Mode** — Full light/dark theme support
- 📱 **Responsive** — Works on mobile, tablet, and desktop
- 🔌 **Offline Support** — Basic cached functionality via Zustand persist

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Web | Next.js 15, TypeScript, Tailwind CSS, Zustand |
| Mobile | Expo 52, React Native, NativeWind, Expo Router |
| Backend | Node.js, Express, TypeScript, MongoDB, Winston |
| AI | Google Gemini 2.0 Flash (free tier) |
| STT | Web Speech API + OpenAI Whisper (local) |
| TTS | Web Speech API + Microsoft Edge TTS (local) |
| Auth | Firebase Authentication |
| Database | MongoDB Atlas (free M0) |
| Hosting | Vercel (web) + Railway/Render (API) + Expo (mobile) |

---

## Project Structure

```
kijitalk/
├── backend/           # Express API server
│   ├── src/
│   │   ├── config/    # Env, DB, Firebase
│   │   ├── models/    # MongoDB schemas
│   │   ├── routes/    # API endpoints
│   │   ├── services/  # Gemini, Speech
│   │   └── middleware/
│   └── tests/
├── frontend/          # Next.js 15 web app
│   └── src/
│       ├── app/       # 12 screens (App Router)
│       ├── components/
│       ├── lib/       # API, Firebase, Speech
│       └── stores/    # Zustand
├── mobile/            # Expo React Native app
│   ├── app/           # Expo Router screens
│   └── src/
├── speech-service/    # Python Whisper + Edge TTS
├── docs/              # Setup, API, Deployment guides
├── design/            # Design tokens + Figma spec
└── .github/workflows/ # CI/CD
```

---

## Quick Start (Node 20 — Windows)

```powershell
# 1. Install sab kuch (Node 20 + Python)
cd e:\kijitalk
powershell -ExecutionPolicy Bypass -File scripts\install-all.ps1

# 2. backend\.env aur frontend\.env.local mein API keys bharein

# 3. Run — 2 alag terminals
powershell -File scripts\start-backend.ps1   # → localhost:4000
powershell -File scripts\start-frontend.ps1  # → localhost:3000
```

Detailed Hindi guide: [docs/RUN-WINDOWS-NODE20.md](docs/RUN-WINDOWS-NODE20.md)

### Manual install

```bash
# 1. Install dependencies
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
cd mobile && npm install && cd ..

# 2. Configure environment
cp backend/.env.example backend/.env        # Add MongoDB, Gemini, Firebase keys
cp frontend/.env.example frontend/.env.local # Add Firebase web config
cp mobile/.env.example mobile/.env          # Add Firebase + API URL

# 3. Start services
cd backend && npm run dev     # → http://localhost:4000
cd frontend && npm run dev    # → http://localhost:3000
cd mobile && npx expo start   # → Expo Go QR code
```

Full setup guide: [docs/SETUP.md](docs/SETUP.md)

---

## Documentation

| Doc | Description |
|-----|-------------|
| [Setup Guide](docs/SETUP.md) | Local development setup |
| [API Docs](docs/API.md) | Backend REST API reference |
| [Deployment](docs/DEPLOYMENT.md) | Vercel + Railway + Expo deploy |
| [Pro Upgrade](docs/PRO_UPGRADE.md) | Paid API integration path |
| [Figma Spec](design/FIGMA_SPEC.md) | Complete UI design blueprint |
| [Design Tokens](design/tokens.json) | Colors, typography, components |

---

## Screens (12)

1. Welcome / Splash
2. Onboarding (3 slides)
3. Login
4. Signup
5. Dashboard
6. AI Chat
7. Voice Practice
8. Roleplay Selection
9. Roleplay Conversation
10. Daily Lessons
11. Progress Dashboard
12. Settings

---

## Free Services Setup

| Service | Sign Up | Free Tier |
|---------|---------|-----------|
| [MongoDB Atlas](https://cloud.mongodb.com) | M0 cluster | 512MB storage |
| [Firebase](https://console.firebase.google.com) | Spark plan | 10K auth/month |
| [Google AI Studio](https://aistudio.google.com) | API key | 15 RPM, 1M tokens/day |
| [Vercel](https://vercel.com) | Hobby plan | Unlimited static |
| [Railway](https://railway.app) | Free credit | $5/month |
| [Expo](https://expo.dev) | Free account | Limited EAS builds |

---

## License

MIT — free to use, modify, and deploy.

---

Built with ❤️ for English learners worldwide.
