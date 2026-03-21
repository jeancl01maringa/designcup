import { Router } from 'express';
import pkg from 'pg';
const { Pool } = pkg;
import { BrevoService } from '../services/brevo-service.js';

export const router = Router();

// Pool PostgreSQL para webhook
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// Função de hash de senha para usuários
async function hashPassword(password: string): Promise<string> {
    const crypto = await import('crypto');
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(password, salt, 64).toString('hex');
    return `${hash}.${salt}`;
}

// Funções de validação de status
function isApprovedStatus(status: string | undefined): boolean {
    if (!status) return false;
    const s = status.toLowerCase();
    return s === 'paid' || s === 'approved' || s === 'venda paga' || s === 'assinatura paga' || s === 'completed';
}

function isCancellationStatus(status: string | undefined): boolean {
    if (!status) return false;
    const s = status.toLowerCase();
    return s === 'canceled' || s === 'cancelled' || s === 'refunded' || s === 'chargeback' ||
        s === 'assinatura cancelada' || s === 'venda reembolsada' || s === 'chargeback realizado';
}

// Rota principal do webhook Greenn
router.post('/', async (req, res) => {
    console.log('🔥 WEBHOOK GREENN CHAMADO!');
    console.log('🕒 Timestamp:', new Date().toISOString());
    console.log('📨 Headers:', JSON.stringify(req.headers, null, 2));

    const payload = req.body;
    const eventType = payload?.type || payload?.event || payload?.event_type || 'SEM_EVENTO';
    console.log('📩 Webhook Greenn recebido:', eventType);
    console.log('📋 Payload completo:', JSON.stringify(payload, null, 2));

    // Tenta extrair o status da transação/assinatura
    const status = payload?.currentStatus || payload?.status || payload?.data?.status || eventType;

    // LÓGICA DE COMPRA APROVADA
    if (isApprovedStatus(status)) {
        try {
            // Extração de dados com base na documentação oficial da Greenn
            const buyerData = payload?.client || payload?.customer || payload?.buyer || {};
            const productData = payload?.product || {};
            const saleData = payload?.sale || payload?.currentSale || payload?.transaction || payload || {};
            const contractData = payload?.contract || {};

            const email = (buyerData?.email || payload?.email || '')?.toLowerCase().trim();
            const name = buyerData?.name || buyerData?.full_name || payload?.name || 'Usuário';

            // Captura telefone
            let telefone = buyerData?.phone || buyerData?.cellphone || buyerData?.mobile || '';
            telefone = telefone.replace(/[^\d]/g, '');

            // Captura ID da transação
            const transactionId = saleData?.transaction || saleData?.id || saleData?.order_id || `GR_${Date.now()}`;

            console.log(`📞 Telefone capturado da Greenn: ${telefone || 'não informado'}`);
            console.log(`💳 Transação ID capturada: ${transactionId}`);

            // Captura dados do plano
            const planName = productData?.name || saleData?.product_name || 'Plano Premium (Greenn)';

            // Captura dados da assinatura/subscription para extrair tipo e datas
            let planType = 'mensal'; // default
            let startDate = new Date();
            let endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // +30 dias fallback

            // Tenta inferir o tipo do plano
            const typeString = (productData?.type || planName || '').toLowerCase();
            if (typeString.includes('anual') || typeString.includes('annual') || typeString.includes('yearly')) {
                planType = 'anual';
                endDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
            } else if (typeString.includes('trimestral')) {
                planType = 'trimestral';
                endDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
            } else if (typeString.includes('semestral')) {
                planType = 'semestral';
                endDate = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000);
            }

            // Se a plataforma mandar as datas explicitamente no contract ou sale, usamos
            if (contractData?.current_period_end) {
                endDate = new Date(contractData.current_period_end);
            } else if (saleData?.next_payment_date || saleData?.expires_at || saleData?.due_date) {
                endDate = new Date(saleData.next_payment_date || saleData.expires_at || saleData.due_date);
            }

            if (contractData?.start_date) {
                startDate = new Date(contractData.start_date);
            } else if (saleData?.approved_date || saleData?.created_at || saleData?.payment_date) {
                startDate = new Date(saleData.approved_date || saleData.created_at || saleData.payment_date);
            }

            // Extrai preço
            let planPrice = 0;
            let planCurrency = 'BRL';

            const priceVal = saleData?.price || saleData?.value || saleData?.amount || productData?.price || 0;
            if (typeof priceVal === 'object' && priceVal !== null) {
                planPrice = parseFloat(priceVal.value || priceVal.amount) || 0;
                planCurrency = priceVal.currency || priceVal.currency_value || 'BRL';
            } else {
                planPrice = parseFloat(priceVal.toString()) || 0;
            }

            console.log(`🎯 Dados da compra Greenn: Email=${email}, Plano=${planName}, Tipo=${planType}, Transação=${transactionId}`);
            console.log(`💰 Preço final extraído: ${planPrice}, Moeda: ${planCurrency}`);
            console.log(`📅 Datas: Início=${startDate.toISOString()}, Vencimento=${endDate.toISOString()}`);

            if (!email) {
                console.log('❌ Email não encontrado no payload da Greenn');
                return res.status(400).json({ error: 'Email não encontrado', payload });
            }

            // Verifica se usuário existe
            const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);

            if (existingUser.rowCount === 0) {
                // Cria novo usuário
                let username = email.split('@')[0];

                // Garante username único
                const existingUsername = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
                if (existingUsername.rowCount && existingUsername.rowCount > 0) {
                    username = `${username}_${Date.now()}`;
                }

                const hashedPassword = await hashPassword('designcup@123'); // Senha padrão

                await pool.query(`
          INSERT INTO users (
            email, username, password, telefone, tipo, plano_id, 
            data_vencimento, active, created_at, is_admin, bio,
            origem_assinatura
          )
          VALUES ($1, $2, $3, $4, 'premium', $5, $6, true, NOW(), false, 'Cliente Greenn', 'greenn')
        `, [email, username, hashedPassword, telefone, planType, endDate]);

                console.log(`✅ Novo usuário criado: ${name} (${email}) - Plano Greenn: ${planName}`);

                // Enviar email de boas-vindas
                try {
                    await BrevoService.enviarEmailTemplate(email, name, 1, { nome: name, email: email });
                    await BrevoService.adicionarContato(email, name, [1]);
                    console.log('📧 Email de boas-vindas enviado para:', email);

                    await BrevoService.notificarNovoUsuario('jean.maringa@hotmail.com', username, email);
                } catch (emailError) {
                    console.log('⚠️ Erro ao enviar email de boas-vindas:', emailError);
                }
            } else {
                // Atualiza usuário existente para premium
                await pool.query(`
          UPDATE users SET 
            tipo = 'premium', 
            plano_id = $2, 
            data_vencimento = $3, 
            telefone = $4,
            active = true,
            origem_assinatura = 'greenn'
          WHERE email = $1
        `, [email, planType, endDate, telefone]);

                console.log(`✅ Usuário atualizado para premium: ${name} (${email}) - Plano Greenn: ${planName}`);
            }

            // Envia notificações por email
            try {
                await BrevoService.enviarEmailTemplate(email, name, 1, {
                    nome: name, email: email, plano: planName, valor: planPrice.toFixed(2)
                });
                await BrevoService.notificarNovaCompra('jean.maringa@hotmail.com', name, email, planName, planPrice);
                console.log('📧 Emails de confirmação enviados para:', email);
            } catch (emailError) {
                console.log('⚠️ Erro ao enviar email de confirmação:', emailError);
            }

            return res.status(200).json({ success: true, message: 'Processado com sucesso (Greenn)' });
        } catch (err: any) {
            console.error('❌ Erro ao processar compra Greenn:', err);
            return res.status(500).json({ error: 'Erro interno', details: err.message });
        }
    }

    // LÓGICA DE CANCELAMENTO
    if (isCancellationStatus(status)) {
        try {
            const buyerData = payload?.client || payload?.customer || payload?.buyer || payload?.data?.buyer || payload?.data?.client || {};
            const email = (buyerData?.email || payload?.email || '')?.toLowerCase().trim();

            if (!email) {
                console.log('❌ Email não encontrado no payload de cancelamento (Greenn)');
                return res.status(400).json({ error: 'Email não encontrado' });
            }

            console.log(`🔄 Processando cancelamento (Greenn) para: ${email}, status: ${status}`);

            const userUpdateResult = await pool.query(`
        UPDATE users 
        SET tipo = 'free', 
            plano_id = null, 
            data_vencimento = CURRENT_TIMESTAMP,
            active = true
        WHERE email = $1
      `, [email]);

            if (userUpdateResult.rowCount && userUpdateResult.rowCount > 0) {

                console.log(`✅ Usuário ${email} rebaixado para free devido a: ${status}`);

                try {
                    const userResult = await pool.query('SELECT username FROM users WHERE email = $1', [email]);
                    const username = userResult.rows[0]?.username || email.split('@')[0];
                    await BrevoService.enviarCancelamento(email, username);
                } catch (error) { }
            } else {
                console.log(`⚠️ Usuário ${email} não encontrado para cancelamento`);
            }

            return res.status(200).json({ success: true, message: 'Cancelamento processado com sucesso' });
        } catch (err: any) {
            console.error('❌ Erro ao processar cancelamento Greenn:', err);
            return res.status(500).json({ error: 'Erro ao processar', details: err.message });
        }
    }

    // Outros eventos
    console.log(`ℹ️ Status ${status} ignorado - webhook funcionando`);
    return res.status(200).json({ success: true, message: 'Webhook Greenn recebido mas ignorado', status });
});

export default router;
