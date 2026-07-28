-- Run this once in phpMyAdmin after importing smart_real_estate.sql.
-- It adds decision-support data without deleting or changing existing records.

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS commission_terms_accepted TINYINT(1) NOT NULL DEFAULT 0
  AFTER needs_3d_shoot;

CREATE TABLE property_intelligence (
  intelligence_id INT NOT NULL AUTO_INCREMENT,
  property_id INT NOT NULL,
  growth_score TINYINT NOT NULL DEFAULT 0,
  investment_score TINYINT NOT NULL DEFAULT 0,
  livability_score TINYINT NOT NULL DEFAULT 0,
  risk_score TINYINT NOT NULL DEFAULT 0,
  future_outlook ENUM('high', 'moderate', 'watch') NOT NULL DEFAULT 'watch',
  summary TEXT NULL,
  highlights_json JSON NULL,
  cautions_json JSON NULL,
  generated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (intelligence_id),
  UNIQUE KEY unique_property_intelligence (property_id),
  CONSTRAINT fk_intelligence_property
    FOREIGN KEY (property_id) REFERENCES properties(property_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE three_d_requests (
  request_id INT NOT NULL AUTO_INCREMENT,
  property_id INT NOT NULL,
  requested_by INT NOT NULL,
  status ENUM('requested', 'scheduled', 'captured', 'published', 'cancelled') NOT NULL DEFAULT 'requested',
  scheduled_at DATETIME NULL,
  seller_notes TEXT NULL,
  admin_notes TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (request_id),
  UNIQUE KEY unique_property_3d_request (property_id),
  KEY fk_3d_request_seller (requested_by),
  CONSTRAINT fk_3d_request_property
    FOREIGN KEY (property_id) REFERENCES properties(property_id) ON DELETE CASCADE,
  CONSTRAINT fk_3d_request_seller
    FOREIGN KEY (requested_by) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
