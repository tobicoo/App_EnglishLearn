-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(255) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `age` TINYINT UNSIGNED NULL,
    `avatar` VARCHAR(32) NULL,
    `level` SMALLINT UNSIGNED NOT NULL DEFAULT 1,
    `total_xp` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `streak` SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    `gems` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `hearts` TINYINT UNSIGNED NOT NULL DEFAULT 5,
    `max_hearts` TINYINT UNSIGNED NOT NULL DEFAULT 5,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    INDEX `idx_users_total_xp`(`total_xp`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sections` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(120) NOT NULL,
    `subtitle` VARCHAR(255) NULL,
    `sort_order` SMALLINT UNSIGNED NOT NULL,
    `is_published` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `uk_sections_sort_order`(`sort_order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `units` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `section_id` INTEGER UNSIGNED NOT NULL,
    `title` VARCHAR(160) NULL,
    `description` TEXT NULL,
    `kind` ENUM('LESSON', 'REVIEW', 'CHECKPOINT') NOT NULL DEFAULT 'LESSON',
    `sort_order` SMALLINT UNSIGNED NOT NULL,
    `xp_reward` SMALLINT UNSIGNED NOT NULL DEFAULT 20,
    `is_published` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `idx_units_section_id`(`section_id`),
    UNIQUE INDEX `uk_units_section_sort_order`(`section_id`, `sort_order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `flashcards` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `unit_id` INTEGER UNSIGNED NOT NULL,
    `word` VARCHAR(120) NOT NULL,
    `phonetic` VARCHAR(120) NULL,
    `meaning` VARCHAR(255) NOT NULL,
    `image_url` VARCHAR(500) NULL,
    `sort_order` SMALLINT UNSIGNED NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `idx_flashcards_unit_id`(`unit_id`),
    UNIQUE INDEX `uk_flashcards_unit_sort_order`(`unit_id`, `sort_order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `exercises` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `unit_id` INTEGER UNSIGNED NOT NULL,
    `type` ENUM('MULTIPLE_CHOICE', 'FILL_BLANK', 'MATCHING') NOT NULL,
    `prompt` TEXT NOT NULL,
    `answer_text` TEXT NULL,
    `correct_option_id` INTEGER UNSIGNED NULL,
    `explanation` TEXT NULL,
    `sort_order` SMALLINT UNSIGNED NOT NULL,
    `xp_reward` SMALLINT UNSIGNED NOT NULL DEFAULT 5,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `exercises_correct_option_id_key`(`correct_option_id`),
    INDEX `idx_exercises_unit_id`(`unit_id`),
    UNIQUE INDEX `uk_exercises_unit_sort_order`(`unit_id`, `sort_order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `exercise_options` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `exercise_id` INTEGER UNSIGNED NOT NULL,
    `text` TEXT NOT NULL,
    `sort_order` SMALLINT UNSIGNED NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `idx_exercise_options_exercise_id`(`exercise_id`),
    UNIQUE INDEX `uk_exercise_options_exercise_sort_order`(`exercise_id`, `sort_order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `matching_pairs` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `exercise_id` INTEGER UNSIGNED NOT NULL,
    `left_text` VARCHAR(255) NOT NULL,
    `right_text` VARCHAR(255) NOT NULL,
    `sort_order` SMALLINT UNSIGNED NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `idx_matching_pairs_exercise_id`(`exercise_id`),
    UNIQUE INDEX `uk_matching_pairs_exercise_sort_order`(`exercise_id`, `sort_order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_unit_progress` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER UNSIGNED NOT NULL,
    `unit_id` INTEGER UNSIGNED NOT NULL,
    `status` ENUM('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED') NOT NULL DEFAULT 'NOT_STARTED',
    `completed_exercises` SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    `total_exercises` SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    `best_score` SMALLINT UNSIGNED NULL,
    `completed_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `idx_user_unit_progress_unit_id`(`unit_id`),
    UNIQUE INDEX `uk_user_unit_progress_user_unit`(`user_id`, `unit_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `unit_attempts` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER UNSIGNED NOT NULL,
    `unit_id` INTEGER UNSIGNED NOT NULL,
    `status` ENUM('STARTED', 'COMPLETED', 'ABANDONED') NOT NULL DEFAULT 'STARTED',
    `score` SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    `total_exercises` SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    `correct_answers` SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    `xp_earned` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `started_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `completed_at` DATETIME(3) NULL,

    INDEX `idx_unit_attempts_user_unit_started`(`user_id`, `unit_id`, `started_at`),
    INDEX `idx_unit_attempts_unit_id`(`unit_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `exercise_attempts` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER UNSIGNED NOT NULL,
    `unit_id` INTEGER UNSIGNED NOT NULL,
    `exercise_id` INTEGER UNSIGNED NOT NULL,
    `unit_attempt_id` INTEGER UNSIGNED NULL,
    `response` JSON NULL,
    `is_correct` BOOLEAN NOT NULL DEFAULT false,
    `hearts_before` TINYINT UNSIGNED NOT NULL,
    `hearts_after` TINYINT UNSIGNED NOT NULL,
    `xp_earned` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `attempted_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `idx_exercise_attempts_user_exercise_attempted`(`user_id`, `exercise_id`, `attempted_at`),
    INDEX `idx_exercise_attempts_unit_attempt_id`(`unit_attempt_id`),
    INDEX `idx_exercise_attempts_unit_id`(`unit_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `xp_ledger` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER UNSIGNED NOT NULL,
    `unit_id` INTEGER UNSIGNED NULL,
    `unit_attempt_id` INTEGER UNSIGNED NULL,
    `source` ENUM('UNIT_COMPLETION', 'EXERCISE_CORRECT', 'MANUAL_ADJUSTMENT') NOT NULL,
    `idempotency_key` VARCHAR(160) NOT NULL,
    `amount` INTEGER UNSIGNED NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `idx_xp_ledger_user_created`(`user_id`, `created_at`),
    INDEX `idx_xp_ledger_unit_id`(`unit_id`),
    INDEX `idx_xp_ledger_unit_attempt_id`(`unit_attempt_id`),
    UNIQUE INDEX `uk_xp_ledger_user_idempotency`(`user_id`, `idempotency_key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `units` ADD CONSTRAINT `units_section_id_fkey` FOREIGN KEY (`section_id`) REFERENCES `sections`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `flashcards` ADD CONSTRAINT `flashcards_unit_id_fkey` FOREIGN KEY (`unit_id`) REFERENCES `units`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exercises` ADD CONSTRAINT `exercises_unit_id_fkey` FOREIGN KEY (`unit_id`) REFERENCES `units`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exercises` ADD CONSTRAINT `exercises_correct_option_id_fkey` FOREIGN KEY (`correct_option_id`) REFERENCES `exercise_options`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exercise_options` ADD CONSTRAINT `exercise_options_exercise_id_fkey` FOREIGN KEY (`exercise_id`) REFERENCES `exercises`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `matching_pairs` ADD CONSTRAINT `matching_pairs_exercise_id_fkey` FOREIGN KEY (`exercise_id`) REFERENCES `exercises`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_unit_progress` ADD CONSTRAINT `user_unit_progress_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_unit_progress` ADD CONSTRAINT `user_unit_progress_unit_id_fkey` FOREIGN KEY (`unit_id`) REFERENCES `units`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `unit_attempts` ADD CONSTRAINT `unit_attempts_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `unit_attempts` ADD CONSTRAINT `unit_attempts_unit_id_fkey` FOREIGN KEY (`unit_id`) REFERENCES `units`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exercise_attempts` ADD CONSTRAINT `exercise_attempts_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exercise_attempts` ADD CONSTRAINT `exercise_attempts_unit_id_fkey` FOREIGN KEY (`unit_id`) REFERENCES `units`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exercise_attempts` ADD CONSTRAINT `exercise_attempts_exercise_id_fkey` FOREIGN KEY (`exercise_id`) REFERENCES `exercises`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exercise_attempts` ADD CONSTRAINT `exercise_attempts_unit_attempt_id_fkey` FOREIGN KEY (`unit_attempt_id`) REFERENCES `unit_attempts`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `xp_ledger` ADD CONSTRAINT `xp_ledger_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `xp_ledger` ADD CONSTRAINT `xp_ledger_unit_id_fkey` FOREIGN KEY (`unit_id`) REFERENCES `units`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `xp_ledger` ADD CONSTRAINT `xp_ledger_unit_attempt_id_fkey` FOREIGN KEY (`unit_attempt_id`) REFERENCES `unit_attempts`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
