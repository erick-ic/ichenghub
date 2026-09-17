ALTER TABLE "ToolSubmission"
  ADD COLUMN "reviewNote" TEXT,
  ADD COLUMN "reviewedAt" TIMESTAMPTZ(0);

ALTER TABLE "ToolDemand"
  ADD COLUMN "reviewNote" TEXT,
  ADD COLUMN "reviewedAt" TIMESTAMPTZ(0);
