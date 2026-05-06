-- Add base price column for quote comparison
ALTER TABLE "quote_requests"
  ADD COLUMN "Price_Base" INTEGER;
