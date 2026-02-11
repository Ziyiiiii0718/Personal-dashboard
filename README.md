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

### Todo
- Add / edit / complete / delete todos
- Todos can have an optional due date
- **Auto-add rule:** Any deadline within the next **7 days** will automatically create a todo (no duplicates)

### Calendar (Deadlines + Exams)
- One combined list with a `type` field: `ddl` or `exam`
- Sort by date, filter by type
- Upcoming (next 7 days) items feed into Todo automatically

### Fitness
- Log workouts with: date, activity, duration, intensity, notes

### Weight
- Log weight entries (date + value)
- Display a **trend line chart**
- Set a **goal weight** and show it as a reference in the chart

### Diet
- Log meals by date and meal type (breakfast/lunch/dinner/snack)
- Optional notes (no forced calorie calculations)

### Goals
- Track short-term goals with deadline + progress + notes

### Recipes
- Save recipes with: title, ingredients, steps, tags, time

### Diary (Password Locked)
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

