const UTMIFY_API_KEY = 'LhXBo6b1QEPP10L6aby5p3YOZULrTzSA42qv';
const UTMIFY_ENDPOINT = 'https://api.utmify.com.br/v1/facebook/conversions';

export class UTMifyService {
    /**
     * Envia evento de conversão para UTMify (Facebook Conversion API)
     * @param userData Dados do usuário (email, telefone, ip, etc.)
     * @param orderData Dados do pedido (valor, moeda, produtos)
     */
    static async sendConversion(userData: {
        email: string;
        phone?: string;
        firstName?: string;
        lastName?: string;
        ip?: string;
        userAgent?: string;
    }, orderData: {
        transactionId: string;
        value: number;
        currency: string;
        productName: string;
        productId: string;
    }) {
        try {
            console.log(`[UTMify] Processando conversão para: ${userData.email} (${orderData.transactionId})`);

            const payload = {
                event_name: 'Purchase',
                event_time: Math.floor(Date.now() / 1000),
                action_source: 'website',
                user_data: {
                    em: [userData.email.toLowerCase().trim()],
                    ph: userData.phone ? [userData.phone.replace(/\D/g, '')] : [],
                    client_ip_address: userData.ip || null,
                    client_user_agent: userData.userAgent || null
                },
                custom_data: {
                    value: orderData.value,
                    currency: orderData.currency || 'BRL',
                    content_name: orderData.productName,
                    content_ids: [orderData.productId],
                    order_id: orderData.transactionId
                }
            };

            console.log(`[UTMify] Payload preparado:`, JSON.stringify(payload));

            const response = await fetch(UTMIFY_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': UTMIFY_API_KEY
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`[UTMify] Erro na resposta: ${response.status} - ${errorText}`);
                return false;
            }

            const result = await response.json();
            console.log(`[UTMify] ✅ Conversão enviada com sucesso para ${userData.email}. Trace ID:`, result.trace_id);
            return true;
        } catch (error: any) {
            console.error('[UTMify] ❌ Exceção ao enviar conversão:', error.message);
            return false;
        }
    }
}

export default UTMifyService;
