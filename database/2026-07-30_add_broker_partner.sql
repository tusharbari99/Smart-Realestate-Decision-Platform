ALTER TABLE users
MODIFY COLUMN role
ENUM('buyer','seller','broker','admin')
NOT NULL DEFAULT 'buyer';

CREATE TABLE IF NOT EXISTS broker_profiles (
  broker_id INT NOT NULL AUTO_INCREMENT,
  user_id INT NOT NULL,
  agency_name VARCHAR(150) NOT NULL,
  service_city VARCHAR(100) NOT NULL,
  registration_id VARCHAR(100) DEFAULT NULL,
  verification_status ENUM(
    'pending',
    'verified',
    'rejected'
  ) NOT NULL DEFAULT 'pending',
  partner_tier ENUM(
    'starter',
    'growth',
    'pro'
  ) NOT NULL DEFAULT 'starter',
  discount_percent DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (broker_id),
  UNIQUE KEY unique_broker_user (user_id),
  UNIQUE KEY unique_broker_registration (registration_id),
  CONSTRAINT fk_broker_profile_user
    FOREIGN KEY (user_id)
    REFERENCES users(user_id)
    ON DELETE CASCADE
);
