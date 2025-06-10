/**
 * Script para adicionar campos de valor original e porcentagem de economia na tabela plans
 * 
 * Para executar: npx tsx add-plan-discount-fields.ts
 */

import { pool } from './server/db';

async function addDiscountFields() {
  try {
    console.log('Adicionando campos de desconto na tabela plans...');
    
    // Adicionar campo valor_original
    try {
      await pool.query(`
        ALTER TABLE plans 
        ADD COLUMN IF NOT EXISTS valor_original TEXT;
      `);
      console.log('Campo valor_original adicionado com sucesso');
    } catch (error) {
      console.log('Campo valor_original já existe ou erro:', error);
    }
    
    // Adicionar campo porcentagem_economia
    try {
      await pool.query(`
        ALTER TABLE plans 
        ADD COLUMN IF NOT EXISTS porcentagem_economia TEXT;
      `);
      console.log('Campo porcentagem_economia adicionado com sucesso');
    } catch (error) {
      console.log('Campo porcentagem_economia já existe ou erro:', error);
    }
    
    // Verificar se os campos foram adicionados
    const columnsResult = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'plans'
      AND column_name IN ('valor_original', 'porcentagem_economia')
    `);
    
    console.log('Verificação dos novos campos:');
    columnsResult.rows.forEach(col => {
      console.log(`- ${col.column_name}: ${col.data_type}`);
    });
    
    console.log('Migração concluída com sucesso!');
    
  } catch (error) {
    console.error('Erro ao adicionar campos de desconto:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Executa a função principal
addDiscountFields()
  .then(() => {
    console.log('Script executado com sucesso!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Erro ao executar script:', error);
    process.exit(1);
  });