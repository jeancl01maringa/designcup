import express from 'express';
import { pool } from '../db';
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';
import BrevoService from '../services/brevo-service';

const scryptAsync = promisify(scrypt);
const router = express.Router();

// Função para hash da senha
async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

// Funções de validação
function isValidPurchase(payload: any): boolean {
  return payload?.event === 'PURCHASE_APPROVED' && 
         payload?.data?.buyer?.email && 
         payload?.data?.purchase?.status === 'APPROVED';
}

function isValidCancellation(payload: any): boolean {
  const cancellationEvents = ['SUBSCRIPTION_CANCELLATION', 'PURCHASE_PROTEST', 'PURCHASE_REFUNDED', 'CHARGEBACK'];
  return cancellationEvents.includes(payload?.event);
}

// Rota principal do webhook
router.post('/', async (req, res) => {
  console.log('🔥 WEBHOOK HOTMART CHAMADO!');
  console.log('🕒 Timestamp:', new Date().toISOString());
  console.log('📨 Headers:', JSON.stringify(req.headers, null, 2));
  
  const payload = req.body;
  console.log('📩 Webhook Hotmart recebido:', payload?.event || 'SEM EVENTO');
  console.log('📋 Payload completo:', JSON.stringify(payload, null, 2));

  // LÓGICA DE COMPRA APROVADA
  if (isValidPurchase(payload)) {
    try {
      const email = payload.data?.buyer?.email?.toLowerCase().trim();
      const name = payload.data?.buyer?.name || 'Usuário';
      const telefone = payload.data?.buyer?.phone || payload.data?.buyer?.checkout_phone || '';
      const transactionId = payload.data?.purchase?.transaction;
      
      // Captura dados do plano da Hotmart
      const planName = payload.data?.subscription?.plan?.name || payload.data?.product?.name || 'Plano Premium';
      const planType = planName?.toLowerCase().includes('anual') ? 'anual' : 'mensal';
      
      // Extrai preço corretamente do formato da Hotmart ANTES de tudo
      let planPrice = 0;
      let planCurrency = 'BRL';
      
      console.log('🔍 Debug preço original:', JSON.stringify({
        purchasePrice: payload.data?.purchase?.price,
        productPrice: payload.data?.product?.price
      }));
      
      // Tenta extrair do purchase.price primeiro
      if (payload.data?.purchase?.price) {
        const priceData = payload.data.purchase.price;
        if (typeof priceData === 'object' && priceData !== null && priceData.value !== undefined) {
          planPrice = parseFloat(priceData.value) || 0;
          planCurrency = priceData.currency_value || 'BRL';
          console.log('✅ Preço extraído do purchase.price (objeto):', planPrice, planCurrency);
        } else if (typeof priceData === 'number') {
          planPrice = priceData;
          console.log('✅ Preço extraído do purchase.price (número):', planPrice);
        } else if (typeof priceData === 'string') {
          planPrice = parseFloat(priceData) || 0;
          console.log('✅ Preço extraído do purchase.price (string):', planPrice);
        }
      }
      
      // Se não encontrou no purchase, tenta no product
      if (planPrice === 0 && payload.data?.product?.price) {
        const priceData = payload.data.product.price;
        if (typeof priceData === 'object' && priceData !== null && priceData.value !== undefined) {
          planPrice = parseFloat(priceData.value) || 0;
          planCurrency = priceData.currency_value || 'BRL';
          console.log('✅ Preço extraído do product.price (objeto):', planPrice, planCurrency);
        } else if (typeof priceData === 'number') {
          planPrice = priceData;
          console.log('✅ Preço extraído do product.price (número):', planPrice);
        } else if (typeof priceData === 'string') {
          planPrice = parseFloat(priceData) || 0;
          console.log('✅ Preço extraído do product.price (string):', planPrice);
        }
      }
      
      console.log(`🎯 Dados da compra Hotmart: Email=${email}, Plano=${planName}, Tipo=${planType}, Transação=${transactionId}`);
      console.log(`💰 Preço final extraído: ${planPrice}, Moeda: ${planCurrency}`);
      
      const now = new Date();
      // Calcula data de expiração baseada no tipo de plano da Hotmart
      const endDate = planType === 'anual' 
        ? new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000)
        : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      if (!email) {
        console.log('❌ Email não encontrado no payload');
        return res.status(400).json({ error: 'Email não encontrado' });
      }

      // Verifica se usuário existe
      const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
      
      if (existingUser.rowCount === 0) {
        // Cria novo usuário seguindo o modelo documentado
        let username = email.split('@')[0];
        
        // Garante username único
        const existingUsername = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
        if (existingUsername.rowCount && existingUsername.rowCount > 0) {
          username = `${username}_${Date.now()}`;
        }
        
        const hashedPassword = await hashPassword('estetica@123'); // Senha padrão com hash
        
        await pool.query(`
          INSERT INTO users (
            email, username, password, telefone, tipo, plano_id, 
            data_vencimento, active, created_at, is_admin, bio,
            origem_assinatura, tipo_plano, data_assinatura, acesso_vitalicio
          )
          VALUES ($1, $2, $3, $4, 'premium', '2', $5, true, $6, false, 'Cliente Hotmart', 'hotmart', $7, $8, false)
        `, [email, username, hashedPassword, telefone, endDate, now, planType, now]);
        
        console.log(`✅ Novo usuário criado: ${name} (${email}) - Plano Hotmart: ${planName}`);
        
        // Enviar email de boas-vindas para novo usuário
        try {
          await BrevoService.enviarBoasVindas(email, username);
          await BrevoService.adicionarContato(email, username, [1]); // Lista ID 1 para novos usuários
          console.log('📧 Email de boas-vindas enviado para:', email);
          
          // Notificar administrador sobre novo usuário
          await BrevoService.notificarNovoUsuario('jean.maringa@hotmail.com', username, email);
          console.log('📧 Notificação enviada ao administrador sobre novo usuário');
        } catch (emailError) {
          console.log('⚠️ Erro ao enviar email de boas-vindas:', emailError);
        }
      } else {
        // Atualiza usuário existente para premium com dados da Hotmart
        await pool.query(`
          UPDATE users SET 
            tipo = 'premium', 
            tipo_plano = $2, 
            data_vencimento = $3, 
            origem_assinatura = 'hotmart',
            telefone = $4,
            active = true,
            data_assinatura = $5
          WHERE email = $1
        `, [email, planType, endDate, telefone, now]);
        
        console.log(`✅ Usuário atualizado para premium: ${name} (${email}) - Plano Hotmart: ${planName}`);
      }

      // Gerencia assinatura na tabela subscriptions com dados completos da Hotmart
      const userResult = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
      const userId = userResult.rows[0].id;
      
      const existingSubscription = await pool.query('SELECT id FROM subscriptions WHERE user_id = $1', [userId]);
      
      if (existingSubscription.rowCount === 0) {
        // Cria nova assinatura com dados completos da Hotmart
        await pool.query(`
          INSERT INTO subscriptions (
            user_id, plan_type, start_date, end_date, status, 
            transaction_id, origin, last_event, telefone, created_at,
            hotmart_plan_id, hotmart_plan_name, hotmart_plan_price, hotmart_currency
          )
          VALUES ($1, $2, $3, $4, 'active', $5, 'hotmart', 'PURCHASE_APPROVED', $6, $7, $8, $9, $10, $11)
        `, [
          userId, planType, now, endDate, transactionId, telefone, now,
          payload.data?.subscription?.plan?.id || payload.data?.product?.id || planType, // hotmart_plan_id vem da Hotmart
          planName, // hotmart_plan_name vem da Hotmart  
          planPrice, // hotmart_plan_price extraído corretamente
          planCurrency // hotmart_currency extraído corretamente
        ]);
        
        console.log(`✅ Nova assinatura criada para usuário ${userId} com plano Hotmart ${planName}`);
        
        // Enviar email de confirmação de compra
        try {
          await BrevoService.enviarConfirmacaoCompra(email, name, planName, planPrice);
          console.log('📧 Email de confirmação de compra enviado para:', email);
        } catch (emailError) {
          console.log('⚠️ Erro ao enviar email de confirmação:', emailError);
        }
      } else {
        // Atualiza assinatura existente com dados completos da Hotmart
        await pool.query(`
          UPDATE subscriptions SET 
            plan_type = $2, 
            end_date = $3, 
            status = 'active', 
            transaction_id = $4, 
            telefone = $5,
            last_event = 'PURCHASE_APPROVED',
            updated_at = CURRENT_TIMESTAMP,
            hotmart_plan_id = $6,
            hotmart_plan_name = $7,
            hotmart_plan_price = $8,
            hotmart_currency = $9
          WHERE user_id = $1
        `, [
          userId, planType, endDate, transactionId, telefone,
          payload.data?.subscription?.plan?.id || payload.data?.product?.id || planType, // hotmart_plan_id vem da Hotmart
          planName, // hotmart_plan_name vem da Hotmart
          planPrice, // hotmart_plan_price extraído corretamente
          planCurrency // hotmart_currency extraído corretamente
        ]);
        
        console.log(`✅ Assinatura atualizada para usuário ${userId} com plano Hotmart ${planName}`);
      }

      return res.status(200).json({ 
        success: true, 
        message: 'Usuário criado ou atualizado com sucesso' 
      });

    } catch (err: any) {
      console.error('❌ Erro ao processar PURCHASE_APPROVED:', err);
      console.error('❌ Stack trace:', err.stack);
      console.error('❌ Código do erro:', err.code);
      console.error('❌ Detalhes do erro:', err.detail);
      return res.status(500).json({ 
        error: 'Erro ao processar webhook', 
        details: err.message 
      });
    }
  }

  // LÓGICA DE CANCELAMENTO
  if (isValidCancellation(payload)) {
    try {
      let email = null;
      
      // Extrai email dependendo do tipo de evento
      if (payload.data?.subscriber?.email) {
        email = payload.data.subscriber.email.toLowerCase().trim();
      } else if (payload.data?.buyer?.email) {
        email = payload.data.buyer.email.toLowerCase().trim();
      }

      if (!email) {
        console.log('❌ Email não encontrado no payload de cancelamento');
        return res.status(400).json({ error: 'Email não encontrado' });
      }

      console.log(`🔄 Processando cancelamento para: ${email}, evento: ${payload.event}`);

      // Rebaixa usuário para free seguindo o modelo documentado
      const userUpdateResult = await pool.query(`
        UPDATE users 
        SET tipo = 'free', 
            tipo_plano = null, 
            acesso_vitalicio = false, 
            data_vencimento = CURRENT_TIMESTAMP,
            active = true
        WHERE email = $1
      `, [email]);

      if (userUpdateResult.rowCount && userUpdateResult.rowCount > 0) {
        // Cancela assinatura
        await pool.query(`
          UPDATE subscriptions 
          SET status = 'canceled', 
              last_event = $2,
              updated_at = CURRENT_TIMESTAMP
          WHERE user_id = (SELECT id FROM users WHERE email = $1)
        `, [email, payload.event]);

        console.log(`✅ Usuário ${email} rebaixado para free devido a: ${payload.event}`);
        
        // Enviar email de cancelamento
        try {
          // Buscar nome do usuário para personalizar o email
          const userResult = await pool.query('SELECT username FROM users WHERE email = $1', [email]);
          const username = userResult.rows[0]?.username || email.split('@')[0];
          
          await BrevoService.enviarCancelamento(email, username);
          console.log('📧 Email de cancelamento enviado para:', email);
        } catch (emailError) {
          console.log('⚠️ Erro ao enviar email de cancelamento:', emailError);
        }
        
        return res.status(200).json({ 
          success: true, 
          message: 'Usuário rebaixado com sucesso' 
        });
      } else {
        console.log(`⚠️ Usuário não encontrado: ${email}`);
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

    } catch (err) {
      console.error('❌ Erro ao processar cancelamento:', err);
      return res.status(500).json({ error: 'Erro ao processar webhook' });
    }
  }

  // Evento não reconhecido
  console.log('⚠️ Evento não reconhecido:', payload.event);
  return res.status(200).json({ 
    success: true, 
    message: 'Evento recebido mas não processado' 
  });
});

// Endpoint de teste para verificar se o webhook está acessível
router.get('/test', (req, res) => {
  console.log('🧪 Endpoint de teste do webhook chamado');
  res.json({ 
    status: 'OK', 
    message: 'Webhook está funcionando',
    timestamp: new Date().toISOString(),
    url: req.originalUrl
  });
});

export default router;