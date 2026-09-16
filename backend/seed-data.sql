-- Forever Fit - Demo Seed Data
-- Run this AFTER schema.sql, against your existing database, using the
-- same "Load SQL file" method in HeidiSQL. It's safe to run even if you
-- already have accounts - it looks up IDs by email rather than assuming
-- specific numbers, so it won't collide with your existing test accounts.
--
-- ALL seeded accounts use the password:  Password123!
-- (This is a bcrypt hash of that password baked in below - never do this
-- with a real production password.)

SET @pw := '$2a$12$z59Csd6LToEoE/4uyHLug.4z15Tb1XDOV.Oni0TYY/H6g5aBZxl5u';

-- ============================================================
-- 1. Admin
-- ============================================================
INSERT INTO users (email, password_hash, role, full_name, phone)
VALUES ('admin@foreverfit.test', @pw, 'admin', 'Ava Administrator', '0400 000 001')
ON DUPLICATE KEY UPDATE email = email;

-- ============================================================
-- 2. Doctors (3) - two verified so they're bookable, one pending so
--    you have something to approve on the Doctor Verification page
-- ============================================================
INSERT INTO users (email, password_hash, role, full_name, phone) VALUES
  ('dr.chen@foreverfit.test', @pw, 'doctor', 'Mei Chen', '0400 000 010'),
  ('dr.okafor@foreverfit.test', @pw, 'doctor', 'Ade Okafor', '0400 000 011'),
  ('dr.singh@foreverfit.test', @pw, 'doctor', 'Priya Singh', '0400 000 012')
ON DUPLICATE KEY UPDATE email = email;

SET @doc1_user := (SELECT id FROM users WHERE email = 'dr.chen@foreverfit.test');
SET @doc2_user := (SELECT id FROM users WHERE email = 'dr.okafor@foreverfit.test');
SET @doc3_user := (SELECT id FROM users WHERE email = 'dr.singh@foreverfit.test');

INSERT INTO doctors (user_id, specialty, license_number, verification_status, bio) VALUES
  (@doc1_user, 'General Practice', 'GP-10234', 'verified', 'General practitioner with a focus on rural and remote patient care.'),
  (@doc2_user, 'Paediatrics', 'PD-88213', 'verified', 'Paediatrician supporting families across regional communities.'),
  (@doc3_user, 'Dermatology', 'DM-55210', 'pending', 'Dermatologist - awaiting admin verification.')
ON DUPLICATE KEY UPDATE specialty = VALUES(specialty);

SET @doc1_id := (SELECT id FROM doctors WHERE user_id = @doc1_user);
SET @doc2_id := (SELECT id FROM doctors WHERE user_id = @doc2_user);
SET @doc3_id := (SELECT id FROM doctors WHERE user_id = @doc3_user);

-- Weekly availability: Mon/Wed/Fri mornings for Dr Chen, Tue/Thu afternoons for Dr Okafor
INSERT INTO doctor_availability (doctor_id, day_of_week, start_time, end_time, slot_minutes) VALUES
  (@doc1_id, 1, '09:00:00', '12:00:00', 30),
  (@doc1_id, 3, '09:00:00', '12:00:00', 30),
  (@doc1_id, 5, '09:00:00', '12:00:00', 30),
  (@doc2_id, 2, '13:00:00', '17:00:00', 30),
  (@doc2_id, 4, '13:00:00', '17:00:00', 30)
ON DUPLICATE KEY UPDATE slot_minutes = VALUES(slot_minutes);

-- ============================================================
-- 3. Patients (6)
-- ============================================================
INSERT INTO users (email, password_hash, role, full_name, phone) VALUES
  ('patient.jones@foreverfit.test', @pw, 'patient', 'Sarah Jones', '0400 000 020'),
  ('patient.lee@foreverfit.test', @pw, 'patient', 'David Lee', '0400 000 021'),
  ('patient.wilson@foreverfit.test', @pw, 'patient', 'Emma Wilson', '0400 000 022'),
  ('patient.brown@foreverfit.test', @pw, 'patient', 'James Brown', '0400 000 023'),
  ('patient.taylor@foreverfit.test', @pw, 'patient', 'Grace Taylor', '0400 000 024'),
  ('patient.nguyen@foreverfit.test', @pw, 'patient', 'Linh Nguyen', '0400 000 025')
ON DUPLICATE KEY UPDATE email = email;

SET @pat1_user := (SELECT id FROM users WHERE email = 'patient.jones@foreverfit.test');
SET @pat2_user := (SELECT id FROM users WHERE email = 'patient.lee@foreverfit.test');
SET @pat3_user := (SELECT id FROM users WHERE email = 'patient.wilson@foreverfit.test');
SET @pat4_user := (SELECT id FROM users WHERE email = 'patient.brown@foreverfit.test');
SET @pat5_user := (SELECT id FROM users WHERE email = 'patient.taylor@foreverfit.test');
SET @pat6_user := (SELECT id FROM users WHERE email = 'patient.nguyen@foreverfit.test');

