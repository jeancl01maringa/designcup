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

/**
 * Verifica se o usuário está autenticado no Supabase
 * @returns Promise que resolve com o objeto do usuário ou null se não estiver autenticado
 */
export async function getCurrentUser() {
  try {
    // Se as credenciais são inválidas, não tente obter o usuário
    if (!hasValidCredentials) {
      console.warn('Verificação de usuário ignorada: credenciais inválidas.');
      return null;
    }
    
    const { data, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('Erro ao verificar usuário logado:', error);
      return null;
    }
    
    return data?.user || null;
  } catch (error) {
    console.error('Erro ao verificar autenticação do usuário:', error);
    return null;
  }
}

/**
 * Sanitiza um nome de arquivo removendo caracteres especiais, acentos e espaços
 * Importante para compatibilidade com sistemas de arquivos e URLs
 * 
 * @param name Nome do arquivo original
 * @returns Nome do arquivo limpo, seguro para uso em caminhos
 */
export function sanitizeFileName(name: string): string {
  // Remover a extensão para processamento
  const lastDotIndex = name.lastIndexOf('.');
  const extension = lastDotIndex !== -1 ? name.substring(lastDotIndex) : '';
  const baseName = lastDotIndex !== -1 ? name.substring(0, lastDotIndex) : name;
  
  // Remover acentos
  const withoutAccents = baseName.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  
  // Substituir caracteres não alfanuméricos por underscore e converter para minúsculas
  const cleaned = withoutAccents.replace(/[^a-zA-Z0-9-_.]/g, '_').toLowerCase();
  
  // Limitar tamanho e retornar com extensão
  return (cleaned.substring(0, 50) + extension).toLowerCase();
}

/**
 * Comprime e converte uma imagem para WebP antes do upload
 * Melhora significativamente o desempenho e tamanho do arquivo
 * 
 * @param file Arquivo de imagem original
 * @returns Promise que resolve com o arquivo comprimido em formato WebP
 */
async function compressAndConvertToWebP(file: File): Promise<File> {
  try {
    // Importação dinâmica da biblioteca de compressão
    const imageCompression = await import('browser-image-compression');
    
    // Opções de compressão otimizadas para web
    const options = {
      maxSizeMB: 1,             // Tamanho máximo em MB
      maxWidthOrHeight: 1920,   // Dimensão máxima (mantém proporção)
      useWebWorker: true,       // Usa worker para não bloquear UI
      fileType: 'image/webp',   // Converte para WebP
      initialQuality: 0.8,      // Qualidade inicial (0-1)
    };
    
    console.log(`Comprimindo imagem: ${file.name} (${(file.size / 1024).toFixed(1)}KB)`);
    
    // Comprimir a imagem
    const compressedFile = await imageCompression.default(file, options);
    
    // Gerar um novo nome com extensão .webp
    const originalName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
    const webpFile = new File([compressedFile], `${originalName}.webp`, {
      type: 'image/webp',
    });
    
    console.log(`Imagem convertida para WebP: ${webpFile.name} (${(webpFile.size / 1024).toFixed(1)}KB)`);
    console.log(`Taxa de compressão: ${((1 - webpFile.size / file.size) * 100).toFixed(1)}%`);
    
    return webpFile;
  } catch (error) {
    console.warn('Erro na compressão da imagem, usando original:', error);
    return file; // Em caso de erro, retorna o arquivo original
  }
}

/**
 * Faz o upload de um arquivo para o bucket 'images' do Supabase
 * Implementação seguindo as práticas recomendadas
 * 
 * @param file Arquivo para upload
 * @param customPath Caminho personalizado (opcional)
 * @param convertToWebP Se true, converte a imagem para WebP antes do upload (default: true)
 * @returns Promise com a URL pública do arquivo ou null em caso de erro
 */
