/**
 * Script para testar o webhook Hotmart com dados simulados
 * 
 * Para executar: npx tsx test-hotmart-webhook.ts
 */

// Usando fetch nativo do Node.js

const WEBHOOK_URL = 'http://localhost:5000/webhook/hotmart';

// Payload de teste para compra aprovada
const purchaseApprovedPayload = {
  event: 'PURCHASE_APPROVED',
  data: {
    buyer: {
      email: 'teste.compra@designparaestetica.com',
      name: 'João Silva'
    },
    purchase: {
      transaction: 'HP_TEST_001_2025',
      status: 'APPROVED'
    },
    subscription: {
      plan: {
        name: 'Plano Mensal Premium'
      }
    }
  }
};

// Payload de teste para cancelamento
const cancellationPayload = {
  event: 'SUBSCRIPTION_CANCELLATION',
  data: {
    subscriber: {
      email: 'teste.compra@designparaestetica.com'
    }
  }
};

async function testWebhook() {
  console.log('🧪 Testando webhook Hotmart...\n');

  try {
    // Teste 1: Compra aprovada
    console.log('📦 Teste 1: Simulando compra aprovada...');
    const response1 = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(purchaseApprovedPayload)
    });

    const result1 = await response1.json();
    console.log(`Status: ${response1.status}`);
    console.log('Resposta:', result1);
    console.log('✅ Teste 1 concluído\n');

    // Aguardar um pouco antes do próximo teste
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Teste 2: Cancelamento
    console.log('❌ Teste 2: Simulando cancelamento...');
    const response2 = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(cancellationPayload)
    });

    const result2 = await response2.json();
    console.log(`Status: ${response2.status}`);
    console.log('Resposta:', result2);
    console.log('✅ Teste 2 concluído\n');

    // Teste 3: Evento não reconhecido
    console.log('❓ Teste 3: Simulando evento não reconhecido...');
    const unknownPayload = {
      event: 'UNKNOWN_EVENT',
      data: {}
    };

    const response3 = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(unknownPayload)
    });

    const result3 = await response3.json();
    console.log(`Status: ${response3.status}`);
    console.log('Resposta:', result3);
    console.log('✅ Teste 3 concluído\n');

    console.log('🎉 Todos os testes do webhook concluídos!');
    console.log('\n📋 VERIFICAÇÕES RECOMENDADAS:');
    console.log('1. Verificar logs do servidor para mensagens do webhook');
    console.log('2. Verificar se o usuário foi criado/atualizado no banco');
    console.log('3. Verificar se a assinatura foi registrada na tabela subscriptions');
    console.log('4. Testar com dados reais da Hotmart quando disponíveis');

  } catch (error: any) {
    console.error('❌ Erro durante os testes:', error.message);
  }
}

// Executar testes
testWebhook();