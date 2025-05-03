/**
 * Script para criar as tabelas de formatos diretamente no Supabase
 */

import { supabase } from './server/supabase-client';

async function createFormatTablesInSupabase() {
  console.log("Criando tabelas de formatos no Supabase...");
  
  try {
    // Criar tabela file_formats
    console.log("\nCriando tabela file_formats:");
    const fileFormatsResult = await supabase.rpc('create_file_formats_table');
    console.log("Resultado:", fileFormatsResult);
    
    // Criar tabela post_formats
    console.log("\nCriando tabela post_formats:");
    const postFormatsResult = await supabase.rpc('create_post_formats_table');
    console.log("Resultado:", postFormatsResult);
    
    // Inserir dados padrão nas tabelas
    if (!fileFormatsResult.error && !postFormatsResult.error) {
      await insertDefaultData();
    }
    
  } catch (error) {
    console.error("Erro ao criar tabelas:", error);
  }
}

async function insertDefaultData() {
  console.log("\nInserindo dados de exemplo nas tabelas:");
  
  try {
    // Inserir formatos de arquivo
    const fileFormats = [
      { name: 'Canva', type: 'Editável', icon: 'canva', is_active: true },
      { name: 'PNG', type: 'Download', icon: 'download', is_active: true },
      { name: 'JPG', type: 'Download', icon: 'download', is_active: true },
      { name: 'Adobe Photoshop', type: 'Editável', icon: 'photoshop', is_active: true }
    ];
    
    const { data: insertedFileFormats, error: fileError } = await supabase
      .from('file_formats')
      .insert(fileFormats)
      .select();
      
    if (fileError) {
      console.error("Erro ao inserir formatos de arquivo:", fileError);
    } else {
      console.log(`Inseridos ${insertedFileFormats?.length || 0} formatos de arquivo.`);
    }
    
    // Inserir formatos de post
    const postFormats = [
      { name: 'Feed', size: '1080x1080px', orientation: 'Quadrado', is_active: true },
      { name: 'Stories', size: '1080x1920px', orientation: 'Vertical', is_active: true },
      { name: 'Cartaz', size: '1080x1350px', orientation: 'Vertical', is_active: true },
      { name: 'Banner', size: '1200x628px', orientation: 'Horizontal', is_active: true }
    ];
    
    const { data: insertedPostFormats, error: postError } = await supabase
      .from('post_formats')
      .insert(postFormats)
      .select();
      
    if (postError) {
      console.error("Erro ao inserir formatos de post:", postError);
    } else {
      console.log(`Inseridos ${insertedPostFormats?.length || 0} formatos de post.`);
    }
    
  } catch (error) {
    console.error("Erro ao inserir dados padrão:", error);
  }
}

// Executar a criação
createFormatTablesInSupabase();