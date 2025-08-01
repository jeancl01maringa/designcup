/**
 * Script para adicionar o campo whatsapp na tabela users
 * Para executar: npx tsx add-whatsapp-field.ts
 */

import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL não encontrada');
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

async function addWhatsappField() {
  try {
    console.log('🔄 Adicionando campo whatsapp na tabela users...');
    
    // Verificar se a coluna já existe
    const columnExists = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'whatsapp'
    `;
    
    if (columnExists.length > 0) {
      console.log('✅ Campo whatsapp já existe na tabela users');
      return;
    }
    
    // Adicionar a coluna whatsapp
    await sql`
      ALTER TABLE users 
      ADD COLUMN whatsapp text
    `;
    
    console.log('✅ Campo whatsapp adicionado com sucesso na tabela users');
    
  } catch (error) {
    console.error('❌ Erro ao adicionar campo whatsapp:', error);
    process.exit(1);
  }
}

addWhatsappField();