-- ============================================================
--  english_learning_app  —  Seed Data (dữ liệu mẫu)
--  Chạy SAU khi đã import database_full.sql
--  KHÔNG cần chạy npm run seed trước
-- ============================================================

USE `english_learning_app`;

SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
-- 1. SECTIONS (chương học)
-- ============================================================
INSERT INTO `sections` (`id`, `title`, `subtitle`, `sort_order`, `is_published`, `created_at`, `updated_at`) VALUES
(1, 'Nhập Môn',    'Làm quen với tiếng Anh cơ bản',           1, true, NOW(), NOW()),
(2, 'Giao Tiếp',   'Hội thoại thường ngày',                   2, true, NOW(), NOW()),
(3, 'Ngữ Pháp',    'Cấu trúc câu và thì trong tiếng Anh',     3, true, NOW(), NOW()),
(4, 'Từ Vựng',     'Mở rộng vốn từ theo chủ đề',              4, true, NOW(), NOW()),
(5, 'Nâng Cao',    'Kỹ năng đọc hiểu và viết',                5, false, NOW(), NOW())
ON DUPLICATE KEY UPDATE `title` = VALUES(`title`);

-- ============================================================
-- 2. UNITS (bài học)
-- ============================================================
INSERT INTO `units` (`id`, `section_id`, `title`, `description`, `kind`, `sort_order`, `xp_reward`, `is_published`, `created_at`, `updated_at`) VALUES
-- Section 1: Nhập Môn
(1,  1, 'Chào Hỏi',          'Hello, Good morning, How are you?',             'LESSON',     1, 20, true,  NOW(), NOW()),
(2,  1, 'Số Đếm & Màu Sắc',  'Numbers 1-100, basic colors',                   'LESSON',     2, 20, true,  NOW(), NOW()),
(3,  1, 'Gia Đình',          'Family members, relationships',                  'LESSON',     3, 20, true,  NOW(), NOW()),
(4,  1, 'Ôn Tập Chương 1',   'Review: greetings, numbers, family',             'REVIEW',     4, 10, true,  NOW(), NOW()),
-- Section 2: Giao Tiếp
(5,  2, 'Tại Nhà Hàng',      'Ordering food, asking for the bill',             'LESSON',     1, 25, true,  NOW(), NOW()),
(6,  2, 'Mua Sắm',           'Shopping phrases, prices, bargaining',           'LESSON',     2, 25, true,  NOW(), NOW()),
(7,  2, 'Hỏi Đường',         'Directions, locations, transportation',          'LESSON',     3, 25, true,  NOW(), NOW()),
(8,  2, 'Ôn Tập Chương 2',   'Review: restaurant, shopping, directions',       'REVIEW',     4, 15, true,  NOW(), NOW()),
-- Section 3: Ngữ Pháp
(9,  3, 'Thì Hiện Tại Đơn',  'Simple Present: habits and facts',               'LESSON',     1, 30, true,  NOW(), NOW()),
(10, 3, 'Thì Quá Khứ Đơn',   'Simple Past: completed actions',                 'LESSON',     2, 30, true,  NOW(), NOW()),
(11, 3, 'Thì Tương Lai',     'Will & Going to',                                'LESSON',     3, 30, true,  NOW(), NOW()),
(12, 3, 'Kiểm Tra Ngữ Pháp', 'Checkpoint: all tenses',                         'CHECKPOINT', 4, 50, true,  NOW(), NOW()),
-- Section 4: Từ Vựng
(13, 4, 'Du Lịch',           'Airport, hotel, travel vocabulary',              'LESSON',     1, 25, true,  NOW(), NOW()),
(14, 4, 'Công Việc',         'Jobs, workplace, professional English',           'LESSON',     2, 25, true,  NOW(), NOW()),
(15, 5, 'Đọc Hiểu Nâng Cao', 'Reading comprehension: articles & essays',       'LESSON',     1, 40, false, NOW(), NOW())
ON DUPLICATE KEY UPDATE `title` = VALUES(`title`);

