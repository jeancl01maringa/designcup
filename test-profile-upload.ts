/**
 * Script para testar upload de imagem de perfil com conversão WebP
 */

import { uploadImageToSupabase } from './server/supabase-upload.js';
import fs from 'fs';

async function testProfileUpload() {
  try {
    console.log('Testando upload de imagem de perfil com conversão WebP...');
    
    // Criar uma imagem PNG simples de teste
    const testImageBuffer = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
      0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0xD7, 0x63, 0xF8, 0x0F, 0x00, 0x00,
      0x01, 0x00, 0x01, 0x2E, 0x02, 0x9A, 0xB2, 0x00, 0x00, 0x00, 0x00, 0x49,
      0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
    ]);
    
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