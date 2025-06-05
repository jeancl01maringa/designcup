/**
 * Script para criar o bucket "images" no Supabase Storage
 * e configurar as permissões adequadas para acesso público
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY devem estar configurados');
  process.exit(1);
}

// Usar service role key para ter permissões administrativas
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createImagesBucket() {
  console.log('Criando bucket "images" no Supabase Storage...');
  
  try {
    // 1. Criar o bucket público
    const { data: bucket, error: createError } = await supabase.storage.createBucket('images', {
      public: true,
      allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
      fileSizeLimit: 10485760, // 10MB
    });

    if (createError) {
      if (createError.message.includes('already exists')) {
        console.log('Bucket "images" já existe');
      } else {
        console.error('Erro ao criar bucket:', createError);
        return false;
      }
    } else {
      console.log('Bucket "images" criado com sucesso:', bucket);
    }

    // 2. Verificar se o bucket foi criado
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Erro ao listar buckets:', listError);
      return false;
    }

    const imagesBucket = buckets?.find(b => b.name === 'images');
    if (!imagesBucket) {
      console.error('Bucket "images" não foi encontrado após criação');
      return false;
    }

    console.log('Bucket "images" confirmado:', imagesBucket);

    // 3. Criar políticas de acesso público
    console.log('\nConfigurando políticas de acesso...');
    
    // Como não podemos criar policies via JavaScript facilmente, vamos mostrar as instruções
    console.log(`
Para completar a configuração, execute as seguintes queries SQL no painel do Supabase:

-- Política para permitir SELECT público
CREATE POLICY "Public Access" ON storage.objects
FOR SELECT USING (bucket_id = 'images');

-- Política para permitir INSERT autenticado
CREATE POLICY "Authenticated users can upload images" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'images' AND auth.role() = 'authenticated');

-- Política para permitir UPDATE do proprietário
CREATE POLICY "Users can update own images" ON storage.objects
FOR UPDATE USING (bucket_id = 'images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Política para permitir DELETE do proprietário
CREATE POLICY "Users can delete own images" ON storage.objects
FOR DELETE USING (bucket_id = 'images' AND auth.uid()::text = (storage.foldername(name))[1]);
`);

    return true;

  } catch (error) {
    console.error('Erro ao criar bucket:', error);
    return false;
  }
}

createImagesBucket().then(success => {
  if (success) {
    console.log('\nBucket criado com sucesso!');
  } else {
    console.log('\nFalha ao criar bucket');
    process.exit(1);
  }
});