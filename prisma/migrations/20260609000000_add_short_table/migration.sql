-- CreateTable
CREATE TABLE "short" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "startSec" DOUBLE PRECISION NOT NULL,
    "endSec" DOUBLE PRECISION NOT NULL,
    "durationSec" DOUBLE PRECISION NOT NULL,
    "reason" TEXT NOT NULL,
    "seoScore" INTEGER NOT NULL,
    "captionsVtt" TEXT NOT NULL,
    "segments" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "short_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "short_projectId_idx" ON "short"("projectId");

-- AddForeignKey
ALTER TABLE "short" ADD CONSTRAINT "short_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
