-- AlterTable
ALTER TABLE `sessions` ADD COLUMN `stripe_payment_intent_id` VARCHAR(191) NULL,
    ADD COLUMN `payment_status` VARCHAR(191) NOT NULL DEFAULT 'unpaid';
