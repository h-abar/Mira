# Saloon Server

Backend API for the women's hair salon management system (bilingual Arabic/English).

## Stack

- Node.js + Express + TypeScript
- Prisma ORM + PostgreSQL
- JWT authentication (jsonwebtoken) + bcryptjs
- Zod input validation
- ExcelJS / PDFKit for report exports
- node-cron for scheduled tasks (backups)

## Requirements

- Node.js 20+
- PostgreSQL 16+ (or Docker Compose)

## Getting Started

1. Start PostgreSQL (from repo root):

```bash
docker compose up -d
```

2. Install dependencies:

```bash
npm install
```

3. Generate the Prisma client and create the schema:

```bash
npx prisma generate
npm run prisma:migrate
```

4. Seed the database (admin user, sample services, employees, client):

```bash
npm run prisma:seed
```

5. Run the development server:

```bash
npm run dev
```

The server listens on `http://localhost:4000`.

## Scripts

| Script              | Description                          |
| ------------------- | ------------------------------------ |
| `npm run dev`       | Start dev server with auto-reload    |
| `npm run build`     | Compile TypeScript to `dist/`        |
| `npm start`         | Run the compiled server              |
| `npm run prisma:migrate` | Apply Prisma migrations         |
| `npm run prisma:seed`    | Seed the database                 |

## Configuration

Environment variables live in `server/.env` (see `.env.example`):

- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - secret used to sign JWT tokens
- `JWT_EXPIRES_IN` - token lifetime (e.g. `7d`)
- `PORT` - server port (default 4000)
- `CORS_ORIGIN` - allowed frontend origin(s), `*` for all

## API Health Check

```
GET /api/health
```

## Default Admin

Created by the seed script:

- username: `admin`
- password: `admin123`
