/**
 * Script para alterar a tabela users e adicionar as colunas necessárias
 * para gerenciamento de assinantes e tipos de usuário
 * 
 * Para executar:
 * npx tsx alter-users-table.ts
 */

import { pool } from './server/db';
import { supabase } from './server/supabase-client';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * Função principal para alterar a tabela users
 */
async function alterUsersTable() {
  console.log('Iniciando alteração da tabela users...');

  try {
    // Verificar se as colunas já existem
    const checkColumnQuery = `
      SELECT 
        column_name 
      FROM 
        information_schema.columns 
      WHERE 
        table_name = 'users' AND 
        column_name IN ('tipo', 'plano_id', 'data_vencimento', 'active')
    `;
    
    const columnsResult = await pool.query(checkColumnQuery);
    const existingColumns = columnsResult.rows.map(row => row.column_name);
    
    console.log('Colunas existentes:', existingColumns);
    
    // Alterar a estrutura da tabela users
    let alterQuery = 'ALTER TABLE users';
    let columnsAdded = false;
    
    if (!existingColumns.includes('tipo')) {
      alterQuery += " ADD COLUMN tipo VARCHAR(10) DEFAULT 'free' NOT NULL";
      columnsAdded = true;
    }
    
    if (!existingColumns.includes('plano_id')) {
      if (columnsAdded) alterQuery += ',';
      alterQuery += ' ADD COLUMN plano_id VARCHAR(50) DEFAULT NULL';
      columnsAdded = true;
    }
    
    if (!existingColumns.includes('data_vencimento')) {
      if (columnsAdded) alterQuery += ',';
      alterQuery += ' ADD COLUMN data_vencimento TIMESTAMP DEFAULT NULL';
      columnsAdded = true;
    }
    
    if (!existingColumns.includes('active')) {
      if (columnsAdded) alterQuery += ',';
      alterQuery += ' ADD COLUMN active BOOLEAN DEFAULT TRUE';
      columnsAdded = true;
    }
    
    // Se não precisar adicionar nenhuma coluna, pular esta etapa
    if (columnsAdded) {
      console.log('Executando query de alteração:', alterQuery);
      await pool.query(alterQuery);
      console.log('Tabela users alterada com sucesso');
    } else {
      console.log('Todas as colunas necessárias já existem, nenhuma alteração necessária');
    }
    
    // Verificar se as colunas foram criadas
    const verifyResult = await pool.query(checkColumnQuery);
    console.log('Colunas após alteração:', verifyResult.rows.map(row => row.column_name));
    
    console.log('Processo de alteração concluído com sucesso!');
  } catch (error: any) {
    console.error('Erro ao alterar tabela users:', error);
    throw error;
  }
}

/**
 * Executa a função principal e trata erros
 */
alterUsersTable()
  .then(() => {
    console.log('Script executado com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Erro executando o script:', error);
    process.exit(1);
  });