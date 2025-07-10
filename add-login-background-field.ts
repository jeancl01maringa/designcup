/**
 * Script para adicionar campos de personalização na tabela settings
 * Adiciona logo_url e login_background_url para personalização da plataforma
 * 
 * Para executar: npx tsx add-login-background-field.ts
 */

import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

async function addPersonalizationFields() {
  try {
    console.log('Adicionando campos de personalização na tabela settings...');

    // Inserir logo_url se não existir
    await sql`
      INSERT INTO settings (key, value, description)
      VALUES ('logo_url', '', 'URL do logo da plataforma armazenado no Supabase Storage')
      ON CONFLICT (key) DO NOTHING
    `;

    // Inserir login_background_url se não existir
    await sql`
      INSERT INTO settings (key, value, description)
      VALUES ('login_background_url', '', 'URL da imagem de fundo da página de login armazenada no Supabase Storage')
      ON CONFLICT (key) DO NOTHING
    `;

    console.log('✅ Campos de personalização adicionados com sucesso!');
    
    // Verificar se foram inseridos
    const settings = await sql`
      SELECT key, value, description 
      FROM settings 
      WHERE key IN ('logo_url', 'login_background_url')
      ORDER BY key
    `;
    
    console.log('Configurações existentes:');
    settings.forEach(setting => {
      console.log(`- ${setting.key}: ${setting.value || '(vazio)'}`);
    });

  } catch (error) {
    console.error('❌ Erro ao adicionar campos de personalização:', error);
  }
}

addPersonalizationFields();