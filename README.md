# Beverage Vault API (Backend)

Separate git repository for **Node.js + Express + MySQL**.

## Folder layout

```
Beverage-backend/
├── src/
│   ├── server.js
│   ├── config/db.js
│   ├── middleware/auth.js
│   ├── routes/
│   ├── controllers/
│   ├── services/
│   ├── repositories/
│   └── migrations/
│       ├── 001_schema.sql      ← full MySQL schema (Workbench)
│       ├── 002_seed.sql        ← seed vaults/varieties/articles/videos
│       └── seed-admin.js       ← bcrypt admin user
├── .env.example
└── package.json
```

## MySQL Workbench setup

1. Open MySQL Workbench and connect to your local server.
2. Run `src/migrations/001_schema.sql` (creates DB + tables + FKs).
3. Run `src/migrations/002_seed.sql` (seed content).
4. Copy `.env.example` → `.env` and set DB password.
5. Install + seed admin:

```bash
cd Beverage-backend
npm install
npm run seed
npm run dev
```

Admin (after seed):
- Email: `admin@beveragevault.com`
- Password: `Admin@Vault1` (or `SEED_ADMIN_PASSWORD` in `.env`)

## API endpoints

| Method | Path | Access |
|--------|------|--------|
| GET | `/api/health` | Public |
| POST | `/api/auth/login` | Public |
| POST | `/api/auth/register` | Public |
| GET | `/api/auth/me` | Auth |
| GET | `/api/vaults` | Public |
| GET | `/api/vaults/:key` | Public |
| POST | `/api/vaults/:key/varieties` | Admin |
| DELETE | `/api/vaults/:key/varieties/:varietyId` | Admin |
| GET/POST/DELETE | `/api/articles` | Read public / write admin |
| GET/POST/DELETE | `/api/classic-cocktails` | Read public / write admin |
| GET | `/api/classic-cocktails/:slug` | Public |
| GET/POST/DELETE | `/api/signature-cocktails` | Read public / write admin |
| GET/POST/DELETE | `/api/videos` | Read public / write admin |
| GET | `/api/cocktail-categories` | Public |

## Videos rule

Store only: title, thumbnail URL, Instagram URL, category, description, status.  
No video file upload.

## Frontend connection

In `Beverage-frontend/.env.local`:

```
NEXT_PUBLIC_DATA_SOURCE=api
NEXT_PUBLIC_API_URL=http://localhost:5000
```

UI stays the same — only the service layer switches from localStorage to API.
