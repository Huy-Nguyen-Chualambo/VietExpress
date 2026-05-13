-- CreateTable
CREATE TABLE "sla_alerts" (
    "id" TEXT NOT NULL,
    "order_id" TEXT,
    "type" VARCHAR(30) NOT NULL DEFAULT 'alert',
    "status" VARCHAR(30) NOT NULL DEFAULT 'open',
    "severity" VARCHAR(20),
    "message" TEXT,
    "metadata" JSONB,
    "detected_at" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "sla_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sla_alerts_order_id_status_idx" ON "sla_alerts"("order_id", "status");

-- AddForeignKey
ALTER TABLE "sla_alerts" ADD CONSTRAINT "sla_alerts_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
