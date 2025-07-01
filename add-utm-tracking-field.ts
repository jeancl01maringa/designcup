/**
 * Script para adicionar campo UTM na tabela traffic_investments
 * Permite rastreamento de campanhas específicas
 * 
 * Para executar: npx tsx add-utm-tracking-field.ts
 */

import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

async function addUtmField() {
  try {
    console.log('Adicionando campo utm_campaign na tabela traffic_investments...');
    
    // Adicionar campo utm_campaign
    await sql`
      ALTER TABLE traffic_investments 
      ADD COLUMN IF NOT EXISTS utm_campaign VARCHAR(255)
    `;
    
    console.log('✅ Campo utm_campaign adicionado com sucesso!');
    
    // Verificar estrutura da tabela
    const tableInfo = await sql`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'traffic_investments' 
      ORDER BY ordinal_position
    `;
    
    console.log('\n📋 Estrutura atual da tabela traffic_investments:');
    tableInfo.forEach(col => {
      console.log(`- ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(nullable)' : '(not null)'}`);
    });
    
  } catch (error) {
    console.error('❌ Erro ao adicionar campo UTM:', error);
  }
}

addUtmField();