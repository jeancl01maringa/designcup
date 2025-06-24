/**
 * Script para testar a integração com a Brevo API
 * 
 * Para executar: npx tsx test-brevo-integration.ts
 */

import dotenv from 'dotenv';
dotenv.config();

import BrevoService from './server/services/brevo-service';

async function testBrevoIntegration() {
  console.log('🧪 Testando integração com Brevo...');
  
  // Verifica se a API key está configurada
  if (!process.env.BREVO_API_KEY) {
    console.error('❌ BREVO_API_KEY não encontrada nas variáveis de ambiente');
    return;
  }
  
  console.log('✅ BREVO_API_KEY encontrada');
  
  // Email de teste (usando email do desenvolvedor para não gerar spam)
  const emailTeste = 'jean.maringa@hotmail.com';
  const nomeTeste = 'Jean Carlos (Teste)';
  
  try {
    console.log('\n📧 Testando envio de email de boas-vindas...');
    const resultadoBemVindo = await BrevoService.enviarBoasVindas(emailTeste, nomeTeste);
    
    if (resultadoBemVindo) {
      console.log('✅ Email de boas-vindas enviado com sucesso!');
    } else {
      console.log('❌ Falha ao enviar email de boas-vindas');
    }
    
    console.log('\n📧 Testando envio de email de confirmação de compra...');
    const resultadoCompra = await BrevoService.enviarConfirmacaoCompra(
      emailTeste, 
      nomeTeste, 
      'Plano Premium Mensal', 
      29.90
    );
    
    if (resultadoCompra) {
      console.log('✅ Email de confirmação de compra enviado com sucesso!');
    } else {
      console.log('❌ Falha ao enviar email de confirmação de compra');
    }
    
    console.log('\n📧 Testando adição de contato...');
    const resultadoContato = await BrevoService.adicionarContato(emailTeste, nomeTeste, [1]);
    
    if (resultadoContato) {
      console.log('✅ Contato adicionado com sucesso!');
    } else {
      console.log('❌ Falha ao adicionar contato');
    }
    
    console.log('\n🎉 Teste da integração Brevo concluído!');
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

// Executar teste
testBrevoIntegration();