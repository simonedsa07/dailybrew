# Daily Brew ☕🌱

Daily Brew is a cozy, retro-inspired personal dashboard for building habits, tracking expenses, keeping a daily journal, and decorating a virtual café. The interface uses a warm, pixel-art-inspired visual style and a bean-based rewards system.

## Features

- **Dashboard** — a central overview of daily habits, spending, budget information, and bean balance.
- **Habit tracker** — create and manage habits, record completions, and view habit history/streak information.
- **Expenses and budget** — record and manage transactions and view monthly expense summaries.
- **Daily journal** — save daily entries, including mood and water-tracking information.
- **My Café** — browse café decorations and items and purchase them using earned beans.
- **Account and settings** — sign-in/account UI and user preferences, including currency and theme settings.
- **Rewards** — server-side bean rewards for habit completion, a daily mood check-in, completing all scheduled habits, and a seven-day habit streak. Reward-ledger records are used to prevent duplicate awards for the same reward reference.
- **Persistence** — Express API and MongoDB/Mongoose models support user-specific data rather than relying solely on browser-only demo state.

> **Implementation note:** This README describes the current project implementation and the latest reported local verification. Deployment, production security review, and end-to-end browser testing are not claimed as complete.

## Technology stack

| Area | Technology |
|---|---|
| Frontend | React, TypeScript, Vite |
| Frontend API access | Fetch-based API client |
| Backend | Node.js, Express, TypeScript |
| Database | MongoDB with Mongoose |
| Authentication | Cookie-based authentication middleware |
| Testing | Jest and Supertest (backend tests) |
| Code quality | TypeScript builds and Oxlint (client); ESLint (server) |

## Repository layout

```text
dailybrew/
├── client/                 # React + TypeScript + Vite application
│   └── src/
│       ├── App.tsx
│       ├── App.css
│       └── lib/api.ts
├── server/                 # Express + TypeScript API
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   └── server.ts
│   └── tests/
├── PROJECT_COMPLETION.md   # Implementation and verification status
└── README.md
```

## Prerequisites

- Node.js and npm
- MongoDB running locally or a reachable MongoDB instance
- PowerShell or another terminal

Use the Node.js version supported by the installed dependencies. Install dependencies separately in the client and server folders if they have not already been installed.

## Run locally

Open **two terminals** from the repository root.

### 1. Configure the backend

```powershell
cd server
npm install
```

Review `src/config/index.ts` and any existing environment example file in `server/` for the configuration keys required by this checkout. Set the MongoDB connection string and authentication-related configuration in the way the project expects before starting the server. Do not commit real secrets.

Start the backend:

```powershell
npm run dev
```

The previously verified local backend was available at `http://localhost:5000`, with its health endpoint at `/health`. Your configured port may differ.

### 2. Start the frontend

In a second terminal:

```powershell
cd client
npm install
npm run dev
```

The previously verified Vite development server was available at `http://localhost:5173`. Open the URL printed by Vite if it chooses another port.

The frontend development server and backend must both be running for API-backed features to work. Ensure the frontend API configuration and backend CORS/origin settings agree with the local URLs.

## Backend API areas

The Express application mounts API route groups for:

- `/api/v1/auth`
- `/api/v1/users`
- `/api/v1/habits`
- `/api/v1/transactions`
- `/api/v1/budget`
- `/api/v1/daily-entries`
- `/api/v1/cafe`
- `/api/v1/dashboard`

The health endpoint is `/health` (not `/api/v1/health`). Consult the route and controller files for the current request/response schemas and authentication requirements.

## Tests and validation

Run commands from the repository root in PowerShell:

```powershell
npm run build --prefix server
npm test --prefix server -- --runInBand
npm run build --prefix client
npm run lint --prefix server
npm run lint --prefix client
git diff --check
```

Latest reported local verification:

- Backend TypeScript build: passed.
- Backend Jest tests: **30 tests passed across 6 suites**.
- Frontend TypeScript/Vite production build: passed.
- Server lint: passed.
- Client lint: zero errors, with two non-blocking `react(set-state-in-effect)` warnings in `client/src/App.tsx`.
- `git diff --check`: passed; Git may also print normal LF-to-CRLF line-ending warnings on Windows.

Re-run these checks after making changes; the status above is a record of the last reported run, not a guarantee about future changes.

## Git workflow

The project has a local Git repository and a configured remote. Review changes before committing:

```powershell
git status --short
git diff --check
git diff
```

Only commit and push when the changes have been reviewed and are ready to share.

## Current scope and limitations

- The local builds and backend automated tests have passed as reported, but they do not replace manual browser testing of each workflow.
- Production deployment and production-environment configuration have not been verified here.
- The two client lint warnings are non-blocking but should be reviewed.
- Keep credentials, session secrets, and database passwords out of version control.
