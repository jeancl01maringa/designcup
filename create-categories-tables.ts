/**
 * Script para sincronizar as categorias entre o PostgreSQL direto e o Supabase
 * 
 * Este script realizará as seguintes tarefas:
 * 1. Verificar quais categorias existem no Supabase
 * 2. Criar essas categorias no PostgreSQL direto se não existirem
 * 
 * Para executar:
 * npx tsx create-categories-tables.ts
 */

import { createClient } from '@supabase/supabase-js';
import { Pool } from '@neondatabase/serverless';
import 'dotenv/config';

// Valores fixos para garantir funcionamento
const supabaseUrl = 'https://kmunxjuiuxaqitbovjls.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_KEY || process.env.SUPABASE_KEY || '';
const databaseUrl = process.env.DATABASE_URL || '';

// Verificar se temos as variáveis de ambiente necessárias
if (!supabaseKey || !databaseUrl) {
  console.error('Erro: Variáveis de ambiente SUPABASE_KEY e DATABASE_URL são necessárias.');
  process.exit(1);
}

console.log(`Usando Supabase URL: ${supabaseUrl}`);
console.log(`Database URL presente: ${!!databaseUrl}`);

// Criar cliente do Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

// Criar conexão com o PostgreSQL
const pool = new Pool({ connectionString: databaseUrl });

/**
 * Função principal para sincronizar as categorias
 */
async function syncCategories() {
  try {
    console.log('Iniciando sincronização de categorias entre Supabase e PostgreSQL direto...');
    
    // 1. Buscar categorias do Supabase
    const { data: supabaseCategories, error: supabaseError } = await supabase
      .from('categories')
      .select('*');
      
    if (supabaseError) {
      throw new Error(`Erro ao buscar categorias do Supabase: ${supabaseError.message}`);
    }
    
    console.log(`Encontradas ${supabaseCategories?.length || 0} categorias no Supabase:`);
    console.table(supabaseCategories);
    
    if (!supabaseCategories || supabaseCategories.length === 0) {
      console.log('Nenhuma categoria encontrada no Supabase para sincronizar.');
      return;
    }
    
    // 2. Verificar quais categorias existem no PostgreSQL direto
    const pgCategoriesResult = await pool.query('SELECT id, name FROM categories');
    const pgCategories = pgCategoriesResult.rows;
    
    console.log(`Encontradas ${pgCategories.length} categorias no PostgreSQL direto:`);
    console.table(pgCategories);
    
    // 3. Identificar categorias que precisam ser criadas no PostgreSQL
    const categoriesToCreate = supabaseCategories.filter(supabaseCat => 
      !pgCategories.some(pgCat => pgCat.id === supabaseCat.id)
    );
    
    console.log(`Categorias para criar no PostgreSQL: ${categoriesToCreate.length}`);
    
    // 4. Criar as categorias faltantes no PostgreSQL
    if (categoriesToCreate.length > 0) {
      console.log('Criando categorias no PostgreSQL...');
      
      for (const category of categoriesToCreate) {
        try {
          // Criar tabela de categorias se não existir
          await pool.query(`
            CREATE TABLE IF NOT EXISTS categories (
              id SERIAL PRIMARY KEY,
              name TEXT NOT NULL,
              slug TEXT,
              description TEXT,
              image_url TEXT,
              is_active BOOLEAN DEFAULT true,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )
          `);
          
          // Inserir categoria com o mesmo ID do Supabase
          const insertResult = await pool.query(`
            INSERT INTO categories (id, name, slug, description, image_url, is_active, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (id) DO UPDATE
            SET name = $2, slug = $3, description = $4, image_url = $5, is_active = $6
            RETURNING id, name
          `, [
            category.id,
            category.name,
            category.slug || '',
            category.description || '',
            category.image_url || null,
            category.is_active !== false, // Se for null ou undefined, assume true
            category.created_at || new Date()
          ]);
          
          console.log(`Categoria criada/atualizada: ${insertResult.rows[0].name} (ID: ${insertResult.rows[0].id})`);
        } catch (insertError) {
          console.error(`Erro ao criar categoria ${category.name} (ID: ${category.id}):`, insertError);
        }
      }
      
      console.log('Sincronização de categorias concluída!');
    } else {
      console.log('Todas as categorias já estão sincronizadas entre Supabase e PostgreSQL direto.');
    }
    
  } catch (error) {
    console.error('Erro durante a sincronização de categorias:', error);
  } finally {
    // Fechar conexão com o banco de dados
    await pool.end();
  }
}

// Executar a função principal
syncCategories().catch(error => {
  console.error('Erro na execução do script:', error);
  process.exit(1);
});