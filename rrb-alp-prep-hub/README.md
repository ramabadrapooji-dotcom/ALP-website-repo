# RRB ALP PREP HUB

A complete, production-quality, dynamic web application for RRB Assistant Loco Pilot (ALP) CBT-1 preparation.

## Features

- **PDF Import Center** — Upload PYQ PDFs and automatically extract questions, options, and answer keys
- **Question Bank** — Centralized, searchable, filterable question database with full provenance
- **Mock Test Generator** — Full 75Q/60-min mocks, subject tests, topic tests, weak-area tests, custom configs
- **Realistic CBT Simulator** — Accurate timer, question palette, mark for review, session recovery
- **Scoring Engine** — +1/-1/3 configurable negative marking, per-question time tracking
- **Performance Analytics** — Score trends, subject/topic accuracy, weak topic detection
- **Targeted Practice** — Auto-generated weak-area tests based on actual performance data

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + TypeScript |
| Styling | Vanilla CSS (CSS Variables) |
| State | Zustand |
| Backend | Node.js + Express + TypeScript |
| ORM | Drizzle ORM |
| DB (dev) | SQLite |
| DB (prod) | PostgreSQL |
| PDF | pdf-parse + pdfjs-dist |
| OCR | tesseract.js |
| Charts | Recharts |
| Math | KaTeX |
| Validation | Zod |

## Project Structure

```
rrb-alp-prep-hub/
├── shared/      # Shared TypeScript types, constants, Zod schemas
├── backend/     # Express API server
├── frontend/    # React + Vite SPA
├── database/    # Drizzle schema + migrations + seeds
└── docs/        # Architecture and deployment docs
```

## Getting Started

### Prerequisites
- Node.js >= 18
- npm >= 9

### Install

```bash
npm install
```

### Database Setup

```bash
npm run db:generate   # generate migrations
npm run db:migrate    # apply migrations
npm run db:seed       # seed subjects and topics
```

### Run in Development

```bash
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

### Environment Variables

Copy `.env.example` to `backend/.env` and configure:

```bash
cp .env.example backend/.env
```

## Production Deployment

| Service | Target |
|---|---|
| Frontend | Vercel |
| Backend | Render |
| Database | PostgreSQL (Supabase / Render Postgres) |

See `docs/deployment.md` for full guide.

## Development Phases

1. Foundation & Monorepo
2. Database Schema & Migrations
3. Backend API & Services
4. PDF Processing Pipeline
5. Frontend Core & Design System
6. Exam Engine (CBT Simulator)
7. Results & Review
8. Dashboard & Mock Configuration
9. Import Center & Question Bank
10. Analytics, Settings & Polish

## Data Integrity Principles

- Every question has provenance (source, year, shift, import date)
- Questions are never silently guessed — uncertain matches flagged as NEEDS_REVIEW
- Source attribution preserved for all PYQs
- Generated/original questions never labeled as official RRB material
- Statistics based on actual stored data only — never fabricated

## License

Private — Personal Exam Preparation Tool
