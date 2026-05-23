-- CreateTable: exam_questions
CREATE TABLE `exam_questions` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `exam_id` INTEGER UNSIGNED NOT NULL,
    `question_text` TEXT NOT NULL,
    `type` VARCHAR(30) NOT NULL DEFAULT 'MULTIPLE_CHOICE',
    `options` JSON NULL,
    `correct_answer` TEXT NULL,
    `explanation` TEXT NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `idx_exam_questions_exam_sort`(`exam_id`, `sort_order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `exam_questions` ADD CONSTRAINT `exam_questions_exam_id_fkey` FOREIGN KEY (`exam_id`) REFERENCES `exams`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
