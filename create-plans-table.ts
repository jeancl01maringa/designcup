/**
 * Script para criar a tabela plans diretamente no banco de dados PostgreSQL
 * 
 * Para executar: npx tsx create-plans-table.ts
 */

import { pool } from './server/db';

async function createPlansTable() {
  try {
    console.log('Criando tabela plans...');
    
    // Tenta criar a tabela plans
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS plans (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        periodo TEXT NOT NULL,
        valor TEXT NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        is_principal BOOLEAN NOT NULL DEFAULT FALSE,
        is_gratuito BOOLEAN NOT NULL DEFAULT FALSE,
        codigo_hotmart TEXT,
        url_hotmart TEXT,
        beneficios TEXT,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `;
    
    await pool.query(createTableQuery);
    console.log('Tabela plans criada com sucesso!');
    
    // Verifica se a tabela foi criada corretamente
    const checkTableResult = await pool.query(`
      SELECT * FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'plans'
    `);
    
    if (checkTableResult.rows.length > 0) {
      console.log('Verificação: Tabela plans existe no banco de dados');
      
      // Adicionalmente, lista as colunas da tabela para verificação
      const columnsResult = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'plans'
      `);
      
      console.log('Colunas da tabela plans:');
      columnsResult.rows.forEach(col => {
        console.log(`- ${col.column_name}: ${col.data_type}`);
      });
    } else {
      console.error('Verificação falhou: Tabela plans não foi encontrada após a criação');
    }
    
  } catch (error) {
    console.error('Erro ao criar tabela plans:', error);
    throw error;
  } finally {
    console.log('Finalizando script...');
    // Fechar a conexão com o banco de dados
    await pool.end();
  }
}

// Executa a função principal
createPlansTable()
  .then(() => {
    console.log('Script executado com sucesso!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Erro ao executar script:', error);
    process.exit(1);
  });