/**
 * Script para criar um usuário de teste para demonstrar o botão "Seguir"
 * Para executar: npx tsx create-test-user-follow.ts
 */

import { createClient } from '@supabase/supabase-js';
import { Pool } from '@neondatabase/serverless';
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function createTestUser() {
  console.log('🔧 Criando usuário de teste para demonstrar botão "Seguir"...');

  // Configurar conexão PostgreSQL
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    const hashedPassword = await hashPassword('123456');
    
    // Criar usuário de teste no PostgreSQL
    const insertQuery = `
      INSERT INTO users (username, email, password, "isAdmin", telefone, "profileImage", bio, tipo, plano_id, active)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (email) DO UPDATE SET
        username = EXCLUDED.username,
        password = EXCLUDED.password,
        "isAdmin" = EXCLUDED."isAdmin",
        telefone = EXCLUDED.telefone,
        bio = EXCLUDED.bio,
        tipo = EXCLUDED.tipo,
        active = EXCLUDED.active
      RETURNING *;
    `;

    const result = await pool.query(insertQuery, [
      'Usuário Teste',
      'teste.seguir@designparaestetica.com',
      hashedPassword,
      false, // não é admin
      '44999888777',
      null,
      'Usuário criado para testar o botão de seguir outros usuários da plataforma.',
      'free',
      '1',
      true
    ]);

    console.log('✅ Usuário de teste criado com sucesso:', {
      id: result.rows[0].id,
      username: result.rows[0].username,
      email: result.rows[0].email,
      isAdmin: result.rows[0].isAdmin
    });

    console.log('\n📋 Para testar o botão "Seguir":');
    console.log('1. Faça logout do Jean Carlos');
    console.log('2. Entre com: teste.seguir@designparaestetica.com / 123456');
    console.log('3. Acesse qualquer post do Jean Carlos');
    console.log('4. O botão "Seguir" deve aparecer ao lado do nome do autor');

  } catch (error) {
    console.error('❌ Erro ao criar usuário de teste:', error);
  } finally {
    await pool.end();
  }
}

createTestUser();