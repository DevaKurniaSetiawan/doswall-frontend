CREATE TABLE IF NOT EXISTS `accounts_tb` (
  `user_id` varchar(100) NOT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `geotag` varchar(100) NOT NULL DEFAULT '',
  `password` varchar(100) NOT NULL,
  `role` varchar(20) NOT NULL,
  `status` tinyint(1) NOT NULL DEFAULT 0,
  `notes` varchar(75) NOT NULL DEFAULT '',
  `last_update` varchar(50) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `token` varchar(50) NOT NULL,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `accounts_tb_email_unique` (`email`),
  UNIQUE KEY `accounts_tb_token_unique` (`token`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `announcements_queue` (
  `order` int(200) NOT NULL,
  `duration` varchar(200) NOT NULL,
  `announcement_id` varchar(200) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  KEY `announcements_queue_announcement_id` (`announcement_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `announcements_tb` (
  `announcement_id` varchar(100) NOT NULL,
  `title` varchar(50) NOT NULL,
  `content` varchar(2500) NOT NULL,
  `user_id` varchar(100) NOT NULL,
  `created_at` varchar(50) NOT NULL,
  PRIMARY KEY (`announcement_id`),
  KEY `announcements_tb_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `password_reset_pins` (
  `id` int(200) NOT NULL AUTO_INCREMENT,
  `user_id` varchar(200) NOT NULL,
  `pin` varchar(6) NOT NULL,
  `expires_at` datetime NOT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `restrict_display_tb` (
  `user_id` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  PRIMARY KEY (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
