# KijiTalk Figma Design Specification

> **Note:** This document provides the complete design blueprint to recreate in Figma.
> Import `design/tokens.json` using the Figma Tokens plugin for automatic color/type sync.

---

## Figma File Structure

```
📁 KijiTalk Design System
├── 🎨 Colors (Light + Dark modes)
├── 📝 Typography (Inter font family)
├── 🧩 Components
│   ├── Buttons (Primary, Secondary, Ghost, Icon)
│   ├── Inputs (Text, Search, Textarea)
│   ├── Cards (Stat, Lesson, Roleplay, Chat Bubble)
│   ├── Navigation (Sidebar, Bottom Tab, Header)
│   ├── Avatar, Badge, Progress Bar, Toggle
│   └── Mic Button (Recording states)
├── 📱 Screens (12 total)
└── 🔗 Prototype (connected flows)
```

---

## 12 Screens

| # | Screen | Route | Frame Size |
|---|--------|-------|------------|
| 1 | Welcome / Splash | `/` | 390×844 (mobile), 1440×900 (web) |
| 2 | Onboarding (3 slides) | `/onboarding` | 390×844 |
| 3 | Login | `/login` | 390×844 |
| 4 | Signup | `/signup` | 390×844 |
| 5 | Dashboard / Home | `/dashboard` | 390×844 + 1440×900 |
| 6 | AI Chat | `/chat` | 390×844 |
| 7 | Voice Practice | `/voice` | 390×844 |
| 8 | Roleplay Selection | `/roleplay` | 390×844 |
| 9 | Roleplay Conversation | `/roleplay/[id]` | 390×844 |
| 10 | Daily Lessons List | `/lessons` | 390×844 |
| 11 | Progress Dashboard | `/progress` | 390×844 + 1440×900 |
| 12 | Settings / Profile | `/settings` | 390×844 |

---

## Screen Details

### 1. Welcome
- Full-screen gradient hero (brand-600 → indigo-400)
- Logo: "K" in rounded square + "KijiTalk" wordmark
- Headline: "Speak English Confidently"
- CTA: "Get Started Free" (white button) + "Take a Tour" (ghost)
- 3 feature cards at bottom with glassmorphism

### 2. Onboarding (3 slides)
- Full-color slide backgrounds (purple, violet, emerald gradients)
- Large emoji illustration center
- Dot pagination indicator
- Next / Start Learning buttons

### 3-4. Login / Signup
- Centered card (max 400px)
- Logo on top
- Form fields with rounded inputs
- Google OAuth button
- Link to alternate auth page

### 5. Dashboard
- Greeting header with user name
- 4 stat cards in grid (Streak, Time, Lessons, Score)
- Today's Lesson hero card (gradient)
- Quick action grid (Chat, Voice, Roleplay, Lessons)
- Sidebar nav (web) / Bottom tab bar (mobile)

### 6. AI Chat
- Message bubbles: user (brand-600, right), AI (slate-100, left)
- Correction chips below AI messages (amber text)
- Typing indicator (3 bouncing dots)
- Input bar with send button fixed bottom

### 7. Voice Practice
- Phrase card center
- Large circular mic button (80px, gradient, pulse when recording)
- Score circle (color-coded: green ≥80, amber ≥60, red <60)
- Word-level score chips
- "Next Phrase" button

### 8. Roleplay Selection
- 2-column grid of scenario cards
- Each card: emoji/icon area, level badge, title, description, time
- Categories: Daily Life, Travel, Professional, Health

### 9. Roleplay Conversation
- Same as Chat but with goal chips in header
- Violet accent for AI avatar

### 10. Lessons List
- Vertical list of lesson cards
- Number badge, title, level pill, duration

### 11. Progress
- 4 stat cards top
- Bar chart (daily minutes, 30 days)
- Pie chart (activity breakdown)
- Daily goal progress bar

### 12. Settings
- Profile card with avatar initial
- Toggle rows: Dark Mode, Notifications
- Daily goal slider (5-60 min)
- Sign Out button (red outline)

---

## Dark Mode

All screens have dark variants:
- Background: `#0f172a` (slate-900)
- Surface: `#1e293b` (slate-800)
- Text: `#f8fafc` (slate-50)
- Borders: `#334155` (slate-700)

Use Figma variable modes: `Light` / `Dark`

---

## Prototype Connections

```
Welcome → Signup → Dashboard
Welcome → Login → Dashboard
Welcome → Onboarding → Signup
Dashboard → Chat → (back)
Dashboard → Voice → (back)
Dashboard → Roleplay → Roleplay Chat → (back)
Dashboard → Lessons → Lesson Detail → Dashboard
Dashboard → Progress
Dashboard → Settings → Sign Out → Welcome
```

Transitions: Smart Animate, 300ms ease-out

---

## Exportable Assets

Export from Figma as:

| Asset | Format | Size |
|-------|--------|------|
| App Icon | PNG | 1024×1024 |
| Splash Screen | PNG | 1284×2778 |
| Logo (light) | SVG | vector |
| Logo (dark) | SVG | vector |
| Roleplay icons (6) | SVG | 64×64 |
| Empty state illustrations | SVG | 200×200 |
| Tab bar icons | SVG | 24×24 |

Place exported assets in:
- Web: `frontend/public/assets/`
- Mobile: `mobile/assets/`

---

## How to Create in Figma

1. Install [Figma Tokens](https://tokens.studio/) plugin
2. Import `design/tokens.json`
3. Create color styles from tokens (light + dark modes)
4. Create text styles from typography scale
5. Build components with Auto Layout
6. Compose 12 screens using components
7. Connect prototype flows
8. Share link with "Anyone can view" for developers

---

## Figma Community Template

Search "KijiTalk" on Figma Community after publishing, or duplicate from your team's shared file once created using this spec.

**Recommended Figma plugins:**
- Tokens Studio (design tokens)
- Iconify (Lucide icons)
- Unsplash (hero images)
- Stark (accessibility contrast check)
- Content Reel (realistic placeholder text)
