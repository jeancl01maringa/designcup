/**
 * Script para corrigir posts sem unique_code no Supabase
 */

import { createClient } from '@supabase/supabase-js';

// Limpar aspas extras das variáveis de ambiente
const supabaseUrl = process.env.VITE_SUPABASE_URL?.replace(/"/g, '') || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.replace(/"/g, '') || '';

console.log('URL do Supabase:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseKey);

async function generateUniqueCode(id: number): Promise<string> {
  return `${id}-${Date.now().toString(36)}`;
}

async function fixUniqueCodesInSupabase() {
  try {
    console.log('Buscando posts sem unique_code no Supabase...');
    
    // Buscar posts com unique_code NULL
    const { data: postsWithoutCode, error: fetchError } = await supabase
      .from('posts')
      .select('id, title, unique_code')
      .is('unique_code', null);
      
    if (fetchError) {
      console.error('Erro ao buscar posts:', fetchError);
      return;
    }
    
    if (!postsWithoutCode || postsWithoutCode.length === 0) {
      console.log('Todos os posts já têm unique_code!');
      return;
    }
    
    console.log(`Encontrados ${postsWithoutCode.length} posts sem unique_code`);
    
    // Atualizar cada post
    for (const post of postsWithoutCode) {
      const newUniqueCode = await generateUniqueCode(post.id);
      
      console.log(`Atualizando post ${post.id}: "${post.title}" com unique_code: ${newUniqueCode}`);
      
      const { error: updateError } = await supabase
        .from('posts')
        .update({ unique_code: newUniqueCode })
        .eq('id', post.id);
        
      if (updateError) {
        console.error(`Erro ao atualizar post ${post.id}:`, updateError);
      } else {
        console.log(`✓ Post ${post.id} atualizado com sucesso`);
      }
    }
    
    console.log('Processo concluído!');
    
  } catch (error) {
    console.error('Erro no processo:', error);
  }
}

fixUniqueCodesInSupabase();