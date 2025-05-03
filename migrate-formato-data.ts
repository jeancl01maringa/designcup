/**
 * Script para migrar a estrutura da tabela posts
 * Adiciona os novos campos necessários para o agrupamento de formatos
 * 
 * Para executar: 
 * npx tsx migrate-formato-data.ts
 */

import { drizzle } from "drizzle-orm/neon-serverless";
import { sql } from "drizzle-orm";
import { Pool } from "@neondatabase/serverless";
import * as dotenv from "dotenv";

dotenv.config();

async function migratePostsTable() {
  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL não encontrada nas variáveis de ambiente");
    return;
  }

  console.log("🔄 Iniciando migração da tabela posts...");
  
  try {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const db = drizzle(pool);
    
    // Verifica se as colunas já existem
    const checkColumns = await db.execute(sql`
      SELECT 
        column_name 
      FROM 
        information_schema.columns 
      WHERE 
        table_name = 'posts' AND 
        column_name IN ('titulo_base', 'formato', 'is_pro', 'formato_data', 'canva_url')
    `);
    
    const existingColumns = checkColumns.rows.map(row => row.column_name);
    console.log("📊 Colunas existentes:", existingColumns);
    
    // Adiciona coluna titulo_base se não existir
    if (!existingColumns.includes('titulo_base')) {
      console.log("➕ Adicionando coluna titulo_base...");
      await db.execute(sql`ALTER TABLE posts ADD COLUMN titulo_base TEXT`);
    }
    
    // Adiciona coluna formato se não existir
    if (!existingColumns.includes('formato')) {
      console.log("➕ Adicionando coluna formato...");
      await db.execute(sql`ALTER TABLE posts ADD COLUMN formato TEXT`);
    }
    
    // Adiciona coluna formato_data se não existir
    if (!existingColumns.includes('formato_data')) {
      console.log("➕ Adicionando coluna formato_data...");
      await db.execute(sql`ALTER TABLE posts ADD COLUMN formato_data TEXT`);
    }
    
    // Adiciona coluna canva_url se não existir
    if (!existingColumns.includes('canva_url')) {
      console.log("➕ Adicionando coluna canva_url...");
      await db.execute(sql`ALTER TABLE posts ADD COLUMN canva_url TEXT`);
    }
    
    // Adiciona coluna is_pro se não existir
    if (!existingColumns.includes('is_pro')) {
      console.log("➕ Adicionando coluna is_pro...");
      await db.execute(sql`ALTER TABLE posts ADD COLUMN is_pro BOOLEAN DEFAULT FALSE`);
    }
    
    // Atualiza valores iniciais para compatibilidade
    console.log("🔄 Atualizando valores iniciais para compatibilidade...");
    
    // Preenche titulo_base com o valor atual de title
    await db.execute(sql`
      UPDATE posts 
      SET titulo_base = title 
      WHERE titulo_base IS NULL
    `);
    
    // Preenche is_pro baseado no licenseType
    await db.execute(sql`
      UPDATE posts 
      SET is_pro = TRUE 
      WHERE license_type = 'premium' AND is_pro IS NULL
    `);
    
    // Para cada entrada no formats array, popula o campo formato com o primeiro valor
    await db.execute(sql`
      UPDATE posts 
      SET formato = formats[1] 
      WHERE formato IS NULL AND formats IS NOT NULL AND array_length(formats, 1) > 0
    `);
    
    // Migra format_data para formato_data
    await db.execute(sql`
      UPDATE posts 
      SET formato_data = format_data 
      WHERE formato_data IS NULL AND format_data IS NOT NULL
    `);
    
    console.log("✅ Migração concluída com sucesso!");
  } catch (error) {
    console.error("❌ Erro durante a migração:", error);
  }
}

// Executa a migração
migratePostsTable().catch(console.error);