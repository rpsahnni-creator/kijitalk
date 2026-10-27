# KijiTalk API Documentation

Base URL: `http://localhost:4000` (dev) | `https://your-api.railway.app` (prod)

All authenticated endpoints require header: `Authorization: Bearer <firebase_id_token>`

---

## Health

### `GET /health`
Returns API status.

**Response:**
```json
{ "status": "ok", "service": "kijitalk-api", "timestamp": "2026-05-22T..." }
```

---

## Auth

### `POST /api/auth/sync`
Sync Firebase user to MongoDB. Call after login/signup.

**Body:**
```json
{ "displayName": "Alex", "nativeLanguage": "hi", "targetLevel": "beginner" }
```

### `GET /api/auth/me`
Get current user profile.

### `PATCH /api/auth/me`
Update profile fields.

---

## Chat

### `GET /api/chat/sessions`
List user's chat sessions (max 20).

### `POST /api/chat/sessions`
Create new chat session.

**Body:** `{ "title": "...", "type": "free" }`

### `POST /api/chat/message`
Send message and get AI reply with grammar corrections.

**Body:**
```json
{ "sessionId": "optional", "message": "I go to store yesterday" }
```

**Response:**
```json
{
  "reply": "Oh, you went to the store yesterday? ...",
  "corrections": ["I go → I went"],
  "session": { "_id": "..." }
}
```

---

## Roleplay

### `GET /api/roleplay`
List all 6 roleplay scenarios.

### `GET /api/roleplay/:id`
Get scenario details.

### `POST /api/roleplay/:id/start`
Start roleplay session with opening line.

### `POST /api/roleplay/:id/message`
Send message in roleplay context.

**Body:** `{ "sessionId": "...", "message": "..." }`

---

## Lessons

### `GET /api/lessons`
List all active lessons.

### `GET /api/lessons/daily`
Get today's lesson based on user level and day of year.

### `GET /api/lessons/:id`
Get lesson details with vocabulary, phrases, exercises.

### `POST /api/lessons/:id/complete`
Mark lesson complete and update streak.

**Body:** `{ "score": 85, "minutesSpent": 10 }`

---

## Progress

### `GET /api/progress/dashboard`
Get 30-day stats, daily chart data, activity breakdown.

### `POST /api/progress/record`
Record custom activity.

**Body:**
```json
{
  "minutesSpent": 5,
  "score": 90,
  "activityType": "voice",
  "pronunciationScore": 88
}
```

---

## Voice / Speech

### `POST /api/voice/transcribe`
Transcribe audio via local Whisper service.

**Body:** `{ "audio": "<base64>" }`

### `POST /api/voice/synthesize`
Generate speech via Edge TTS.

**Body:** `{ "text": "Hello", "voice": "en-US-JennyNeural" }`

### `POST /api/voice/pronunciation`
Score pronunciation against expected text.

**Body:**
```json
{
  "expected": "The weather is beautiful today.",
  "spoken": "The weather is beautiful today",
  "audio": "<optional base64>"
}
```

**Response:**
```json
{
  "score": 92,
  "feedback": "Great pronunciation!",
  "wordScores": [{ "word": "weather", "score": 95 }],
  "transcribed": "..."
}
```

---

## Settings

### `GET /api/settings`
Get user settings.

### `PATCH /api/settings`
Update settings.

**Body:**
```json
{ "darkMode": true, "notifications": true, "dailyGoalMinutes": 20 }
```

---

## AI Integration (Gemini)

- Model: `gemini-2.0-flash` (free tier)
- Used for: chat replies, grammar correction, pronunciation analysis
- Rate limit: 15 RPM on free tier — backend has 200 req/15min rate limit

## Error Codes

| Code | Meaning |
|------|---------|
| 400 | Bad request / missing fields |
| 401 | Invalid or missing auth token |
| 404 | Resource not found |
| 429 | Rate limit exceeded |
| 500 | Server error |
| 503 | Auth or AI service unavailable |
