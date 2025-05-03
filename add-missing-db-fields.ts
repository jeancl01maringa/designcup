/**
 * Script para adicionar campos faltantes no banco de dados
 * 
 * 1. Campo telefone na tabela users
 * 2. Campos is_pro e license_type na tabela posts
 * 
 * Para executar:
 * npx tsx add-missing-db-fields.ts
 */

import { Pool } from '@neondatabase/serverless';
import { config } from 'dotenv';
import { neonConfig } from '@neondatabase/serverless';
import * as ws from 'ws';

// Configuração para o WebSocket
neonConfig.webSocketConstructor = ws.WebSocket;

// Carrega variáveis de ambiente
config();

async function addMissingFields() {
  console.log("Iniciando adição de campos faltantes no banco de dados...");
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });
  
  try {
    // 1. Verifica e adiciona coluna telefone na tabela users
    const checkTelefoneResult = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'telefone'
    `);
    
    if (checkTelefoneResult.rows.length === 0) {
      console.log("Adicionando coluna 'telefone' à tabela users...");
      await pool.query(`
        ALTER TABLE users
        ADD COLUMN telefone TEXT
      `);
      console.log("Campo 'telefone' adicionado com sucesso à tabela users!");
    } else {
      console.log("A coluna 'telefone' já existe na tabela users.");
    }

    // 2. Verifica e adiciona coluna is_pro na tabela posts
    const checkIsProResult = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'posts' AND column_name = 'is_pro'
    `);
    
    if (checkIsProResult.rows.length === 0) {
      console.log("Adicionando coluna 'is_pro' à tabela posts...");
      await pool.query(`
        ALTER TABLE posts
        ADD COLUMN is_pro BOOLEAN DEFAULT FALSE
      `);
      console.log("Campo 'is_pro' adicionado com sucesso à tabela posts!");
    } else {
      console.log("A coluna 'is_pro' já existe na tabela posts.");
    }

    // 3. Verifica e adiciona coluna license_type na tabela posts
    const checkLicenseTypeResult = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'posts' AND column_name = 'license_type'
    `);
    
    if (checkLicenseTypeResult.rows.length === 0) {
      console.log("Adicionando coluna 'license_type' à tabela posts...");
      await pool.query(`
        ALTER TABLE posts
        ADD COLUMN license_type TEXT DEFAULT 'free'
      `);
      console.log("Campo 'license_type' adicionado com sucesso à tabela posts!");
    } else {
      console.log("A coluna 'license_type' já existe na tabela posts.");
    }

    // 4. Atualiza os valores de is_pro e license_type para posts que contêm 'premium' no título
    console.log("Atualizando status premium dos posts existentes...");
    
    await pool.query(`
      UPDATE posts
      SET is_pro = TRUE, license_type = 'premium'
      WHERE (
        LOWER(title) LIKE '%premium%' OR 
        LOWER(description) LIKE '%premium%'
      ) AND (is_pro IS NULL OR is_pro = FALSE)
    `);
    
    console.log("Status premium dos posts atualizado com sucesso!");
    
  } catch (error) {
    console.error("Erro ao adicionar campos faltantes:", error);
  } finally {
    await pool.end();
  }
}

addMissingFields()
  .then(() => console.log("Processo finalizado com sucesso."))
  .catch(error => console.error("Erro:", error));