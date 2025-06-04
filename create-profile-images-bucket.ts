import { supabase } from './server/supabase-client';

async function createProfileImagesBucket() {
  try {
    console.log('Criando bucket profile-images no Supabase Storage...');
    
    // Criar o bucket
    const { data: bucket, error: bucketError } = await supabase.storage
      .createBucket('profile-images', {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        fileSizeLimit: 5242880 // 5MB
      });

    if (bucketError) {
      if (bucketError.message.includes('already exists')) {
        console.log('Bucket profile-images já existe');
      } else {
        console.error('Erro ao criar bucket:', bucketError);
        return;
      }
    } else {
      console.log('Bucket profile-images criado com sucesso');
    }

    // Verificar se o bucket existe
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Erro ao listar buckets:', listError);
      return;
    }

    const profileBucket = buckets.find(b => b.name === 'profile-images');
    if (profileBucket) {
      console.log('Bucket profile-images confirmado:', profileBucket);
    } else {
      console.log('Bucket profile-images não encontrado na lista');
    }

  } catch (error) {
    console.error('Erro geral:', error);
  }
}

createProfileImagesBucket();
