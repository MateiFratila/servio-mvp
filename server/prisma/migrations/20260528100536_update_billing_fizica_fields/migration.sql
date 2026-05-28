/*
  Warnings:

  - You are about to drop the column `address` on the `session_billing` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `session_billing` DROP COLUMN `address`,
    ADD COLUMN `judet` VARCHAR(191) NULL,
    ADD COLUMN `localitate` VARCHAR(191) NULL;
