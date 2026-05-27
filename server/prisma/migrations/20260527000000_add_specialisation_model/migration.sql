-- CreateTable
CREATE TABLE `specialisations` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `specialisations_name_key`(`name`),
    UNIQUE INDEX `specialisations_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `consultant_profile_specialisations` (
    `profile_id` INTEGER NOT NULL,
    `specialisation_id` INTEGER NOT NULL,

    PRIMARY KEY (`profile_id`, `specialisation_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AlterTable: add nullable specialisation_id to expertise_categories
ALTER TABLE `expertise_categories` ADD COLUMN `specialisation_id` INTEGER NULL;

-- AlterTable: drop specialisation column from consultant_profiles
ALTER TABLE `consultant_profiles` DROP COLUMN `specialisation`;

-- CreateIndex
CREATE INDEX `expertise_categories_specialisation_id_idx` ON `expertise_categories`(`specialisation_id`);

-- AddForeignKey
ALTER TABLE `consultant_profile_specialisations` ADD CONSTRAINT `consultant_profile_specialisations_profile_id_fkey` FOREIGN KEY (`profile_id`) REFERENCES `consultant_profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `consultant_profile_specialisations` ADD CONSTRAINT `consultant_profile_specialisations_specialisation_id_fkey` FOREIGN KEY (`specialisation_id`) REFERENCES `specialisations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `expertise_categories` ADD CONSTRAINT `expertise_categories_specialisation_id_fkey` FOREIGN KEY (`specialisation_id`) REFERENCES `specialisations`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
