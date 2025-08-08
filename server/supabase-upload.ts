/**
 * Utilitário para upload de imagens no Supabase Storage com conversão WebP
 */

import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from '@ffmpeg-installer/ffmpeg';
import { writeFile, unlink } from 'fs/promises';
import path from 'path';
import os from 'os';

// Configure FFmpeg path
ffmpeg.setFfmpegPath(ffmpegPath.path);

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
 * Converte vídeo/GIF para WebM usando FFmpeg
 */
async function convertToWebM(buffer: Buffer, originalName: string): Promise<Buffer> {
  const tempDir = os.tmpdir();
  const inputPath = path.join(tempDir, `input_${Date.now()}_${originalName}`);
  const outputPath = path.join(tempDir, `output_${Date.now()}.webm`);

  try {
    console.log(`Convertendo ${originalName} para WebM...`);
    
    // Escrever arquivo temporário
    await writeFile(inputPath, buffer);
    
    // Converter usando FFmpeg com configurações mais robustas
    await new Promise<void>((resolve, reject) => {
      const command = ffmpeg(inputPath);
      
      // Detectar se é GIF ou MP4 para ajustar configurações
      const isGif = originalName.toLowerCase().includes('.gif');
      
      if (isGif) {
        // Para GIFs: configuração mais simples sem áudio
        command
          .videoCodec('libvpx')
          .noAudio() // GIFs não têm áudio
          .size('?x480') // Manter aspecto original, max altura 480
          .fps(12) // FPS mais baixo para GIFs
          .videoBitrate('300k')
          .outputOptions([
            '-f webm',
            '-pix_fmt yuv420p',
            '-auto-alt-ref 0', // Importante para GIFs
            '-lag-in-frames 0',
            '-error-resilient 1'
          ]);
      } else {
        // Para MP4s: configuração mais robusta
        command
          .videoCodec('libvpx')
          .audioCodec('libvorbis')
          .size('?x720') // Manter aspecto, max altura 720
          .fps(20)
          .videoBitrate('500k')
          .audioBitrate('96k')
          .outputOptions([
            '-f webm',
            '-pix_fmt yuv420p',
            '-error-resilient 1'
          ]);
      }
      
      command
        .output(outputPath)
        .on('start', (commandLine: any) => {
          console.log(`FFmpeg iniciado: ${commandLine}`);
        })
        .on('progress', (progress: any) => {
          if (progress.percent) {
            console.log(`Progresso: ${Math.round(progress.percent)}%`);
          }
        })
        .on('end', () => {
          console.log(`Conversão WebM concluída: ${originalName}`);
          resolve();
        })
        .on('error', (error: any, stdout: any, stderr: any) => {
          console.error(`Erro na conversão WebM de ${originalName}:`, {
            error: error.message,
            stdout: stdout,
            stderr: stderr
          });
          reject(error);
        })
        .run();
    });

    // Ler arquivo convertido
    const { readFile } = await import('fs/promises');
    const convertedBuffer = await readFile(outputPath);
    
    console.log(`Conversão WebM bem-sucedida: ${originalName} -> ${(convertedBuffer.length / 1024).toFixed(1)}KB`);
    
    // Limpeza dos arquivos temporários
    await Promise.all([
      unlink(inputPath).catch(() => {}),
      unlink(outputPath).catch(() => {})
    ]);
    
    return convertedBuffer;
    
  } catch (error) {
    console.error(`Erro na conversão WebM de ${originalName}:`, error);
    
    // Limpeza em caso de erro
    await Promise.all([
      unlink(inputPath).catch(() => {}),
      unlink(outputPath).catch(() => {})
    ]);
    
    throw error;
  }
}

/**
 * Detecta se o arquivo é vídeo ou GIF baseado no MIME type
 */
function isVideoOrGif(mimeType: string): boolean {
  return mimeType === 'video/mp4' || mimeType === 'image/gif';
}

