/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `consultant_profiles` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `consultant_profiles` ADD COLUMN `slug` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `sessions` MODIFY `duration_minutes` INTEGER NOT NULL DEFAULT 30;

-- CreateIndex
CREATE UNIQUE INDEX `consultant_profiles_slug_key` ON `consultant_profiles`(`slug`);
