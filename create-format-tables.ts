/**
 * Script para gerar as instruções SQL para criar as tabelas file_formats e post_formats no Supabase
 * 
 * Este script gera os comandos SQL que precisam ser executados no painel do Supabase
 * através do SQL Editor para criar as tabelas necessárias.
 */

import { supabaseAdmin } from './server/supabase';

function generateFileFormatsTable() {
  console.log(`
  -- Execute este SQL no Editor SQL do Supabase para criar a tabela de formatos de arquivo
  
  CREATE TABLE IF NOT EXISTS file_formats (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    icon TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  
  -- Dados iniciais para formatos de arquivo
  INSERT INTO file_formats (name, type, icon, is_active)
  VALUES
    ('Canva', 'Editável', 'canva', true),
    ('PNG', 'Download', 'download', true),
    ('JPG', 'Download', 'download', true),
    ('Adobe Photoshop', 'Editável', 'photoshop', true)
  ON CONFLICT (name) DO NOTHING;
  
  -- Configurar permissões de RLS (Row Level Security)
  ALTER TABLE file_formats ENABLE ROW LEVEL SECURITY;
  
  -- Criar políticas de acesso
  CREATE POLICY "Permitir leitura anônima de formatos de arquivo"
    ON file_formats FOR SELECT
    USING (true);
    
  CREATE POLICY "Permitir todas as operações para usuários autenticados com is_admin = true"
    ON file_formats FOR ALL
    USING (auth.uid() IN (SELECT auth.uid() FROM auth.users WHERE raw_user_meta_data->>'is_admin' = 'true'));
  `);
  
  return true;
}

function generatePostFormatsTable() {
  console.log(`
  -- Execute este SQL no Editor SQL do Supabase para criar a tabela de formatos de post
  
  CREATE TABLE IF NOT EXISTS post_formats (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    size TEXT NOT NULL,
    orientation TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  
  -- Dados iniciais para formatos de post
  INSERT INTO post_formats (name, size, orientation, is_active)
  VALUES
    ('Feed', '1080x1080px', 'Quadrado', true),
    ('Stories', '1080x1920px', 'Vertical', true),
    ('Cartaz', '1080x1350px', 'Vertical', true),
    ('Banner', '1200x628px', 'Horizontal', true)
  ON CONFLICT (name) DO NOTHING;
  
  -- Configurar permissões de RLS (Row Level Security)
  ALTER TABLE post_formats ENABLE ROW LEVEL SECURITY;
  
  -- Criar políticas de acesso
  CREATE POLICY "Permitir leitura anônima de formatos de post"
    ON post_formats FOR SELECT
    USING (true);
    
  CREATE POLICY "Permitir todas as operações para usuários autenticados com is_admin = true"
    ON post_formats FOR ALL
    USING (auth.uid() IN (SELECT auth.uid() FROM auth.users WHERE raw_user_meta_data->>'is_admin' = 'true'));
  `);
  
  return true;
}

async function insertSampleData() {
  // Inserir dados de exemplo para file_formats
  const fileFormats = [
    { name: 'Canva', type: 'Editável', icon: 'canva' },
    { name: 'PNG', type: 'Download', icon: 'download' },
    { name: 'JPG', type: 'Download', icon: 'download' },
    { name: 'Adobe Photoshop', type: 'Editável', icon: 'photoshop' },
  ];

  const { error: fileInsertError } = await supabaseAdmin
    .from('file_formats')
    .upsert(fileFormats, { onConflict: 'name' });

  if (fileInsertError) {
    console.error('Erro ao inserir formatos de arquivo:', fileInsertError);
  } else {
    console.log('Formatos de arquivo inseridos com sucesso');
  }

  // Inserir dados de exemplo para post_formats
  const postFormats = [
    { name: 'Feed', size: '1080x1080px', orientation: 'Quadrado' },
    { name: 'Stories', size: '1080x1920px', orientation: 'Vertical' },
    { name: 'Cartaz', size: '1080x1350px', orientation: 'Vertical' },
    { name: 'Banner', size: '1200x628px', orientation: 'Horizontal' },
  ];

  const { error: postInsertError } = await supabaseAdmin
    .from('post_formats')
    .upsert(postFormats, { onConflict: 'name' });

  if (postInsertError) {
    console.error('Erro ao inserir formatos de post:', postInsertError);
  } else {
    console.log('Formatos de post inseridos com sucesso');
  }
}

function main() {
  console.log('Gerando SQL para criar as tabelas de formatos...');
  
  console.log('\n----- SQL PARA TABELA DE FORMATOS DE ARQUIVO -----\n');
  generateFileFormatsTable();
  
  console.log('\n----- SQL PARA TABELA DE FORMATOS DE POST -----\n');
  generatePostFormatsTable();
  
  console.log('\nCopie e cole este SQL no Editor SQL do painel do Supabase.');
  console.log('Processo concluído. Após executar o SQL no Supabase, continue com a implementação da interface.');
}

main();