INSERT INTO patients (user_id, date_of_birth, address, preferred_language) VALUES
  (@pat1_user, '1990-04-12', 'Wilcannia NSW', 'en'),
  (@pat2_user, '1985-11-02', 'Broken Hill NSW', 'en'),
  (@pat3_user, '2000-07-19', 'Dubbo NSW', 'en'),
  (@pat4_user, '1978-01-30', 'Wilcannia NSW', 'en'),
  (@pat5_user, '1995-09-08', 'Broken Hill NSW', 'en'),
  (@pat6_user, '1988-03-22', 'Dubbo NSW', 'vi')
ON DUPLICATE KEY UPDATE address = VALUES(address);

SET @pat1_id := (SELECT id FROM patients WHERE user_id = @pat1_user);
SET @pat2_id := (SELECT id FROM patients WHERE user_id = @pat2_user);
SET @pat3_id := (SELECT id FROM patients WHERE user_id = @pat3_user);
SET @pat4_id := (SELECT id FROM patients WHERE user_id = @pat4_user);
SET @pat5_id := (SELECT id FROM patients WHERE user_id = @pat5_user);
SET @pat6_id := (SELECT id FROM patients WHERE user_id = @pat6_user);

-- ============================================================
-- 4. Appointments spread over the last 6 weeks (for analytics charts)
--    + a couple of upcoming ones. Mostly Dr Chen, a few with Dr Okafor.
-- ============================================================
INSERT INTO appointments (patient_id, doctor_id, scheduled_at, status, reason) VALUES
  (@pat1_id, @doc1_id, DATE_SUB(NOW(), INTERVAL 41 DAY), 'completed', 'Persistent cough'),
  (@pat2_id, @doc1_id, DATE_SUB(NOW(), INTERVAL 38 DAY), 'completed', 'Annual check-up'),
  (@pat3_id, @doc2_id, DATE_SUB(NOW(), INTERVAL 35 DAY), 'completed', 'Child vaccination follow-up'),
  (@pat4_id, @doc1_id, DATE_SUB(NOW(), INTERVAL 29 DAY), 'completed', 'Headaches'),
  (@pat1_id, @doc1_id, DATE_SUB(NOW(), INTERVAL 22 DAY), 'completed', 'Follow-up on cough'),
  (@pat5_id, @doc2_id, DATE_SUB(NOW(), INTERVAL 20 DAY), 'cancelled', 'Rash'),
  (@pat2_id, @doc1_id, DATE_SUB(NOW(), INTERVAL 15 DAY), 'completed', 'Blood pressure review'),
  (@pat6_id, @doc1_id, DATE_SUB(NOW(), INTERVAL 9 DAY), 'completed', 'Fatigue'),
  (@pat3_id, @doc2_id, DATE_SUB(NOW(), INTERVAL 6 DAY), 'completed', 'Growth check'),
  (@pat4_id, @doc1_id, DATE_SUB(NOW(), INTERVAL 2 DAY), 'completed', 'Follow-up on headaches'),
  (@pat5_id, @doc1_id, DATE_ADD(NOW(), INTERVAL 2 DAY), 'confirmed', 'General consultation'),
  (@pat6_id, @doc2_id, DATE_ADD(NOW(), INTERVAL 4 DAY), 'confirmed', 'Vaccination');

-- ============================================================
-- 5. Consultations, notes & prescriptions for the completed appointments
-- ============================================================
INSERT INTO consultations (appointment_id, room_code, notes, started_at, ended_at)
SELECT id, CONCAT('seed-', id, '-', FLOOR(RAND()*100000)),
  CASE reason
    WHEN 'Persistent cough' THEN 'Likely viral upper respiratory infection. Advised rest and fluids, review if not improved in a week.'
    WHEN 'Annual check-up' THEN 'All observations within normal range. No concerns raised.'
    WHEN 'Child vaccination follow-up' THEN 'No adverse reaction noted. Growth on track.'
    WHEN 'Headaches' THEN 'Tension-type headache suspected. Discussed hydration and screen-time breaks.'
    WHEN 'Follow-up on cough' THEN 'Cough resolved. No further action needed.'
    WHEN 'Blood pressure review' THEN 'Blood pressure stable on current management.'
    WHEN 'Fatigue' THEN 'Discussed sleep hygiene and workload. Bloods requested for further review.'
    WHEN 'Growth check' THEN 'Growth tracking on expected curve.'
    WHEN 'Follow-up on headaches' THEN 'Headaches improved with hydration changes. No red flags.'
    ELSE 'Consultation completed.'
  END,
  scheduled_at, DATE_ADD(scheduled_at, INTERVAL 20 MINUTE)
