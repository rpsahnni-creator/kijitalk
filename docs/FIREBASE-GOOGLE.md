# Google Sign-In Setup (Firebase) — KijiTalk

Google login ke liye **Firebase Console** mein 5 steps follow karo.

---

## Step 1 — Firebase Project

1. https://console.firebase.google.com
2. **Add project** → name: `kijitalk` → Create

---

## Step 2 — Google Sign-In ENABLE karo ⭐

1. Left menu → **Build** → **Authentication**
2. **Get started**
3. Tab: **Sign-in method**
4. **Google** row par click karo
5. **Enable** toggle ON karo
6. **Project support email** select karo (apna Gmail)
7. **Save**

---

## Step 3 — Web App config

1. Gear icon → **Project settings**
2. Scroll → **Your apps** → **Web** `</>` icon
3. Nickname: `kijitalk-web` → **Register app**
4. Config copy karo → paste in `E:\kijitalk\frontend\.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=kijitalk-xxxxx.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=kijitalk-xxxxx
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=kijitalk-xxxxx.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef

NEXT_PUBLIC_API_URL=http://localhost:4001
```

5. **Email/Password** bhi enable karo (Sign-in method → Email → Enable)

---

## Step 4 — localhost Allow karo ⭐

1. **Authentication** → **Settings** tab
2. **Authorized domains** section
3. Check karo ye listed hon:
   - `localhost` ✅ (default hota hai)
   - `127.0.0.1` (optional add karo)

Agar `localhost` nahi hai → **Add domain** → `localhost`

---

## Step 5 — Frontend restart

```cmd
cd E:\kijitalk\frontend
npm run dev
```

Browser: http://localhost:3100/login → **Continue with Google**

---

## Optional — Backend Firebase Admin (production)

Login ke baad profile sync ke liye (dev mode mein bina iske bhi chalega):

1. Project settings → **Service accounts**
2. **Generate new private key** → JSON download
3. `E:\kijitalk\backend\.env` mein uncomment karke bharein:

```env
FIREBASE_PROJECT_ID=kijitalk-xxxxx
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@...
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

Backend restart karo.

---

## Common Errors

| Error | Fix |
|-------|-----|
| `auth/operation-not-allowed` | Google enable nahi → Step 2 |
| `auth/unauthorized-domain` | localhost add karo → Step 4 |
| `auth/invalid-api-key` | `.env.local` sahi keys → Step 3 |
| `auth/popup-blocked` | Browser popup allow karo |
| Firebase configure nahi | `.env.local` placeholder hai → Step 3 |

---

## Test

1. http://localhost:3100/login
2. **Continue with Google** click
3. Google account choose karo
4. Dashboard par redirect hona chahiye
