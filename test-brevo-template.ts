import { BrevoService } from './server/services/brevo-service.js';

async function testBrevoTemplate() {
  try {
    const email = 'jeancl01.maringa@hotmail.com';
    const nome = 'Jean_Teste';
    
    console.log('📧 Testando Template ID 1 da Brevo...');
    
    const success = await BrevoService.enviarEmailTemplate(email, nome, 1, {
      NOME: nome,
      PLANO: 'Plano Anual Premium - TESTE',
      VALOR: '197,00'
    });
    
    if (success) {
      console.log('✅ Email enviado com sucesso via Template ID 1!');
      console.log('📩 Verifique a caixa de entrada:', email);
    } else {
      console.log('❌ Falha ao enviar email');
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  } finally {
    process.exit(0);
  }
}

testBrevoTemplate();