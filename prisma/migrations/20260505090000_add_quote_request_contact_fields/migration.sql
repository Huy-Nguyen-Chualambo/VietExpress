-- Add customer contact snapshot fields to quote_requests
ALTER TABLE "quote_requests"
  ADD COLUMN "customer_name" VARCHAR(255),
  ADD COLUMN "customer_phone" VARCHAR(50),
  ADD COLUMN "customer_email" VARCHAR(255);