-- ============================================================
-- 3. USERS
-- ============================================================
INSERT INTO `users` (`email`, `password_hash`, `name`, `avatar`, `role`, `level`, `total_xp`, `streak`, `gems`, `hearts`, `max_hearts`, `heart_refilled_at`, `created_at`, `updated_at`)
VALUES
    ('admin@englishapp.vn',   '$2b$12$L6gL/WfKmFlvw5toVKnns.wbQFaVxXkT.0SSePn1zahq9jVI9XZeS', 'Admin',            '🛡️', 'ADMIN', 10, 99999, 0,  0,   5, 5, NOW(), NOW(), NOW()),
    ('ngoc.bui@gmail.com',    '$2b$12$GhSSkeQ.MHU1AreFK2vAjeGwWUpvbW20FQy3u5LWWOsFrpTNIrehO', 'Bùi Thị Ngọc',     '🌸', 'USER',  8,  4500, 35, 120, 5, 5, NOW(), DATE_SUB(NOW(), INTERVAL 60 DAY), NOW()),
    ('thulinh.ntt@gmail.com', '$2b$12$tkHJSNlwOl3ACzPi92Dlk.Z1gQN6wLYKukTWC.pFxI92/8e.wiY2G', 'Nguyễn Thùy Linh', '🦋', 'USER',  5,  2200, 12,  65, 3, 5, NOW(), DATE_SUB(NOW(), INTERVAL 45 DAY), NOW()),
    ('minhtung.tr@gmail.com', '$2b$12$8dmj48JUbyW/amYYlOpPMuvfn7A7aNkewhGZA51YnRSxFkqTnrBoK', 'Trần Minh Tùng',   '🐯', 'USER',  3,   800,  5,  20, 5, 5, NOW(), DATE_SUB(NOW(), INTERVAL 10 DAY), NOW()),
    ('levannam97@gmail.com',  '$2b$12$Qj.XJHFTLLKMBGAZw4NzpuFdIBKgd1.tkJwiO.DtPjpbGHc5sCkpq', 'Lê Văn Nam',       '🦁', 'USER',  4,  1650,  8,  45, 4, 5, NOW(), DATE_SUB(NOW(), INTERVAL 30 DAY), NOW()),
    ('phamthumai@gmail.com',  '$2b$12$WgyAQRhGE4sb1j73iUhryuc8ytJ3kIlmt7Ymr25UkzeOMnu17Kq82', 'Phạm Thu Mai',     '🌺', 'USER',  2,   350,  2,  10, 5, 5, NOW(), DATE_SUB(NOW(), INTERVAL 5  DAY), NOW())
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `total_xp` = VALUES(`total_xp`), `streak` = VALUES(`streak`);

-- ============================================================
-- 4. APP SETTINGS
-- ============================================================
INSERT INTO `app_settings` (`key`, `value`, `created_at`, `updated_at`)
VALUES ('heart_refill_interval_seconds', '120', NOW(), NOW())
ON DUPLICATE KEY UPDATE `value` = `value`;

-- ============================================================
-- 5. UNIT ATTEMPTS (lịch sử làm bài)
-- ============================================================
-- Bùi Thị Ngọc: hoàn thành units 1–12 (điểm cao)
INSERT INTO `unit_attempts` (`user_id`, `unit_id`, `status`, `score`, `total_exercises`, `correct_answers`, `xp_earned`, `started_at`, `completed_at`)
SELECT u.id, un.id, 'COMPLETED', FLOOR(85 + (un.id % 3) * 5), 10, FLOOR(8 + (un.id % 3)), un.xp_reward,
    DATE_SUB(NOW(), INTERVAL (13 - un.id) * 4 DAY),
    DATE_SUB(NOW(), INTERVAL (13 - un.id) * 4 DAY) + INTERVAL 18 MINUTE
FROM `users` u JOIN `units` un ON un.id BETWEEN 1 AND 12
WHERE u.email = 'ngoc.bui@gmail.com';

