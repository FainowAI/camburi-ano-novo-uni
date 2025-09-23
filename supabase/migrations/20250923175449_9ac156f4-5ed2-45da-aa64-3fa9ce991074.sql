-- Adicionar o usuário existente como admin
INSERT INTO public.user_roles (user_id, role)
VALUES ('ee435b01-7cd9-4f05-920d-1f34881fa4d3', 'admin'::app_role)
ON CONFLICT (user_id, role) DO NOTHING;