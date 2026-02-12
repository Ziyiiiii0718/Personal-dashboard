# Personal Dashboard

A minimalist, Instagram-style personal dashboard for planning and tracking day-to-day life — **todos, calendar deadlines, diet logs, fitness sessions, weight trends, and a private diary** — all in one place. Built as a modular Next.js app with type-safe data models, local persistence, and production-ready deployment.

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
- Log items + optional calories/notes
- Entries grouped by date (newest first)
- Within each day, meals are displayed in a fixed order for readability

### Fitness
- Log multiple sessions per day
- Detailed categories (e.g., strength groups + cardio types + pilates)
- Grouped by date with optional duration/intensity/notes

### Weight
- Add weight entries (kg) with optional notes
- Set a goal weight and view the delta to goal
- Trend chart with a goal reference line

### Diary (Private)
- Password-gated access
- Diary content stored encrypted locally (not plaintext)
- Designed to keep sensitive notes private

---

## Getting Started (Local)

### 1) Install dependencies
```bash
npm install
### 2) Run the dev server

```bash
npm run dev
### 3) Production build (recommended before deploy)

```bash
npm run build
npm run start

