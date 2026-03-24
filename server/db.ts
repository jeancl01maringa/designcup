import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Configuração do websocket para o Neon Database
neonConfig.webSocketConstructor = ws;

// Verificar a existência da URL do banco de dados
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Adicionar log para debug da conexão
console.log("Configurando conexão com o banco de dados PostgreSQL (Neon)");

// Criar pool de conexões com parâmetros otimizados
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10, // Limite máximo de conexões no pool
  idleTimeoutMillis: 30000, // Tempo máximo que uma conexão pode ficar ociosa
  connectionTimeoutMillis: 15000 // Tempo máximo para estabelecer uma conexão
});

// Configurar evento para monitorar erros nas conexões do pool
// IMPORTANTE: sem esse handler, erros de conexão ociosa derrubam o processo inteiro
pool.on('error', (err: any) => {
  console.error('⚠️ Erro inesperado no cliente do pool (conexão será reciclada):', err?.message || err);
  // NÃO fazer process.exit() aqui — o pool recicla a conexão automaticamente
});

// Keepalive: a cada 5 minutos, faz um SELECT 1 para manter conexões vivas
// e evitar que o Neon descarte conexões ociosas
setInterval(async () => {
  try {
    await pool.query('SELECT 1');
  } catch (err: any) {
    console.warn('⚠️ Keepalive query falhou (pool vai reconectar):', err?.message);
  }
}, 5 * 60 * 1000); // 5 minutos

// Proteção global contra crashes por erros não tratados em Promises
process.on('unhandledRejection', (reason: any) => {
  console.error('⚠️ Unhandled Promise Rejection (não vai crashar o servidor):', reason?.message || reason);
});

// Criar instância do Drizzle ORM com o pool configurado
export const db = drizzle({ client: pool, schema });