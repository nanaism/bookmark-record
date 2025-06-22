-- CreateEnum
CREATE TYPE "ProcessingStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED');

-- AlterTable
ALTER TABLE "Bookmark" ADD COLUMN     "processingStatus" "ProcessingStatus" DEFAULT 'PENDING';
