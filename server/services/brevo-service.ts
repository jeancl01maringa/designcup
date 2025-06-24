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
      const createContact = new SibApiV3Sdk.CreateContact();
      createContact.email = email;
      
      if (nome) {
        // Separar nome e sobrenome se possível
        const nomeParts = nome.trim().split(' ');
        createContact.attributes = {
          NOME: nomeParts[0],
          SOBRENOME: nomeParts.slice(1).join(' ') || nomeParts[0]
        };
      }
      
      if (listIds && listIds.length > 0) {
        createContact.listIds = listIds;
      }

      await contactsApi.createContact(createContact);
      console.log('✅ Contato adicionado na Brevo:', email);
      return true;
    } catch (error: any) {
      // Código 400 geralmente significa contato já existe
      if (error.response?.status === 400) {
        console.log('ℹ️ Contato já existe na Brevo:', email);
        return true;
      }
      console.error('❌ Erro ao adicionar contato na Brevo:', error?.response?.body || error.message);
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
            
            <a href="https://${process.env.REPL_SLUG}.replit.app" class="button">Acessar Plataforma</a>
            
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
            
            <a href="https://${process.env.REPL_SLUG}.replit.app" class="button">Acessar Área Premium</a>
            
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
            
            <a href="https://${process.env.REPL_SLUG}.replit.app" class="button">Voltar para a Plataforma</a>
            
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
   * Email de recuperação de senha
   */
  static async enviarRecuperacaoSenha(email: string, nome: string, novaSenha: string): Promise<boolean> {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #ffc107 0%, #fd7e14 100%); color: #212529; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .password-box { background: #e2e3e5; padding: 15px; border-radius: 5px; margin: 20px 0; text-align: center; font-size: 18px; font-weight: bold; }
          .button { display: inline-block; background: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Nova Senha de Acesso</h1>
          </div>
          <div class="content">
            <h2>Olá, ${nome}!</h2>
            <p>Uma nova senha foi gerada para sua conta no Design para Estética.</p>
            
            <div class="password-box">
              Sua nova senha: ${novaSenha}
            </div>
            
            <p><strong>Importante:</strong></p>
            <ul>
              <li>Use esta senha para fazer login na plataforma</li>
              <li>Recomendamos alterar para uma senha de sua preferência após o login</li>
              <li>Mantenha sua senha em local seguro</li>
              <li>Não compartilhe sua senha com terceiros</li>
            </ul>
            
            <a href="https://${process.env.REPL_SLUG}.replit.app/auth" class="button">Fazer Login</a>
            
            <p>Se você não solicitou esta alteração, entre em contato conosco imediatamente.</p>
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
      subject: '🔐 Nova senha de acesso - Design para Estética',
      htmlContent,
      textContent: `Olá ${nome}, uma nova senha foi gerada para sua conta: ${novaSenha}. Use esta senha para fazer login e recomendamos alterá-la após o acesso.`
    });
  }
}

export default BrevoService;