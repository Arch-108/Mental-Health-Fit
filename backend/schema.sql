-- Telemedicine Platform - Initial Schema (Sprint 0-2 scope)
-- Run this against your MySQL database before starting the server.
-- Later sprints (appointments, consultations, records, AI briefs, follow-ups,
-- care circle) will extend this file incrementally - do not build those
-- tables yet, per the phased roadmap.


-- Base authentication + role table. Patients and Doctors extend this
-- with a 1:1 profile table rather than duplicating auth fields.
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('patient', 'doctor', 'admin') NOT NULL DEFAULT 'patient',
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_role (role)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS patients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  date_of_birth DATE,
  address VARCHAR(255),
  preferred_language VARCHAR(50) DEFAULT 'en',
  simple_mode_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS doctors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  specialty VARCHAR(150),
  license_number VARCHAR(100),
  verification_status ENUM('pending', 'verified', 'rejected') NOT NULL DEFAULT 'pending',
  bio TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Write-only audit trail for medical-data-relevant actions (NFR2 from the
-- research doc). The app layer should only ever INSERT here, never
-- UPDATE/DELETE, to preserve integrity.
CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  action VARCHAR(100) NOT NULL,
  resource VARCHAR(100),
  metadata JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================================
-- Increment 2: Appointments, Consultations, AI features,
-- Continuity of Care, Care Circle, Resource Map
-- ============================================================

