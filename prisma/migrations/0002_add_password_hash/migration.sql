-- Add password_hash for NextAuth Credentials users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'users'
      AND column_name = 'password_hash'
  ) THEN
    ALTER TABLE public.users
      ADD COLUMN password_hash TEXT;
  END IF;
END $$;
