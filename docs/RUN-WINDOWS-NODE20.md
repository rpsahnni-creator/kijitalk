# KijiTalk Run Guide — Windows (Node 20 + Python)

Aapke system par **Node.js 20** aur **Python** installed hai — ye guide usi ke liye hai.

---

## Step 0: Version Check

**Naya PowerShell** kholo (Cursor ke andar ya bahar):

```powershell
node --version
npm --version
python --version
```

Expected:
```
v20.x.x
10.x.x
Python 3.10+ (ya 3.11, 3.12)
```

Agar `node` ya `npm` nahi milta → terminal **band karke dubara kholo** (PATH update ke baad).

---

## Step 1: Ek Baar Install (Sab Dependencies)

```powershell
cd e:\kijitalk
powershell -ExecutionPolicy Bypass -File scripts\install-all.ps1
```

Ye script automatically:
- Backend, Frontend, Mobile mein `npm install` karega
- Python venv + speech-service packages install karega
- `.env` files copy karega (agar nahi hain)

---

## Step 2: API Keys Bharein (.env files)

Install ke baad ye 2 files **zaroor** edit karo:

### `e:\kijitalk\backend\.env`
```env
MONGODB_URI=mongodb+srv://USER:PASS@cluster.mongodb.net/kijitalk
GEMINI_API_KEY=apna_gemini_key
FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### `e:\kijitalk\frontend\.env.local`
```env
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=....firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
NEXT_PUBLIC_API_URL=http://localhost:4000
```

**Free keys kahan se:**
- MongoDB: https://cloud.mongodb.com
- Firebase: https://console.firebase.google.com
- Gemini: https://aistudio.google.com/apikey

---

## Step 3: App Chalao

**2 alag PowerShell windows** kholo (minimum web ke liye):

### Window 1 — Backend
```powershell
powershell -ExecutionPolicy Bypass -File e:\kijitalk\scripts\start-backend.ps1
```
Wait karo jab tak dikhe: `KijiTalk API running on http://localhost:4000`

### Window 2 — Frontend (Web)
```powershell
powershell -ExecutionPolicy Bypass -File e:\kijitalk\scripts\start-frontend.ps1
```
Browser kholo: **http://localhost:3000**

---

## Optional: Speech + Mobile

### Window 3 — Python Speech (Whisper + Edge TTS)
```powershell
powershell -ExecutionPolicy Bypass -File e:\kijitalk\scripts\start-speech.ps1
```

### Window 4 — Mobile (Expo)
```powershell
powershell -ExecutionPolicy Bypass -File e:\kijitalk\scripts\start-mobile.ps1
```
Phone par **Expo Go** app se QR scan karo.

---

## Quick Test Checklist

| Check | URL / Action |
|-------|----------------|
| Backend OK? | http://localhost:4000/health |
| Web app? | http://localhost:3000 |
| Sign up | Account banao |
| AI Chat | Message bhejo |

---

## Agar Error Aaye

| Error | Fix |
|-------|-----|
| `node is not recognized` | Node 20 reinstall, terminal restart |
| `MONGODB_URI is required` | `backend\.env` file banao/bharo |
| `npm ERR! engine` | `node --version` → v20 hona chahiye |
| MongoDB connect fail | Atlas → Network Access → IP allow |
| Firebase error | `.env.local` saari keys check karo |
| Python / venv error | `cd speech-service` → `python -m venv venv` → dubara install script |

---

## Manual Commands (Script ke bina)

```powershell
# Install
cd e:\kijitalk\backend && npm install
cd e:\kijitalk\frontend && npm install
cd e:\kijitalk\mobile && npm install

# Env
copy e:\kijitalk\backend\.env.example e:\kijitalk\backend\.env
copy e:\kijitalk\frontend\.env.example e:\kijitalk\frontend\.env.local

# Run
cd e:\kijitalk\backend && npm run dev
cd e:\kijitalk\frontend && npm run dev

# Python speech
cd e:\kijitalk\speech-service
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

---

**Minimum run:** Backend + Frontend = 2 terminals. Browser → `localhost:3000`
