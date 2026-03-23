// Script de migração: Adiciona suporte a categorias em destaque na home
// Executa: node migrate-featured-categories.cjs

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function migrate() {
    const client = await pool.connect();
    try {
        console.log('Iniciando migração...');

        // 1. Adicionar colunas home_visible e home_order na tabela categories
        await client.query(`
      ALTER TABLE categories
        ADD COLUMN IF NOT EXISTS home_visible BOOLEAN NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS home_order INTEGER NOT NULL DEFAULT 99;
    `);
        console.log('✅ Colunas home_visible e home_order adicionadas em categories');

        // 2. Criar tabela site_config (chave/valor)
        await client.query(`
      CREATE TABLE IF NOT EXISTS site_config (
        key TEXT PRIMARY KEY,
        value JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);
        console.log('✅ Tabela site_config criada');

        console.log('✅ Migração concluída com sucesso!');
    } catch (err) {
        console.error('❌ Erro durante a migração:', err);
        throw err;
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();
