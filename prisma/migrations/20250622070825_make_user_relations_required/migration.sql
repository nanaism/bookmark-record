/*
  Warnings:

  - Made the column `authorId` on table `Bookmark` required. This step will fail if there are existing NULL values in that column.
  - Made the column `userId` on table `Topic` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Bookmark" ALTER COLUMN "authorId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Topic" ALTER COLUMN "userId" SET NOT NULL;