CREATE TABLE IF NOT EXISTS doctor_availability (
  id INT AUTO_INCREMENT PRIMARY KEY,
  doctor_id INT NOT NULL,
  day_of_week TINYINT NOT NULL, -- 0=Sunday .. 6=Saturday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  slot_minutes INT NOT NULL DEFAULT 30,
  FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
  INDEX idx_avail_doctor_day (doctor_id, day_of_week)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS appointments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  doctor_id INT NOT NULL,
  scheduled_at DATETIME NOT NULL,
  status ENUM('pending','confirmed','completed','cancelled') NOT NULL DEFAULT 'pending',
  reason VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
  INDEX idx_appt_doctor_time (doctor_id, scheduled_at),
  INDEX idx_appt_patient_time (patient_id, scheduled_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS consultations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  appointment_id INT NOT NULL UNIQUE,
  room_code VARCHAR(64) NOT NULL UNIQUE,
  notes TEXT,
  connection_mode_log JSON,
  started_at TIMESTAMP NULL,
  ended_at TIMESTAMP NULL,
  FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS async_submissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  consultation_id INT NOT NULL,
  sender_role ENUM('patient','doctor') NOT NULL,
  message TEXT,
  image_path VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (consultation_id) REFERENCES consultations(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS medical_records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  entry_type ENUM('consultation','diagnosis','note','goal','event') NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT,
  created_by INT, -- users.id of the clinician/system that wrote it
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  INDEX idx_records_patient_time (patient_id, created_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS prescriptions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  consultation_id INT NOT NULL,
  medication VARCHAR(255) NOT NULL,
  instructions TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (consultation_id) REFERENCES consultations(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS consultation_briefs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  appointment_id INT NOT NULL UNIQUE,
  structured_intake JSON NOT NULL,
  ai_summary TEXT,
  patient_edited BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS follow_ups (
  id INT AUTO_INCREMENT PRIMARY KEY,
  consultation_id INT NOT NULL,
  due_date DATE NOT NULL,
  status ENUM('pending','submitted','reviewed') NOT NULL DEFAULT 'pending',
  patient_response TEXT,
  ai_summary TEXT,
  doctor_reviewed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (consultation_id) REFERENCES consultations(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS care_circle_members (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  caregiver_email VARCHAR(255) NOT NULL,
  caregiver_user_id INT NULL,
  scopes JSON NOT NULL, -- e.g. ["appointments","followups"]
  status ENUM('pending','active','revoked') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (caregiver_user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS healthcare_facilities (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type ENUM('clinic','hospital','pharmacy','specialist','emergency') NOT NULL,
  address VARCHAR(255),
  latitude DECIMAL(10,7),
  longitude DECIMAL(10,7),
  phone VARCHAR(50),
  telehealth_available BOOLEAN NOT NULL DEFAULT FALSE,
  open_24_7 BOOLEAN NOT NULL DEFAULT FALSE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  type VARCHAR(50) NOT NULL,
  message VARCHAR(500) NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_notif_user (user_id, is_read)
) ENGINE=InnoDB;

-- Seed a handful of demo facilities (Sydney area, plausible-looking, for
-- the map demo). Replace/expand with real data before any real deployment.
INSERT INTO healthcare_facilities (name, type, address, latitude, longitude, phone, telehealth_available, open_24_7)
VALUES
  ('Riverside Community Clinic', 'clinic', '12 Riverside Rd, Wilcannia NSW', -31.5595, 143.3789, '02 5000 1111', TRUE, FALSE),
  ('Outback Regional Hospital', 'hospital', '5 Hospital Dr, Broken Hill NSW', -31.9581, 141.4678, '02 5000 2222', FALSE, TRUE),
  ('Far West Pharmacy', 'pharmacy', '88 Main St, Broken Hill NSW', -31.9600, 141.4700, '02 5000 3333', FALSE, FALSE),
  ('Bush Telehealth Specialist Centre', 'specialist', '3 Health Ave, Dubbo NSW', -32.2569, 148.6011, '02 5000 4444', TRUE, FALSE),
  ('24/7 Emergency & Urgent Care', 'emergency', '1 Emergency Way, Dubbo NSW', -32.2500, 148.6100, '000', FALSE, TRUE)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- ============================================================
-- Increment 3: Forever Fit rebrand + extra modules
-- (Vitals Monitoring, Maternal Care Check-ins, Vaccination
-- Outreach Planner, Crisis Support - the last is informational
-- only and needs no table, see CrisisSupport.jsx)
-- ============================================================

CREATE TABLE IF NOT EXISTS vitals_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  heart_rate INT,
  spo2 INT,
  steps INT,
  sleep_hours DECIMAL(4,1),
  flagged BOOLEAN NOT NULL DEFAULT FALSE,
  flag_reason VARCHAR(255),
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  INDEX idx_vitals_patient_time (patient_id, recorded_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS maternal_checkins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  gestational_week INT,
  symptoms TEXT,
  red_flag BOOLEAN NOT NULL DEFAULT FALSE,
  red_flag_reason VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  INDEX idx_maternal_patient_time (patient_id, created_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS vaccination_routes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  created_by INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  cold_chain_limit_hours DECIMAL(4,1) NOT NULL DEFAULT 8.0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS vaccination_route_stops (
  id INT AUTO_INCREMENT PRIMARY KEY,
  route_id INT NOT NULL,
  facility_id INT NOT NULL,
  stop_order INT NOT NULL,
  service_minutes INT NOT NULL DEFAULT 20,
  FOREIGN KEY (route_id) REFERENCES vaccination_routes(id) ON DELETE CASCADE,
  FOREIGN KEY (facility_id) REFERENCES healthcare_facilities(id) ON DELETE CASCADE,
  INDEX idx_route_stops_route (route_id, stop_order)
) ENGINE=InnoDB;

-- ============================================================
-- Increment 4: Staff messaging (doctor/admin direct messages) and
-- admin announcements. Profile editing and password change reuse the
-- existing users/doctors columns - no schema change needed for those.
-- ============================================================

CREATE TABLE IF NOT EXISTS staff_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sender_id INT NOT NULL,
  recipient_id INT NOT NULL,
  body TEXT NOT NULL,
  related_patient_id INT NULL, -- optional "this is about patient X" context
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (related_patient_id) REFERENCES patients(id) ON DELETE SET NULL,
  INDEX idx_staffmsg_conversation (sender_id, recipient_id, created_at),
  INDEX idx_staffmsg_inbox (recipient_id, is_read)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS announcements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  author_id INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Forgot-password support. Only ever stores a HASH of the reset token,
-- never the raw token itself (mirrors how password_hash never stores the
-- real password) - see auth.controller.js forgotPassword/resetPassword.
-- One-time addition (MySQL < 8.0.29 doesn't support "ADD COLUMN IF NOT
-- EXISTS", so unlike the rest of this file, re-running this exact ALTER
-- after it's already applied will error "duplicate column" - that's
-- expected, not a sign something's wrong).
ALTER TABLE users ADD COLUMN reset_token_hash VARCHAR(255) NULL;
ALTER TABLE users ADD COLUMN reset_token_expires TIMESTAMP NULL;
