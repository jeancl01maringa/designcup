/**
 * Script para criar a tabela subscriptions necessária para integração Hotmart
 * 
 * Para executar: npx tsx create-subscriptions-table.ts
 */

import { pool } from './server/db';

async function createSubscriptionsTable() {
  try {
    console.log('🔄 Criando tabela subscriptions...');

    // Criar tabela subscriptions
    await pool.query(`
      CREATE TABLE IF NOT EXISTS subscriptions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        plan_type VARCHAR(20) NOT NULL CHECK (plan_type IN ('mensal', 'anual')),
        status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'expired')),
        start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        end_date TIMESTAMP WITH TIME ZONE NOT NULL,
        transaction_id VARCHAR(255),
        origin VARCHAR(50) NOT NULL DEFAULT 'hotmart' CHECK (origin IN ('hotmart', 'manual', 'stripe')),
        last_event VARCHAR(100),
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, status) -- Garante apenas uma assinatura ativa por usuário
      );
    `);

    console.log('✅ Tabela subscriptions criada com sucesso');

    // Adicionar campos necessários na tabela users se não existirem
    console.log('🔄 Verificando campos necessários na tabela users...');

    const fieldsToAdd = [
      { name: 'origem_assinatura', type: 'VARCHAR(50) DEFAULT \'manual\'', check: 'CHECK (origem_assinatura IN (\'hotmart\', \'manual\', \'stripe\'))' },
      { name: 'tipo_plano', type: 'VARCHAR(20)', check: 'CHECK (tipo_plano IN (\'mensal\', \'anual\'))' },
      { name: 'data_assinatura', type: 'TIMESTAMP WITH TIME ZONE' },
      { name: 'acesso_vitalicio', type: 'BOOLEAN DEFAULT false' },
      { name: 'is_active', type: 'BOOLEAN DEFAULT true' },
      { name: 'email_confirmed', type: 'BOOLEAN DEFAULT false' }
    ];

    for (const field of fieldsToAdd) {
      try {
        await pool.query(`
          ALTER TABLE users 
          ADD COLUMN IF NOT EXISTS ${field.name} ${field.type} ${field.check || ''}
        `);
        console.log(`✅ Campo ${field.name} adicionado/verificado na tabela users`);
      } catch (err: any) {
        if (err.message.includes('already exists')) {
          console.log(`⚠️ Campo ${field.name} já existe na tabela users`);
        } else {
          console.error(`❌ Erro ao adicionar campo ${field.name}:`, err.message);
        }
      }
    }

    // Criar índices para melhor performance
    console.log('🔄 Criando índices...');

    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status)',
      'CREATE INDEX IF NOT EXISTS idx_subscriptions_end_date ON subscriptions(end_date)',
      'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)',
      'CREATE INDEX IF NOT EXISTS idx_users_origem_assinatura ON users(origem_assinatura)',
      'CREATE INDEX IF NOT EXISTS idx_users_tipo ON users(tipo)'
    ];

    for (const indexQuery of indexes) {
      try {
        await pool.query(indexQuery);
        console.log('✅ Índice criado com sucesso');
      } catch (err: any) {
        if (err.message.includes('already exists')) {
          console.log('⚠️ Índice já existe');
        } else {
          console.error('❌ Erro ao criar índice:', err.message);
        }
      }
    }

    // Inserir dados de teste se não existirem
    console.log('🔄 Verificando dados de teste...');

    const testUserEmail = 'teste.hotmart@designparaestetica.com';
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [testUserEmail]);

    if (existingUser.rowCount === 0) {
      console.log('🔄 Criando usuário de teste para integração Hotmart...');
      
      await pool.query(`
        INSERT INTO users (
          email, username, password, tipo, origem_assinatura, 
          tipo_plano, data_assinatura, acesso_vitalicio, 
          is_active, email_confirmed, active, created_at
        ) VALUES (
          $1, 'teste_hotmart', 'estetica@123', 'premium', 'hotmart',
          'mensal', CURRENT_TIMESTAMP, false,
          true, true, true, CURRENT_TIMESTAMP
        )
      `, [testUserEmail]);

      const userResult = await pool.query('SELECT id FROM users WHERE email = $1', [testUserEmail]);
      const userId = userResult.rows[0].id;

      await pool.query(`
        INSERT INTO subscriptions (
          user_id, plan_type, start_date, end_date, status,
          transaction_id, origin, last_event, created_at
        ) VALUES (
          $1, 'mensal', CURRENT_TIMESTAMP, 
          CURRENT_TIMESTAMP + INTERVAL '30 days', 'active',
          'TEST_TRANSACTION_001', 'hotmart', 'PURCHASE_APPROVED', CURRENT_TIMESTAMP
        )
      `, [userId]);

      console.log('✅ Usuário de teste criado com sucesso');
    } else {
      console.log('⚠️ Usuário de teste já existe');
    }

    console.log('\n🎉 Configuração da integração Hotmart concluída!');
    console.log('\n📋 PRÓXIMOS PASSOS:');
    console.log('1. Configure o webhook na Hotmart com a URL: https://seudominio.replit.app/webhook/hotmart');
    console.log('2. Eventos para configurar na Hotmart:');
    console.log('   - PURCHASE_APPROVED (compras aprovadas)');
    console.log('   - SUBSCRIPTION_CANCELLATION (cancelamentos)');
    console.log('   - PURCHASE_PROTEST (contestações)');
    console.log('   - PURCHASE_REFUNDED (reembolsos)');
    console.log('   - CHARGEBACK (chargebacks)');
    console.log('3. Teste o webhook com dados reais da Hotmart');

  } catch (error: any) {
    console.error('❌ Erro ao configurar integração Hotmart:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Executar script
createSubscriptionsTable()
  .then(() => {
    console.log('✅ Script executado com sucesso');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro ao executar script:', error);
    process.exit(1);
  });