-- AlterTable
ALTER TABLE `consultant_profiles` ADD COLUMN `average_rating` DECIMAL(3, 2) NOT NULL DEFAULT 0.00;

-- CreateTable
CREATE TABLE `reviews` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `session_id` INTEGER NOT NULL,
    `client_id` INTEGER NOT NULL,
    `consultant_id` INTEGER NOT NULL,
    `rating` INTEGER NOT NULL,
    `testimonial` TEXT NOT NULL,
    `private_notes` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `reviews_session_id_key`(`session_id`),
    INDEX `reviews_client_id_idx`(`client_id`),
    INDEX `reviews_consultant_id_idx`(`consultant_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_session_id_fkey` FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_client_id_fkey` FOREIGN KEY (`client_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_consultant_id_fkey` FOREIGN KEY (`consultant_id`) REFERENCES `consultant_profiles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
