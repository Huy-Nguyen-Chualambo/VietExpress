Seed mock data (50 orders) for KPI/SLA testing

Overview
- `seed-mock.js` creates 5 mock customers and 50 orders (past 30 days) with tracking events, notifications, and SLA alerts for ~5% failing orders.

How to run
1. Ensure `DATABASE_URL` (or `DIRECT_URL`) points to your Supabase Postgres instance.
2. Install dependencies if missing:

```bash
npm install @faker-js/faker
# prisma client should already be in project; if not:
npm install @prisma/client
```

3. Run the script from repo root:

```bash
node prisma/seed-mock.js
```

Notes
- The script uses Prisma to write to the same tables defined in `schema.prisma`. If you prefer to insert via Supabase client directly, adapt the script accordingly.
- PII is real-like (faker); if you need true production anonymization, don't use this dataset for external sharing.
