import { createClient } from '@supabase/supabase-js';

// Usar as variáveis de ambiente configuradas no Replit
// No frontend, apenas import.meta.env está disponível (não process.env)
let supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string || '';
let supabaseAnonKey = import.meta.env.VITE_SUPABASE_KEY as string || '';

// Limpar as strings removendo todas as aspas duplas
if (supabaseUrl) {
  supabaseUrl = supabaseUrl.replace(/"/g, '');
  console.log('URL do Supabase após limpeza:', supabaseUrl);
}
if (supabaseAnonKey) {
  supabaseAnonKey = supabaseAnonKey.replace(/"/g, '');
}

// Verificar se a URL é válida
function isValidUrl(urlString: string): boolean {
  try {
    if (!urlString) return false;
    new URL(urlString);
    return true;
  } catch (error) {
    console.error(`URL inválida: "${urlString}"`);
    return false;
  }
}

// Verificação básica de credenciais
let credentialCheckErrors = [];
if (!supabaseUrl) credentialCheckErrors.push("VITE_SUPABASE_URL não encontrado");
if (!supabaseAnonKey) credentialCheckErrors.push("VITE_SUPABASE_KEY não encontrado");
if (supabaseUrl && !isValidUrl(supabaseUrl)) credentialCheckErrors.push("VITE_SUPABASE_URL inválido");

const hasValidCredentials = credentialCheckErrors.length === 0;

if (!hasValidCredentials) {
  console.warn(
    "⚠️ ATENÇÃO: Credenciais do Supabase ausentes ou inválidas. Funcionalidade de upload ficará indisponível."
  );
  console.warn(`Erros encontrados: ${credentialCheckErrors.join(", ")}`);
  console.warn("Por favor, configure corretamente as variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_KEY.");
}

/**
 * Cliente do Supabase configurado para uso no lado do cliente (browser)
 */
export const supabase = createClient(
  supabaseUrl || 'https://placeholder-url.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);

/**
 * Verifica se a conexão com o Supabase está funcionando
 * @returns Promise<boolean> verdadeiro se a conexão for bem-sucedida
 */
export async function checkSupabaseConnection(): Promise<boolean> {
  // Se já sabemos que as credenciais são inválidas, não precisa tentar conectar
  if (!hasValidCredentials) {
    console.warn('Verificação de conexão ignorada: credenciais inválidas.');
    return false;
  }
  
  try {
    // Testar primeiro requisição básica: verificar se podemos usar a API de storage
    const { data: bucketData, error: bucketError } = await supabase.storage.getBucket('images');
    
    if (!bucketError) {
      console.log('Conexão com Supabase storage estabelecida.');
      return true;
    }
    
    // Se falhou no bucket, tente acessar dados
    const { data, error } = await supabase.from('users').select('count');
    
    if (!error) {
      console.log('Conexão com Supabase database estabelecida.');
      return true;
    }
    
    // Registrar o motivo da falha
    if (error?.message.includes('auth')) {
      console.error('Falha de autenticação com o Supabase:', error.message);
    } else if (error?.message.includes('network')) {
      console.error('Falha de rede ao conectar com o Supabase:', error.message);
    } else {
      console.error('Erro ao verificar conexão com Supabase:', error);
    }
    
    return false;
  } catch (error) {
    console.error('Erro ao verificar conexão com Supabase:', error);
    return false;
  }
}

/**
 * Verifica e garante que o bucket de imagens existe
 * @returns Promise<boolean> verdadeiro se o bucket existe ou foi criado com sucesso
 */
export async function ensureImageBucket(): Promise<boolean> {
  // Se as credenciais são inválidas, não tente criar o bucket
  if (!hasValidCredentials) {
    console.warn('Verificação/criação de bucket ignorada: credenciais inválidas.');
    return false;
  }
  
  try {
    // Primeiro, verifique se o bucket já existe
    const { data: bucketData, error: getBucketError } = await supabase.storage.getBucket('images');
    
    // Se não houve erro, o bucket existe
    if (!getBucketError) {
      console.log('Bucket "images" já existe.');
      return true;
    }
    
    // Se o erro não for "não encontrado", é outro problema
    if (!getBucketError.message.includes('not found')) {
      console.error('Erro ao verificar bucket:', getBucketError);
      return false;
    }
    
    // Tentar listar buckets para confirmar se temos permissão
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Erro ao listar buckets. Permissão insuficiente:', listError);
      return false;
    }
    
    // Verificar nos buckets retornados
    const imagesBucketExists = buckets.some(bucket => bucket.name === 'images');
    
    if (imagesBucketExists) {
      console.log('Bucket "images" encontrado na lista de buckets.');
      return true;
    }
    
    // Criar o bucket se não existir
    console.log('Criando bucket "images"...');
    const { error: createError } = await supabase.storage.createBucket('images', {
      public: true, // acessível publicamente
      fileSizeLimit: 10485760, // 10MB
    });
    
    if (createError) {
      console.error('Erro ao criar bucket "images":', createError);
      return false;
    }
    
    console.log('Bucket "images" criado com sucesso.');
    return true;
  } catch (error) {
    console.error('Falha ao verificar/criar bucket:', error);
    return false;
  }
}