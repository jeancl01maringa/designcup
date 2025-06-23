/**
 * Script para adicionar campos dos planos reais do Hotmart na tabela subscriptions
 * 
 * Para executar: npx tsx add-hotmart-plan-fields.ts
 */

import { Pool } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function addHotmartPlanFields() {
  console.log('🔧 Adicionando campos de planos reais do Hotmart na tabela subscriptions...');
  
  try {
    // Verificar se as colunas já existem
    const checkColumns = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'subscriptions' 
      AND column_name IN ('hotmart_plan_id', 'hotmart_plan_name', 'hotmart_plan_price', 'hotmart_currency')
    `);
    
    const existingColumns = checkColumns.rows.map(row => row.column_name);
    console.log('📋 Colunas existentes:', existingColumns);
    
    // Adicionar colunas faltantes
    const columnsToAdd = [
      { name: 'hotmart_plan_id', type: 'TEXT', description: 'ID real do plano no Hotmart' },
      { name: 'hotmart_plan_name', type: 'TEXT', description: 'Nome real do plano no Hotmart' },
      { name: 'hotmart_plan_price', type: 'DECIMAL(10,2)', description: 'Preço real do plano' },
      { name: 'hotmart_currency', type: 'VARCHAR(3) DEFAULT \'BRL\'', description: 'Moeda do plano' }
    ];
    
    for (const column of columnsToAdd) {
      if (!existingColumns.includes(column.name)) {
        console.log(`➕ Adicionando coluna ${column.name}...`);
        
        await pool.query(`
          ALTER TABLE subscriptions 
          ADD COLUMN ${column.name} ${column.type}
        `);
        
        console.log(`✅ Coluna ${column.name} adicionada com sucesso`);
      } else {
        console.log(`⏭️ Coluna ${column.name} já existe`);
      }
    }
    
    // Verificar a estrutura final da tabela
    const finalStructure = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'subscriptions' 
      ORDER BY ordinal_position
    `);
    
    console.log('\n📊 Estrutura final da tabela subscriptions:');
    finalStructure.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} ${row.is_nullable === 'YES' ? '(nullable)' : '(not null)'}`);
    });
    
    console.log('\n🎯 Campos de planos reais do Hotmart adicionados com sucesso!');
    console.log('Agora o webhook pode capturar e salvar:');
    console.log('  - ID real do plano no Hotmart');
    console.log('  - Nome completo do plano');
    console.log('  - Preço real pago');
    console.log('  - Moeda da transação');
    
  } catch (error: any) {
    console.error('❌ Erro ao adicionar campos:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    await pool.end();
  }
}

addHotmartPlanFields();