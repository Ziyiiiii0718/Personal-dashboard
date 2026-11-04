# Personal Dashboard

A minimalist, Instagram-style personal dashboard for planning and tracking day-to-day life — **todos, calendar deadlines, diet logs, fitness sessions, weight trends, goals, and a private diary** — all in one place. Built as a modular Next.js app with type-safe data models, local persistence, and production-ready deployment.

**Live Demo:** https://personal-dashboard-two-ochre.vercel.app/  
**Source Code:** https://github.com/Ziyiiiii0718/Personal-dashboard.git

---

## Highlights

- **Modular multi-page app** (Next.js App Router) with a consistent layout and reusable UI components.
- **Local-first persistence** using browser storage for fast, account-free usage.
- **Calendar + Todo workflow** designed for daily planning and quick navigation.
- **Diet tracking (6 meals/day)** with date grouping and ordered meal structure for completion tracking.
- **Fitness logging** supports multiple sessions per day across detailed categories.
- **Weight tracking** includes a trend chart and goal line for progress visualization.
- **Private diary module** with password-gated access (client-side encryption).

---

## Tech Stack

- **Next.js (App Router)** + **TypeScript**
- **Tailwind CSS**
- **Chart.js** (via **react-chartjs-2**)
- **Web Crypto API** (PBKDF2 + AES-GCM for diary encryption)
- **Anthropic API** (AI meal parsing and nutrition label scanning)
- **Vercel** for deployment

---

## Features

### Dashboard
- Overview cards for **Todo**, **Upcoming deadlines**, **Diet Today**, **Fitness Today**, and **Weight**
- Quick “View →” links into each module

### Todo
- Add / complete / delete tasks
- Clean list UI designed for daily use

### Calendar
- Add deadlines/events with **title**, **type**, **date**, and optional **notes**
- Edit / delete entries
- Upcoming items appear on the dashboard

### Diet (6 meals/day)
Supported meal types:
- Breakfast
- Morning Snack
- Lunch
- Afternoon Snack
- Dinner
- Late Snack

Features:
- **AI meal logger** — describe a meal by **voice** (browser speech-to-text) or text; the AI parses it into items and estimates calories + protein/carbs/fat, which you can edit before saving.
- **Food library** — scan a nutrition-label photo (营养成分表) and the AI extracts the facts; saved foods are reused for more accurate future estimates.
- **Cooking habits** — free-form notes (typical portions, oil usage, preferences) fed to the AI to tune its estimates.
- Manual logging with optional calories/notes still available.
- Entries grouped by date (newest first); within each day, meals display in a fixed order.

### Fitness
- Log multiple sessions per day
- Detailed categories (e.g., strength groups + cardio types + pilates)
- Grouped by date with optional duration/intensity/notes

### Weight
- Add weight entries (kg) with optional notes
- Set a goal weight and view the delta to goal
- Trend chart with a goal reference line

### Goals
- Add / edit / delete goals across fitness, weight, study, health, life, and other categories
- Optional numeric target with unit, deadline, and notes

### Diary (Private)
- Password-gated access
- Diary content stored encrypted locally (not plaintext)
- Designed to keep sensitive notes private

---

## Getting Started (Local)

### 1) Install dependencies
```bash
npm install
```

### 2) Configure the AI features
The diet AI assistant calls the Anthropic API from a server route, so the key
stays off the client. Copy the example env file and fill in both values:
```bash
cp .env.local.example .env.local
# then edit .env.local and set ANTHROPIC_API_KEY and AI_ACCESS_PASSWORD
```
On Vercel, add the same two variables under Project → Settings → Environment Variables.

`AI_ACCESS_PASSWORD` protects your API credit. The AI routes refuse every request
until it is set, and the app asks for it the first time you use an AI feature on
each device, then remembers it in that browser. Requests are also rate limited
per IP: 20 per minute, and 10 wrong passwords per 15 minutes. The limits are kept
in memory, so on serverless hosting they apply per running instance.

### 3) Run the dev server

```bash
npm run dev
```

### 4) Production build (recommended before deploy)

```bash
npm run build
npm run start
```
