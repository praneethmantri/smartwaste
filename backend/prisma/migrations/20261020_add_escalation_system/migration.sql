-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'MUNICIPAL_OFFICER';
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'COLLECTOR_OFFICE';

-- AlterEnum
ALTER TYPE "ComplaintStatus" ADD VALUE IF NOT EXISTS 'ESCALATED';
ALTER TYPE "ComplaintStatus" ADD VALUE IF NOT EXISTS 'RESOLVED';

-- AlterTable
ALTER TABLE "complaints" 
ADD COLUMN IF NOT EXISTS "escalation_level" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS "resolution_deadline" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "escalated_at" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "collector_instructions" TEXT,
ADD COLUMN IF NOT EXISTS "officer_notes" TEXT;

-- CreateTable
CREATE TABLE IF NOT EXISTS "escalation_events" (
    "id" TEXT NOT NULL,
    "complaint_id" TEXT NOT NULL,
    "from_level" INTEGER NOT NULL,
    "to_level" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "action_taken" TEXT NOT NULL,
    "notes" TEXT,
    "action_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "escalation_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "complaints_escalation_level_idx" ON "complaints"("escalation_level");
CREATE INDEX IF NOT EXISTS "complaints_resolution_deadline_idx" ON "complaints"("resolution_deadline");
CREATE INDEX IF NOT EXISTS "escalation_events_complaint_id_idx" ON "escalation_events"("complaint_id");
CREATE INDEX IF NOT EXISTS "escalation_events_to_level_idx" ON "escalation_events"("to_level");

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'escalation_events_complaint_id_fkey'
    ) THEN
        ALTER TABLE "escalation_events" ADD CONSTRAINT "escalation_events_complaint_id_fkey" 
        FOREIGN KEY ("complaint_id") REFERENCES "complaints"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'escalation_events_action_by_id_fkey'
    ) THEN
        ALTER TABLE "escalation_events" ADD CONSTRAINT "escalation_events_action_by_id_fkey" 
        FOREIGN KEY ("action_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;
