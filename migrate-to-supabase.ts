/**
 * Script para migrar dados do banco de dados PostgreSQL local para o Supabase
 * 
 * Este script verifica a conexão com o Supabase, mostra as instruções para
 * criar as tabelas necessárias no painel do Supabase, e tenta migrar os dados
 * de usuários, categorias, artworks e posts.
 * 
 * Para executar este script:
 * npm run migrate-supabase
 */

import { setupSupabaseTables, migrateLocalDataToSupabase } from './server/supabase';
import { db } from './server/db';
import { migrateImagesToSupabase } from './server/supabase-upload';

/**
 * Função principal para migrar dados para o Supabase
 */
async function main() {
  try {
    console.log('='.repeat(80));
    console.log(' MIGRAÇÃO PARA SUPABASE '.padStart(40 + 10, '=').padEnd(80, '='));
    console.log('='.repeat(80));
    
    console.log('\n1. Verificando conexão com o Supabase...');
    
    // Configurar tabelas no Supabase
    await setupSupabaseTables();
    
    console.log('\n2. Iniciando migração de dados...');
    
    // Migrar dados para o Supabase
    await migrateLocalDataToSupabase(db);
    
    console.log('\n3. Iniciando migração de imagens...');
    
    // Migrar imagens para o Storage do Supabase
    await migrateImagesToSupabase();
    
    console.log('\n4. Migração concluída!');
    console.log('\nPróximos passos:');
    console.log('1. Acesse o painel do Supabase para verificar se os dados foram migrados corretamente.');
    console.log('2. Adicione e configure a autenticação no Supabase, se necessário.');
    console.log('3. Configure as permissões de acesso às tabelas e ao bucket de storage.');
    
    console.log('\nSe precisar modificar as tabelas, use o SQL Editor no painel do Supabase.');
    console.log('='.repeat(80));
  } catch (error) {
    console.error('Erro durante a migração:', error);
  } finally {
    // Encerrar a conexão com o banco de dados
    process.exit(0);
  }
}

// Executar o script
main();