-- Nguyễn Thùy Linh: hoàn thành units 1–8 (điểm khá)
INSERT INTO `unit_attempts` (`user_id`, `unit_id`, `status`, `score`, `total_exercises`, `correct_answers`, `xp_earned`, `started_at`, `completed_at`)
SELECT u.id, un.id, 'COMPLETED', FLOOR(70 + (un.id % 4) * 5), 10, FLOOR(7 + (un.id % 3)), un.xp_reward,
    DATE_SUB(NOW(), INTERVAL (9 - un.id) * 5 DAY),
    DATE_SUB(NOW(), INTERVAL (9 - un.id) * 5 DAY) + INTERVAL 24 MINUTE
FROM `users` u JOIN `units` un ON un.id BETWEEN 1 AND 8
WHERE u.email = 'thulinh.ntt@gmail.com';

-- Lê Văn Nam: hoàn thành units 1–5 (điểm trung bình)
INSERT INTO `unit_attempts` (`user_id`, `unit_id`, `status`, `score`, `total_exercises`, `correct_answers`, `xp_earned`, `started_at`, `completed_at`)
SELECT u.id, un.id, 'COMPLETED', FLOOR(62 + (un.id % 5) * 6), 10, FLOOR(6 + (un.id % 4)), un.xp_reward,
    DATE_SUB(NOW(), INTERVAL (6 - un.id) * 6 DAY),
    DATE_SUB(NOW(), INTERVAL (6 - un.id) * 6 DAY) + INTERVAL 30 MINUTE
FROM `users` u JOIN `units` un ON un.id BETWEEN 1 AND 5
WHERE u.email = 'levannam97@gmail.com';

-- Trần Minh Tùng: làm unit 1 nhưng bỏ dở (ABANDONED)
INSERT INTO `unit_attempts` (`user_id`, `unit_id`, `status`, `score`, `total_exercises`, `correct_answers`, `xp_earned`, `started_at`, `completed_at`)
SELECT u.id, 1, 'ABANDONED', 0, 10, 0, 0, DATE_SUB(NOW(), INTERVAL 3 DAY), NULL
FROM `users` u WHERE u.email = 'minhtung.tr@gmail.com';

-- Trần Minh Tùng: làm lại unit 1, đang dở
INSERT INTO `unit_attempts` (`user_id`, `unit_id`, `status`, `score`, `total_exercises`, `correct_answers`, `xp_earned`, `started_at`, `completed_at`)
SELECT u.id, 1, 'STARTED', 0, 10, 0, 0, DATE_SUB(NOW(), INTERVAL 1 HOUR), NULL
FROM `users` u WHERE u.email = 'minhtung.tr@gmail.com';

-- ============================================================
-- 6. USER UNIT PROGRESS
-- ============================================================
-- Bùi Thị Ngọc: completed units 1–12, in_progress unit 13
INSERT INTO `user_unit_progress` (`user_id`, `unit_id`, `status`, `completed_exercises`, `total_exercises`, `best_score`, `completed_at`, `created_at`, `updated_at`)
SELECT u.id, un.id, 'COMPLETED', 10, 10, FLOOR(85 + (un.id % 3) * 5),
    DATE_SUB(NOW(), INTERVAL (13 - un.id) * 4 DAY), NOW(), NOW()
FROM `users` u JOIN `units` un ON un.id BETWEEN 1 AND 12
WHERE u.email = 'ngoc.bui@gmail.com'
ON DUPLICATE KEY UPDATE `status` = 'COMPLETED', `best_score` = VALUES(`best_score`);

INSERT INTO `user_unit_progress` (`user_id`, `unit_id`, `status`, `completed_exercises`, `total_exercises`, `best_score`, `completed_at`, `created_at`, `updated_at`)
SELECT u.id, 13, 'IN_PROGRESS', 4, 10, NULL, NULL, NOW(), NOW()
FROM `users` u WHERE u.email = 'ngoc.bui@gmail.com'
ON DUPLICATE KEY UPDATE `status` = 'IN_PROGRESS';

