-- Insert users for A92 and A93
INSERT INTO users (id, athlete_id, athlete_user_id, athlete_password, athlete_role, guardian_id, guardian_password, guardian_role)
VALUES 
  (93, 'A92', 'A92', 'Aps1234', 'athlete', 'PA92', 'APSPAIS', 'guardian'),
  (94, 'A93', 'A93', 'Aps1234', 'athlete', 'PA93', 'APSPAIS', 'guardian');

-- Insert payments for A91 (December 2025 - August 2026)
INSERT INTO payments (payment_id, athlete_id, month, year, amount_due, amount_paid, status)
VALUES 
  ('PAY1081', 'A91', 'December', 2025, 0, 0, 'Unpaid'),
  ('PAY1082', 'A91', 'January', 2026, 0, 0, 'Unpaid'),
  ('PAY1083', 'A91', 'February', 2026, 0, 0, 'Unpaid'),
  ('PAY1084', 'A91', 'March', 2026, 0, 0, 'Unpaid'),
  ('PAY1085', 'A91', 'April', 2026, 0, 0, 'Unpaid'),
  ('PAY1086', 'A91', 'May', 2026, 0, 0, 'Unpaid'),
  ('PAY1087', 'A91', 'June', 2026, 0, 0, 'Unpaid'),
  ('PAY1088', 'A91', 'July', 2026, 0, 0, 'Unpaid'),
  ('PAY1089', 'A91', 'August', 2026, 0, 0, 'Unpaid');

-- Insert payments for A92 (December 2025 - August 2026)
INSERT INTO payments (payment_id, athlete_id, month, year, amount_due, amount_paid, status)
VALUES 
  ('PAY1090', 'A92', 'December', 2025, 0, 0, 'Unpaid'),
  ('PAY1091', 'A92', 'January', 2026, 0, 0, 'Unpaid'),
  ('PAY1092', 'A92', 'February', 2026, 0, 0, 'Unpaid'),
  ('PAY1093', 'A92', 'March', 2026, 0, 0, 'Unpaid'),
  ('PAY1094', 'A92', 'April', 2026, 0, 0, 'Unpaid'),
  ('PAY1095', 'A92', 'May', 2026, 0, 0, 'Unpaid'),
  ('PAY1096', 'A92', 'June', 2026, 0, 0, 'Unpaid'),
  ('PAY1097', 'A92', 'July', 2026, 0, 0, 'Unpaid'),
  ('PAY1098', 'A92', 'August', 2026, 0, 0, 'Unpaid');

-- Insert payments for A93 (December 2025 - August 2026)
INSERT INTO payments (payment_id, athlete_id, month, year, amount_due, amount_paid, status)
VALUES 
  ('PAY1099', 'A93', 'December', 2025, 0, 0, 'Unpaid'),
  ('PAY1100', 'A93', 'January', 2026, 0, 0, 'Unpaid'),
  ('PAY1101', 'A93', 'February', 2026, 0, 0, 'Unpaid'),
  ('PAY1102', 'A93', 'March', 2026, 0, 0, 'Unpaid'),
  ('PAY1103', 'A93', 'April', 2026, 0, 0, 'Unpaid'),
  ('PAY1104', 'A93', 'May', 2026, 0, 0, 'Unpaid'),
  ('PAY1105', 'A93', 'June', 2026, 0, 0, 'Unpaid'),
  ('PAY1106', 'A93', 'July', 2026, 0, 0, 'Unpaid'),
  ('PAY1107', 'A93', 'August', 2026, 0, 0, 'Unpaid');