/**
 * Script para criar a tabela settings no banco de dados PostgreSQL
 * 
 * Esta tabela armazenará configurações dinâmicas da plataforma
 * como números de suporte, textos de ajuda, etc.
 * 
 * Para executar:
 * npx tsx create-settings-table.ts
 */

import { Pool } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required");
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function createSettingsTable() {
  try {
    console.log("Criando tabela settings...");

    // Verificar se a tabela já existe
    const checkTableQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'settings'
      );
    `;

    const tableExists = await pool.query(checkTableQuery);
    
    if (tableExists.rows[0].exists) {
      console.log("Tabela settings já existe!");
      return;
    }

    // Criar a tabela settings
    const createTableQuery = `
      CREATE TABLE public.settings (
        id SERIAL PRIMARY KEY,
        key VARCHAR(255) NOT NULL UNIQUE,
        value TEXT NOT NULL,
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    await pool.query(createTableQuery);
    console.log("Tabela settings criada com sucesso!");

    // Criar índice para melhor performance nas consultas por key
    const createIndexQuery = `
      CREATE INDEX idx_settings_key ON public.settings(key);
    `;

    await pool.query(createIndexQuery);
    console.log("Índice criado com sucesso!");

    // Inserir configuração inicial do número de suporte (exemplo)
    const insertInitialSettingQuery = `
      INSERT INTO public.settings (key, value, description)
      VALUES ('numero_suporte', '(44) 9 9999-9999', 'Número de WhatsApp para suporte da plataforma')
      ON CONFLICT (key) DO NOTHING;
    `;

    await pool.query(insertInitialSettingQuery);
    console.log("Configuração inicial inserida!");

  } catch (error) {
    console.error("Erro ao criar tabela settings:", error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Executar a função
createSettingsTable()
  .then(() => {
    console.log("Script executado com sucesso!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Erro no script:", error);
    process.exit(1);
  });