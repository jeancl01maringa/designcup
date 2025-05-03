import { createClient } from '@supabase/supabase-js';

// Função para validar URL
function isValidUrl(urlString: string): boolean {
  try {
    // Tentar criar um objeto URL (lança exceção se inválido)
    new URL(urlString);
    // Verificar se é um URL do tipo https
    return urlString.startsWith('https://');
  } catch (e) {
    return false;
  }
}

// Verificar se as variáveis de ambiente estão disponíveis e válidas
let supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string || '';
let supabaseKey = import.meta.env.VITE_SUPABASE_KEY as string || '';

// Remover aspas extras se presentes (erro comum ao copiar de documentação)
if (supabaseUrl.startsWith('"') && supabaseUrl.endsWith('"')) {
  supabaseUrl = supabaseUrl.slice(1, -1);
}
if (supabaseKey.startsWith('"') && supabaseKey.endsWith('"')) {
  supabaseKey = supabaseKey.slice(1, -1);
}

// Verificar a validade da URL
if (!isValidUrl(supabaseUrl)) {
  console.error(`VITE_SUPABASE_URL inválida: "${supabaseUrl}". O armazenamento de imagens não funcionará corretamente.`);
  supabaseUrl = 'https://example.supabase.co'; // URL placeholder para evitar erros de construção
}

// Verificar se a chave está presente
if (!supabaseKey) {
  console.error('VITE_SUPABASE_KEY não definida. O armazenamento de imagens não funcionará corretamente.');
}

// Criar uma função que retorna um cliente mock se as credenciais não forem válidas
function createSupabaseClient() {
  const hasValidCredentials = isValidUrl(supabaseUrl) && supabaseKey.length > 0;
  
  if (!hasValidCredentials) {
    console.error('Usando cliente Supabase simulado devido a credenciais inválidas.');
    // @ts-ignore - permitindo um mock rudimentar para evitar erros
    return {
      storage: {
        listBuckets: () => ({ data: [], error: new Error('Credenciais Supabase inválidas') }),
        createBucket: () => ({ error: new Error('Credenciais Supabase inválidas') }),
        from: () => ({
          upload: () => ({ error: new Error('Credenciais Supabase inválidas') }),
          getPublicUrl: () => ({ data: { publicUrl: '' } }),
        }),
      },
    };
  }
  
  // Criar um cliente real se tivermos credenciais válidas
  try {
    console.log('Inicializando cliente Supabase com URL:', supabaseUrl);
    console.log('Chave Supabase válida:', supabaseKey && supabaseKey.length > 0);
    return createClient(supabaseUrl, supabaseKey);
  } catch (error) {
    console.error('Erro ao criar cliente Supabase:', error);
    // @ts-ignore - permitindo um mock rudimentar para evitar erros
    return {
      storage: {
        listBuckets: () => ({ data: [], error: new Error('Erro ao criar cliente Supabase') }),
        createBucket: () => ({ error: new Error('Erro ao criar cliente Supabase') }),
        from: () => ({
          upload: () => ({ error: new Error('Erro ao criar cliente Supabase') }),
          getPublicUrl: () => ({ data: { publicUrl: '' } }),
        }),
      },
    };
  }
}

// Exportar o cliente
export const supabase = createSupabaseClient();

/**
 * Verifica se o bucket de imagens existe e o cria se necessário
 */
export async function ensureImageBucket() {
  try {
    // Verificar se o bucket já existe
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      throw listError;
    }
    
    const imagesBucketExists = buckets?.some(bucket => bucket.name === 'images');
    
    if (!imagesBucketExists) {
      // Criar bucket se não existir
      const { error: createError } = await supabase.storage.createBucket('images', {
        public: true,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp']
      });
      
      if (createError) {
        throw createError;
      }
      
      console.log('Bucket de imagens criado com sucesso!');
    }
  } catch (error) {
    console.error('Erro ao configurar bucket de imagens:', error);
    throw new Error('Não foi possível configurar o armazenamento de imagens.');
  }
}

/**
 * Gera um nome de arquivo único para upload
 */
export function generateUniqueFileName(originalFileName: string, extension = 'webp') {
  const timestamp = new Date().getTime();
  const randomString = Math.random().toString(36).substring(2, 10);
  const cleanFileName = originalFileName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  
  return `${cleanFileName.substring(0, 20)}-${timestamp}-${randomString}.${extension}`;
}

/**
 * Retorna a URL pública de uma imagem armazenada no Supabase
 */
export function getPublicImageUrl(filePath: string) {
  const { data } = supabase.storage.from('images').getPublicUrl(filePath);
  return data.publicUrl;
}