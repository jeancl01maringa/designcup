/**
 * Script para adicionar a coluna bio na tabela users
 * Para executar: npx tsx add-bio-column.ts
 */

import { Pool } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL não encontrada');
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function addBioColumn() {
  try {
    console.log('Adicionando coluna bio na tabela users...');

    // Adicionar a coluna bio se não existir
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS bio TEXT;
    `);

    console.log('Coluna bio adicionada com sucesso!');

    // Verificar se a coluna foi criada
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'bio';
    `);

    if (result.rows.length > 0) {
      console.log('Confirmado: Coluna bio existe na tabela users');
      console.log('Tipo de dados:', result.rows[0].data_type);
    } else {
      console.log('Erro: Coluna bio não foi encontrada após criação');
    }

  } catch (error) {
    console.error('Erro ao adicionar coluna bio:', error);
  } finally {
    await pool.end();
  }
}

addBioColumn();