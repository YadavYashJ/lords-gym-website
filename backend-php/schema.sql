-- ============================================================
-- LORD'S GYM DATABASE SCHEMA
-- Database: lords_gym_db
-- Developer: Yadav Yash Jayprakash | En.Roll: 202506101410003
-- XAMPP / MySQL 8.x
-- ============================================================

CREATE DATABASE IF NOT EXISTS lords_gym_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE lords_gym_db;

-- ============================================================
-- TABLE: membership_plans
-- ============================================================
CREATE TABLE IF NOT EXISTS membership_plans (
    id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
    plan_name  VARCHAR(100) NOT NULL,
    price      DECIMAL(10,2) NOT NULL COMMENT 'Monthly price in INR',
    duration   INT NOT NULL DEFAULT 30 COMMENT 'Duration in days',
    inclusions TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed membership plans (matching UI options)
INSERT INTO membership_plans (plan_name, price, duration, inclusions) VALUES
('Normal Gym',                     1500.00, 30, 'Cardio equipment, Free weights, Locker access'),
('Gym with Trainer',               4000.00, 30, 'Everything in Normal Gym + Dedicated personal trainer, Custom workout plan'),
('Gym with Trainer & Dietician',   5000.00, 30, 'Everything in Gym with Trainer + Certified dietician, Customised meal plan, Progress tracking');


-- ============================================================
-- TABLE: amenities
-- ============================================================
CREATE TABLE IF NOT EXISTS amenities (
    id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
    name        VARCHAR(100) NOT NULL,
    description TEXT,
    icon        VARCHAR(60) COMMENT 'Material Symbol icon name',
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed 6 core facilities
INSERT INTO amenities (name, description, icon) VALUES
('Heavy Free Weights',    'Full Olympic barbell sets, dumbbell rack up to 50 kg, powerlifting platforms.', 'fitness_center'),
('Cardio Equipment',      'Commercial-grade treadmills, cross trainers, assault bikes, and rowing machines.', 'directions_run'),
('Personal Training',     'Dedicated floor time with certified head coach Imran Pathan and lead trainers.', 'sports_gymnastics'),
('Diet & Nutrition',      'Certified dietician consultation and customised meal plan for elite members.', 'restaurant'),
('Chilled RO Water',      'Pure alkaline RO water dispenser cleaned daily at 5:00 AM on the 2nd floor.', 'water_drop'),
('Secure Locker Room',    'Individual combination lockers, changing rooms, and 24-hour CCTV security.', 'lock');


-- ============================================================
-- TABLE: enquiries
-- Captures web leads from the Contact / Enquiry Desk page
-- ============================================================
CREATE TABLE IF NOT EXISTS enquiries (
    id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
    visitor_name VARCHAR(120) NOT NULL,
    mobile       CHAR(10)     NOT NULL COMMENT '10-digit Indian mobile number',
    plan_id      INT UNSIGNED NULL COMMENT 'FK to membership_plans; NULL = walk-in/general',
    plan_label   VARCHAR(120) NULL COMMENT 'Human-readable plan label from form select',
    message      TEXT,
    slot_pref    VARCHAR(60)  NULL COMMENT 'Preferred session slot selected on form',
    status       ENUM('New','Contacted','Converted','Dropped') NOT NULL DEFAULT 'New',
    created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_status     (status),
    INDEX idx_created_at (created_at),
    CONSTRAINT fk_enquiry_plan
        FOREIGN KEY (plan_id) REFERENCES membership_plans(id)
        ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- TABLE: users
-- Handles authentication for Admin (owner) and Members
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id                   INT UNSIGNED NOT NULL AUTO_INCREMENT,
    full_name            VARCHAR(120) NOT NULL,
    email                VARCHAR(180) NOT NULL,
    mobile               CHAR(10)     NULL,
    password_hash        VARCHAR(255) NOT NULL COMMENT 'bcrypt hash via password_hash()',
    role                 ENUM('admin','member') NOT NULL DEFAULT 'member',
    active_plan_id       INT UNSIGNED NULL COMMENT 'FK to membership_plans',
    subscription_start   DATE         NULL,
    subscription_end     DATE         NULL COMMENT 'Used for Days-Left calculation',
    is_active            TINYINT(1)   NOT NULL DEFAULT 1,
    created_at           TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_email  (email),
    INDEX idx_role       (role),
    INDEX idx_active     (is_active),
    CONSTRAINT fk_user_plan
        FOREIGN KEY (active_plan_id) REFERENCES membership_plans(id)
        ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Seed: Default Admin user — Imran Pathan (gym owner)
-- Password: LordsGym@2025   (change immediately after first login)
-- Hash generated with:  password_hash('LordsGym@2025', PASSWORD_BCRYPT)
-- ============================================================
INSERT INTO users (full_name, email, mobile, password_hash, role, is_active)
VALUES (
    'Imran Pathan',
    'thelordsgymsachin@gmail.com',
    '9998841979',
    '$2y$12$eC8xWWoM5hXqHK8Dy.TN3Oy0pGhU7BmvWXnj3ZI3tYnVK4vRqMZ0K',
    'admin',
    1
);

-- ============================================================
-- Seed: Sample member (Yash — displayed in dashboard UI)
-- Password: Member@123
-- ============================================================
INSERT INTO users (full_name, email, mobile, password_hash, role, active_plan_id, subscription_start, subscription_end, is_active)
VALUES (
    'Yash Jayprakash',
    'yash@example.com',
    '9876543210',
    '$2y$12$s9h3LqKLqKR3TRfTW5ZSUuvwZM8U5BrNEJ3E/sMVULbp4vF9l2Yqm',
    'member',
    2,
    CURDATE() - INTERVAL 12 DAY,
    CURDATE() + INTERVAL 18 DAY,
    1
);
