# Salon Management — Client (Frontend)

React + Vite + TypeScript frontend for the salon management system.
Bilingual (Arabic / English) UI with RTL support, powered by MUI.

## Prerequisites

- Node.js 20+
- The backend API running on `http://localhost:5000`

## Setup

```bash
npm install
```

## Development

```bash
npm run dev
```

Starts the Vite dev server on `http://localhost:5173`.
API calls to `/api/*` are proxied to `http://localhost:5000`.

## Production build

```bash
npm run build   # type-checks with tsc, then bundles with vite
npm run preview # serves the production build locally
```

## Configuration

- Default language: Arabic (`ar`). Language is persisted in `localStorage` under `lang`.
- Auth token is persisted in `localStorage` under `token` and attached as a `Bearer` token to every API request.