/**
 * Script para criar as tabelas de ferramentas no banco de dados
 * 
 * Para executar: npx tsx create-tools-tables.ts
 */

import { neon } from '@neondatabase/serverless';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL não encontrada nas variáveis de ambiente');
  process.exit(1);
}

const sql = neon(DATABASE_URL);

async function createToolsTables() {
  try {
    console.log('🔧 Criando tabelas de ferramentas...');

    // Criar tabela de categorias de ferramentas
    await sql`
      CREATE TABLE IF NOT EXISTS tool_categories (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        is_active BOOLEAN DEFAULT true NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `;

    // Criar tabela de ferramentas
    await sql`
      CREATE TABLE IF NOT EXISTS tools (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        url TEXT NOT NULL,
        category_id INTEGER REFERENCES tool_categories(id) ON DELETE SET NULL,
        image_url TEXT,
        is_new BOOLEAN DEFAULT false NOT NULL,
        is_active BOOLEAN DEFAULT true NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `;

    console.log('✅ Tabelas de ferramentas criadas com sucesso!');

    // Inserir algumas categorias padrão
    console.log('📂 Inserindo categorias padrão...');
    
    await sql`
      INSERT INTO tool_categories (name, description) VALUES 
      ('Design', 'Ferramentas para criação e edição de designs'),
      ('Produtividade', 'Ferramentas para melhorar a produtividade'),
      ('Marketing', 'Ferramentas de marketing digital'),
      ('Análise', 'Ferramentas de análise e métricas')
      ON CONFLICT (name) DO NOTHING
    `;

    console.log('✅ Categorias padrão inseridas!');

    // Inserir algumas ferramentas de exemplo
    console.log('🔨 Inserindo ferramentas de exemplo...');

    const designCategory = await sql`SELECT id FROM tool_categories WHERE name = 'Design' LIMIT 1`;
    const productivityCategory = await sql`SELECT id FROM tool_categories WHERE name = 'Produtividade' LIMIT 1`;
    const marketingCategory = await sql`SELECT id FROM tool_categories WHERE name = 'Marketing' LIMIT 1`;

    if (designCategory.length > 0) {
      await sql`
        INSERT INTO tools (name, description, url, category_id, is_new) VALUES 
        ('Canva', 'Plataforma de design gráfico online', 'https://canva.com', ${designCategory[0].id}, false),
        ('Figma', 'Ferramenta de design colaborativo', 'https://figma.com', ${designCategory[0].id}, false),
        ('Adobe Photoshop', 'Editor de imagens profissional', 'https://adobe.com/photoshop', ${designCategory[0].id}, false)
        ON CONFLICT DO NOTHING
      `;
    }

    if (productivityCategory.length > 0) {
      await sql`
        INSERT INTO tools (name, description, url, category_id, is_new) VALUES 
        ('Trello', 'Ferramenta de organização e produtividade', 'https://trello.com', ${productivityCategory[0].id}, false),
        ('Notion', 'Workspace tudo-em-um', 'https://notion.so', ${productivityCategory[0].id}, true)
        ON CONFLICT DO NOTHING
      `;
    }

    if (marketingCategory.length > 0) {
      await sql`
        INSERT INTO tools (name, description, url, category_id, is_new) VALUES 
        ('Google Analytics', 'Análise de tráfego de websites', 'https://analytics.google.com', ${marketingCategory[0].id}, false),
        ('Mailchimp', 'Plataforma de email marketing', 'https://mailchimp.com', ${marketingCategory[0].id}, false)
        ON CONFLICT DO NOTHING
      `;
    }

    console.log('✅ Ferramentas de exemplo inseridas!');
    console.log('🎉 Sistema de ferramentas configurado com sucesso!');

  } catch (error) {
    console.error('❌ Erro ao criar tabelas de ferramentas:', error);
  }
}

createToolsTables();