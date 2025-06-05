-- Script SQL para criar bucket no Supabase Storage via SQL direto
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-images',
  'profile-images',
  true,
  5242880,
  '{"image/*"}'
) ON CONFLICT (id) DO NOTHING;

-- Criar políticas de acesso
INSERT INTO storage.policies (id, bucket_id, name, definition, check_definition, command)
VALUES (
  'profile-images-policy-select',
  'profile-images',
  'Public read access',
  '(true)',
  '(true)',
  'SELECT'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.policies (id, bucket_id, name, definition, check_definition, command)
VALUES (
  'profile-images-policy-insert',
  'profile-images',
  'Users can upload their own profile images',
  '(auth.uid()::text = (storage.foldername(name))[1])',
  '(auth.uid()::text = (storage.foldername(name))[1])',
  'INSERT'
) ON CONFLICT (id) DO NOTHING;
