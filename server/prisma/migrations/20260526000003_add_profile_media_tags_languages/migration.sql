-- Add avatar blob name, banner URL+blob, and languages to consultant_profiles
ALTER TABLE `consultant_profiles`
  ADD COLUMN `avatar_blob_name` LONGTEXT NULL,
  ADD COLUMN `banner_url`       VARCHAR(191) NULL,
  ADD COLUMN `banner_blob_name` LONGTEXT NULL,
  ADD COLUMN `languages`        JSON NULL;

-- Platform-defined expertise categories
CREATE TABLE `expertise_categories` (
  `id`   INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(191) NOT NULL,
  `slug` VARCHAR(191) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `expertise_categories_name_key` (`name`),
  UNIQUE KEY `expertise_categories_slug_key` (`slug`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Junction: consultant ↔ category
CREATE TABLE `consultant_profile_categories` (
  `profile_id`  INT NOT NULL,
  `category_id` INT NOT NULL,
  PRIMARY KEY (`profile_id`, `category_id`),
  CONSTRAINT `consultant_profile_categories_profile_id_fkey`
    FOREIGN KEY (`profile_id`)  REFERENCES `consultant_profiles`(`id`) ON DELETE CASCADE,
  CONSTRAINT `consultant_profile_categories_category_id_fkey`
    FOREIGN KEY (`category_id`) REFERENCES `expertise_categories`(`id`) ON DELETE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Free-text hashtags per consultant (normalized for search)
CREATE TABLE `consultant_tags` (
  `id`            INT NOT NULL AUTO_INCREMENT,
  `consultant_id` INT NOT NULL,
  `tag`           VARCHAR(191) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `consultant_tags_consultant_id_tag_key` (`consultant_id`, `tag`),
  KEY `consultant_tags_tag_idx` (`tag`),
  CONSTRAINT `consultant_tags_consultant_id_fkey`
    FOREIGN KEY (`consultant_id`) REFERENCES `consultant_profiles`(`id`) ON DELETE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
