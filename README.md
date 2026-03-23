# Nurvo — Family Wellness Companion

A mobile wellness organizer built with React Native + Expo. Nurvo helps you remember routines, organize wellness information, and stay on track.

> **Disclaimer:** Nurvo is a personal wellness organizer. It is not a medical service and does not provide medical advice. All information is for general wellness purposes only. Always consult a qualified healthcare provider for medical decisions. Nurvo is not a substitute for professional medical care.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React Native + Expo SDK 51 |
| Navigation | React Navigation v6 (Bottom Tabs + Native Stack) |
| Database & Auth | Supabase |
| State Management | Zustand |
| Animations | React Native Reanimated 3 |
| Haptics | expo-haptics |
| Camera / Scanning | expo-camera |
| Subscriptions | RevenueCat |
| Icons | @expo/vector-icons (Feather + Ionicons) |

---

## Getting Started

### 1. Clone and install

```bash
git clone https://github.com/YOUR_USERNAME/nurvo.git
cd nurvo
npm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
EXPO_PUBLIC_OPENFDA_BASE=https://api.fda.gov
EXPO_PUBLIC_CLAUDE_API_KEY=your_claude_key
```

### 3. Set up Supabase

- Create a project at [supabase.com](https://supabase.com)
- Run the SQL in `supabase/schema.sql` in your Supabase SQL editor
- Enable email auth in Authentication > Providers

### 4. Start the app

```bash
npx expo start
```

---

## Project Structure

```
nurvo/
├── app/
│   ├── (tabs)/
│   │   ├── index.tsx          ← Home tab
│   │   ├── meds.tsx           ← Meds tab
│   │   ├── clarity.tsx        ← Clarity AI chat tab
│   │   ├── family.tsx         ← Family tab
│   │   └── _layout.tsx        ← Tab bar layout
│   ├── onboarding/
│   │   ├── welcome.tsx
│   │   ├── who.tsx
│   │   ├── name.tsx
│   │   ├── add-med.tsx
│   │   └── complete.tsx
│   ├── meds/
│   │   ├── add.tsx
│   │   ├── detail.tsx
│   │   └── scanner.tsx
│   ├── family/
│   │   ├── add-member.tsx
│   │   └── member-detail.tsx
│   └── _layout.tsx
├── components/
├── lib/
├── store/
├── constants/
└── supabase/
    └── schema.sql
```

---

## Features

### Home Tab
- Personalized greeting with time-of-day detection
- Today's dose schedule with progress tracking
- One-tap dose confirmation with haptic feedback
- Streak badge (daily wellness streak)
- Daily wellness tips
- Completion celebration animation

### Meds Tab
- Full medication list with supply tracking
- 3-step add medication flow
- Medication autocomplete via FDA + NIH APIs
- Barcode scanner for quick medication lookup
- Drug interaction detection (via OpenFDA)
- Critical medication flagging

### Clarity Tab (AI Wellness Assistant)
- Chat interface powered by Claude claude-3-haiku-20240307
- Medication context automatically injected
- 3 free questions per day (unlimited with premium)
- Suggested wellness questions
- Full disclaimer + no medical advice boundary

### Family Tab
- Multiple profile support
- Switch between family member wellness views
- Per-member medication management
- Caregiver alert toggle (premium)
- Upgrade prompt for family plan

### Onboarding
- Animated welcome screen
- Email/password auth via Supabase
- Name collection + primary profile creation
- Optional first medication setup
- Completion celebration

---

## Subscription Tiers

| Feature | Free | Premium | Family |
|---|---|---|---|
| Family members | 2 | Unlimited | Unlimited |
| Clarity questions/day | 3 | Unlimited | Unlimited |
| Caregiver alerts | — | ✓ | ✓ |
| Wellness analytics | — | ✓ | ✓ |

RevenueCat is integrated (`react-native-purchases`) for subscription management.

---

## Legal

This app is a personal wellness organizer. It is not a medical service and does not provide medical advice. All information is for general wellness purposes only. Always consult a qualified healthcare provider for medical decisions. Nurvo is not a substitute for professional medical care.
