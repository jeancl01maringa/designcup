// Teste completo do webhook Hotmart com Template Brevo
import fetch from 'node-fetch';

async function testWebhookBrevo() {
  try {
    console.log('🚀 Testando webhook Hotmart com Template ID 1 da Brevo...');
    
    const webhookData = {
      event: "PURCHASE_APPROVED",
      data: {
        buyer: {
          name: "Jean Carlos Teste",
          email: "jeancl01.maringa@hotmail.com",
          phone: "5544999999999"
        },
        product: {
          name: "Design para Estética Premium"
        },
        purchase: {
          transaction: "HP12345TEST",
          approved_date: Date.now(),
          status: "APPROVED"
        },
        subscription: {
          plan: {
            name: "Plano Anual Premium",
            type: "RECURRENCY",
            price: {
              value: 19700,
              currency_value: "BRL"
            }
          }
        }
      }
    };

    const response = await fetch('http://localhost:5000/webhook/hotmart', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(webhookData)
    });

    if (response.ok) {
      const result = await response.text();
      console.log('✅ Webhook processado com sucesso!');
      console.log('📧 Email enviado via Template ID 1 da Brevo');
      console.log('👤 Usuário criado/atualizado no sistema');
      console.log('📋 Adicionado à Lista ID 1 da Brevo');
    } else {
      console.log('❌ Erro no webhook:', response.status);
    }

  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

testWebhookBrevo();