CREATE TABLE IF NOT EXISTS "action_logs" (
    "id" TEXT NOT NULL,
    "actor_id" uuid,
    "mode" VARCHAR(20) NOT NULL DEFAULT 'manual',
    "action_type" VARCHAR(80) NOT NULL,
    "entity_type" VARCHAR(50),
    "entity_id" VARCHAR(120),
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "action_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "action_logs_mode_created_at_idx"
  ON "action_logs"("mode", "created_at");

CREATE INDEX IF NOT EXISTS "action_logs_action_type_created_at_idx"
  ON "action_logs"("action_type", "created_at");

CREATE INDEX IF NOT EXISTS "action_logs_actor_id_created_at_idx"
  ON "action_logs"("actor_id", "created_at");

ALTER TABLE "action_logs"
  ADD CONSTRAINT "action_logs_actor_id_fkey"
  FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
