# Beverage Vault API

**Separate backend repository** for The Beverage Vault.

| Item | Detail |
|------|--------|
| Stack | Node.js + Express + MySQL |
| Frontend repo | `Beverage_Vault` (Next.js) |
| Database | MySQL (design with MySQL Workbench) |
| Deploy | Railway / Render / VPS (independent of frontend) |

## Status

Scaffold only — API modules will be built next (auth, cocktails, articles, vault).

## Setup (later)

```bash
cd beverage-vault-api
cp .env.example .env
npm install
npm run dev
```

Health check: `GET http://localhost:5000/api/health`

## Planned folders

```
src/
├── server.js
├── config/
├── middleware/
├── routes/
├── controllers/
├── services/
├── repositories/
└── migrations/
```

## Frontend link

Frontend will call this API using:

```
NEXT_PUBLIC_API_URL=http://localhost:5000
```
