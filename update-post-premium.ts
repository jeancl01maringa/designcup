/**
 * Script para atualizar todos os posts no Supabase
 * Garante que todos os posts tenham os campos licenseType e isPro corretamente preenchidos
 * 
 * Para executar:
 * ts-node update-post-premium.ts
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

// Verificar se as variáveis de ambiente necessárias estão definidas
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Erro: SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY devem estar definidos no ambiente.');
  process.exit(1);
}

// Criar cliente Supabase com a chave de serviço para ter acesso total
const supabase = createClient(supabaseUrl, supabaseKey);

async function updateAllPosts() {
  console.log('Iniciando atualização de posts...');
  
  try {
    // 1. Buscar todos os posts
    const { data: posts, error } = await supabase
      .from('posts')
      .select('*');
    
    if (error) {
      throw error;
    }
    
    if (!posts || posts.length === 0) {
      console.log('Nenhum post encontrado para atualizar.');
      return;
    }
    
    console.log(`Encontrados ${posts.length} posts para atualizar.`);
    
    // 2. Iterar por cada post e atualizar seus campos
    let successCount = 0;
    let errorCount = 0;
    
    for (const post of posts) {
      // Define default premium status based on naming convention
      // Se o título ou descrição contiver "premium", consideramos como premium
      const isPremiumByTitle = 
        (post.title && post.title.toLowerCase().includes('premium')) || 
        (post.description && post.description.toLowerCase().includes('premium'));
      
      // Determina se deveria ser premium baseado nas informações existentes
      const shouldBePremium = post.is_pro === true || 
                             post.license_type === 'premium' || 
                             isPremiumByTitle;
      
      try {
        // Atualiza ambos os campos para garantir consistência
        const { error: updateError } = await supabase
          .from('posts')
          .update({
            is_pro: shouldBePremium,
            license_type: shouldBePremium ? 'premium' : 'free'
          })
          .eq('id', post.id);
        
        if (updateError) {
          throw updateError;
        }
        
        console.log(`✓ Post #${post.id} atualizado: ${shouldBePremium ? 'PREMIUM' : 'FREE'}`);
        successCount++;
      } catch (updateError) {
        console.error(`✗ Erro ao atualizar post #${post.id}:`, updateError);
        errorCount++;
      }
    }
    
    console.log('\nResumo da operação:');
    console.log(`- Total de posts: ${posts.length}`);
    console.log(`- Atualizados com sucesso: ${successCount}`);
    console.log(`- Falhas: ${errorCount}`);
    
  } catch (error) {
    console.error('Erro ao processar os posts:', error);
  }
}

// Executar o script
updateAllPosts()
  .then(() => {
    console.log('Script concluído.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Erro durante a execução do script:', error);
    process.exit(1);
  });