# Swimmer Data

A poolside app for swim coaches to record stroke rate test reps quickly on an iPad or phone.

> **Status: prototype.** Reps save to a real database, end to end. There is no login yet, and every session is saved to a single test swimmer. A session in progress lives in the page, so unsaved reps are lost if the page is refreshed.

## What it does

- **Pick a protocol** from large chips: All out, Fastest movement, 50 pace, 100 pace, 200 pace, Race footage. The protocol stays selected between reps.
- **Enter a rep:** stroke rate (strokes/min) and time (seconds, to hundredths, e.g. `18.42`).
- **Optionally tag it** (Tempo Trainer, Tired, Underwater off) and add a short note.
- **See the session's reps** listed newest first, with **Undo last rep** (asks for confirmation; only for reps not yet saved).
- **Submit to swimmer's file** sends the unsaved reps. Saved reps stay in the list with a tick, so a coach can save as they go.
- **End session** clears the list, so the next rep starts a new session at Rep 1. It warns first if anything is unsaved.

Designed for wet hands: touch targets are at least 60px tall, inputs bring up numeric keypads, and on iPad (768px and wider) the form and rep list sit side by side.

Designed for patchy poolside signal: a failed save keeps everything and shows the error, and saves time out after 15 seconds rather than hanging. Retrying is always safe. Each session has an ID created in the browser, and each rep a number within it, so sending the same reps twice overwrites rather than duplicates, even when the first save succeeded but its response was lost.

## Tech stack

**Frontend**
- [React](https://react.dev) 19 + [TypeScript](https://www.typescriptlang.org), built with [Vite](https://vite.dev)
- [Tailwind CSS](https://tailwindcss.com) v4
- [shadcn/ui](https://ui.shadcn.com) components (built on [Base UI](https://base-ui.com))
- [Vitest](https://vitest.dev) for tests
- Hosted on [Cloudflare Workers](https://developers.cloudflare.com/workers/static-assets/) as static assets

**Backend** (AWS, `eu-west-2`)
- API Gateway HTTP API with one route, `POST /sessions`
- A Python 3.13 Lambda that validates each request and writes the session and its reps in one DynamoDB transaction
- DynamoDB, one table: `PK = SWIMMER#<id>`, `SK = SESSION#<sessionId>` for a session and `SESSION#<sessionId>#REP#001` for each rep
- [pytest](https://pytest.org) for tests
- Infrastructure defined in [Terraform](https://www.terraform.io)

## Getting started

### Frontend

You'll need [Node.js](https://nodejs.org) (developed with v24).

```sh
cd frontend
npm install
npm run dev
```

Then open the URL Vite prints (usually http://localhost:5173). To try the iPad layout, use your browser's device toolbar.

To save reps, the app needs the API's address. Put it in `frontend/.env.local`, which git ignores:

```sh
VITE_API_URL=https://<api-id>.execute-api.eu-west-2.amazonaws.com
```

`terraform output api_url` (run in `infra/`) prints it; leave off any trailing `/`. Anything in a `VITE_` variable ends up in the public JavaScript, so never put a secret there.

Commands, run from `frontend/`:

| Command | What it does |
|---|---|
| `npm run dev` | Starts the dev server |
| `npx vitest run` | Runs the tests |
| `npm run build` | Type-checks and builds for production into `dist/` |
| `npm run preview` | Serves the production build locally |
| `npm run lint` | Runs ESLint |

### Backend tests

You'll need Python 3.13 or later. From the repo root:

```sh
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements-dev.txt
pytest backend
```

`requirements-dev.txt` is for local tests only. The Lambda is deployed as `handler.py` on its own, and boto3 comes with the Lambda runtime.

## Deploying

**Backend.** From `infra/`, with AWS credentials set up:

```sh
terraform plan     # check the plan before applying
terraform apply
```

Terraform zips `backend/handler.py` itself, so there's no separate build step.

**Frontend.** From `frontend/`, logged in to Cloudflare with `npx wrangler login`:

```sh
npm run build
npx wrangler deploy
```

Pushing to GitHub doesn't deploy anything. When a change touches both halves, deploy whichever side still accepts the other's old requests first, so saving keeps working in between.

## Project structure

```
├── frontend/
│   ├── wrangler.jsonc       Cloudflare deploy config (serves dist/)
│   └── src/
│       ├── App.tsx          Entry form, rep list and session handling
│       ├── components/ui/   shadcn components (added with `npx shadcn add ...`)
│       └── lib/
│           ├── api.ts           submitSession() and newSessionId()
│           ├── protocols.ts     PROTOCOLS list and Protocol type
│           ├── tags.ts          TAGS list and Tag type
│           ├── types.ts         Rep type
│           ├── calculations.ts  Time helpers (with tests in calculations.test.ts)
│           └── utils.ts         shadcn's cn() class-merging helper
├── backend/
│   ├── handler.py           Lambda: validate, build items, write to DynamoDB
│   ├── tests/               pytest tests for validate and build_items
│   └── requirements-dev.txt Test-only dependencies
├── infra/                   Terraform: API Gateway, Lambda, DynamoDB
└── docs/                    Architecture, data model and decision records
```

The protocol list exists twice, in `frontend/src/lib/protocols.ts` and `backend/handler.py`. Change both together.

## Roadmap

- Coach login, and choosing a swimmer before a session ("Submit to James's file")
- Keep a session in the browser so it survives a refresh or a dropped connection
- Read sessions back and chart speed against stroke rate
- Per-coach protocol buttons, stored as data