-- Nguyễn Thùy Linh: completed units 1–8, in_progress unit 9
INSERT INTO `user_unit_progress` (`user_id`, `unit_id`, `status`, `completed_exercises`, `total_exercises`, `best_score`, `completed_at`, `created_at`, `updated_at`)
SELECT u.id, un.id, 'COMPLETED', 10, 10, FLOOR(70 + (un.id % 4) * 5),
    DATE_SUB(NOW(), INTERVAL (9 - un.id) * 5 DAY), NOW(), NOW()
FROM `users` u JOIN `units` un ON un.id BETWEEN 1 AND 8
WHERE u.email = 'thulinh.ntt@gmail.com'
ON DUPLICATE KEY UPDATE `status` = 'COMPLETED', `best_score` = VALUES(`best_score`);

INSERT INTO `user_unit_progress` (`user_id`, `unit_id`, `status`, `completed_exercises`, `total_exercises`, `best_score`, `completed_at`, `created_at`, `updated_at`)
SELECT u.id, 9, 'IN_PROGRESS', 5, 10, NULL, NULL, NOW(), NOW()
FROM `users` u WHERE u.email = 'thulinh.ntt@gmail.com'
ON DUPLICATE KEY UPDATE `status` = 'IN_PROGRESS';

-- Lê Văn Nam: completed units 1–5, in_progress unit 6
INSERT INTO `user_unit_progress` (`user_id`, `unit_id`, `status`, `completed_exercises`, `total_exercises`, `best_score`, `completed_at`, `created_at`, `updated_at`)
SELECT u.id, un.id, 'COMPLETED', 10, 10, FLOOR(62 + (un.id % 5) * 6),
    DATE_SUB(NOW(), INTERVAL (6 - un.id) * 6 DAY), NOW(), NOW()
FROM `users` u JOIN `units` un ON un.id BETWEEN 1 AND 5
WHERE u.email = 'levannam97@gmail.com'
ON DUPLICATE KEY UPDATE `status` = 'COMPLETED', `best_score` = VALUES(`best_score`);

INSERT INTO `user_unit_progress` (`user_id`, `unit_id`, `status`, `completed_exercises`, `total_exercises`, `best_score`, `completed_at`, `created_at`, `updated_at`)
SELECT u.id, 6, 'IN_PROGRESS', 2, 10, NULL, NULL, NOW(), NOW()
FROM `users` u WHERE u.email = 'levannam97@gmail.com'
ON DUPLICATE KEY UPDATE `status` = 'IN_PROGRESS';

-- Trần Minh Tùng: đang làm unit 1
INSERT INTO `user_unit_progress` (`user_id`, `unit_id`, `status`, `completed_exercises`, `total_exercises`, `best_score`, `completed_at`, `created_at`, `updated_at`)
SELECT u.id, 1, 'IN_PROGRESS', 3, 10, NULL, NULL, NOW(), NOW()
FROM `users` u WHERE u.email = 'minhtung.tr@gmail.com'
ON DUPLICATE KEY UPDATE `status` = 'IN_PROGRESS';

-- Phạm Thu Mai: chưa bắt đầu
INSERT INTO `user_unit_progress` (`user_id`, `unit_id`, `status`, `completed_exercises`, `total_exercises`, `best_score`, `completed_at`, `created_at`, `updated_at`)
SELECT u.id, 1, 'NOT_STARTED', 0, 10, NULL, NULL, NOW(), NOW()
FROM `users` u WHERE u.email = 'phamthumai@gmail.com'
ON DUPLICATE KEY UPDATE `status` = 'NOT_STARTED';

-- ============================================================
-- 7. XP LEDGER
-- ============================================================
INSERT INTO `xp_ledger` (`user_id`, `source`, `idempotency_key`, `amount`, `created_at`)
SELECT u.id, 'MANUAL_ADJUSTMENT', CONCAT('seed:initial-xp-', u.id), u.total_xp, u.created_at
FROM `users` u
WHERE u.email IN ('ngoc.bui@gmail.com','thulinh.ntt@gmail.com','minhtung.tr@gmail.com','levannam97@gmail.com','phamthumai@gmail.com')
ON DUPLICATE KEY UPDATE `amount` = `amount`;

