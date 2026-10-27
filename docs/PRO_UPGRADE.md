# KijiTalk Pro Upgrade Path

Guide for upgrading from the free stack to paid/production-grade services.

---

## Current Free Stack vs Pro Alternatives

| Feature | Free (Current) | Pro Upgrade | Why Upgrade |
|---------|---------------|-------------|-------------|
| AI Chat | Gemini 2.0 Flash (free) | OpenAI GPT-4o / Claude 3.5 | Better conversation quality |
| STT | Web Speech API + Whisper local | Deepgram / AssemblyAI | Higher accuracy, real-time streaming |
| TTS | Web Speech API + Edge TTS | ElevenLabs / Azure Neural TTS | Natural voices, emotion |
| Auth | Firebase Spark | Firebase Blaze + custom claims | Advanced roles, SSO |
| Database | MongoDB Atlas M0 | MongoDB M10+ | Performance, backups |
| Hosting | Vercel Hobby + Railway | Vercel Pro + AWS/GCP | SLA, scaling |
| Mobile | Expo Go / EAS Free | EAS Production | Unlimited builds, OTA updates |

---

## 1. Upgrade AI: OpenAI GPT-4o

### Install
```bash
cd backend
npm install openai
```

### Create `backend/src/services/openai.service.ts`
```typescript
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function chatWithGPT(message: string, history: Array<{role: string; content: string}>) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: 'You are KijiTalk English tutor...' },
      ...history,
      { role: 'user', content: message },
    ],
    response_format: { type: 'json_object' },
  });
  return JSON.parse(response.choices[0].message.content ?? '{}');
}
```

### Env
```
OPENAI_API_KEY=sk-...
AI_PROVIDER=openai  # or 'gemini'
```

### Cost: ~$2.50/1M input tokens, $10/1M output tokens

---

## 2. Upgrade STT: Deepgram

```bash
npm install @deepgram/sdk
```

```typescript
import { createClient } from '@deepgram/sdk';

const deepgram = createClient(process.env.DEEPGRAM_API_KEY);

export async function transcribeStream(audioBuffer: Buffer) {
  const { result } = await deepgram.listen.prerecorded.transcribeFile(audioBuffer, {
    model: 'nova-2',
    language: 'en',
    smart_format: true,
  });
  return result.results.channels[0].alternatives[0].transcript;
}
```

### Cost: $0.0043/minute (Nova-2)

---

## 3. Upgrade TTS: ElevenLabs

```bash
npm install elevenlabs
```

Natural, expressive voices with SSML support. Best for roleplay scenarios.

### Cost: Free 10K chars/month, then $5/month for 30K chars

---

## 4. Upgrade Pronunciation: Azure Speech

Azure Pronunciation Assessment provides phoneme-level scoring:

```typescript
// Uses Azure Cognitive Services Speech SDK
// Returns accuracy, fluency, completeness, prosody scores
```

### Cost: Free 5 audio hours/month, then $1/audio hour

---

## 5. Upgrade Database: MongoDB M10

- 2GB RAM, dedicated cluster
- Automated backups
- Performance insights
- Cost: ~$57/month

---

## 6. Upgrade Auth: Firebase Blaze + Custom Claims

```typescript
// Admin SDK — set premium user
await admin.auth().setCustomUserClaims(uid, { plan: 'pro', features: ['unlimited_chat'] });

// Middleware check
if (req.user?.plan !== 'pro' && dailyMessages > 20) {
  return res.status(403).json({ error: 'Upgrade to Pro for unlimited chat' });
}
```

---

## 7. Add Stripe Payments

```bash
npm install stripe
```

### Pro plan features to gate:
- Unlimited AI messages (free: 20/day)
- Advanced pronunciation analysis
- All roleplay scenarios (free: 3)
- Offline lesson downloads
- Priority AI model (GPT-4o)

### Stripe products:
- **Pro Monthly**: $9.99/month
- **Pro Yearly**: $79.99/year

---

## 8. Recommended Upgrade Order

1. **Stripe + Pro gating** — monetize first
2. **OpenAI GPT-4o** — biggest quality improvement
3. **Deepgram STT** — better voice experience
4. **ElevenLabs TTS** — natural AI voices in roleplay
5. **Azure Pronunciation** — professional scoring
6. **MongoDB M10** — when you hit 500+ users
7. **Vercel Pro + AWS** — when you need SLA

---

## Environment Toggle Pattern

Add to `backend/src/config/env.ts`:
```typescript
AI_PROVIDER: z.enum(['gemini', 'openai', 'anthropic']).default('gemini'),
STT_PROVIDER: z.enum(['whisper', 'deepgram', 'azure']).default('whisper'),
TTS_PROVIDER: z.enum(['edge', 'elevenlabs', 'azure']).default('edge'),
```

Create factory in `backend/src/services/ai.factory.ts` to switch providers via env — no code changes needed per deployment.

---

## Estimated Pro Stack Cost (1000 active users)

| Service | Monthly Cost |
|---------|-------------|
| OpenAI GPT-4o | ~$50-100 |
| Deepgram | ~$30 |
| ElevenLabs | ~$22 |
| MongoDB M10 | $57 |
| Vercel Pro | $20 |
| Railway Pro | $20 |
| **Total** | **~$200-230/month** |

Revenue at 5% conversion × $9.99 = ~$500/month → profitable at 1000 users.
