-- Inserir utilizador super admin com ID sequencial
INSERT INTO users (id, admin_id, admin_password, admin_role)
VALUES (92, 'superadmin', 'SuperAdmin2024!', 'super_admin')
ON CONFLICT DO NOTHING;