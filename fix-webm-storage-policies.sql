-- Script para corrigir políticas de storage do Supabase para suportar WebM
-- Execute este SQL no painel do Supabase

-- 1. Habilitar upload de arquivos WebM no bucket 'images' 
UPDATE storage.buckets 
SET allowed_mime_types = ARRAY[
  'image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml',
  'video/webm', 'video/mp4', 'image/gif'
] 
WHERE name = 'images';

-- 2. Criar política de INSERT para permitir upload de WebM
INSERT INTO storage.policies (id, bucket_id, name, definition, check, command)
VALUES (
  'allow_webm_upload',
  'images', 
  'Allow WebM and video uploads',
  '(bucket_id = ''images''::text)',
  '(bucket_id = ''images''::text)',
  'INSERT'
) ON CONFLICT (id) DO UPDATE SET 
  definition = EXCLUDED.definition,
  check = EXCLUDED.check;

-- 3. Criar política de SELECT para permitir acesso público a WebM
INSERT INTO storage.policies (id, bucket_id, name, definition, check, command)
VALUES (
  'allow_webm_select',
  'images',
  'Allow public access to WebM files', 
  '(bucket_id = ''images''::text)',
  '(bucket_id = ''images''::text)', 
  'SELECT'
) ON CONFLICT (id) DO UPDATE SET
  definition = EXCLUDED.definition,
  check = EXCLUDED.check;

-- 4. Verificar se as políticas foram criadas
SELECT id, bucket_id, name, command 
FROM storage.policies 
WHERE bucket_id = 'images' 
ORDER BY command, name;