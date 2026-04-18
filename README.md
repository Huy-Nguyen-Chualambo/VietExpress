# VietExpress

## Cau hinh database Supabase

Du an da su dung Supabase SDK trong `src/lib/supabase/*`.

**⚠️ Trước tiên, vui lòng xem [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) để lấy Supabase credentials thật từ dashboard.**

1. Tao file `.env.local` tu file mau:

```bash
copy .env.example .env.local
```

2. Dien cac bien moi truong trong `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL`: Project URL cua Supabase (Dashboard > Settings > API)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Anon public key (Dashboard > Settings > API)
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key (cho server-side operations)
- `SUPABASE_DB_URL`: Connection string Postgres de dung cho migration/ORM va Prisma

3. Neu ban dang dung connection string Shared Pooler, thay password vao:

```text
postgresql://postgres.dhtnbwqtbyugozmwronx:[YOUR-PASSWORD]@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres
```

Luu y:
- Khong commit `.env.local` len git.
- `SUPABASE_DB_URL` khong duoc dung trong client browser.

## Prisma + PostgreSQL

Project da duoc cau hinh Prisma voi datasource PostgreSQL trong `prisma/schema.prisma`.

**Cau hinh:**
- Prisma client singleton: `src/lib/prisma.ts`
- Connection pooling (port 6543) cho app queries: `DATABASE_URL`
- Direct connection (port 5432) cho migrations: `DIRECT_URL`
- Initial migration: `prisma/migrations/0001_init/migration.sql`

**Chay migration de tao bang trong database:**

```bash
npm run prisma:migrate -- --name=init
```

**Hoac push schema truc tiep (khong tao migration moi):**

```bash
npm run prisma:push
```

**Generate lai Prisma client sau khi sua schema:**

```bash
npm run prisma:generate
```

## Chay du an

```bash
npm install
npm run dev
```

Neu gap loi cache/runtime hoac xung dot port khi dev tren Windows:

```bash
npm run dev:safe
```

Mo `http://localhost:3000` de xem giao dien.

## Seed du lieu mau

Seed tao tai khoan nhan vien, khach hang va du lieu van hanh mau cho dashboard:

```bash
npm run prisma:seed
```

Tai khoan nhan vien mac dinh:

- `admin@vietexpress.vn` / `Admin@123456`
- `ops.bac@vietexpress.vn` / `OpsBac@123456`
- `ops.nam@vietexpress.vn` / `OpsNam@123456`

Tai khoan khach hang mac dinh:

- `customer.abc@vietexpress.vn` / `Customer@123456`
- `customer.xyz@vietexpress.vn` / `Customer@123456`
- `customer.mno@vietexpress.vn` / `Customer@123456`

## Optional: Supabase Agent Skills

Neu ban muon cai bo huong dan/automation cho AI tools khi lam viec voi Supabase:

```bash
npx skills add supabase/agent-skills
```
