import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Configuração do websocket para o Neon Database
neonConfig.webSocketConstructor = ws;
// Configurar um timeout maior para conexões de WebSocket
neonConfig.wsConnectionTimeout = 30000; // 30 segundos
// Configurar tentativas de reconexão
neonConfig.wsReconnectDelay = 500; // 500ms entre tentativas

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
  connectionTimeoutMillis: 10000 // Tempo máximo para estabelecer uma conexão
});

// Configurar evento para monitorar erros nas conexões do pool
pool.on('error', (err, client) => {
  console.error('Erro inesperado no cliente do pool:', err);
});

// Criar instância do Drizzle ORM com o pool configurado
export const db = drizzle({ client: pool, schema });