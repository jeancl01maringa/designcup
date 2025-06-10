/**
 * Script para testar upload de imagem de perfil com conversão WebP
 */

import { uploadImageToSupabase } from './server/supabase-upload.js';
import sharp from 'sharp';

async function testProfileUpload() {
  try {
    console.log('Testando upload de imagem de perfil com conversão WebP...');
    
    // Criar uma imagem PNG válida usando Sharp
    const testImageBuffer = await sharp({
      create: {
        width: 100,
        height: 100,
        channels: 3,
        background: { r: 255, g: 0, b: 0 }
      }
    }).png().toBuffer();
    
    console.log(`Imagem de teste criada: ${testImageBuffer.length} bytes`);
    
    // Testar upload para bucket 'perfis'
    const result = await uploadImageToSupabase(
      testImageBuffer,
      'test-profile.png',
      'perfis',
      'test_profile_upload'
    );
    
    if (result.error) {
      console.error('Erro no upload:', result.error);
    } else {
      console.log('Upload bem-sucedido!');
      console.log('URL da imagem:', result.url);
      console.log('Conversão WebP aplicada:', result.url?.includes('.webp') ? 'Sim' : 'Não');
    }
    
  } catch (error) {
    console.error('Erro no teste:', error);
  }
}

testProfileUpload();