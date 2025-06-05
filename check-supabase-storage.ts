/**
 * Script para verificar o status do storage do Supabase
 * Testa se as imagens existem no bucket e verifica as permissões
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('SUPABASE_URL e SUPABASE_ANON_KEY devem estar configurados');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkSupabaseStorage() {
  console.log('Verificando conexão com Supabase Storage...');
  console.log('URL:', supabaseUrl);
  console.log('Key exists:', Boolean(supabaseAnonKey));

  try {
    // 1. Verificar se podemos listar buckets
    console.log('\n1. Listando buckets...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('Erro ao listar buckets:', bucketsError);
      return;
    }
    
    console.log('Buckets encontrados:', buckets?.map(b => b.name));

    // 2. Verificar o bucket de imagens
    console.log('\n2. Verificando bucket "images"...');
    const imagesBucket = buckets?.find(b => b.name === 'images');
    
    if (!imagesBucket) {
      console.error('Bucket "images" não encontrado');
      return;
    }
    
    console.log('Bucket "images" encontrado:', imagesBucket);

    // 3. Listar arquivos no bucket
    console.log('\n3. Listando arquivos no bucket "images"...');
    const { data: files, error: filesError } = await supabase.storage
      .from('images')
      .list('', { limit: 10 });
    
    if (filesError) {
      console.error('Erro ao listar arquivos:', filesError);
      return;
    }
    
    console.log(`Encontrados ${files?.length || 0} arquivos no bucket`);
    files?.forEach((file, index) => {
      console.log(`  ${index + 1}. ${file.name} (${file.metadata?.size || 'unknown size'})`);
    });

    // 4. Testar acesso público a um arquivo específico
    if (files && files.length > 0) {
      console.log('\n4. Testando acesso público ao primeiro arquivo...');
      const firstFile = files[0];
      const { data: publicUrl } = supabase.storage
        .from('images')
        .getPublicUrl(firstFile.name);
      
      console.log('URL pública gerada:', publicUrl.publicUrl);
      
      // Testar se a URL é acessível
      try {
        const response = await fetch(publicUrl.publicUrl);
        console.log('Status da requisição HTTP:', response.status);
        console.log('Headers:', Object.fromEntries(response.headers.entries()));
      } catch (fetchError) {
        console.error('Erro ao fazer requisição HTTP:', fetchError);
      }
    }

    // 5. Verificar arquivos específicos dos posts
    console.log('\n5. Verificando arquivos específicos dos posts...');
    const testFiles = [
      'post_10_1725392776012.webp',
      'post_11_1725392836789.webp',
      'post_23_1725393756456.webp'
    ];
    
    for (const filename of testFiles) {
      const { data: fileData, error: fileError } = await supabase.storage
        .from('images')
        .download(filename);
      
      if (fileError) {
        console.log(`❌ ${filename}: ${fileError.message}`);
      } else {
        console.log(`✅ ${filename}: arquivo existe (${fileData?.size || 'unknown'} bytes)`);
      }
    }

  } catch (error) {
    console.error('Erro geral:', error);
  }
}

checkSupabaseStorage().catch(console.error);