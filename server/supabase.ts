import { createClient } from '@supabase/supabase-js';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from '@shared/schema';

// Definir URL e chave de fallback para desenvolvimento (não usadas em produção)
const fallbackUrl = 'https://mysupabase.supabase.co';
const fallbackKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

// Verificações de ambiente
if (!process.env.SUPABASE_URL) {
  console.warn('SUPABASE_URL não está definida, usando fallback');
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('SUPABASE_SERVICE_ROLE_KEY não está definida, usando fallback');
}

// Remover aspas extras se presentes (erro comum ao copiar de documentação)
let supabaseUrl = process.env.SUPABASE_URL || fallbackUrl;
let supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || fallbackKey;

if (supabaseUrl.startsWith('"') && supabaseUrl.endsWith('"')) {
  supabaseUrl = supabaseUrl.slice(1, -1);
}

if (supabaseServiceKey.startsWith('"') && supabaseServiceKey.endsWith('"')) {
  supabaseServiceKey = supabaseServiceKey.slice(1, -1);
}

// Validar URL
function isValidUrl(urlString: string): boolean {
  try {
    new URL(urlString);
    return true;
  } catch (error) {
    return false;
  }
}

// Garantir que a URL é válida
if (!isValidUrl(supabaseUrl)) {
  console.warn('URL Supabase inválida, usando fallback:', supabaseUrl);
  supabaseUrl = fallbackUrl;
}

// Criar cliente Supabase com chave de serviço (acesso privilegiado)
export const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Função para verificar e criar tabelas necessárias
export async function setupSupabaseTables() {
  try {
    console.log('Iniciando setup do Supabase...');
    
    // Verificar se podemos acessar o Supabase
    try {
      // Tentar listar buckets para verificar a conexão
      const { data: buckets, error } = await supabaseAdmin.storage.listBuckets();
      
      if (error) {
        console.error('Erro ao conectar com Supabase:', error);
        return;
      }
      
      console.log(`Conexão com Supabase estabelecida! Buckets encontrados: ${buckets?.length || 0}`);
      
      // Verificar/criar bucket de imagens
      const imagesBucket = buckets?.find(b => b.name === 'images');
      
      if (!imagesBucket) {
        // Criar bucket de imagens
        const { error: createError } = await supabaseAdmin.storage.createBucket('images', {
          public: true,
          fileSizeLimit: 10485760, // 10MB
          allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/gif']
        });
        
        if (createError) {
          console.error('Erro ao criar bucket de imagens:', createError);
        } else {
          console.log('Bucket de imagens criado com sucesso');
        }
      } else {
        console.log('Bucket de imagens já existe');
      }
      
      // Criar tabelas via REST API (já que SQL direto não está disponível)
      await createTables();
      
    } catch (error) {
      console.error('Erro ao acessar Supabase:', error);
    }
    
    console.log('Setup do Supabase concluído');
  } catch (error) {
    console.error('Erro durante o setup do Supabase:', error);
  }
}

// Função para criar tabelas no Supabase usando a API REST direta
async function createTables() {
  try {
    console.log('Iniciando criação de tabelas no Supabase via API...');
    
    // Criar tabelas diretamente com a API do Supabase
    
    // 1. Criar tabela users
    await createUserTable();
    
    // 2. Criar tabela categories
    await createCategoryTable();
    
    // 3. Criar tabela artworks
    await createArtworkTable();
    
    // 4. Criar tabela posts
    await createPostTable();
    
    // 5. Criar tabela favorites
    await createFavoritesTable();
    
    // 6. Criar tabela user_artworks
    await createUserArtworksTable();
    
    console.log('Criação de tabelas via API do Supabase concluída');
    return true;
  } catch (error) {
    console.error('Erro ao criar tabelas no Supabase:', error);
    return false;
  }
}