/**
 * Detecta se o arquivo é imagem (exceto GIF)
 */
function isImage(mimeType: string): boolean {
  return mimeType.startsWith('image/') && mimeType !== 'image/gif';
}

/**
 * Faz upload de arquivo (imagem, vídeo ou GIF) para o Supabase Storage
 * Imagens são convertidas para WebP, vídeos/GIFs são convertidos para WebM
 */
export async function uploadFileToSupabase(
  buffer: Buffer,
  originalName: string,
  mimeType: string,
  bucket: string,
  fileName: string
): Promise<{ url: string | null; error: string | null }> {
  try {
    let processedBuffer: Buffer;
    let contentType: string;
    let fileExtension: string;
    const timestamp = Date.now();

    // Determinar o tipo de processamento baseado no MIME type
    if (isVideoOrGif(mimeType)) {
      // Para GIFs, sempre manter formato original no bucket 'images'
      if (mimeType === 'image/gif') {
        console.log(`Mantendo GIF original: ${originalName} (${mimeType})`);
        processedBuffer = buffer;
        contentType = 'image/gif';
        fileExtension = '.gif';
      } else {
        // Para MP4, salvar formato original no bucket 'images' (Supabase é mais flexível com bucket 'images')
        console.log(`Detectado MP4: ${originalName} (${mimeType}) - mantendo formato original`);
        processedBuffer = buffer;
        contentType = mimeType; // Manter video/mp4
        fileExtension = '.mp4';
      }
    } else if (isImage(mimeType)) {
      // Converter imagem para WebP
      console.log(`Detectado imagem: ${originalName} (${mimeType})`);
      processedBuffer = await compressAndConvertToWebP(buffer, originalName);
      contentType = 'image/webp';
      fileExtension = '.webp';
    } else {
      // Manter formato original para outros tipos
      console.log(`Mantendo formato original: ${originalName} (${mimeType})`);
      processedBuffer = buffer;
      contentType = mimeType;
      fileExtension = path.extname(originalName);
    }

    const finalPath = `${fileName}_${timestamp}${fileExtension}`;
    
    // CORREÇÃO: Sempre usar bucket 'images' para compatibilidade 
    // O bucket 'images' do Supabase suporta tanto imagens quanto vídeos MP4/GIF
    const targetBucket = bucket; // Usar sempre o bucket passado como parâmetro
    
    console.log(`Fazendo upload para Supabase: ${targetBucket}/${finalPath} (${(processedBuffer.length / 1024).toFixed(1)}KB), contentType: ${contentType}`);

    // Assegurar que o bucket existe e tem configurações corretas
    await ensureBucket(targetBucket);

    // Upload para o Supabase com upsert e configurações mais flexíveis
    const { data, error } = await supabase.storage
      .from(targetBucket)
      .upload(finalPath, processedBuffer, { 
        contentType, 
        upsert: true,
        duplex: 'half' // Para compatibilidade com vídeos
      });

    if (error) {
      console.error('Erro no upload Supabase:', error);
      
      // Se é erro de MIME type, tentar upload sem especificar contentType
      if (error.message.includes('mime type') || error.message.includes('not supported')) {
        console.log('Fallback: Tentando upload sem contentType específico');
        
        // Upload sem especificar contentType (deixar Supabase detectar automaticamente)
        const { data: fallbackData, error: fallbackError } = await supabase.storage
          .from(bucket) // Sempre usar bucket original
          .upload(finalPath, processedBuffer, { 
            upsert: true // Sem contentType explícito
          });
        
        if (fallbackError) {
          console.error('Erro no fallback upload:', fallbackError);
          return { url: null, error: `Upload falhou após fallback: ${fallbackError.message}` };
        }
        
        const fallbackUrl = `https://kmunxjuiuxaqitbovjls.supabase.co/storage/v1/object/public/${bucket}/${finalPath}?t=${timestamp}`;
        console.log(`Fallback bem-sucedido (sem contentType): ${fallbackUrl}`);
        return { url: fallbackUrl, error: null };
      }
      
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
 * Mantém compatibilidade com a função anterior para upload apenas de imagens
 * @deprecated Use uploadFileToSupabase instead
 */
export async function uploadImageToSupabase(
  buffer: Buffer,
  originalName: string,
  bucket: string,
  fileName: string
): Promise<{ url: string | null; error: string | null }> {
  // Assumir que é imagem se não temos MIME type
  return uploadFileToSupabase(buffer, originalName, 'image/jpeg', bucket, fileName);
}

/**
 * Faz upload especializado para logos (converte SVG para PNG de alta qualidade)
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
    let contentType = 'image/png';
    let fileExtension = '.png';
    
    // Gerar timestamp único para evitar cache
    const timestamp = Date.now();
    
    console.log(`Processando logo: ${originalName} (${mimeType})`);
    
    // Converter para PNG de alta qualidade (funciona com SVG e outros formatos)
    try {
      if (mimeType === 'image/svg+xml') {
        console.log(`Convertendo SVG ${originalName} para PNG de alta qualidade...`);
        
        // Para SVG, criar PNG de alta resolução
        finalBuffer = await sharp(buffer, { density: 300 })
          .resize(800, 800, { 
            fit: 'inside', 
            withoutEnlargement: true,
            background: { r: 255, g: 255, b: 255, alpha: 0 } // Fundo transparente
          })
          .png({ 
            quality: 100,
            compressionLevel: 6,
            adaptiveFiltering: true
          })
          .toBuffer();
          
        console.log(`SVG convertido para PNG de alta qualidade: ${(finalBuffer.length / 1024).toFixed(1)}KB`);
      } else {
        // Para outros formatos, otimizar mantendo boa qualidade
        finalBuffer = await sharp(buffer)
          .resize(800, 800, { 
            fit: 'inside', 
            withoutEnlargement: true 
          })
          .png({ 
            quality: 95,
            compressionLevel: 6
          })
          .toBuffer();
          
        console.log(`${originalName} otimizado para PNG: ${(finalBuffer.length / 1024).toFixed(1)}KB`);
      }
    } catch (sharpError) {
      console.warn('Falha na conversão, usando original:', sharpError);
      // Se falhar, manter o buffer original
      if (mimeType.startsWith('image/')) {
        contentType = mimeType;
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
    
    if (getBucketError && getBucketError.message.includes('not found')) {
      // Tentar criar o bucket com configurações mais permissivas
      console.log(`Criando bucket ${bucketName} com suporte completo a mídia...`);
      const { error: createError } = await supabase.storage.createBucket(bucketName, {
        public: true,
        allowedMimeTypes: ['image/*', 'video/*', 'application/*'], // Mais permissivo
        fileSizeLimit: 104857600 // 100MB para suportar vídeos maiores
      });
      
      if (createError) {
        console.error(`Erro ao criar bucket ${bucketName}:`, createError);
        return false;
      }
      
      console.log(`Bucket ${bucketName} criado com sucesso!`);
    } else if (bucket && !bucket.public) {
      // Tornar o bucket público e atualizar configurações
      console.log(`Atualizando bucket ${bucketName} para suportar vídeos...`);
      const { error: updateError } = await supabase.storage.updateBucket(bucketName, { 
        public: true,
        allowedMimeTypes: ['image/*', 'video/*', 'application/*'],
        fileSizeLimit: 104857600
      });
      
      if (updateError) {
        console.warn(`Aviso ao atualizar bucket ${bucketName}:`, updateError);
        // Continuar mesmo com aviso, pois pode já estar configurado
      }
    }
    
    console.log(`Bucket ${bucketName} está pronto para uso`);
    return true;
  } catch (error) {
    console.error(`Erro ao verificar/criar bucket ${bucketName}:`, error);
    return false;
  }
}