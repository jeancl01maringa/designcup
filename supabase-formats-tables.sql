-- SQL para criar as tabelas de formatos diretamente no Supabase
-- Executar este SQL no editor SQL do Supabase

-- Criar tabela de formatos de arquivo
CREATE TABLE IF NOT EXISTS file_formats (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL,
  icon TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de formatos de post
CREATE TABLE IF NOT EXISTS post_formats (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  size TEXT NOT NULL,
  orientation TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir dados de exemplo para formatos de arquivo
INSERT INTO file_formats (name, type, icon, is_active)
VALUES
  ('Canva', 'Editável', 'canva', true),
  ('PNG', 'Download', 'download', true),
  ('JPG', 'Download', 'download', true),
  ('Adobe Photoshop', 'Editável', 'photoshop', true)
ON CONFLICT (name) DO NOTHING;

-- Inserir dados de exemplo para formatos de post
INSERT INTO post_formats (name, size, orientation, is_active)
VALUES
  ('Feed', '1080x1080px', 'Quadrado', true),
  ('Stories', '1080x1920px', 'Vertical', true),
  ('Cartaz', '1080x1350px', 'Vertical', true),
  ('Banner', '1200x628px', 'Horizontal', true)
ON CONFLICT (name) DO NOTHING;

-- Configurar políticas de acesso RLS (Row Level Security)

-- Ativar RLS nas tabelas
ALTER TABLE file_formats ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_formats ENABLE ROW LEVEL SECURITY;

-- Criar política para permitir leitura por todos
CREATE POLICY file_formats_select_policy
  ON file_formats
  FOR SELECT
  USING (true);

CREATE POLICY post_formats_select_policy
  ON post_formats
  FOR SELECT
  USING (true);

-- Criar política para permitir inserção/edição apenas para usuários autenticados com is_admin=true
CREATE POLICY file_formats_insert_policy
  ON file_formats
  FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT auth.uid() FROM auth.users
      WHERE auth.uid() IN (SELECT user_id FROM users WHERE is_admin = true)
    )
  );

CREATE POLICY file_formats_update_policy
  ON file_formats
  FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT auth.uid() FROM auth.users
      WHERE auth.uid() IN (SELECT user_id FROM users WHERE is_admin = true)
    )
  );

CREATE POLICY file_formats_delete_policy
  ON file_formats
  FOR DELETE
  USING (
    auth.uid() IN (
      SELECT auth.uid() FROM auth.users
      WHERE auth.uid() IN (SELECT user_id FROM users WHERE is_admin = true)
    )
  );

CREATE POLICY post_formats_insert_policy
  ON post_formats
  FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT auth.uid() FROM auth.users
      WHERE auth.uid() IN (SELECT user_id FROM users WHERE is_admin = true)
    )
  );

CREATE POLICY post_formats_update_policy
  ON post_formats
  FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT auth.uid() FROM auth.users
      WHERE auth.uid() IN (SELECT user_id FROM users WHERE is_admin = true)
    )
  );

CREATE POLICY post_formats_delete_policy
  ON post_formats
  FOR DELETE
  USING (
    auth.uid() IN (
      SELECT auth.uid() FROM auth.users
      WHERE auth.uid() IN (SELECT user_id FROM users WHERE is_admin = true)
    )
  );