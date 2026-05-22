-- AlterTable: add 'pending_confirmation' to the sessions status enum
ALTER TABLE `sessions` MODIFY `status` ENUM('pending', 'pending_confirmation', 'confirmed', 'completed', 'cancelled') NOT NULL DEFAULT 'pending';
