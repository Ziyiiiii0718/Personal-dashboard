This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
# Personal Life Dashboard

A private, offline-first web app for managing my daily life in one place:
- Todo list (manual + auto-generated from upcoming deadlines)
- Calendar (deadlines + exams combined)
- Fitness training log
- Weight tracking (trend chart + goal weight)
- Diet log
- Short-term goals
- Recipes
- **Password-protected encrypted diary** (cannot view without unlocking)

This app is designed for **personal use**, keeping the UI simple and fast. Data is stored locally by default.

---

## Features

### ✅ Todo
- Add / edit / complete / delete todos
- Todos can have an optional due date
- **Auto-add rule:** Any deadline within the next **7 days** will automatically create a todo (no duplicates)

### ✅ Calendar (Deadlines + Exams)
- One combined list with a `type` field: `ddl` or `exam`
- Sort by date, filter by type
- Upcoming (next 7 days) items feed into Todo automatically

### ✅ Fitness
- Log workouts with: date, activity, duration, intensity, notes

### ✅ Weight
- Log weight entries (date + value)
- Display a **trend line chart**
- Set a **goal weight** and show it as a reference in the chart

### ✅ Diet
- Log meals by date and meal type (breakfast/lunch/dinner/snack)
- Optional notes (no forced calorie calculations)

### ✅ Goals
- Track short-term goals with deadline + progress + notes

### ✅ Recipes
- Save recipes with: title, ingredients, steps, tags, time

### ✅ Diary (Password Locked)
- Diary entries are **encrypted client-side**
- You must unlock with a password to view or edit
- Only ciphertext is stored locally (no plaintext saved)

---

## Tech Stack (Recommended)
- Next.js + TypeScript
- Tailwind CSS
- Web Crypto API for diary encryption (PBKDF2 + AES-GCM)
- Local storage (localStorage) for persistence
- A lightweight chart library (e.g., Chart.js) for weight trends

---

## Project Structure (Suggested)
src/
app/
page.tsx # Dashboard
todo/
calendar/
fitness/
weight/
diet/
goals/
recipes/
diary/
settings/
lib/
storage/ # load/save helpers
sync/ # deadlines -> todos sync logic
crypto/ # diary encryption helpers
types/
models.ts # all TypeScript types


---

## Data Model (High-Level)

### DeadlineItem (DDL + Exam combined)
- id
- title
- type: "ddl" | "exam"
- dateISO (YYYY-MM-DD)
- course (optional)
- notes (optional)

### TodoItem
- id
- text
- done
- dueDateISO (optional)
- source: "manual" | "deadline"
- sourceId (optional)  // deadline id if auto-generated

### Weight
- entries: { id, dateISO, weightKg, note? }[]
- goalWeightKg?: number

### Diary (Encrypted)
- entries: { id, dateISO, ciphertextBase64, ivBase64 }[]
- password verifier + salt stored (not the password itself)

---

## Auto Todo Rule (Deadlines -> Todo)
On app load (and whenever deadlines change):
1. Find deadlines where `dateISO` is within the next 7 days (including today).
2. For each such deadline:
   - If no todo exists with `source="deadline"` AND `sourceId=deadline.id`,
     create a new todo:
     - text: `"[DDL] " + deadline.title` (or include type)
     - dueDateISO = deadline.dateISO
     - source = "deadline"
     - sourceId = deadline.id
3. Never create duplicates.

---

## Security Note (Diary)
This project uses client-side encryption so diary text is not stored in plaintext.
However:
- If someone has access to your unlocked browser session, they can read it.
- Choose a strong password.
- Consider making the repo Private if you ever publish it.

---

## Getting Started

### 1) Install
```bash
npm install
### 2) Run Locally
npm run dev
### 3) Build
npm run build
npm start

Roadmap (Optional)

Calendar month view

Search / tags / filters

Charts for fitness frequency

IndexedDB for larger storage

Optional cloud sync (future)

---

## How to create the repo (two ways)

### Option A — Create on GitHub website (recommended)
1. Go to GitHub → click **New repository**
2. Repository name: `personal-dashboard` (or any name)
3. Choose **Private** (recommended because you have a diary feature)
4. Don’t worry about folders—leave defaults (you can choose “Add a README” or not)
5. Click **Create repository**

Then you’ll push your local project to it.

---

### Option B — Create locally first, then push (most common workflow)
In your terminal:

```bash
# 1) Create local folder
mkdir personal-dashboard
cd personal-dashboard

# 2) Start git
git init

# 3) (Later) add files, then:
git add .
git commit -m "Initial commit"

