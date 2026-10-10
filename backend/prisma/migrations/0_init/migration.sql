-- ==============================================================================
-- Initial Migration: Schema for GCP Quota Governance & Increase Request Planning
-- Database: MySQL 8.0+
-- ==============================================================================

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
    PRIMARY KEY (`id`),
    CONSTRAINT `quota_metrics_project_id_fkey` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
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
    `admin_comments` TEXT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `increase_requests_quota_metric_id_idx`(`quota_metric_id`),
    PRIMARY KEY (`id`),
    CONSTRAINT `increase_requests_quota_metric_id_fkey` FOREIGN KEY (`quota_metric_id`) REFERENCES `quota_metrics` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
