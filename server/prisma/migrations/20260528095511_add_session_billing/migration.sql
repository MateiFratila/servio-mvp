-- CreateTable
CREATE TABLE `session_billing` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `session_id` INTEGER NOT NULL,
    `billing_type` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NULL,
    `cnp` VARCHAR(191) NULL,
    `address` VARCHAR(191) NULL,
    `company_name` VARCHAR(191) NULL,
    `cui` VARCHAR(191) NULL,
    `reg_com` VARCHAR(191) NULL,
    `company_address` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `session_billing_session_id_key`(`session_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `session_billing` ADD CONSTRAINT `session_billing_session_id_fkey` FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
