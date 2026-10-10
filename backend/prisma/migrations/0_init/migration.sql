-- ==============================================================================
-- Initial Migration: Schema for GCP Quota Governance & Increase Request Planning
-- Database: MySQL 8.0+
-- ==============================================================================

-- Create Users Table
CREATE TABLE IF NOT EXISTS `users` (
    `id` VARCHAR(36) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `role` ENUM('ADMIN', 'DEVELOPER', 'VIEWER') NOT NULL DEFAULT 'DEVELOPER',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) ENGINE = InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create Projects Table
CREATE TABLE IF NOT EXISTS `projects` (
    `id` VARCHAR(36) NOT NULL,
    `gcp_project_id` VARCHAR(255) NOT NULL,
    `environment` VARCHAR(50) NOT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE INDEX `projects_gcp_project_id_key`(`gcp_project_id`),
    PRIMARY KEY (`id`)
) ENGINE = InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create Quota Metrics Table
CREATE TABLE IF NOT EXISTS `quota_metrics` (
    `id` VARCHAR(36) NOT NULL,
    `project_id` VARCHAR(36) NOT NULL,
    `metric_name` VARCHAR(255) NOT NULL,
    `region` VARCHAR(100) NOT NULL,
    `current_usage` FLOAT NOT NULL,
    `quota_limit` FLOAT NOT NULL,
    `utilization_percentage` FLOAT NOT NULL,
    `last_synced_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `quota_metrics_project_id_idx`(`project_id`),
    INDEX `quota_metrics_lookup_idx`(`project_id`, `metric_name`, `region`),
    PRIMARY KEY (`id`),
    CONSTRAINT `quota_metrics_project_id_fkey` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create Usage Observations Table
CREATE TABLE IF NOT EXISTS `usage_observations` (
    `id` VARCHAR(36) NOT NULL,
    `quota_metric_id` VARCHAR(36) NOT NULL,
    `usage_value` FLOAT NOT NULL,
    `observed_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX `usage_observations_metric_time_idx`(`quota_metric_id`, `observed_at`),
    PRIMARY KEY (`id`),
    CONSTRAINT `usage_observations_quota_metric_id_fkey` FOREIGN KEY (`quota_metric_id`) REFERENCES `quota_metrics` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create Demand Forecasts Table
CREATE TABLE IF NOT EXISTS `demand_forecasts` (
    `id` VARCHAR(36) NOT NULL,
    `quota_metric_id` VARCHAR(36) NOT NULL,
    `projected_burn_rate` FLOAT NOT NULL,
    `days_to_saturation` INT NOT NULL,
    `forecast_horizon_days` INT NOT NULL DEFAULT 30,
    `generated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX `demand_forecasts_metric_idx`(`quota_metric_id`, `generated_at`),
    PRIMARY KEY (`id`),
    CONSTRAINT `demand_forecasts_quota_metric_id_fkey` FOREIGN KEY (`quota_metric_id`) REFERENCES `quota_metrics` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create Increase Requests Table
CREATE TABLE IF NOT EXISTS `increase_requests` (
    `id` VARCHAR(36) NOT NULL,
    `quota_metric_id` VARCHAR(36) NOT NULL,
    `requested_by` VARCHAR(255) NOT NULL,
    `current_limit` FLOAT NOT NULL,
    `requested_limit` FLOAT NOT NULL,
    `business_justification` TEXT NOT NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED', 'GCP_SUBMITTED', 'GCP_FULFILLED', 'FAILED') NOT NULL DEFAULT 'PENDING',
    `confidence_score` INT NOT NULL DEFAULT 75,
    `admin_comments` TEXT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `increase_requests_quota_metric_id_idx`(`quota_metric_id`),
    INDEX `increase_requests_status_idx`(`status`),
    PRIMARY KEY (`id`),
    CONSTRAINT `increase_requests_quota_metric_id_fkey` FOREIGN KEY (`quota_metric_id`) REFERENCES `quota_metrics` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create Notifications Table
CREATE TABLE IF NOT EXISTS `notifications` (
    `id` VARCHAR(36) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `message` TEXT NOT NULL,
    `channel` VARCHAR(50) NOT NULL DEFAULT 'webhook',
    `severity` VARCHAR(20) NOT NULL DEFAULT 'info',
    `delivered` BOOLEAN NOT NULL DEFAULT FALSE,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) ENGINE = InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create Audit Events Table
CREATE TABLE IF NOT EXISTS `audit_events` (
    `id` VARCHAR(36) NOT NULL,
    `user_id` VARCHAR(36) NULL,
    `action` VARCHAR(100) NOT NULL,
    `resource_type` VARCHAR(50) NOT NULL,
    `resource_id` VARCHAR(100) NOT NULL,
    `metadata` TEXT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX `audit_events_lookup_idx`(`action`, `resource_type`, `created_at`),
    PRIMARY KEY (`id`),
    CONSTRAINT `audit_events_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
