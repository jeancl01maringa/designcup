/**
 * Script para validar a conexão com o banco de dados e verificar a sincronização
 * entre o PostgreSQL direto e o Supabase
 * 
 * Para executar:
 * npx tsx validate-database-connection.ts
 */

import { Pool } from '@neondatabase/serverless';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { WebSocket } from 'ws';

// Carregar variáveis de ambiente
dotenv.config();

async function validateDatabaseConnection() {
  console.log("=== Validação de Conexão com Banco de Dados ===\n");
  
  // Verificar variáveis de ambiente
  console.log("Verificando variáveis de ambiente...");
  
  const databaseUrl = process.env.DATABASE_URL;
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!databaseUrl) {
    console.error("❌ DATABASE_URL não está definida");
    return;
  } else {
    console.log("✅ DATABASE_URL está definida");
    // Mostrar os primeiros 15 caracteres para verificar sem expor dados sensíveis
    const maskedUrl = databaseUrl.substring(0, 15) + "..." + 
                     (databaseUrl.includes("@") ? 
                       databaseUrl.substring(databaseUrl.indexOf("@")) : 
                       "[restante omitido]");
    console.log(`   URL: ${maskedUrl}`);
  }
  
  if (!supabaseUrl) {
    console.error("❌ SUPABASE_URL não está definida");
  } else {
    console.log("✅ SUPABASE_URL está definida");
    console.log(`   URL: ${supabaseUrl}`);
  }
  
  if (!supabaseKey) {
    console.error("❌ SUPABASE_KEY e SUPABASE_SERVICE_ROLE_KEY não estão definidas");
  } else {
    console.log("✅ Chave do Supabase está definida");
    console.log(`   Primeiros caracteres: ${supabaseKey.substring(0, 5)}...`);
  }
  
  console.log("\nTestando conexão direta com PostgreSQL...");
  try {
    // Configurar WebSocket para Neon
    const neonConfig = { webSocketConstructor: WebSocket };
    
    // Criar pool de conexão
    const pool = new Pool({ 
      connectionString: databaseUrl,
      max: 5,
      connectionTimeoutMillis: 10000
    });
    
    // Teste simples de consulta
    const client = await pool.connect();
    try {
      const result = await client.query('SELECT current_timestamp as time, current_database() as database');
      console.log("✅ Conexão com PostgreSQL estabelecida com sucesso!");
      console.log(`   Banco de dados: ${result.rows[0].database}`);
      console.log(`   Timestamp: ${result.rows[0].time}`);
      
      // Verificar tabelas existentes
      const tablesResult = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name
      `);
      
      console.log(`\n   Tabelas encontradas (${tablesResult.rows.length}):`);
      for (const row of tablesResult.rows) {
        console.log(`   - ${row.table_name}`);
      }
      
    } finally {
      client.release();
    }
    
    // Fechar pool
    await pool.end();
    
  } catch (error: any) {
    console.error("❌ Erro na conexão com PostgreSQL:");
    console.error(`   ${error.message}`);
    if (error.cause) {
      console.error(`   Causa: ${error.cause.message || error.cause}`);
    }
  }
  
  // Testar Supabase se as credenciais estiverem disponíveis
  if (supabaseUrl && supabaseKey) {
    console.log("\nTestando conexão com Supabase...");
    try {
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Testar a conexão com uma consulta simples
      const { data, error } = await supabase.from('users').select('count(*)', { count: 'exact', head: true });
      
      if (error) throw error;
      
      console.log("✅ Conexão com Supabase estabelecida com sucesso!");
      
      // Testar outras funcionalidades do Supabase
      try {
        const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
        
        if (bucketsError) {
          console.warn("⚠️ Não foi possível listar buckets de armazenamento:");
          console.warn(`   ${bucketsError.message}`);
        } else {
          console.log(`   Buckets de armazenamento encontrados: ${buckets.length}`);
          buckets.forEach((bucket, index) => {
            console.log(`   ${index + 1}. ${bucket.name} (${bucket.public ? 'público' : 'privado'})`);
          });
        }
      } catch (storageError: any) {
        console.warn("⚠️ Erro ao acessar o Storage do Supabase:");
        console.warn(`   ${storageError.message}`);
      }
      
      // Listar tabelas no Supabase
      try {
        // Usando postgres-meta API
        const { data: tables, error: tablesError } = await supabase.rpc('pg_meta_tables');
        
        if (tablesError) {
          console.warn("⚠️ Não foi possível listar tabelas via RPC:");
          console.warn(`   ${tablesError.message}`);
          
          // Tentar consulta alternativa
          const { data: tablesList, error: tablesListError } = await supabase.from('pg_tables')
            .select('tablename')
            .eq('schemaname', 'public');
            
          if (tablesListError) {
            console.warn("⚠️ Também não foi possível listar tabelas via consulta direta:");
            console.warn(`   ${tablesListError.message}`);
          } else if (tablesList) {
            console.log(`\n   Tabelas encontradas no Supabase (${tablesList.length}):`);
            for (const row of tablesList) {
              console.log(`   - ${row.tablename}`);
            }
          }
        } else if (tables) {
          console.log(`\n   Tabelas encontradas no Supabase (${tables.length}):`);
          for (const table of tables) {
            console.log(`   - ${table.name}`);
          }
        }
      } catch (metaError: any) {
        console.warn("⚠️ Erro ao acessar metadados do Supabase:");
        console.warn(`   ${metaError.message}`);
      }
      
    } catch (error: any) {
      console.error("❌ Erro na conexão com Supabase:");
      console.error(`   ${error.message}`);
      
      // Tentar fazer um ping simples para verificar DNS
      try {
        console.log(`\nVerificando resolução DNS para ${supabaseUrl}...`);
        const urlObj = new URL(supabaseUrl);
        const hostname = urlObj.hostname;
        
        const dns = require('dns');
        dns.lookup(hostname, (err: any, address: any, family: any) => {
          if (err) {
            console.error(`❌ Erro de DNS: Não foi possível resolver ${hostname}`);
            console.error(`   ${err.message}`);
            console.log("\nSugestões para resolver problemas de DNS:");
            console.log("1. Verifique se a URL está correta");
            console.log("2. Verifique se o projeto Supabase existe e está ativo");
            console.log("3. Considere usar um serviço de DNS alternativo");
          } else {
            console.log(`✅ Nome de domínio ${hostname} resolvido para ${address}`);
            console.log("   O problema não é de resolução DNS, mas pode ser de conexão ou autenticação");
          }
        });
      } catch (dnsError: any) {
        console.error("❌ Erro ao verificar DNS:");
        console.error(`   ${dnsError.message}`);
      }
    }
  }
  
  console.log("\n=== Validação concluída ===");
}

// Executar a função principal
validateDatabaseConnection().catch(err => {
  console.error("Erro fatal durante a validação:", err);
});