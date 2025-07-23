import { pool } from './server/db.js';
import { BrevoService } from './server/services/brevo-service.js';
import { hashPassword } from './server/auth.js';

async function createTestUser() {
  try {
    const email = 'jeancl01.maringa@hotmail.com';
    const username = 'Jean_Teste';
    const telefone = '44999999999';
    
    // Verifica se usuário já existe
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    
    if (existingUser.rowCount && existingUser.rowCount > 0) {
      console.log('❌ Usuário já existe com este email');
      return;
    }
    
    // Cria hash da senha
    const hashedPassword = await hashPassword('estetica@123');
    
    // Cria usuário teste
    const result = await pool.query(`
      INSERT INTO users (
        email, username, password, telefone, tipo, plano_id, 
        data_vencimento, active, created_at, is_admin, bio,
        origem_assinatura, tipo_plano, data_assinatura, acesso_vitalicio
      )
      VALUES ($1, $2, $3, $4, 'premium', '2', $5, true, $6, false, 'Usuário teste Brevo', 'hotmart', 'anual', $7, false)
      RETURNING id
    `, [
      email, 
      username, 
      hashedPassword, 
      telefone, 
      new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 ano
      new Date(),
      new Date()
    ]);
    
    const userId = result.rows[0].id;
    console.log(`✅ Usuário teste criado com ID: ${userId}`);
    
    // Testa email com template ID 1
    console.log('📧 Enviando email de teste via template Brevo...');
    
    await BrevoService.enviarEmailTemplate(email, username, 1, {
      NOME: username,
      PLANO: 'Plano Anual Premium - TESTE',
      VALOR: '197,00'
    });
    
    console.log('✅ Email de teste enviado via Template ID 1!');
    
    // Adiciona à lista ID 1
    await BrevoService.adicionarContato(email, username, [1]);
    console.log('✅ Contato adicionado à Lista ID 1 da Brevo');
    
  } catch (error) {
    console.error('❌ Erro ao criar usuário teste:', error);
  } finally {
    process.exit(0);
  }
}

createTestUser();