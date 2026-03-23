import pkg from 'pg';
const { Pool } = pkg;

const BREVO_API_URL = 'https://api.brevo.com/v3';
const API_KEY = process.env.BREVO_API_KEY;
const TARGET_EMAIL = 'jeancl01.maringa@hotmail.com';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function enviarEmail(payload) {
    const response = await fetch(`${BREVO_API_URL}/smtp/email`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'api-key': API_KEY
        },
        body: JSON.stringify(payload)
    });

    if (response.ok) {
        const result = await response.json();
        console.log('✅ Email enviado! MessageId:', result.messageId);
        return true;
    } else {
        const error = await response.text();
        console.error('❌ Erro:', error);
        return false;
    }
}

async function main() {
    console.log('=== TESTE 1: Email de Recuperação de Senha ===\n');

    const resetLink = 'https://designcup.com.br/redefinir-senha?token=TESTE_TOKEN_123';

    const resetHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #1a1a1a 0%, #333 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #c4a962; color: #1a1a1a; padding: 14px 35px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold; font-size: 16px; }
        .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
        .code-box { background: #e9ecef; padding: 15px; border-radius: 5px; margin: 15px 0; text-align: center; font-family: monospace; font-size: 14px; word-break: break-all; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔑 Recuperação de Senha</h1>
        </div>
        <div class="content">
          <h2>Olá, Jean!</h2>
          <p>Recebemos uma solicitação para redefinir a senha da sua conta na <strong>DesignCup</strong>.</p>
          
          <p>Clique no botão abaixo para criar uma nova senha:</p>
          
          <div style="text-align: center;">
            <a href="${resetLink}" class="button">Redefinir Minha Senha</a>
          </div>
          
          <p style="font-size: 13px; color: #666;">Se o botão não funcionar, copie e cole este link no seu navegador:</p>
          <div class="code-box">${resetLink}</div>
          
          <p><strong>⚠️ Este link expira em 1 hora.</strong></p>
          <p style="font-size: 13px; color: #666;">Se você não solicitou essa alteração, ignore este e-mail. Sua senha não será alterada.</p>
        </div>
        <div class="footer">
          <p>DesignCup - A melhor plataforma de designs para profissionais de estética</p>
          <p>Este é um email automático, não responda esta mensagem.</p>
        </div>
      </div>
    </body>
    </html>
  `;

    await enviarEmail({
        sender: { email: 'jean.maringa@hotmail.com', name: 'DesignCup' },
        to: [{ email: TARGET_EMAIL, name: 'Jean' }],
        subject: '🔑 Recuperação de Senha - DesignCup',
        htmlContent: resetHtml
    });

    console.log('\n=== TESTE 2: Email de Boas-Vindas (Primeiro Acesso após compra) ===\n');

    const boasVindasHtml = `
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
        .highlight { background: #e8f5e8; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #28a745; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Bem-vindo ao DesignCup!</h1>
        </div>
        <div class="content">
          <h2>Olá, Jean!</h2>
          <p>É um prazer ter você conosco! Agora você faz parte da melhor plataforma de designs para profissionais de estética do Brasil.</p>
          
          <div class="highlight">
            <h3>🔐 Seus dados de acesso:</h3>
            <p><strong>E-mail:</strong> ${TARGET_EMAIL}</p>
            <p><strong>Senha:</strong> designcup@123</p>
            <p style="font-size: 13px; color: #666;">Recomendamos alterar sua senha no primeiro acesso.</p>
          </div>
          
          <p><strong>O que você pode fazer agora:</strong></p>
          <ul>
            <li>Explorar milhares de templates profissionais</li>
            <li>Baixar artes nos formatos Feed, Stories e Cartaz</li>
            <li>Personalizar conteúdos para sua marca</li>
            <li>Acessar nossa biblioteca premium</li>
          </ul>
          
          <div style="text-align: center;">
            <a href="https://designcup.com.br/loguin" class="button">Acessar Minha Conta</a>
          </div>
          
          <p>Sua conta foi criada com sucesso e você já pode começar a usar nossa plataforma.</p>
          
          <p>Se tiver alguma dúvida, nossa equipe de suporte está sempre disponível para ajudar!</p>
          
          <p>Bem-vindo à família DesignCup!</p>
        </div>
        <div class="footer">
          <p>DesignCup - A melhor plataforma de designs para profissionais de estética do Brasil</p>
          <p>Este é um email automático, não responda esta mensagem.</p>
        </div>
      </div>
    </body>
    </html>
  `;

    await enviarEmail({
        sender: { email: 'jean.maringa@hotmail.com', name: 'DesignCup' },
        to: [{ email: TARGET_EMAIL, name: 'Jean' }],
        subject: '🎨 Bem-vindo ao DesignCup! Seus dados de acesso',
        htmlContent: boasVindasHtml
    });

    console.log('\n✅ Ambos os emails foram enviados para:', TARGET_EMAIL);
    console.log('Verifique sua caixa de entrada (e spam)!');

    process.exit(0);
}

main().catch(console.error);