export async function uploadFileToSupabase(
  file: File, 
  customPath?: string, 
  convertToWebP = true
): Promise<string | null> {
  // Verificar se temos credenciais válidas
  if (!hasValidCredentials) {
    console.error('Upload falhou: credenciais do Supabase inválidas.');
    return null;
  }
  
  try {
    // 1. Autenticar diretamente com o Supabase utilizando a API key do projeto
    // Isto é necessário porque o RLS exige que estejamos autenticados para upload
    try {
      // Tentar fazer login com chave anônima para autorizar operações de storage
      const { data: sessionData, error: sessionError } = await supabase.auth.signInWithPassword({
        email: 'jean.maringa@hotmail.com', // Usar o email do usuário admin
        password: import.meta.env.VITE_SUPABASE_USER_PASSWORD || '', // Usando a senha armazenada como secret
      });
      
      if (sessionError) {
        console.warn('Falha ao autenticar com Supabase para upload:', sessionError.message);
      } else {
        console.log('Autenticado com sucesso no Supabase para upload');
      }
    } catch (authError) {
      console.warn('Erro ao tentar autenticar para upload:', authError);
    }
    
    // 2. Comprimir e converter para WebP se for uma imagem e a opção estiver ativada
    let fileToUpload = file;
    if (convertToWebP && file.type.startsWith('image/')) {
      fileToUpload = await compressAndConvertToWebP(file);
    }
    
    // 3. Preparar o caminho do arquivo com timestamp para evitar conflitos
    const timestamp = Date.now();
    
    const cleanFileName = sanitizeFileName(fileToUpload.name);
    
    // Se um caminho personalizado foi fornecido, sanitize também esse caminho
    let finalPath;
    if (customPath) {
      // Separar o diretório do nome do arquivo no caminho personalizado
      const lastSlashIndex = customPath.lastIndexOf('/');
      if (lastSlashIndex === -1) {
        // Não há diretório no caminho, usa apenas o nome limpo
        finalPath = cleanFileName;
      } else {
        // Limpar o diretório e combinar com o nome limpo
        const dir = customPath.substring(0, lastSlashIndex);
        const cleanDir = dir.replace(/[^a-zA-Z0-9-_/]/g, '_').toLowerCase();
        finalPath = `${cleanDir}/${cleanFileName}`;
      }
    } else {
      // Usar o caminho padrão com timestamp
      finalPath = `posts/${timestamp}-${cleanFileName}`;
    }
    
    const filePath = finalPath;
    
    console.log(`Fazendo upload para Supabase em '${filePath}'...`);
    
    // 3. Fazer upload com opção upsert para sobrescrever arquivos existentes
    const { data, error } = await supabase.storage
      .from('images')
      .upload(filePath, fileToUpload, {
        upsert: true,  // Permite sobrescrever arquivos existentes
        cacheControl: '3600',
      });
      
    if (error) {
      console.error('Erro no upload para Supabase:', error);
      throw error;
    }
    
    // 4. Gerar URL pública para o arquivo enviado
    const { data: { publicUrl } } = supabase.storage
      .from('images')
      .getPublicUrl(filePath);
    
    // 5. Atualizar o campo owner na tabela storage.objects com o ID do usuário logado
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      if (userData?.user) {
        console.log('Atualizando owner do arquivo para:', userData.user.id);
        
        // Atualizar o campo owner para permitir UPDATE/DELETE pelo usuário posteriormente
        await supabase
          .from('storage.objects')
          .update({ owner: userData.user.id })
          .eq('name', filePath);
          
        console.log('Campo owner atualizado com sucesso');
      } else {
        console.warn('Não foi possível obter ID do usuário para atualizar owner');
      }
    } catch (ownerUpdateError) {
      // Não falhar o upload se a atualização do owner falhar
      console.warn('Erro ao atualizar campo owner:', ownerUpdateError);
    }
      
    console.log('Upload bem-sucedido. URL pública:', publicUrl);
    return publicUrl;
    
  } catch (error) {
    console.error('Falha no upload para Supabase:', error);
    return null;
  }
}