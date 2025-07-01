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
  fileName: string
): Promise<{ url: string | null; error: string | null }> {
  try {
    // Converter para WebP com Sharp
    const webpBuffer = await sharp(buffer).webp({ quality: 85 }).toBuffer();

    // Gerar timestamp único para evitar cache
    const timestamp = Date.now();
    const finalPath = `${fileName}_${timestamp}.webp`;
    
    console.log(`Fazendo upload para Supabase: ${bucket}/${finalPath} (${(webpBuffer.length / 1024).toFixed(1)}KB)`);

    // Upload para o Supabase com upsert
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(finalPath, webpBuffer, { 
        contentType: 'image/webp', 
        upsert: true 
      });

    if (error) {
      console.error('Erro no upload Supabase:', error);
      return { url: null, error: error.message };
    }

    // Obter URL pública com timestamp para cache-busting
    const publicUrl = `https://kmunxjuiuxaqitbovjls.supabase.co/storage/v1/object/public/${bucket}/${finalPath}?t=${timestamp}`;

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
 * Faz upload especializado para logos (preserva SVG, otimiza outros formatos)
 */
export async function uploadLogoToSupabase(
  buffer: Buffer,
  originalName: string,
  mimeType: string,
  bucket: string,
  fileName: string
): Promise<{ url: string | null; error: string | null }> {
  try {
    let finalBuffer = buffer;
    let contentType = mimeType;
    let fileExtension = '';
    
    // Gerar timestamp único para evitar cache
    const timestamp = Date.now();
    
    // Se for SVG, preservar o formato original
    if (mimeType === 'image/svg+xml') {
      fileExtension = '.svg';
      contentType = 'image/svg+xml';
      console.log(`Preservando SVG original: ${originalName}`);
    } else {
      // Para outros formatos, otimizar para WebP
      try {
        finalBuffer = await sharp(buffer)
          .resize(500, 500, { 
            fit: 'inside', 
            withoutEnlargement: true 
          })
          .webp({ quality: 90 })
          .toBuffer();
        fileExtension = '.webp';
        contentType = 'image/webp';
        console.log(`Convertendo ${originalName} para WebP otimizado`);
      } catch (error) {
        console.warn('Falha na conversão WebP, usando original:', error);
        fileExtension = originalName.includes('.') ? '.' + originalName.split('.').pop() : '';
      }
    }

    const finalPath = `${fileName}_${timestamp}${fileExtension}`;
    
    console.log(`Fazendo upload do logo: ${bucket}/${finalPath} (${(finalBuffer.length / 1024).toFixed(1)}KB)`);

    // Upload para o Supabase com upsert
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(finalPath, finalBuffer, { 
        contentType, 
        upsert: true 
      });

    if (error) {
      console.error('Erro no upload do logo:', error);
      return { url: null, error: error.message };
    }

    // Obter URL pública com timestamp para cache-busting
    const publicUrl = `https://kmunxjuiuxaqitbovjls.supabase.co/storage/v1/object/public/${bucket}/${finalPath}?t=${timestamp}`;

    console.log(`Upload do logo bem-sucedido: ${publicUrl}`);
    return { url: publicUrl, error: null };

  } catch (error) {
    console.error('Erro geral no upload do logo:', error);
    return { 
      url: null, 
      error: error instanceof Error ? error.message : 'Erro desconhecido no upload do logo' 
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