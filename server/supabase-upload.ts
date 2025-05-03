import { supabaseAdmin } from './supabase';
import fs from 'fs';
import path from 'path';
import { log } from './vite';

// Função para fazer o upload de uma imagem para o Supabase Storage
export async function uploadImageToSupabase(filePath: string, targetPath: string): Promise<string | null> {
  try {
    console.log(`Iniciando upload de ${filePath} para Supabase...`);
    
    // Verificar se o arquivo existe
    if (!fs.existsSync(filePath)) {
      console.error(`Arquivo ${filePath} não encontrado`);
      return null;
    }
    
    // Ler o arquivo
    const fileBuffer = fs.readFileSync(filePath);
    
    // Realizar o upload para o bucket 'images'
    const { data, error } = await supabaseAdmin.storage
      .from('images')
      .upload(targetPath, fileBuffer, {
        contentType: getContentType(filePath),
        upsert: true
      });
    
    if (error) {
      console.error(`Erro ao fazer upload para o Supabase: ${error.message}`);
      return null;
    }
    
    // Obter URL pública da imagem
    const { data: urlData } = supabaseAdmin.storage
      .from('images')
      .getPublicUrl(data.path);
    
    console.log(`Upload bem-sucedido: ${urlData.publicUrl}`);
    return urlData.publicUrl;
  } catch (error) {
    console.error('Erro ao fazer upload da imagem:', error);
    return null;
  }
}

// Função para extrair o tipo de conteúdo (MIME type) com base na extensão do arquivo
function getContentType(filePath: string): string {
  const extension = path.extname(filePath).toLowerCase();
  
  switch (extension) {
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.png':
      return 'image/png';
    case '.gif':
      return 'image/gif';
    case '.webp':
      return 'image/webp';
    case '.svg':
      return 'image/svg+xml';
    default:
      return 'application/octet-stream';
  }
}

// Função para migrar imagens para o Supabase
export async function migrateImagesToSupabase() {
  try {
    const assetsDir = path.resolve('./attached_assets');
    
    // Verificar se o diretório existe
    if (!fs.existsSync(assetsDir)) {
      log('Diretório de assets não encontrado: ' + assetsDir);
      return;
    }
    
    // Listar arquivos
    const files = fs.readdirSync(assetsDir);
    const imageFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'].includes(ext);
    });
    
    log(`Encontradas ${imageFiles.length} imagens para migrar para o Supabase`);
    
    // Fazer upload de cada imagem
    for (const file of imageFiles) {
      const filePath = path.join(assetsDir, file);
      const targetPath = `assets/${file}`; // Caminho no Supabase Storage
      
      const url = await uploadImageToSupabase(filePath, targetPath);
      
      if (url) {
        log(`Migração de imagem concluída: ${file} -> ${url}`);
      } else {
        log(`Falha ao migrar imagem: ${file}`);
      }
    }
    
    log('Migração de imagens concluída');
  } catch (error) {
    log('Erro ao migrar imagens para o Supabase: ' + error);
  }
}