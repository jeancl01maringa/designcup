/**
 * Script para inserir dados de teste na tabela plans
 * 
 * Para executar: npx tsx insert-test-plans.ts
 */

import { pool } from './server/db';

async function insertTestPlans() {
  try {
    console.log('Inserindo planos de teste...');
    
    // Inserir planos de teste
    const testPlans = [
      {
        name: 'Plano Gratuito',
        periodo: 'Sempre',
        valor: 'R$ 0,00',
        isActive: true,
        isPrincipal: false,
        isGratuito: true,
        beneficios: 'Acesso a 5 modelos gratuitos por mês\nVisualizações ilimitadas\nCom marca d\'água'
      },
      {
        name: 'Plano Mensal',
        periodo: 'Mensal',
        valor: 'R$ 29,90',
        isActive: true,
        isPrincipal: true,
        isGratuito: false,
        codigoHotmart: 'PLAN001',
        urlHotmart: 'https://pay.hotmart.com/X1234567',
        beneficios: 'Acesso a todos os modelos\nBaixe até 20 artes por mês\nSem marca d\'água\nAcesso à comunidade exclusiva'
      },
      {
        name: 'Plano Trimestral',
        periodo: 'Trimestral',
        valor: 'R$ 79,90',
        isActive: true,
        isPrincipal: false,
        isGratuito: false,
        codigoHotmart: 'PLAN003',
        urlHotmart: 'https://pay.hotmart.com/X1234568',
        beneficios: 'Acesso a todos os modelos\nBaixe até 70 artes por trimestre\nSem marca d\'água\nAcesso à comunidade exclusiva\nDesconto de 10% em relação ao plano mensal'
      },
      {
        name: 'Plano Anual',
        periodo: 'Anual',
        valor: 'R$ 249,90',
        isActive: true,
        isPrincipal: false,
        isGratuito: false,
        codigoHotmart: 'PLAN012',
        urlHotmart: 'https://pay.hotmart.com/X1234569',
        beneficios: 'Acesso a todos os modelos\nBaixe até 300 artes por ano\nSem marca d\'água\nAcesso à comunidade exclusiva\nDesconto de 30% em relação ao plano mensal\nAcesso a minicursos exclusivos'
      }
    ];
    
    // Primeiro, vamos verificar quais planos já existem para evitar duplicação
    const existingPlansResult = await pool.query('SELECT name FROM plans');
    const existingPlanNames = existingPlansResult.rows.map(row => row.name);
    
    const plansToInsert = testPlans.filter(plan => !existingPlanNames.includes(plan.name));
    
    if (plansToInsert.length === 0) {
      console.log('Todos os planos de teste já existem. Nenhum novo plano adicionado.');
      return;
    }
    
    // Inserir os planos que ainda não existem
    for (const plan of plansToInsert) {
      await pool.query(`
        INSERT INTO plans (
          name, periodo, valor, is_active, is_principal, is_gratuito, 
          codigo_hotmart, url_hotmart, beneficios
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9
        )
      `, [
        plan.name, 
        plan.periodo, 
        plan.valor, 
        plan.isActive, 
        plan.isPrincipal, 
        plan.isGratuito,
        plan.codigoHotmart || null,
        plan.urlHotmart || null,
        plan.beneficios
      ]);
      console.log(`Plano "${plan.name}" inserido com sucesso.`);
    }
    
    // Listar todos os planos após a inserção
    const allPlansResult = await pool.query('SELECT * FROM plans ORDER BY id');
    console.log('Planos disponíveis após inserção:');
    allPlansResult.rows.forEach(plan => {
      console.log(`- ID ${plan.id}: ${plan.name} (${plan.valor}) - Ativo: ${plan.is_active}`);
    });
    
  } catch (error) {
    console.error('Erro ao inserir planos de teste:', error);
    throw error;
  } finally {
    console.log('Finalizando script...');
    // Fechar a conexão com o banco de dados
    await pool.end();
  }
}

// Executa a função principal
insertTestPlans()
  .then(() => {
    console.log('Script executado com sucesso!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Erro ao executar script:', error);
    process.exit(1);
  });