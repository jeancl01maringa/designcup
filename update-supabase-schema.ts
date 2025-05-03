import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';

// Carregar variáveis de ambiente
dotenv.config();

// Verificar conexão direta ao banco de dados PostgreSQL
async function updateDirectlyThroughPostgreSQL() {
  console.log('Tentando atualizar diretamente via PostgreSQL...');
  
  try {
    // Conectar ao banco de dados PostgreSQL usando a DATABASE_URL
    if (!process.env.DATABASE_URL) {
      console.error('Variável de ambiente DATABASE_URL não encontrada');
      return;
    }
    
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    
    // Verificar se a coluna já existe
    const checkResult = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'posts' 
      AND column_name = 'is_visible'
    `);
    
    if (checkResult.rows.length === 0) {
      console.log('Coluna is_visible não encontrada. Adicionando...');
      
      // Adicionar a coluna
      await pool.query(`
        ALTER TABLE posts 
        ADD COLUMN IF NOT EXISTS is_visible BOOLEAN NOT NULL DEFAULT TRUE
      `);
      
      console.log('Coluna is_visible adicionada com sucesso!');
    } else {
      console.log('Coluna is_visible já existe na tabela posts.');
    }
    
    await pool.end();
    
  } catch (error) {
    console.error('Erro ao atualizar via PostgreSQL:', error);
  }
}

// Executar a função principal
updateDirectlyThroughPostgreSQL()
  .then(() => console.log('Processo finalizado'))
  .catch(err => console.error('Erro no processo principal:', err));