FROM appointments WHERE status = 'completed'
  AND id NOT IN (SELECT appointment_id FROM consultations);

-- A couple of prescriptions
INSERT INTO prescriptions (consultation_id, medication, instructions)
SELECT c.id, 'Paracetamol 500mg', 'Take 1-2 tablets every 4-6 hours as needed for pain, max 8 in 24 hours.'
FROM consultations c JOIN appointments a ON a.id = c.appointment_id WHERE a.reason = 'Headaches';

-- ============================================================
-- 6. My Health Journey entries (mirrors the consultation notes)
-- ============================================================
INSERT INTO medical_records (patient_id, entry_type, title, content, created_by)
SELECT a.patient_id, 'consultation', CONCAT('Consultation - ', a.reason), c.notes, d.user_id
FROM consultations c
JOIN appointments a ON a.id = c.appointment_id
JOIN doctors d ON d.id = a.doctor_id;

-- ============================================================
-- 7. Follow-ups - a mix of pending, submitted, and reviewed
-- ============================================================
INSERT INTO follow_ups (consultation_id, due_date, status, patient_response, ai_summary, doctor_reviewed_at)
SELECT c.id, DATE_ADD(DATE(a.scheduled_at), INTERVAL 7 DAY), 'reviewed',
  'Cough is gone, feeling back to normal.', 'Patient reports full resolution of cough.', DATE_ADD(a.scheduled_at, INTERVAL 8 DAY)
FROM consultations c JOIN appointments a ON a.id = c.appointment_id WHERE a.reason = 'Persistent cough';

INSERT INTO follow_ups (consultation_id, due_date, status, patient_response, ai_summary)
SELECT c.id, DATE_ADD(DATE(a.scheduled_at), INTERVAL 7 DAY), 'submitted',
  'Still a bit tired but sleeping better.', 'Patient reports partial improvement in fatigue, sleep improved.'
FROM consultations c JOIN appointments a ON a.id = c.appointment_id WHERE a.reason = 'Fatigue';

INSERT INTO follow_ups (consultation_id, due_date, status)
SELECT c.id, DATE_ADD(DATE(a.scheduled_at), INTERVAL 7 DAY), 'pending'
FROM consultations c JOIN appointments a ON a.id = c.appointment_id WHERE a.reason = 'Follow-up on headaches';

-- ============================================================
-- 8. Vitals Monitoring - a couple of weeks of readings for two patients
-- ============================================================
INSERT INTO vitals_logs (patient_id, heart_rate, spo2, steps, sleep_hours, flagged, flag_reason, recorded_at) VALUES
  (@pat1_id, 72, 98, 6200, 7.5, FALSE, NULL, DATE_SUB(NOW(), INTERVAL 14 DAY)),
  (@pat1_id, 75, 97, 5400, 6.8, FALSE, NULL, DATE_SUB(NOW(), INTERVAL 10 DAY)),
  (@pat1_id, 130, 96, 3000, 5.0, TRUE, 'Heart rate reading was outside the typical resting range.', DATE_SUB(NOW(), INTERVAL 6 DAY)),
  (@pat1_id, 70, 99, 7100, 8.0, FALSE, NULL, DATE_SUB(NOW(), INTERVAL 2 DAY)),
  (@pat2_id, 68, 98, 8300, 7.0, FALSE, NULL, DATE_SUB(NOW(), INTERVAL 9 DAY)),
  (@pat2_id, 66, 91, 4200, 6.5, TRUE, 'Oxygen saturation reading was below 92%.', DATE_SUB(NOW(), INTERVAL 3 DAY));

-- ============================================================
-- 9. Maternal Care check-ins for one patient
-- ============================================================
INSERT INTO maternal_checkins (patient_id, gestational_week, symptoms, red_flag, red_flag_reason, created_at) VALUES
  (@pat3_id, 18, 'Feeling tired but otherwise okay, mild back ache.', FALSE, NULL, DATE_SUB(NOW(), INTERVAL 12 DAY)),
  (@pat3_id, 20, 'Some mild swelling in my ankles by the evening.', FALSE, NULL, DATE_SUB(NOW(), INTERVAL 5 DAY)),
  (@pat3_id, 21, 'Had a severe headache today that would not go away.', TRUE, 'One or more reported symptoms are commonly flagged for prompt clinical review in pregnancy.', DATE_SUB(NOW(), INTERVAL 1 DAY));

SELECT 'Seed data loaded successfully.' AS result;