-- ============================================================
-- 8. NOTIFICATIONS
-- ============================================================
INSERT INTO `notifications` (`user_id`, `type`, `icon`, `title`, `body`, `is_read`, `created_at`, `updated_at`)
SELECT u.id, 'system', '🎉', 'Chào mừng bạn!',
    CONCAT('Chào mừng ', u.name, ' đến với English Learn! Bắt đầu học ngay để đạt mục tiêu của bạn.'),
    false, u.created_at, NOW()
FROM `users` u WHERE u.email IN ('ngoc.bui@gmail.com','thulinh.ntt@gmail.com','minhtung.tr@gmail.com','levannam97@gmail.com','phamthumai@gmail.com');

INSERT INTO `notifications` (`user_id`, `type`, `icon`, `title`, `body`, `is_read`, `created_at`, `updated_at`)
SELECT u.id, 'system', '🔥', 'Streak 35 ngày!',
    'Tuyệt vời! Bạn đã học liên tục 35 ngày. Hãy tiếp tục duy trì phong độ này!',
    true, DATE_SUB(NOW(), INTERVAL 1 DAY), NOW()
FROM `users` u WHERE u.email = 'ngoc.bui@gmail.com';

INSERT INTO `notifications` (`user_id`, `type`, `icon`, `title`, `body`, `is_read`, `created_at`, `updated_at`)
SELECT u.id, 'system', '🏆', 'Lên cấp 8!',
    'Chúc mừng! Bạn vừa đạt cấp độ 8. Tiếp tục chinh phục các bài học nâng cao nhé!',
    true, DATE_SUB(NOW(), INTERVAL 5 DAY), NOW()
FROM `users` u WHERE u.email = 'ngoc.bui@gmail.com';

INSERT INTO `notifications` (`user_id`, `type`, `icon`, `title`, `body`, `is_read`, `created_at`, `updated_at`)
SELECT u.id, 'system', '💡', 'Gợi ý học tập',
    'Bạn chưa học hôm nay. Chỉ cần 10 phút mỗi ngày để duy trì streak!',
    false, DATE_SUB(NOW(), INTERVAL 3 HOUR), NOW()
FROM `users` u WHERE u.email = 'thulinh.ntt@gmail.com';

INSERT INTO `notifications` (`user_id`, `type`, `icon`, `title`, `body`, `is_read`, `created_at`, `updated_at`)
SELECT u.id, 'system', '❤️', 'Tim đã được nạp đầy!',
    'Tim của bạn đã được nạp đầy. Tiếp tục luyện tập thôi!',
    false, DATE_SUB(NOW(), INTERVAL 2 HOUR), NOW()
FROM `users` u WHERE u.email = 'levannam97@gmail.com';

INSERT INTO `notifications` (`user_id`, `type`, `icon`, `title`, `body`, `is_read`, `created_at`, `updated_at`)
SELECT u.id, 'system', '📚', 'Bài học mới đã mở!',
    'Chương "Giao Tiếp" đã mở khóa. Khám phá các bài học thú vị ngay hôm nay!',
    false, DATE_SUB(NOW(), INTERVAL 1 DAY), NOW()
FROM `users` u WHERE u.email = 'minhtung.tr@gmail.com';

-- ============================================================
-- 9. EXAMS (bài kiểm tra do user tạo)
-- ============================================================
INSERT INTO `exams` (`creator_id`, `title`, `description`, `category`, `difficulty`, `is_public`, `is_premium`, `question_count`, `created_at`, `updated_at`)
SELECT u.id, 'Grammar Cơ Bản - Thì Hiện Tại',
    'Bài kiểm tra các thì hiện tại đơn, hiện tại tiếp diễn và hiện tại hoàn thành.',
    'Grammar', 'EASY', true, false, 20, DATE_SUB(NOW(), INTERVAL 3 DAY), NOW()
