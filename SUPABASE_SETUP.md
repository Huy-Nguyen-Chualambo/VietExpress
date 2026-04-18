# Hướng dẫn Cấu hình Supabase cho VietExpress

## 1. Tạo dự án Supabase (nếu chưa có)

1. Truy cập [supabase.com](https://supabase.com) và đăng nhập
2. Nhấp **"New Project"** → Chọn organization (hoặc tạo mới)
3. Điền:
   - **Project Name**: VietExpress (hoặc tên của bạn)
   - **Database Password**: Tạo mật khẩu mạnh (VD: `Abc@1234!`)
   - **Region**: `Asia Pacific (Singapore)` hoặc gần Việt Nam nhất
4. Nhấp **Create new project** → Chờ ~2 phút

## 2. Lấy Supabase Credentials

Sau khi project được tạo, bạn sẽ thấy dashboard. Làm theo các bước:

### A. Lấy Project URL

1. Vào menu **Settings** → **Configuration** (bên trái)
2. Nhấp tab **General**
3. Tìm **API** section
4. Copy giá trị **Project URL** (dạng: `https://xxxxxxxxxxxxx.supabase.co`)
5. Dán vào `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
   ```

### B. Lấy Anon Key (Public)

1. Vẫn ở menu **Settings** → **Configuration**
2. Nhấp tab **API**
3. Tìm **Project API keys** section
4. Copy giá trị **anon public** (key dài bắt đầu bằng `eyJh...`)
5. Dán vào `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJh...
   ```

### C. Lấy Service Role Key (nếu dùng Prisma/Server-side)

1. Vẫn ở tab **API**
2. Copy giá trị **service_role secret** (key rất dài)
3. Thêm vào `.env.local`:
   ```
   SUPABASE_SERVICE_ROLE_KEY=eyJh...
   ```

## 3. Cập nhật .env.local

File `.env.local` của bạn sẽ trông như sau (thay XXX bằng giá trị thật):

```env
# Supabase Public API (exposed to browser - OK for public anon key)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Supabase Server Secret (không expose ra client)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# PostgreSQL Connection (cho Prisma migrations)
SUPABASE_DB_URL=postgresql://postgres.XXXXX:[PASSWORD]@db.XXXXX.supabase.co:5432/postgres
DATABASE_URL=postgresql://postgres.XXXXX:[PASSWORD]@db.XXXXX.supabase.co:5432/postgres
```

## 4. Kiểm tra Cấu hình

1. Đóng dev server nếu đang chạy
2. Cập nhật `.env.local` với credentials thật
3. Chạy lại dev server:
   ```bash
   npm run dev
   ```
4. Truy cập http://localhost:3000/dang-ky
5. Thử đăng ký tài khoản
6. Nếu vẫn lỗi, hãy kiểm tra:
   - Browser console (F12 → Console) xem error message chi tiết
   - Network tab xem request `auth/v1/signup` bị block ở đâu
   - CORS settings trong Supabase Dashboard (Settings → Auth)

## 5. Cấu hình RLS (Row Level Security) cho bảng profiles

Mặc định, Supabase không cho phép insert vào bảng `profiles` từ client.  
Bạn cần cấu hình RLS policy để app có thể tạo profile khi user đăng ký:

1. Vào **Supabase Dashboard** → **SQL Editor**
2. Chạy SQL này để tạo RLS policies:
   ```sql
   -- Enable RLS
   ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

   -- Cho phép user insert profile của chính mình
   CREATE POLICY "Users can insert their own profile"
   ON public.profiles FOR INSERT
   WITH CHECK (auth.uid()::text = id);

   -- Cho phép user xem profile của chính mình
   CREATE POLICY "Users can read their own profile"
   ON public.profiles FOR SELECT
   USING (auth.uid()::text = id);

   -- Cho phép user update profile của chính mình
   CREATE POLICY "Users can update their own profile"
   ON public.profiles FOR UPDATE
   USING (auth.uid()::text = id)
   WITH CHECK (auth.uid()::text = id);
   ```

## 6. Kiểm tra bảng profiles tồn tại

Supabase sẽ tự tạo bảng `auth.users` khi có user đăng ký.  
Nhưng bảng `profiles` cần tự tạo:

1. Vào **SQL Editor** → chạy lệnh:
   ```sql
   CREATE TABLE IF NOT EXISTS public.profiles (
       id UUID NOT NULL PRIMARY KEY,
       full_name VARCHAR(255),
       phone VARCHAR(50),
       company VARCHAR(255),
       email VARCHAR(255) UNIQUE NOT NULL,
       role VARCHAR(20) DEFAULT 'customer',
       created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
       updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
   );
   ```

2. Hoặc dùng Prisma migrate từ project:
   ```bash
   npm run prisma:push
   ```

## Troubleshooting

| Lỗi | Nguyên nhân | Giải pháp |
|-----|-----------|----------|
| "Failed to fetch" | Credentials sai hoặc placeholder | Kiểm tra lại bước 2 & 3 |
| "Auth error" | RLS policy chưa cấu hình | Chạy SQL ở bước 5 |
| "CORS error" | CORS không được phép | Settings → Auth → Authorized domains |
| "Invalid JWT" | Service key sai hoặc hết hạn | Refresh key từ dashboard |

## Tài liệu thêm

- Supabase Docs: https://supabase.com/docs
- Auth Integration: https://supabase.com/docs/guides/auth/auth-helpers/nextjs
- RLS Policies: https://supabase.com/docs/guides/auth/row-level-security
