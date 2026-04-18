-- Create customer portal tables
CREATE TABLE IF NOT EXISTS "orders" (
    "id" TEXT NOT NULL,
    "user_id" uuid NOT NULL,
    "order_code" VARCHAR(50) NOT NULL,
    "origin" VARCHAR(255) NOT NULL,
    "destination" VARCHAR(255) NOT NULL,
    "service_type" VARCHAR(50) NOT NULL,
    "status" VARCHAR(30) NOT NULL DEFAULT 'pending',
    "current_location" VARCHAR(255),
    "weight_kg" INTEGER,
    "total_amount" INTEGER,
    "estimated_delivery" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "orders_order_code_key" ON "orders"("order_code");
CREATE INDEX IF NOT EXISTS "orders_user_id_status_idx" ON "orders"("user_id", "status");

ALTER TABLE "orders"
  ADD CONSTRAINT "orders_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "quote_requests" (
    "id" TEXT NOT NULL,
    "user_id" uuid NOT NULL,
    "quote_code" VARCHAR(50) NOT NULL,
    "service_type" VARCHAR(50) NOT NULL,
    "origin" VARCHAR(255) NOT NULL,
    "destination" VARCHAR(255) NOT NULL,
    "weight" VARCHAR(50),
    "dimensions" VARCHAR(100),
    "note" TEXT,
    "status" VARCHAR(30) NOT NULL DEFAULT 'pending',
    "quoted_price" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quote_requests_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "quote_requests_quote_code_key" ON "quote_requests"("quote_code");
CREATE INDEX IF NOT EXISTS "quote_requests_user_id_status_idx" ON "quote_requests"("user_id", "status");

ALTER TABLE "quote_requests"
  ADD CONSTRAINT "quote_requests_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "tracking_events" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "status" VARCHAR(30) NOT NULL,
    "location" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "event_time" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tracking_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "tracking_events_order_id_event_time_idx" ON "tracking_events"("order_id", "event_time" DESC);

ALTER TABLE "tracking_events"
  ADD CONSTRAINT "tracking_events_order_id_fkey"
  FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "notifications" (
    "id" TEXT NOT NULL,
    "user_id" uuid NOT NULL,
    "type" VARCHAR(20) NOT NULL DEFAULT 'info',
    "title" VARCHAR(255) NOT NULL,
    "message" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "notifications_user_id_is_read_idx" ON "notifications"("user_id", "is_read");

ALTER TABLE "notifications"
  ADD CONSTRAINT "notifications_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "customer_settings" (
    "id" TEXT NOT NULL,
    "user_id" uuid NOT NULL,
    "language" VARCHAR(10) NOT NULL DEFAULT 'vi',
    "theme" VARCHAR(20) NOT NULL DEFAULT 'light',
    "email_notifications" BOOLEAN NOT NULL DEFAULT true,
    "sms_notifications" BOOLEAN NOT NULL DEFAULT false,
    "push_notifications" BOOLEAN NOT NULL DEFAULT true,
    "company_name" VARCHAR(255),
    "phone" VARCHAR(50),
    "address" VARCHAR(255),
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_settings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "customer_settings_user_id_key" ON "customer_settings"("user_id");

ALTER TABLE "customer_settings"
  ADD CONSTRAINT "customer_settings_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
