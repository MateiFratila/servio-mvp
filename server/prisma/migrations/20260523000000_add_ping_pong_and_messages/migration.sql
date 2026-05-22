-- Add ping_pong to the sessions status enum
ALTER TABLE `sessions` MODIFY `status` ENUM('pending', 'pending_confirmation', 'ping_pong', 'confirmed', 'completed', 'cancelled') NOT NULL DEFAULT 'pending';

-- CreateTable: session_messages
CREATE TABLE `session_messages` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `session_id` INTEGER NOT NULL,
    `author_id` INTEGER NOT NULL,
    `content` TEXT NOT NULL,
    `attachment_filename` VARCHAR(191) NULL,
    `attachment_blob_name` TEXT NULL,
    `attachment_size_bytes` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `session_messages_session_id_idx`(`session_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `session_messages` ADD CONSTRAINT `session_messages_session_id_fkey` FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `session_messages` ADD CONSTRAINT `session_messages_author_id_fkey` FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
