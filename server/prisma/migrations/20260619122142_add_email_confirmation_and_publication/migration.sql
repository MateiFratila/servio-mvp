/*
  Warnings:

  - A unique constraint covering the columns `[email_confirmation_token]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `consultant_profiles` ADD COLUMN `publication_requested` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `users` ADD COLUMN `email_confirmation_token` VARCHAR(191) NULL,
    ADD COLUMN `is_email_confirmed` BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX `users_email_confirmation_token_key` ON `users`(`email_confirmation_token`);
