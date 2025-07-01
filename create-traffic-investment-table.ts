/**
 * Script para criar a tabela traffic_investments no banco de dados
 * 
 * Para executar: npx tsx create-traffic-investment-table.ts
 */

import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

async function createTrafficInvestmentTable() {
  console.log('Criando tabela traffic_investments...');

  try {
    // Criar a tabela traffic_investments
    await sql`
      CREATE TABLE IF NOT EXISTS traffic_investments (
        id SERIAL PRIMARY KEY,
        date DATE NOT NULL UNIQUE,
        amount DECIMAL(10, 2) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    console.log('✅ Tabela traffic_investments criada com sucesso!');

    // Inserir alguns dados de exemplo
    await sql`
      INSERT INTO traffic_investments (date, amount, description) 
      VALUES 
        (CURRENT_DATE - INTERVAL '7 days', 250.00, 'Investimento em Facebook Ads'),
        (CURRENT_DATE - INTERVAL '6 days', 180.50, 'Investimento em Google Ads'),
        (CURRENT_DATE - INTERVAL '5 days', 320.75, 'Investimento em Instagram Ads'),
        (CURRENT_DATE - INTERVAL '4 days', 150.00, 'Investimento em TikTok Ads'),
        (CURRENT_DATE - INTERVAL '3 days', 275.25, 'Investimento em Facebook Ads'),
        (CURRENT_DATE - INTERVAL '2 days', 200.00, 'Investimento em Google Ads'),
        (CURRENT_DATE - INTERVAL '1 day', 195.80, 'Investimento em Instagram Ads'),
        (CURRENT_DATE, 300.00, 'Investimento em Facebook Ads')
      ON CONFLICT (date) DO NOTHING
    `;

    console.log('✅ Dados de exemplo inseridos!');

    // Verificar se os dados foram inseridos
    const investments = await sql`SELECT * FROM traffic_investments ORDER BY date DESC LIMIT 5`;
    console.log('📊 Últimos investimentos:', investments);

  } catch (error) {
    console.error('❌ Erro ao criar tabela:', error);
  }
}

createTrafficInvestmentTable();