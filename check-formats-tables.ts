/**
 * Script para verificar se as tabelas de formatos existem no Supabase
 * Verifica a existência das tabelas file_formats e post_formats e mostra
 * os dados contidos nelas, se existirem.
 */

import { supabase } from './server/supabase-client';

async function checkFormatsTables() {
  console.log("Verificando a existência das tabelas de formatos no Supabase...");
  
  try {
    // Verificar a tabela file_formats
    console.log("\nVerificando tabela file_formats:");
    const { data: fileFormats, error: fileFormatsError } = await supabase
      .from('file_formats')
      .select('*');
    
    if (fileFormatsError) {
      console.error("Erro ao verificar tabela file_formats:", fileFormatsError);
    } else {
      console.log(`Tabela file_formats existe e contém ${fileFormats?.length || 0} registros.`);
      if (fileFormats && fileFormats.length > 0) {
        console.log("Exemplo de dados:", fileFormats[0]);
      }
    }
    
    // Verificar a tabela post_formats
    console.log("\nVerificando tabela post_formats:");
    const { data: postFormats, error: postFormatsError } = await supabase
      .from('post_formats')
      .select('*');
    
    if (postFormatsError) {
      console.error("Erro ao verificar tabela post_formats:", postFormatsError);
    } else {
      console.log(`Tabela post_formats existe e contém ${postFormats?.length || 0} registros.`);
      if (postFormats && postFormats.length > 0) {
        console.log("Exemplo de dados:", postFormats[0]);
      }
    }
    
    // Mostrar resultado final
    if (!fileFormatsError && !postFormatsError) {
      console.log("\nAmbas as tabelas existem no Supabase!");
    } else {
      console.log("\nAlgumas tabelas podem não existir. Verifique os erros acima.");
    }
    
  } catch (error) {
    console.error("Erro ao verificar tabelas:", error);
  }
}

// Executar a verificação
checkFormatsTables();