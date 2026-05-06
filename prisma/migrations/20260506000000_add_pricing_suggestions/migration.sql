-- Add pricing suggestion fields to quote_requests
ALTER TABLE "quote_requests"
  ADD COLUMN "suggested_surcharges" JSONB,
  ADD COLUMN "final_suggested_price" INTEGER,
  ADD COLUMN "pricing_reasoning" TEXT;