FROM `users` u WHERE u.email = 'ngoc.bui@gmail.com';

INSERT INTO `exams` (`creator_id`, `title`, `description`, `category`, `difficulty`, `is_public`, `is_premium`, `question_count`, `created_at`, `updated_at`)
SELECT u.id, 'Từ Vựng Chủ Đề Du Lịch',
    'Kiểm tra từ vựng tiếng Anh liên quan đến du lịch, khách sạn và phương tiện di chuyển.',
    'Vocabulary', 'MEDIUM', true, false, 30, DATE_SUB(NOW(), INTERVAL 2 DAY), NOW()
FROM `users` u WHERE u.email = 'ngoc.bui@gmail.com';

INSERT INTO `exams` (`creator_id`, `title`, `description`, `category`, `difficulty`, `is_public`, `is_premium`, `question_count`, `created_at`, `updated_at`)
SELECT u.id, 'Luyện Đọc - Business English',
    'Bài đọc hiểu chủ đề kinh doanh, email công ty và báo cáo.',
    'Reading', 'HARD', true, true, 15, DATE_SUB(NOW(), INTERVAL 1 DAY), NOW()
FROM `users` u WHERE u.email = 'thulinh.ntt@gmail.com';

INSERT INTO `exams` (`creator_id`, `title`, `description`, `category`, `difficulty`, `is_public`, `is_premium`, `question_count`, `created_at`, `updated_at`)
SELECT u.id, 'Phát Âm Và Ngữ Điệu',
    'Luyện tập phát âm các âm khó và ngữ điệu câu hỏi, câu cảm thán.',
    'Speaking', 'MEDIUM', true, false, 25, NOW(), NOW()
FROM `users` u WHERE u.email = 'levannam97@gmail.com';

-- ============================================================
-- 10. SUBSCRIPTIONS
-- ============================================================
INSERT INTO `user_subscriptions` (`user_id`, `plan`, `status`, `payment_method`, `started_at`, `expires_at`, `created_at`, `updated_at`)
SELECT u.id, 'yearly', 'ACTIVE', 'momo',
    DATE_SUB(NOW(), INTERVAL 30 DAY), DATE_ADD(NOW(), INTERVAL 335 DAY),
    DATE_SUB(NOW(), INTERVAL 30 DAY), NOW()
FROM `users` u WHERE u.email = 'ngoc.bui@gmail.com'
ON DUPLICATE KEY UPDATE `plan` = `plan`;

INSERT INTO `user_subscriptions` (`user_id`, `plan`, `status`, `payment_method`, `started_at`, `expires_at`, `created_at`, `updated_at`)
SELECT u.id, 'monthly', 'ACTIVE', 'card',
    DATE_SUB(NOW(), INTERVAL 5 DAY), DATE_ADD(NOW(), INTERVAL 25 DAY),
    DATE_SUB(NOW(), INTERVAL 5 DAY), NOW()
FROM `users` u WHERE u.email = 'thulinh.ntt@gmail.com'
ON DUPLICATE KEY UPDATE `plan` = `plan`;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- TÀI KHOẢN MẪU
-- Email                       | Mật khẩu    | Vai trò | Ghi chú
-- admin@englishapp.vn         | Admin@2024  | ADMIN   | Quản trị viên
-- ngoc.bui@gmail.com          | Ngoc@123    | USER    | 4500 XP, streak 35, gói Yearly
-- thulinh.ntt@gmail.com       | Linh@456    | USER    | 2200 XP, streak 12, gói Monthly
-- levannam97@gmail.com        | Nam@321     | USER    | 1650 XP, streak 8
-- minhtung.tr@gmail.com       | Tung@789    | USER    | 800 XP, mới học
-- phamthumai@gmail.com        | Mai@654     | USER    | 350 XP, vừa đăng ký
-- ============================================================
