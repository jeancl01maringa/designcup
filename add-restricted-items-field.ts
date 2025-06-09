/**
 * Script para adicionar o campo itens_restritos na tabela plans
 * 
 * Para executar: npx tsx add-restricted-items-field.ts
 */

import { Pool } from '@neondatabase/serverless';
import ws from "ws";

// Configurar WebSocket para Neon
process.env.WEBSOCKET = 'ws';
(globalThis as any).WebSocket = ws;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function addRestrictedItemsField() {
  try {
    console.log('Verificando se a coluna itens_restritos já existe...');
    
    // Verificar se a coluna já existe
    const checkColumn = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'plans' AND column_name = 'itens_restritos'
    `);
    
    if (checkColumn.rows.length > 0) {
      console.log('Coluna itens_restritos já existe na tabela plans');
      return;
    }
    
    // Adicionar a coluna
    console.log('Adicionando coluna itens_restritos à tabela plans...');
    await pool.query(`
      ALTER TABLE plans 
      ADD COLUMN itens_restritos TEXT
    `);
    
    console.log('Coluna itens_restritos adicionada com sucesso!');
    
    // Atualizar o plano gratuito com os itens restritos
    console.log('Atualizando plano gratuito com itens restritos...');
    await pool.query(`
      UPDATE plans 
      SET itens_restritos = $1 
      WHERE is_gratuito = true
    `, [
      'Atualizações Mensais\nDownloads Ilimitados\nModelos Premium\nSuporte individual'
    ]);
    
    console.log('Plano gratuito atualizado com itens restritos!');
    
  } catch (error) {
    console.error('Erro ao adicionar campo itens_restritos:', error);
  } finally {
    await pool.end();
  }
}

addRestrictedItemsField();