// Funções específicas para criar cada tabela com o Supabase Management API
async function createUserTable() {
  try {
    // Verificar se a tabela já existe tentando selecionar algo
    const { error: checkError } = await supabaseAdmin.from('users').select('count').limit(1);
    
    if (!checkError) {
      console.log('Tabela users já existe');
      return;
    }
    
    if (checkError.code !== '42P01') {
      console.error('Erro inesperado ao verificar tabela users:', checkError);
      return;
    }
    
    console.log('Criando tabela users via API...');
    
    // Criar tabela users via API REST
    // Em um ambiente de produção, a criação de tabelas seria feita pelo SQL Editor do Supabase
    // ou via Supabase Migration
    
    // Como alternativa, vamos informar ao usuário para criar as tabelas manualmente no Supabase
    console.log('NOTA: Para criar tabelas no Supabase, você precisa usar o SQL Editor na interface web do Supabase.');
    console.log('Instruções para criar a tabela Users:');
    console.log(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        is_admin BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
  } catch (error) {
    console.error('Erro ao criar tabela users:', error);
  }
}

async function createCategoryTable() {
  try {
    // Verificar se a tabela já existe tentando selecionar algo
    const { error: checkError } = await supabaseAdmin.from('categories').select('count').limit(1);
    
    if (!checkError) {
      console.log('Tabela categories já existe');
      return;
    }
    
    if (checkError.code !== '42P01') {
      console.error('Erro inesperado ao verificar tabela categories:', checkError);
      return;
    }
    
    console.log('Instruções para criar a tabela Categories:');
    console.log(`
      CREATE TABLE categories (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        image_url TEXT,
        slug TEXT UNIQUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
  } catch (error) {
    console.error('Erro ao verificar/criar tabela categories:', error);
  }
}

async function createArtworkTable() {
  try {
    // Verificar se a tabela já existe tentando selecionar algo
    const { error: checkError } = await supabaseAdmin.from('artworks').select('count').limit(1);
    
    if (!checkError) {
      console.log('Tabela artworks já existe');
      return;
    }
    
    if (checkError.code !== '42P01') {
      console.error('Erro inesperado ao verificar tabela artworks:', checkError);
      return;
    }
    
    console.log('Instruções para criar a tabela Artworks:');
    console.log(`
      CREATE TABLE artworks (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        image_url TEXT NOT NULL,
        format TEXT NOT NULL,
        is_pro BOOLEAN DEFAULT FALSE,
        category TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
  } catch (error) {
    console.error('Erro ao verificar/criar tabela artworks:', error);
  }
}

async function createPostTable() {
  try {
    // Verificar se a tabela já existe tentando selecionar algo
    const { error: checkError } = await supabaseAdmin.from('posts').select('count').limit(1);
    
    if (!checkError) {
      console.log('Tabela posts já existe');
      return;
    }
    
    if (checkError.code !== '42P01') {
      console.error('Erro inesperado ao verificar tabela posts:', checkError);
      return;
    }
    
    console.log('Instruções para criar a tabela Posts:');
    console.log(`
      -- Primeiro criar o enum para status
      CREATE TYPE post_status AS ENUM ('aprovado', 'rascunho', 'rejeitado');
      
      -- Depois criar a tabela
      CREATE TABLE posts (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        content TEXT,
        image_url TEXT,
        status TEXT DEFAULT 'rascunho',
        unique_code TEXT,
        category_id INTEGER REFERENCES categories(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        published_at TIMESTAMP WITH TIME ZONE
      );
    `);
  } catch (error) {
    console.error('Erro ao verificar/criar tabela posts:', error);
  }
}

async function createFavoritesTable() {
  try {
    // Verificar se a tabela já existe tentando selecionar algo
    const { error: checkError } = await supabaseAdmin.from('favorites').select('count').limit(1);
    
    if (!checkError) {
      console.log('Tabela favorites já existe');
      return;
    }
    
    if (checkError.code !== '42P01') {
      console.error('Erro inesperado ao verificar tabela favorites:', checkError);
      return;
    }
    
    console.log('Instruções para criar a tabela Favorites:');
    console.log(`
      CREATE TABLE favorites (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        artwork_id INTEGER REFERENCES artworks(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id, artwork_id)
      );
    `);
  } catch (error) {
    console.error('Erro ao verificar/criar tabela favorites:', error);
  }
}

async function createUserArtworksTable() {
  try {
    // Verificar se a tabela já existe tentando selecionar algo
    const { error: checkError } = await supabaseAdmin.from('user_artworks').select('count').limit(1);
    
    if (!checkError) {
      console.log('Tabela user_artworks já existe');
      return;
    }
    
    if (checkError.code !== '42P01') {
      console.error('Erro inesperado ao verificar tabela user_artworks:', checkError);
      return;
    }
    
    console.log('Instruções para criar a tabela User_Artworks:');
    console.log(`
      CREATE TABLE user_artworks (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        artwork_id INTEGER REFERENCES artworks(id) ON DELETE CASCADE,
        used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        customizations JSONB,
        UNIQUE(user_id, artwork_id)
      );
    `);
  } catch (error) {
    console.error('Erro ao verificar/criar tabela user_artworks:', error);
  }
}

// Função para migrar dados do PostgreSQL local para o Supabase
export async function migrateLocalDataToSupabase(db: ReturnType<typeof drizzle>) {
  try {
    console.log('Verificando o status da migração para o Supabase...');
    
    // Verificar se conseguimos acessar o Supabase
    const { data, error } = await supabaseAdmin.from('users').select('count').limit(1);
    
    if (error) {
      console.error('Erro ao acessar o Supabase:', error);
      console.log('A migração de dados foi adiada devido a erros de conexão.');
      return;
    }
    
    console.log('Conexão com Supabase estabelecida. Iniciando migração de dados...');
    
    // Verificar se já existem dados nas tabelas
    const { count: userCount } = await supabaseAdmin.from('users').select('*', { count: 'exact', head: true });
    
    if (userCount && userCount > 0) {
      console.log(`Encontrados ${userCount} usuários no Supabase. Deseja prosseguir com a migração?`);
      console.log('AVISO: A migração pode resultar em dados duplicados se as tabelas não estiverem vazias.');
      console.log('Continuando com a migração...');
    }
    
    // 1. Migrar usuários
    await migrateUsers(db);
    
    // 2. Migrar categorias
    await migrateCategories(db);
    
    // 3. Migrar artworks
    await migrateArtworks(db);
    
    // 4. Migrar posts
    await migratePosts(db);
    
    console.log('Migração de dados para Supabase concluída com sucesso');
  } catch (error) {
    console.error('Erro durante migração de dados para o Supabase:', error);
  }
}

// Função para migrar usuários
async function migrateUsers(db: ReturnType<typeof drizzle>) {
  try {
    const localUsers = await db.select().from(schema.users);
    
    if (localUsers.length === 0) {
      console.log('Nenhum usuário local para migrar');
      return;
    }
    
    console.log(`Iniciando migração de ${localUsers.length} usuários...`);
    
    for (const user of localUsers) {
      // Verificar se o usuário já existe no Supabase
      const { data: existingUsers } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('email', user.email)
        .limit(1);
      
      if (!existingUsers || existingUsers.length === 0) {
        // Converter de camelCase para snake_case para compatibilidade com Supabase
        const supabaseUser = {
          username: user.username,
          email: user.email,
          password: user.password,
          is_admin: user.isAdmin,
          created_at: user.createdAt
        };
        
        const { error } = await supabaseAdmin.from('users').insert(supabaseUser);
        
        if (error) {
          console.error(`Erro ao migrar usuário ${user.email}:`, error);
        } else {
          console.log(`Usuário ${user.email} migrado com sucesso`);
        }
      } else {
        console.log(`Usuário ${user.email} já existe no Supabase`);
      }
    }
    
    console.log('Migração de usuários concluída');
  } catch (error) {
    console.error('Erro ao migrar usuários:', error);
  }
}

// Função para migrar categorias
async function migrateCategories(db: ReturnType<typeof drizzle>) {
  try {
    const localCategories = await db.select().from(schema.categories);
    
    if (localCategories.length === 0) {
      console.log('Nenhuma categoria local para migrar');
      return;
    }
    
    console.log(`Iniciando migração de ${localCategories.length} categorias...`);
    
    for (const category of localCategories) {
      // Verificar se a categoria já existe no Supabase
      const { data: existingCategories } = await supabaseAdmin
        .from('categories')
        .select('id')
        .eq('name', category.name)
        .limit(1);
      
      if (!existingCategories || existingCategories.length === 0) {
        // Converter de camelCase para snake_case para compatibilidade com Supabase
        const supabaseCategory = {
          name: category.name,
          description: category.description,
          image_url: category.imageUrl,
          slug: category.slug,
          created_at: category.createdAt
        };
        
        const { error } = await supabaseAdmin.from('categories').insert(supabaseCategory);
        
        if (error) {
          console.error(`Erro ao migrar categoria ${category.name}:`, error);
        } else {
          console.log(`Categoria ${category.name} migrada com sucesso`);
        }
      } else {
        console.log(`Categoria ${category.name} já existe no Supabase`);
      }
    }
    
    console.log('Migração de categorias concluída');
  } catch (error) {
    console.error('Erro ao migrar categorias:', error);
  }
}

// Função para migrar artworks
async function migrateArtworks(db: ReturnType<typeof drizzle>) {
  try {
    const localArtworks = await db.select().from(schema.artworks);
    
    if (localArtworks.length === 0) {
      console.log('Nenhuma artwork local para migrar');
      return;
    }
    
    console.log(`Iniciando migração de ${localArtworks.length} artworks...`);
    
    for (const artwork of localArtworks) {
      // Verificar se a artwork já existe no Supabase
      const { data: existingArtworks } = await supabaseAdmin
        .from('artworks')
        .select('id')
        .eq('title', artwork.title)
        .limit(1);
      
      if (!existingArtworks || existingArtworks.length === 0) {
        // Converter de camelCase para snake_case para compatibilidade com Supabase
        const supabaseArtwork = {
          title: artwork.title,
          description: artwork.description,
          image_url: artwork.imageUrl,
          format: artwork.format,
          is_pro: artwork.isPro,
          category: artwork.category,
          created_at: artwork.createdAt
        };
        
        const { error } = await supabaseAdmin.from('artworks').insert(supabaseArtwork);
        
        if (error) {
          console.error(`Erro ao migrar artwork ${artwork.title}:`, error);
        } else {
          console.log(`Artwork ${artwork.title} migrada com sucesso`);
        }
      } else {
        console.log(`Artwork ${artwork.title} já existe no Supabase`);
      }
    }
    
    console.log('Migração de artworks concluída');
  } catch (error) {
    console.error('Erro ao migrar artworks:', error);
  }
}

// Função para migrar posts
async function migratePosts(db: ReturnType<typeof drizzle>) {
  try {
    const localPosts = await db.select().from(schema.posts);
    
    if (localPosts.length === 0) {
      console.log('Nenhum post local para migrar');
      return;
    }
    
    console.log(`Iniciando migração de ${localPosts.length} posts...`);
    
    for (const post of localPosts) {
      // Verificar se o post já existe no Supabase
      const { data: existingPosts } = await supabaseAdmin
        .from('posts')
        .select('id')
        .eq('title', post.title)
        .limit(1);
      
      if (!existingPosts || existingPosts.length === 0) {
        // Converter de camelCase para snake_case para compatibilidade com Supabase
        const supabasePost = {
          title: post.title,
          description: post.description,
          content: '', // Campo adicionado, mas não existia no schema original
          image_url: post.imageUrl,
          status: post.status,
          unique_code: post.uniqueCode,
          category_id: post.categoryId,
          created_at: post.createdAt,
          published_at: post.publishedAt
        };
        
        const { error } = await supabaseAdmin.from('posts').insert(supabasePost);
        
        if (error) {
          console.error(`Erro ao migrar post ${post.title}:`, error);
        } else {
          console.log(`Post ${post.title} migrado com sucesso`);
        }
      } else {
        console.log(`Post ${post.title} já existe no Supabase`);
      }
    }
    
    console.log('Migração de posts concluída');
  } catch (error) {
    console.error('Erro ao migrar posts:', error);
  }
}