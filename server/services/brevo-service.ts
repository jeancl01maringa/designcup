// Configuração da API Brevo via REST
const BREVO_API_URL = 'https://api.brevo.com/v3';
const API_KEY = process.env.BREVO_API_KEY;

interface EmailData {
  to: string;
  toName?: string;
  subject: string;
  htmlContent?: string;
  textContent?: string;
  templateId?: number;
  params?: any;
}

export class BrevoService {
  private static remetente = {
    email: 'jean.maringa@hotmail.com',
    name: 'Design para Estética'
  };

  /**
   * Envia email transacional via Brevo
   */
  static async enviarEmail(data: EmailData): Promise<boolean> {
    try {
      const payload: any = {
        sender: this.remetente,
        to: [{ 
          email: data.to, 
          name: data.toName || data.to.split('@')[0] 
        }],
        subject: data.subject
      };
      
      if (data.templateId) {
        payload.templateId = data.templateId;
        payload.params = data.params || {};
      } else {
        payload.htmlContent = data.htmlContent;
        payload.textContent = data.textContent;
      }

      const response = await fetch(`${BREVO_API_URL}/smtp/email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': API_KEY!
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Email enviado via Brevo:', data.to, 'MessageId:', result.messageId);
        return true;
      } else {
        const error = await response.text();
        console.error('❌ Erro ao enviar email via Brevo:', error);
        return false;
      }
    } catch (error: any) {
      console.error('❌ Erro ao enviar email via Brevo:', error.message);
      return false;
    }
  }

  /**
   * Adiciona contato na lista da Brevo
   */
  static async adicionarContato(email: string, nome?: string, listIds?: number[]): Promise<boolean> {
    try {
      const payload: any = {
        email: email
      };
      
      if (nome) {
        const nomeParts = nome.trim().split(' ');
        payload.attributes = {
          NOME: nomeParts[0],
          SOBRENOME: nomeParts.slice(1).join(' ') || nomeParts[0]
        };
      }
      
      if (listIds && listIds.length > 0) {
        payload.listIds = listIds;
      }

      const response = await fetch(`${BREVO_API_URL}/contacts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': API_KEY!
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        console.log('✅ Contato adicionado na Brevo:', email);
        return true;
      } else if (response.status === 400) {
        console.log('ℹ️ Contato já existe na Brevo:', email);
        return true;
      } else {
        const error = await response.text();
        console.error('❌ Erro ao adicionar contato na Brevo:', error);
        return false;
      }
    } catch (error: any) {
      console.error('❌ Erro ao adicionar contato na Brevo:', error.message);
      return false;
    }
  }

  /**
   * Email de boas-vindas para novos usuários
   */
  static async enviarBoasVindas(email: string, nome: string): Promise<boolean> {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Bem-vindo ao Design para Estética!</h1>
          </div>
          <div class="content">
            <h2>Olá, ${nome}!</h2>
            <p>É um prazer ter você conosco! Agora você faz parte da melhor plataforma de artes para estética do Brasil.</p>
            
            <p><strong>O que você pode fazer agora:</strong></p>
            <ul>
              <li>Explorar milhares de templates profissionais</li>
              <li>Baixar artes nos formatos Feed, Stories e Cartaz</li>
              <li>Personalizar conteúdos para sua marca</li>
              <li>Acessar nossa biblioteca premium</li>
            </ul>
            
            <p>Sua conta foi criada com sucesso e você já pode começar a usar nossa plataforma.</p>
            
            <p>Se tiver alguma dúvida, nossa equipe de suporte está sempre disponível para ajudar!</p>
            
            <p>Bem-vindo à família Design para Estética!</p>
          </div>
          <div class="footer">
            <p>Design para Estética - A melhor plataforma de artes para estética do Brasil</p>
            <p>Este é um email automático, não responda esta mensagem.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.enviarEmail({
      to: email,
      toName: nome,
      subject: '🎨 Bem-vindo ao Design para Estética!',
      htmlContent,
      textContent: `Olá ${nome}! Bem-vindo ao Design para Estética. Sua conta foi criada com sucesso e você já pode acessar nossa plataforma de templates para estética.`
    });
  }

