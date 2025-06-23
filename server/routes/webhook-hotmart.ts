import express from 'express';
import { pool } from '../db';
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';

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
  const payload = req.body;
  console.log('📩 Webhook Hotmart recebido:', payload.event);

  // LÓGICA DE COMPRA APROVADA
  if (isValidPurchase(payload)) {
    try {
      const email = payload.data?.buyer?.email?.toLowerCase().trim();
      const name = payload.data?.buyer?.name || 'Usuário';
      const telefone = payload.data?.buyer?.phone || payload.data?.buyer?.telephone || '';
      const transactionId = payload.data?.purchase?.transaction;
      
      // Capturar dados completos do plano do Hotmart
      const planData = payload.data?.subscription?.plan || payload.data?.product || {};
      const planName = planData?.name || '';
      const planId = planData?.id || planData?.code || '';
      const planPrice = planData?.price || payload.data?.purchase?.price || 0;
      const planCurrency = planData?.currency || 'BRL';
      
      console.log(`🎯 Dados do plano Hotmart capturados:`, {
        id: planId,
        name: planName,
        price: planPrice,
        currency: planCurrency
      });
      
      // Identificar o tipo de plano baseado no nome
      let planType = 'mensal'; // padrão
      const planNameLower = planName.toLowerCase();
      if (planNameLower.includes('anual') || planNameLower.includes('yearly')) {
        planType = 'anual';
      } else if (planNameLower.includes('trimestral') || planNameLower.includes('quarterly')) {
        planType = 'trimestral';
      } else if (planNameLower.includes('semestral') || planNameLower.includes('half')) {
        planType = 'semestral';
      } else if (planNameLower.includes('mensal') || planNameLower.includes('monthly')) {
        planType = 'mensal';
      }
      
      const now = new Date();
      
      // Calcular data de vencimento baseada no tipo de plano
      let daysToAdd = 30; // padrão mensal
      if (planType === 'anual') {
        daysToAdd = 365;
      } else if (planType === 'semestral') {
        daysToAdd = 180;
      } else if (planType === 'trimestral') {
        daysToAdd = 90;
      } else if (planType === 'mensal') {
        daysToAdd = 30;
      }
      
      const endDate = new Date(now.getTime() + daysToAdd * 24 * 60 * 60 * 1000);

      console.log(`🔄 Processando compra para: ${email}, plano: ${planType}`);

      // Verifica se usuário existe
      const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
      
      if (existingUser.rowCount === 0) {
        // Cria novo usuário
        const username = email.split('@')[0];
        const hashedPassword = await hashPassword('estetica@123'); // Senha padrão com hash
        
        await pool.query(`
          INSERT INTO users (
            email, username, password, telefone, tipo, plano_id, 
            data_vencimento, active, created_at, is_admin, bio
          )
          VALUES ($1, $2, $3, $4, 'premium', '2', $5, true, CURRENT_TIMESTAMP, false, 'Cliente Hotmart')
        `, [email, username, hashedPassword, telefone, endDate]);
        
        console.log(`✅ Novo usuário criado: ${name} (${email})`);
      } else {
        // Atualiza usuário existente para premium
        await pool.query(`
          UPDATE users SET 
            tipo = 'premium', 
            data_vencimento = $2, 
            active = true
          WHERE email = $1
        `, [email, endDate]);
        
        console.log(`✅ Usuário atualizado para premium: ${name} (${email})`);
      }

      // Gerencia assinatura na tabela subscriptions
      const userResult = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
      const userId = userResult.rows[0].id;
      
      const existingSubscription = await pool.query('SELECT id FROM subscriptions WHERE user_id = $1', [userId]);
      
      if (existingSubscription.rowCount === 0) {
        // Cria nova assinatura com dados completos do Hotmart
        await pool.query(`
          INSERT INTO subscriptions (
            user_id, plan_type, start_date, end_date, status, 
            transaction_id, origin, last_event, telefone, created_at,
            hotmart_plan_id, hotmart_plan_name, hotmart_plan_price, hotmart_currency
          )
          VALUES ($1, $2, $3, $4, 'active', $5, 'hotmart', 'PURCHASE_APPROVED', $6, $7, $8, $9, $10, $11)
        `, [userId, planType, now, endDate, transactionId, telefone, now, planId, planName, planPrice, planCurrency]);
        
        console.log(`✅ Nova assinatura criada para usuário ${userId} com plano ${planName}`);
      } else {
        // Atualiza assinatura existente com dados completos do Hotmart
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
        `, [userId, planType, endDate, transactionId, telefone, planId, planName, planPrice, planCurrency]);
        
        console.log(`✅ Assinatura atualizada para usuário ${userId} com plano ${planName}`);
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
        details: err.message,
        code: err.code 
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

      // Rebaixa usuário para free
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

export default router;