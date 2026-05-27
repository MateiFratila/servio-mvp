-- DropForeignKey
ALTER TABLE `consultant_profile_categories` DROP FOREIGN KEY `consultant_profile_categories_category_id_fkey`;

-- DropForeignKey
ALTER TABLE `consultant_profile_categories` DROP FOREIGN KEY `consultant_profile_categories_profile_id_fkey`;

-- DropForeignKey
ALTER TABLE `consultant_tags` DROP FOREIGN KEY `consultant_tags_consultant_id_fkey`;

-- AlterTable
ALTER TABLE `consultant_profiles` MODIFY `avatar_blob_name` TEXT NULL,
    MODIFY `banner_blob_name` TEXT NULL;

-- AddForeignKey
ALTER TABLE `consultant_profile_categories` ADD CONSTRAINT `consultant_profile_categories_profile_id_fkey` FOREIGN KEY (`profile_id`) REFERENCES `consultant_profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `consultant_profile_categories` ADD CONSTRAINT `consultant_profile_categories_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `expertise_categories`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `consultant_tags` ADD CONSTRAINT `consultant_tags_consultant_id_fkey` FOREIGN KEY (`consultant_id`) REFERENCES `consultant_profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
