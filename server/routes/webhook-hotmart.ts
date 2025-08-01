import { Router } from 'express';
import pkg from 'pg';
const { Pool } = pkg;
import { BrevoService } from '../services/brevo-service.js';

export const router = Router();

// Pool PostgreSQL para webhook
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Função de hash de senha para usuários Hotmart
async function hashPassword(password: string): Promise<string> {
  const crypto = await import('crypto');
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${hash}.${salt}`;
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
      
      // Captura telefone de múltiplas fontes da Hotmart para garantir precisão
      let telefone = '';
      if (payload.data?.buyer?.phone) {
        telefone = payload.data.buyer.phone;
      } else if (payload.data?.buyer?.checkout_phone) {
        telefone = payload.data.buyer.checkout_phone;
      } else if (payload.data?.buyer?.checkout_phone_code && payload.data?.buyer?.checkout_phone) {
        // Combina código + número se disponível
        telefone = `${payload.data.buyer.checkout_phone_code}${payload.data.buyer.checkout_phone}`;
      }
      
      // Remove caracteres não numéricos para padronizar
      telefone = telefone.replace(/[^\d]/g, '');
      
      // Captura ID da transação de múltiplas fontes para garantir rastreabilidade
      const transactionId = payload.data?.purchase?.transaction || 
                           payload.data?.purchase?.order_id || 
                           payload.data?.purchase?.payment_id || 
                           payload.data?.transaction?.id || 
                           `HP_${Date.now()}`; // Fallback com timestamp
      
      console.log(`📞 Telefone capturado da Hotmart: ${telefone || 'não informado'}`);
      console.log(`💳 Transação ID capturada: ${transactionId}`);
      
      // Captura dados do plano da Hotmart
      const planName = payload.data?.subscription?.plan?.name || payload.data?.product?.name || 'Plano Premium';
      
      // Captura dados da assinatura/subscription para extrair tipo e datas reais
      let planType = 'mensal'; // default
      let endDate = new Date();
      let startDate = new Date();
      
      console.log('🔍 Debug dados da subscription:', JSON.stringify({
        subscription: payload.data?.subscription,
        purchase: payload.data?.purchase
      }));
      
      // Extrai data de vencimento real da Hotmart
      if (payload.data?.subscription?.expiry_date || payload.data?.subscription?.expire_date) {
        const expiryTimestamp = payload.data.subscription.expiry_date || payload.data.subscription.expire_date;
        endDate = new Date(expiryTimestamp);
        console.log('✅ Data de vencimento extraída da subscription:', endDate);
      } else if (payload.data?.purchase?.date_next_charge) {
        // Usa date_next_charge como data de vencimento se disponível
        endDate = new Date(payload.data.purchase.date_next_charge);
        console.log('✅ Data de vencimento extraída do date_next_charge:', endDate);
      } else if (payload.data?.subscription?.plan?.type) {
        // Se não tem data específica, usa o tipo do plano
        const hotmartPlanType = payload.data.subscription.plan.type.toLowerCase();
        if (hotmartPlanType.includes('annual') || hotmartPlanType.includes('yearly')) {
          planType = 'anual';
          endDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
        } else {
          planType = 'mensal';
          endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        }
        console.log('✅ Tipo de plano extraído da Hotmart:', hotmartPlanType, '-> definido como:', planType);
      } else {
        // Fallback: analisa o nome do plano
        planType = planName?.toLowerCase().includes('anual') ? 'anual' : 'mensal';
        endDate = planType === 'anual' 
          ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        console.log('⚠️ Usando fallback para tipo de plano baseado no nome:', planType);
      }
      
      // Extrai data de início (data da compra)
      if (payload.data?.purchase?.approved_date) {
        startDate = new Date(payload.data.purchase.approved_date);
      } else if (payload.data?.subscription?.start_date) {
        startDate = new Date(payload.data.subscription.start_date);
      }
      
      // Extrai preço corretamente do formato da Hotmart
      let planPrice = 0;
      let planCurrency = 'BRL';
      
      console.log('🔍 Debug preço original:', JSON.stringify({
        subscriptionPrice: payload.data?.subscription?.plan?.price,
        purchasePrice: payload.data?.purchase?.price,
        productPrice: payload.data?.product?.price
      }));
      
      // Tenta extrair do subscription.plan.price primeiro (mais específico)
      if (payload.data?.subscription?.plan?.price) {
        const priceData = payload.data.subscription.plan.price;
        if (typeof priceData === 'object' && priceData !== null && priceData.value !== undefined) {
          planPrice = parseFloat(priceData.value) || 0;
          planCurrency = priceData.currency_value || 'BRL';
          console.log('✅ Preço extraído do subscription.plan.price (objeto):', planPrice, planCurrency);
        } else if (typeof priceData === 'number') {
          planPrice = priceData;
          console.log('✅ Preço extraído do subscription.plan.price (número):', planPrice);
        } else if (typeof priceData === 'string') {
          planPrice = parseFloat(priceData) || 0;
          console.log('✅ Preço extraído do subscription.plan.price (string):', planPrice);
        }
      }
      
      // Se não encontrou no subscription, tenta extrair do purchase.price
      if (planPrice === 0 && payload.data?.purchase?.price) {
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
      console.log(`📅 Datas: Início=${startDate.toISOString()}, Vencimento=${endDate.toISOString()}`);

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
        `, [email, username, hashedPassword, telefone, endDate, startDate, planType, startDate]);
        
        console.log(`✅ Novo usuário criado: ${name} (${email}) - Plano Hotmart: ${planName}`);
        
        // Enviar email de boas-vindas para novo usuário
        try {
          await BrevoService.enviarEmailTemplate(email, name, 1, { 
            nome: name,
            email: email 
          });
          await BrevoService.adicionarContato(email, name, [1]); // Lista ID 1 para novos usuários
          console.log('📧 Email de boas-vindas enviado via template ID 1 para:', email);
          
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
        `, [email, planType, endDate, telefone, startDate]);
        
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
          VALUES ($1, $2, $3, $4, 'active', $5, 'hotmart', 'PURCHASE_APPROVED', $6, CURRENT_TIMESTAMP, $7, $8, $9, $10)
        `, [
          userId, planType, startDate, endDate, transactionId, telefone,
          payload.data?.subscription?.plan?.id || payload.data?.product?.id || planType, // hotmart_plan_id vem da Hotmart
          planName, // hotmart_plan_name vem da Hotmart  
          planPrice, // hotmart_plan_price extraído corretamente
          planCurrency // hotmart_currency extraído corretamente
        ]);
        
        console.log(`✅ Nova assinatura criada para usuário ${userId} com plano Hotmart ${planName}`);
        
        // Log dos dados para Facebook Pixel Conversions API (futura implementação)
        console.log('📊 Facebook Pixel Purchase Event Data:', {
          event_name: 'Purchase',
          event_time: Math.floor(Date.now() / 1000),
          user_data: {
            email: email,
            phone: telefone,
            first_name: name
          },
          custom_data: {
            content_name: planName,
            content_type: 'product',
            content_ids: [transactionId],
            value: planPrice,
            currency: planCurrency
          }
        });
        
        // Enviar email de confirmação de compra
        try {
          await BrevoService.enviarEmailTemplate(email, name, 1, { 
            nome: name,
            email: email,
            plano: planName,
            valor: planPrice.toFixed(2)
          });
          console.log('📧 Email de confirmação de compra enviado via template ID 1 para:', email);
          
          // Notificar administrador sobre nova compra
          await BrevoService.notificarNovaCompra('jean.maringa@hotmail.com', name, email, planName, planPrice);
          console.log('📧 Notificação enviada ao administrador sobre nova compra');
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
        
        // Enviar email de confirmação de compra para usuário existente
        try {
          await BrevoService.enviarEmailTemplate(email, name, 1, { 
            nome: name,
            email: email,
            plano: planName,
            valor: planPrice.toFixed(2)
          });
          console.log('📧 Email de confirmação de compra enviado via template ID 1 para:', email);
          
          // Notificar administrador sobre nova compra
          await BrevoService.notificarNovaCompra('jean.maringa@hotmail.com', name, email, planName, planPrice);
          console.log('📧 Notificação enviada ao administrador sobre nova compra');
        } catch (emailError) {
          console.log('⚠️ Erro ao enviar email de confirmação:', emailError);
        }
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
      } else {
        console.log(`⚠️ Usuário ${email} não encontrado para cancelamento`);
      }

      return res.status(200).json({ 
        success: true, 
        message: 'Cancelamento processado com sucesso' 
      });

    } catch (err: any) {
      console.error('❌ Erro ao processar cancelamento:', err);
      console.error('❌ Stack trace:', err.stack);
      return res.status(500).json({ 
        error: 'Erro ao processar cancelamento', 
        details: err.message 
      });
    }
  }

  // Outros eventos são ignorados mas logados
  console.log(`ℹ️ Evento ${payload?.event} ignorado - webhook funcionando`);
  return res.status(200).json({ 
    success: true, 
    message: 'Webhook recebido mas evento não processado' 
  });
});

export default router;