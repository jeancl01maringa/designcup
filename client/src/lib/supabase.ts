import { createClient } from '@supabase/supabase-js';

// Definir URL e chave de fallback para desenvolvimento (não usadas em produção)
const fallbackUrl = 'https://mysupabase.supabase.co';
const fallbackKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

// Usar as variáveis de ambiente configuradas no Replit
// No frontend, apenas import.meta.env está disponível (não process.env)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_KEY;

// Validar se as credenciais estão disponíveis
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "Aviso: Credenciais do Supabase não encontradas nas variáveis de ambiente. Usando valores de fallback."
  );
}

// Verificar se a URL é válida
function isValidUrl(urlString: string): boolean {
  try {
    new URL(urlString);
    return true;
  } catch (error) {
    return false;
  }
}

// Selecionar URL e chave a serem usadas
const url = (supabaseUrl && isValidUrl(supabaseUrl)) ? supabaseUrl : fallbackUrl;
const key = supabaseAnonKey || fallbackKey;

console.log("Inicializando Supabase com URL:", url.substring(0, 8) + "...");

/**
 * Cliente do Supabase configurado para uso no lado do cliente (browser)
 */
export const supabase = createClient(url, key);

/**
 * Verifica se a conexão com o Supabase está funcionando
 * @returns Promise<boolean> verdadeiro se a conexão for bem-sucedida
 */
export async function checkSupabaseConnection(): Promise<boolean> {
  try {
    const { data, error } = await supabase.from('users').select('count');
    return !error;
  } catch (error) {
    console.error('Erro ao verificar conexão com Supabase:', error);
    return false;
  }
}

/**
 * Verifica e garante que o bucket de imagens existe
 */
export async function ensureImageBucket(): Promise<void> {
  try {
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error('Erro ao listar buckets:', error);
      return;
    }
    
    const imagesBucketExists = buckets.some(bucket => bucket.name === 'images');
    
    if (!imagesBucketExists) {
      const { error: createError } = await supabase.storage.createBucket('images', {
        public: true, // acessível publicamente
        fileSizeLimit: 10485760, // 10MB
      });
      
      if (createError) {
        console.error('Erro ao criar bucket images:', createError);
      }
    }
  } catch (error) {
    console.error('Falha ao verificar/criar bucket:', error);
  }
}