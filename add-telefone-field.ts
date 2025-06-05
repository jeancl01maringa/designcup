/**
 * Script para adicionar a coluna telefone à tabela users
 * 
 * Executar com:
 * npx tsx add-telefone-field.ts
 */

import { Pool } from '@neondatabase/serverless';
import { config } from 'dotenv';
import { neonConfig } from '@neondatabase/serverless';
import * as ws from 'ws';

// Configuração para o WebSocket
neonConfig.webSocketConstructor = ws.WebSocket;

// Carrega variáveis de ambiente
config();

async function addTelefoneField() {
  console.log("Iniciando adição do campo telefone à tabela users...");
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });
  
  try {
    // Verifica se a coluna já existe
    const checkResult = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'telefone'
    `);
    
    if (checkResult.rows.length > 0) {
      console.log("A coluna 'telefone' já existe na tabela users.");
      return;
    }
    
    // Adiciona a coluna
    await pool.query(`
      ALTER TABLE users
      ADD COLUMN telefone TEXT
    `);
    
    console.log("Campo 'telefone' adicionado com sucesso à tabela users!");
  } catch (error) {
    console.error("Erro ao adicionar campo telefone:", error);
  } finally {
    await pool.end();
  }
}

addTelefoneField()
  .then(() => console.log("Processo finalizado."))
  .catch(error => console.error("Erro:", error));