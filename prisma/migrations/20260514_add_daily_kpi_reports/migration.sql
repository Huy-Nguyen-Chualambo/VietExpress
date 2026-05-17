-- Ensure UUID generation is available
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- CreateTable
CREATE TABLE "daily_kpi_reports" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "generated_at" TIMESTAMPTZ(6) NOT NULL,
    "report_type" TEXT,
    "summary" JSONB,
    "operations" JSONB,
    "financial" JSONB,
    "total_revenue" BIGINT,
    "on_time_rate" DOUBLE PRECISION,
    "sla_alerts" INTEGER,
    "raw_data" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_kpi_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "daily_kpi_reports_generated_at_idx" ON "daily_kpi_reports"("generated_at");

-- CreateIndex
CREATE INDEX "daily_kpi_reports_report_type_generated_at_idx" ON "daily_kpi_reports"("report_type", "generated_at");
