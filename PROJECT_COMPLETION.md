# Daily Brew — Project Completion & Deployment Tracker

## Status: IN PROGRESS 🚀

### 1. Codebase Audit Findings
- **Frontend**: React 19 + TypeScript + Vite. UI design is cozy pixel-art. However, Habits, Expenses, Journal, and Budget were using hardcoded in-memory demo data with mock alerts ("Backend saving is not connected yet").
- **Backend**: Node.js + Express + TypeScript + Mongoose. Well-architected controllers, models, and validators for Auth, Habits, Transactions, Budgets, Journal, Cafe, and Dashboard.
- **MongoDB Atlas**: Host `cluster0.ulfqsoe.mongodb.net`. Windows Node.js c-ares DNS resolver returns `ECONNREFUSED` on SRV records when using local default DNS. Fallback to public DNS servers (`8.8.8.8`, `1.1.1.1`) solves this completely and Atlas connection succeeds (`{"ok": 1}`).
- **Jest TypeScript Diagnostics**: Tests pass, but VS Code showed missing name errors for `describe`, `it`, `expect` in `server/tests/` because `tests/` was excluded from `tsconfig.json` without dedicated test types.
- **Git Repository**: Remote `https://github.com/simonedsa07/dailybrew.git` exists with initial commit (`README.md`). Local project directory has no `.git` initialized yet.

---

### 2. Implementation Milestones

- [x] **Milestone 1: Project Audit & Baseline Verification**
  - [x] Backend compilation & build verified (`tsc`)
  - [x] Backend Jest test suites verified (22/22 passing)
  - [x] Client compilation & build verified (`tsc -b && vite build`)
  - [x] Atlas SRV DNS diagnosis & fix verified (`{"ok": 1}` ping to Atlas)

- [ ] **Milestone 2: Backend Hardening & Jest Types**
  - [ ] Add DNS fallback in `server/src/config/database.ts` for Windows/Atlas resilience
  - [ ] Fix Jest TypeScript types in `server/tests/` with `@jest/globals` and `tests/tsconfig.json`
  - [ ] Support normalized mood values in `DailyEntry` model & Zod schema (`lovely`, `good`, `okay`, `tired`, `low`)
  - [ ] Verify safe, idempotent catalog seeding with connection fallback

- [ ] **Milestone 3: Habit Management (Frontend & Backend Integration)**
  - [ ] Connect habit list to `GET /api/v1/habits`
  - [ ] Implement habit creation via `POST /api/v1/habits`
  - [ ] Implement habit toggle/completion via `POST /api/v1/habits/:id/completions` & uncomplete
  - [ ] Update bean balance dynamically upon habit completion (+5 beans, +10 all-habits bonus)
  - [ ] Implement habit deletion via `DELETE /api/v1/habits/:id`
  - [ ] Show real streak counters and frequency tags
  - [ ] Remove hardcoded demo notices

- [ ] **Milestone 4: Expenses & Budgets Integration**
  - [ ] Connect transactions to `GET /api/v1/transactions`
  - [ ] Implement expense creation via `POST /api/v1/transactions`
  - [ ] Implement expense deletion via `DELETE /api/v1/transactions/:id`
  - [ ] Add category selection with cozy pixel icons
  - [ ] Add monthly filtering (current & previous months)
  - [ ] Connect monthly budget to `GET /api/v1/budgets` & `PUT /api/v1/budgets/:month`
  - [ ] Calculate real monthly totals, remaining balance, and format in INR (₹)
  - [ ] Remove hardcoded demo notices

- [ ] **Milestone 5: Daily Journal & Mood Tracker**
  - [ ] Connect today's check-in to `GET /api/v1/daily-entries/:date`
  - [ ] Implement journal save via `PUT /api/v1/daily-entries/:date`
  - [ ] Support mood selection, daily note, and water intake tracker
  - [ ] Award +3 beans on daily check-in and update live balance
  - [ ] Allow reviewing past journal entries
  - [ ] Remove hardcoded demo notices

- [ ] **Milestone 6: Dashboard Synchronization**
  - [ ] Connect dashboard to `GET /api/v1/dashboard/summary`
  - [ ] Sync habit progress, streaks, monthly spending, remaining budget, journal status, and bean balance
  - [ ] Add empty and loading states
  - [ ] Replace hardcoded topbar date with dynamic current date

- [ ] **Milestone 7: Café Customization & Shop**
  - [ ] Ensure seeded catalog (18 items) is available from backend
  - [ ] Ensure purchases deduct real beans and update user inventory in MongoDB
  - [ ] Ensure room editor placements, removals, and theme selection persist via `PUT /api/v1/cafe/layout`
  - [ ] Ensure layout survives page refresh and re-login
  - [ ] Fix any visual glitches in pixel-art room scene

- [ ] **Milestone 8: UI / UX Polish & Mojibake Fixes**
  - [ ] Fix UTF-8 encoding corruption in `App.tsx` and `App.css` (`ðŸŒ¼`, `ðŸ§¾`, `CAFÃ‰`, etc.)
  - [ ] Ensure mobile view shows profile access and smooth horizontal navigation
  - [ ] Ensure modals and cards do not overflow on small screens

- [ ] **Milestone 9: End-to-End Verification & Testing**
  - [ ] Run complete backend test suite
  - [ ] Build client and server for production
  - [ ] Perform full E2E flow (register, login, habit, expense, budget, journal, cafe purchase, layout save, refresh)

- [ ] **Milestone 10: Git Repository & Deployment Preparation**
  - [ ] Initialize git cleanly, configure `.gitignore` (keep secrets and node_modules safe)
  - [ ] Connect remote `https://github.com/simonedsa07/dailybrew.git`
  - [ ] Update `README.md` with complete architecture, setup, environment, and deployment guide
  - [ ] Final report
