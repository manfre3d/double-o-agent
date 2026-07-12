-- AlterTable
-- Backfill pre-existing (pre-isolation) rows to a sentinel owner no real 256-bit
-- session token can match, so previously-shared data becomes unreachable; then
-- drop the default so every new mission must set ownerId explicitly.
ALTER TABLE "Mission" ADD COLUMN     "ownerId" TEXT NOT NULL DEFAULT 'legacy';
ALTER TABLE "Mission" ALTER COLUMN "ownerId" DROP DEFAULT;

-- DropIndex
DROP INDEX "Mission_code_key";

-- CreateIndex
CREATE INDEX "Mission_ownerId_startedAt_idx" ON "Mission"("ownerId", "startedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Mission_ownerId_code_key" ON "Mission"("ownerId", "code");
