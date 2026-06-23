-- AlterTable
ALTER TABLE `sessions` ADD COLUMN `scheduled_email_ids` JSON NULL;

-- AlterTable
ALTER TABLE `system_settings` MODIFY `value` LONGTEXT NOT NULL;
