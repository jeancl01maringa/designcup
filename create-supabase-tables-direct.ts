/**
 * Script para criar as tabelas de formatos diretamente no Supabase usando consultas SQL
 */

import { supabase } from './server/supabase-client';

async function createFormatTablesInSupabase() {
  console.log("Criando tabelas de formatos no Supabase usando SQL direto...");
  
  try {
    // Criar tabela file_formats
    console.log("\nCriando tabela file_formats:");
    const createFileFormatsResult = await supabase.rpc('exec_sql', { 
      sql_query: `
        CREATE TABLE IF NOT EXISTS file_formats (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL UNIQUE,
          type TEXT NOT NULL,
          icon TEXT,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });
    
    if (createFileFormatsResult.error) {
      console.error("Erro ao criar tabela file_formats:", createFileFormatsResult.error);
    } else {
      console.log("Tabela file_formats criada com sucesso!");
      
      // Inserir dados na tabela file_formats
      const insertFileFormatsResult = await supabase.rpc('exec_sql', {
        sql_query: `
          INSERT INTO file_formats (name, type, icon, is_active)
          VALUES
            ('Canva', 'Editável', 'canva', true),
            ('PNG', 'Download', 'download', true),
            ('JPG', 'Download', 'download', true),
            ('Adobe Photoshop', 'Editável', 'photoshop', true)
          ON CONFLICT (name) DO NOTHING;
        `
      });
      
      if (insertFileFormatsResult.error) {
        console.error("Erro ao inserir dados na tabela file_formats:", insertFileFormatsResult.error);
      } else {
        console.log("Dados inseridos na tabela file_formats!");
      }
    }
    
    // Criar tabela post_formats
    console.log("\nCriando tabela post_formats:");
    const createPostFormatsResult = await supabase.rpc('exec_sql', {
      sql_query: `
        CREATE TABLE IF NOT EXISTS post_formats (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL UNIQUE,
          size TEXT NOT NULL,
          orientation TEXT NOT NULL,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });
    
    if (createPostFormatsResult.error) {
      console.error("Erro ao criar tabela post_formats:", createPostFormatsResult.error);
    } else {
      console.log("Tabela post_formats criada com sucesso!");
      
      // Inserir dados na tabela post_formats
      const insertPostFormatsResult = await supabase.rpc('exec_sql', {
        sql_query: `
          INSERT INTO post_formats (name, size, orientation, is_active)
          VALUES
            ('Feed', '1080x1080px', 'Quadrado', true),
            ('Stories', '1080x1920px', 'Vertical', true),
            ('Cartaz', '1080x1350px', 'Vertical', true),
            ('Banner', '1200x628px', 'Horizontal', true)
          ON CONFLICT (name) DO NOTHING;
        `
      });
      
      if (insertPostFormatsResult.error) {
        console.error("Erro ao inserir dados na tabela post_formats:", insertPostFormatsResult.error);
      } else {
        console.log("Dados inseridos na tabela post_formats!");
      }
    }
    
  } catch (error) {
    console.error("Erro ao criar tabelas:", error);
  }
}

// Executar a criação
createFormatTablesInSupabase();