# Swimmer Data

A poolside app for swim coaches to record stroke rate test reps quickly on an iPad or phone.

> **Status: early MVP.** Reps are kept in memory only and are lost when the page is refreshed. There is no backend or database yet.

## What it does

- **Pick a protocol** from large chips: All out, Fastest movement, Tempo, 100 feel, 200 feel, Race footage. The protocol stays selected between reps.
- **Enter a rep:** stroke rate (strokes/min) and time (seconds, to hundredths, e.g. `18.42`).
- **Optionally tag it** (Tired, Pullout off, 3rd attempt) and add a short note.
- **See all reps** listed newest first, with **Undo last rep** (asks for confirmation).

Designed for wet hands: touch targets are at least 60px tall, inputs bring up numeric keypads, and on iPad (768px and wider) the form and rep list sit side by side.

## Tech stack

- [React](https://react.dev) 19 + [TypeScript](https://www.typescriptlang.org), built with [Vite](https://vite.dev)
- [Tailwind CSS](https://tailwindcss.com) v4
- [shadcn/ui](https://ui.shadcn.com) components (built on [Base UI](https://base-ui.com))
- [Vitest](https://vitest.dev) for tests

## Getting started

You'll need [Node.js](https://nodejs.org) (developed with v24).

```sh
# Run the app
cd frontend
npm install
npm run dev
```

Then open the URL Vite prints (usually http://localhost:5173). To try the iPad layout, use your browser's device toolbar.

```sh
# Run the tests (from the repo root)
npm install
npx vitest run
```

Other commands, run from `frontend/`:

| Command | What it does |
|---|---|
| `npm run build` | Type-checks and builds for production into `dist/` |
| `npm run preview` | Serves the production build locally |
| `npm run lint` | Runs ESLint |

## Project structure

```
frontend/src/
├── App.tsx              Entry form and rep list
├── components/ui/       shadcn components (added with `npx shadcn add ...`)
└── lib/
    ├── protocols.ts     PROTOCOLS list and Protocol type
    ├── tags.ts          TAGS list and Tag type
    ├── types.ts         Rep type
    ├── calculations.ts  Time helpers (with tests in calculations.test.ts)
    └── utils.ts         shadcn's cn() class-merging helper
```

## Roadmap

- Save reps so they survive a refresh
- Calculations based on the recorded reps
- Backend and database