  /**
   * Email de confirmação de compra/assinatura
   */
  static async enviarConfirmacaoCompra(email: string, nome: string, plano: string, valor: number): Promise<boolean> {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .highlight { background: #e8f5e8; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .button { display: inline-block; background: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Compra Confirmada!</h1>
          </div>
          <div class="content">
            <h2>Parabéns, ${nome}!</h2>
            <p>Sua compra foi processada com sucesso e você agora tem acesso premium à nossa plataforma!</p>
            
            <div class="highlight">
              <h3>Detalhes da sua assinatura:</h3>
              <p><strong>Plano:</strong> ${plano}</p>
              <p><strong>Valor:</strong> R$ ${valor.toFixed(2)}</p>
              <p><strong>Status:</strong> Ativo</p>
            </div>
            
            <p><strong>Seus benefícios premium incluem:</strong></p>
            <ul>
              <li>Acesso ilimitado a todos os templates</li>
              <li>Downloads em alta resolução</li>
              <li>Formatos exclusivos para Stories e Feed</li>
              <li>Suporte prioritário</li>
              <li>Novos templates semanais</li>
            </ul>
            
            <p>Obrigado por escolher o Design para Estética!</p>
          </div>
          <div class="footer">
            <p>Design para Estética - A melhor plataforma de artes para estética do Brasil</p>
            <p>Este é um email automático, não responda esta mensagem.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.enviarEmail({
      to: email,
      toName: nome,
      subject: '✅ Sua assinatura premium está ativa!',
      htmlContent,
      textContent: `Parabéns ${nome}! Sua compra do ${plano} (R$ ${valor.toFixed(2)}) foi confirmada. Você agora tem acesso premium à nossa plataforma.`
    });
  }

  /**
   * Email de cancelamento de assinatura
   */
  static async enviarCancelamento(email: string, nome: string): Promise<boolean> {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #dc3545 0%, #fd7e14 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Assinatura Cancelada</h1>
          </div>
          <div class="content">
            <h2>Olá, ${nome}</h2>
            <p>Informamos que sua assinatura premium foi cancelada conforme solicitado.</p>
            
            <p><strong>O que acontece agora:</strong></p>
            <ul>
              <li>Sua conta continua ativa no plano gratuito</li>
              <li>Você pode continuar usando os templates básicos</li>
              <li>Pode reativar sua assinatura a qualquer momento</li>
              <li>Seus dados e preferências foram mantidos</li>
            </ul>
            
            <p>Sentiremos sua falta e esperamos vê-lo novamente em breve!</p>
            
            <p>Se tiver alguma dúvida ou feedback, nossa equipe está sempre disponível.</p>
          </div>
          <div class="footer">
            <p>Design para Estética - A melhor plataforma de artes para estética do Brasil</p>
            <p>Este é um email automático, não responda esta mensagem.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.enviarEmail({
      to: email,
      toName: nome,
      subject: 'Assinatura cancelada - Sentiremos sua falta!',
      htmlContent,
      textContent: `Olá ${nome}, sua assinatura premium foi cancelada. Sua conta continua ativa no plano gratuito e você pode reativar a qualquer momento.`
    });
  }

  /**
   * Email de notificação para administradores sobre novos usuários
   */
  static async notificarNovoUsuario(emailAdmin: string, nomeUsuario: string, emailUsuario: string): Promise<boolean> {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #17a2b8 0%, #6f42c1 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .info-box { background: #e9ecef; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>👤 Novo Usuário Cadastrado</h1>
          </div>
          <div class="content">
            <h2>Olá, Administrador!</h2>
            <p>Um novo usuário se cadastrou na plataforma Design para Estética.</p>
            
            <div class="info-box">
              <h3>Dados do novo usuário:</h3>
              <p><strong>Nome:</strong> ${nomeUsuario}</p>
              <p><strong>Email:</strong> ${emailUsuario}</p>
              <p><strong>Data:</strong> ${new Date().toLocaleString('pt-BR')}</p>
              <p><strong>Tipo:</strong> Usuário Gratuito</p>
            </div>
            
            <p>O usuário recebeu um email de boas-vindas automaticamente e já pode acessar a plataforma.</p>
          </div>
          <div class="footer">
            <p>Design para Estética - Notificação Administrativa</p>
            <p>Este é um email automático, não responda esta mensagem.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.enviarEmail({
      to: emailAdmin,
      subject: `👤 Novo usuário: ${nomeUsuario}`,
      htmlContent,
      textContent: `Novo usuário cadastrado: ${nomeUsuario} (${emailUsuario}) em ${new Date().toLocaleString('pt-BR')}`
    });
  }

  /**
   * Email de notificação para administradores sobre nova compra/assinatura
   */
  static async notificarNovaCompra(emailAdmin: string, nomeCliente: string, emailCliente: string, plano: string, valor: number): Promise<boolean> {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .info-box { background: #d4edda; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>💰 Nova Compra Realizada</h1>
          </div>
          <div class="content">
            <h2>Ótimas notícias!</h2>
            <p>Uma nova compra foi realizada na plataforma via Hotmart.</p>
            
            <div class="info-box">
              <h3>Detalhes da compra:</h3>
              <p><strong>Cliente:</strong> ${nomeCliente}</p>
              <p><strong>Email:</strong> ${emailCliente}</p>
              <p><strong>Plano:</strong> ${plano}</p>
              <p><strong>Valor:</strong> R$ ${valor.toFixed(2)}</p>
              <p><strong>Data:</strong> ${new Date().toLocaleString('pt-BR')}</p>
              <p><strong>Status:</strong> Ativo</p>
            </div>
            
            <p>O cliente foi automaticamente promovido para premium e recebeu email de confirmação.</p>
          </div>
          <div class="footer">
            <p>Design para Estética - Notificação Administrativa</p>
            <p>Este é um email automático, não responda esta mensagem.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.enviarEmail({
      to: emailAdmin,
      subject: `💰 Nova compra: ${plano} - R$ ${valor.toFixed(2)}`,
      htmlContent,
      textContent: `Nova compra realizada: ${nomeCliente} (${emailCliente}) comprou ${plano} por R$ ${valor.toFixed(2)} em ${new Date().toLocaleString('pt-BR')}`
    });
  }
}

export default BrevoService;