/**
 * Script para verificar buckets do Supabase Storage
 * Para executar: npx tsx check-supabase-buckets.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL?.replace(/"/g, '');
const supabaseKey = process.env.VITE_SUPABASE_KEY?.replace(/"/g, '');

if (!supabaseUrl || !supabaseKey) {
  console.error('Variáveis VITE_SUPABASE_URL e VITE_SUPABASE_KEY são obrigatórias');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkBuckets() {
  try {
    console.log('🔍 Verificando buckets do Supabase Storage...\n');
    
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error('❌ Erro ao listar buckets:', error);
      return;
    }
    
    console.log('📁 Buckets existentes:');
    buckets.forEach(bucket => {
      console.log(`  - ${bucket.name} (público: ${bucket.public})`);
    });
    
    // Verificar conteúdo do bucket perfis
    console.log('\n👤 Verificando bucket "perfis":');
    const { data: perfilFiles, error: perfilError } = await supabase.storage
      .from('perfis')
      .list('', { limit: 10, sortBy: { column: 'created_at', order: 'desc' } });
      
    if (!perfilError && perfilFiles && perfilFiles.length > 0) {
      console.log('  Arquivos encontrados:');
      perfilFiles.forEach(file => {
        if (file.name) {
          console.log(`    - ${file.name} (${(file.metadata?.size || 0 / 1024).toFixed(1)}KB)`);
        }
      });
    } else {
      console.log('  ⚠️  Bucket vazio ou erro:', perfilError?.message || 'sem arquivos');
    }
    
    // Verificar conteúdo do bucket logos
    console.log('\n🎨 Verificando bucket "logos":');
    const { data: logoFiles, error: logoError } = await supabase.storage
      .from('logos')
      .list('', { limit: 10, sortBy: { column: 'created_at', order: 'desc' } });
      
    if (!logoError && logoFiles && logoFiles.length > 0) {
      console.log('  Arquivos encontrados:');
      logoFiles.forEach(file => {
        if (file.name) {
          console.log(`    - ${file.name} (${(file.metadata?.size || 0 / 1024).toFixed(1)}KB)`);
        }
      });
    } else {
      console.log('  ⚠️  Bucket vazio ou erro:', logoError?.message || 'sem arquivos');
    }
    
    // Verificar bucket images para comparação
    console.log('\n🖼️  Verificando bucket "images" (para comparação):');
    const { data: imageFiles, error: imageError } = await supabase.storage
      .from('images')
      .list('', { limit: 5, sortBy: { column: 'created_at', order: 'desc' } });
      
    if (!imageError && imageFiles && imageFiles.length > 0) {
      console.log('  Últimos arquivos:');
      imageFiles.forEach((file, index) => {
        if (file.name && index < 3) {
          console.log(`    - ${file.name}`);
        }
      });
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

checkBuckets();