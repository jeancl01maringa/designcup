/**
 * Script para criar buckets necessários para aulas no Supabase Storage
 * 
 * 1. lesson-covers - Para imagens de capa das aulas
 * 2. lesson-materials - Para materiais extras (PDFs, etc.)
 * 
 * Para executar: npx tsx create-lesson-buckets.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL?.replace(/"/g, '') || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.replace(/"/g, '') || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createLessonBuckets() {
  try {
    console.log('🚀 Criando buckets para aulas...');

    // 1. Criar bucket para capas de aulas
    const { data: coverBucket, error: coverError } = await supabase.storage
      .createBucket('lesson-covers', {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
        fileSizeLimit: 5242880 // 5MB
      });

    if (coverError && !coverError.message.includes('already exists')) {
      console.error('❌ Erro ao criar bucket lesson-covers:', coverError);
    } else {
      console.log('✅ Bucket lesson-covers criado/existe');
    }

    // 2. Criar bucket para materiais extras
    const { data: materialsBucket, error: materialsError } = await supabase.storage
      .createBucket('lesson-materials', {
        public: true,
        allowedMimeTypes: [
          'application/pdf',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel',
          'text/plain',
          'image/jpeg',
          'image/png',
          'image/webp',
          'image/gif'
        ],
        fileSizeLimit: 52428800 // 50MB
      });

    if (materialsError && !materialsError.message.includes('already exists')) {
      console.error('❌ Erro ao criar bucket lesson-materials:', materialsError);
    } else {
      console.log('✅ Bucket lesson-materials criado/existe');
    }

    // 3. Criar políticas de acesso público
    const policies = [
      {
        bucket: 'lesson-covers',
        name: 'Public read access',
        definition: 'SELECT',
        using: 'true'
      },
      {
        bucket: 'lesson-covers',
        name: 'Authenticated users can upload',
        definition: 'INSERT',
        using: 'auth.role() = \'authenticated\''
      },
      {
        bucket: 'lesson-materials',
        name: 'Public read access',
        definition: 'SELECT',
        using: 'true'
      },
      {
        bucket: 'lesson-materials',
        name: 'Authenticated users can upload',
        definition: 'INSERT',
        using: 'auth.role() = \'authenticated\''
      }
    ];

    for (const policy of policies) {
      const { error } = await supabase.rpc('create_storage_policy', {
        bucket_name: policy.bucket,
        policy_name: policy.name,
        definition: policy.definition,
        using_expression: policy.using
      });

      if (error && !error.message.includes('already exists')) {
        console.warn(`⚠️ Aviso ao criar política ${policy.name}:`, error.message);
      } else {
        console.log(`✅ Política criada: ${policy.name}`);
      }
    }

    console.log('🎉 Buckets e políticas configurados com sucesso!');

  } catch (error) {
    console.error('❌ Erro ao configurar buckets:', error);
  }
}

createLessonBuckets();