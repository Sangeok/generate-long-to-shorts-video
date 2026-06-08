-- Rename Project -> Video (data-preserving). The `project` table was empty when
-- this was authored, but RENAME is used so no data is lost if rows exist.

-- Rename enum type
ALTER TYPE "ProjectStatus" RENAME TO "VideoStatus";

-- Rename table
ALTER TABLE "project" RENAME TO "video";

-- Rename primary key and foreign key constraints
ALTER TABLE "video" RENAME CONSTRAINT "project_pkey" TO "video_pkey";
ALTER TABLE "video" RENAME CONSTRAINT "project_userId_fkey" TO "video_userId_fkey";

-- Rename indexes
ALTER INDEX "project_s3Key_key" RENAME TO "video_s3Key_key";
ALTER INDEX "project_userId_idx" RENAME TO "video_userId_idx";
