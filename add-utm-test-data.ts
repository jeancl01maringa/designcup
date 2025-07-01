/**
 * Script para adicionar dados de teste de investimentos com UTM campaigns
 * Demonstra como funciona o rastreamento por campanha
 * 
 * Para executar: npx tsx add-utm-test-data.ts
 */

import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

async function addUtmTestData() {
  try {
    console.log('Adicionando dados de teste com UTM campaigns...');
    
    // Investimentos de exemplo com diferentes UTMs
    const testInvestments = [
      {
        date: '2024-12-01',
        amount: 150.00,
        utm_campaign: 'facebook_ads_botox',
        description: 'Campanha Facebook - Botox'
      },
      {
        date: '2024-12-02',
        amount: 200.00,
        utm_campaign: 'google_ads_harmonizacao',
        description: 'Google Ads - Harmonização Facial'
      },
      {
        date: '2024-12-03',
        amount: 120.00,
        utm_campaign: 'facebook_ads_botox',
        description: 'Campanha Facebook - Botox (retargeting)'
      },
      {
        date: '2024-12-04',
        amount: 250.00,
        utm_campaign: 'instagram_ads_preenchimento',
        description: 'Instagram Ads - Preenchimento'
      },
      {
        date: '2024-12-05',
        amount: 180.00,
        utm_campaign: 'google_ads_harmonizacao',
        description: 'Google Ads - Harmonização (expansão)'
      }
    ];
    
    for (const investment of testInvestments) {
      await sql`
        INSERT INTO traffic_investments (date, amount, utm_campaign, description)
        VALUES (${investment.date}, ${investment.amount}, ${investment.utm_campaign}, ${investment.description})
      `;
      console.log(`✓ Adicionado: ${investment.utm_campaign} - R$ ${investment.amount}`);
    }
    
    console.log('\n✅ Dados de teste adicionados com sucesso!');
    
    // Mostrar estatísticas por UTM
    const utmStats = await sql`
      SELECT 
        utm_campaign,
        COALESCE(SUM(amount), 0) as total_investment,
        COUNT(*) as total_entries,
        COALESCE(AVG(amount), 0) as avg_investment
      FROM traffic_investments
      WHERE utm_campaign IS NOT NULL AND utm_campaign != ''
      GROUP BY utm_campaign 
      ORDER BY total_investment DESC
    `;
    
    console.log('\n📊 Estatísticas por UTM Campaign:');
    utmStats.forEach(utm => {
      console.log(`- ${utm.utm_campaign}: R$ ${parseFloat(utm.total_investment).toFixed(2)} (${utm.total_entries} investimentos)`);
    });
    
  } catch (error) {
    console.error('❌ Erro ao adicionar dados de teste:', error);
  }
}

addUtmTestData();