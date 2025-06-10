/**
 * Utilitário para upload de imagens no Supabase Storage com conversão WebP
 */

import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL?.replace(/"/g, '');
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.replace(/"/g, '');

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Variáveis SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias');
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Comprime e converte imagem para WebP usando Sharp
 */
async function compressAndConvertToWebP(buffer: Buffer, originalName: string): Promise<Buffer> {
  try {
    console.log(`Comprimindo e convertendo ${originalName} para WebP...`);
    
    // Usar Sharp para comprimir e converter para WebP
    const compressedBuffer = await sharp(buffer)
      .resize(1920, 1920, { 
        fit: 'inside', 
        withoutEnlargement: true 
      })
      .webp({ 
        quality: 85,
        effort: 4
      })
      .toBuffer();
    
    console.log(`Conversão WebP bem-sucedida: ${originalName} -> ${(compressedBuffer.length / 1024).toFixed(1)}KB`);
    return compressedBuffer;
  } catch (error) {
    console.warn('Falha na compressão WebP, usando original:', error);
    return buffer;
  }
}

/**
 * Faz upload de imagem para o Supabase Storage
 */
export async function uploadImageToSupabase(
  buffer: Buffer,
  originalName: string,
  bucket: string,
  path: string
): Promise<{ url: string | null; error: string | null }> {
  try {
    let processedBuffer = buffer;
    let finalPath = path;
    
    // Sempre comprimir e converter para WebP para imagens
    try {
      console.log(`Comprimindo e convertendo ${originalName} para WebP...`);
      processedBuffer = await compressAndConvertToWebP(buffer, originalName);
      // Garantir que o path tenha extensão .webp
      finalPath = path.replace(/\.[^/.]+$/, '') + '.webp';
      console.log(`Conversão bem-sucedida: ${finalPath}`);
    } catch (compressionError) {
      console.warn('Falha na conversão WebP, usando original:', compressionError);
      // Em caso de falha, manter o path original
    }

    console.log(`Fazendo upload para Supabase: ${bucket}/${finalPath} (${(processedBuffer.length / 1024).toFixed(1)}KB)`);

    // Determinar o contentType correto
    const contentType = finalPath.endsWith('.webp') ? 'image/webp' :
                       originalName.match(/\.(jpg|jpeg)$/i) ? 'image/jpeg' :
                       originalName.match(/\.png$/i) ? 'image/png' :
                       originalName.match(/\.gif$/i) ? 'image/gif' : 'image/jpeg';

    // Upload para o Supabase
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(finalPath, processedBuffer, {
        cacheControl: '3600',
        upsert: true,
        contentType
      });

    if (error) {
      console.error('Erro no upload Supabase:', error);
      return { url: null, error: error.message };
    }

    // Obter URL pública
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(finalPath);

    console.log(`Upload bem-sucedido: ${publicUrl}`);
    return { url: publicUrl, error: null };

  } catch (error) {
    console.error('Erro geral no upload:', error);
    return { 
      url: null, 
      error: error instanceof Error ? error.message : 'Erro desconhecido no upload' 
    };
  }
}

/**
 * Assegura que o bucket existe e tem as políticas corretas
 */
export async function ensureBucket(bucketName: string): Promise<boolean> {
  try {
    // Verificar se o bucket existe
    const { data: bucket, error: getBucketError } = await supabase.storage.getBucket(bucketName);
    
    if (getBucketError) {
      // Tentar criar o bucket
      console.log(`Criando bucket ${bucketName}...`);
      const { error: createError } = await supabase.storage.createBucket(bucketName, {
        public: true,
        allowedMimeTypes: ['image/*'],
        fileSizeLimit: 5242880 // 5MB
      });
      
      if (createError) {
        console.error(`Erro ao criar bucket ${bucketName}:`, createError);
        return false;
      }
    } else if (!bucket.public) {
      // Tornar o bucket público se não for
      console.log(`Tornando bucket ${bucketName} público...`);
      await supabase.storage.updateBucket(bucketName, { public: true });
    }
    
    return true;
  } catch (error) {
    console.error(`Erro ao verificar/criar bucket ${bucketName}:`, error);
    return false;
  }
}