/**
 * Script para criar uma política de exclusão (DELETE) para a tabela categorias
 * usando conexão direta com o PostgreSQL
 * 
 * Para executar:
 * npx tsx create-delete-policy-postgres.ts
 */

import { Pool } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

// Obtendo a URL de conexão do banco de dados das variáveis de ambiente
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('Erro: DATABASE_URL deve estar definida nas variáveis de ambiente');
  process.exit(1);
}

console.log('URL do banco de dados disponível');

// Criando o pool de conexão com o PostgreSQL
const pool = new Pool({ connectionString: databaseUrl });

/**
 * Executa uma consulta SQL diretamente no PostgreSQL
 */
async function executeSql(query: string, params: any[] = []): Promise<any> {
  const client = await pool.connect();
  try {
    const result = await client.query(query, params);
    return result.rows;
  } finally {
    client.release();
  }
}

/**
 * Verifica se a política já existe
 */
async function checkIfPolicyExists(): Promise<boolean> {
  try {
    const query = `
      SELECT *
      FROM pg_policies
      WHERE tablename = 'categorias'
        AND cmd = 'DELETE';
    `;
    
    const result = await executeSql(query);
    return result && result.length > 0;
  } catch (error) {
    console.error('Erro ao verificar se a policy existe:', error);
    return false;
  }
}

/**
 * Verifica a configuração atual da chave estrangeira
 */
async function checkForeignKeyConfig(): Promise<string | null> {
  try {
    const query = `
      SELECT rc.delete_rule, tc.constraint_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.constraint_column_usage ccu 
        ON ccu.constraint_name = tc.constraint_name
      JOIN information_schema.referential_constraints rc
        ON rc.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = 'posts'
        AND ccu.table_name = 'categorias';
    `;
    
    const result = await executeSql(query);
    
    if (result && result.length > 0) {
      return result[0];
    }
    
    return null;
  } catch (error) {
    console.error('Erro ao verificar a configuração da chave estrangeira:', error);
    return null;
  }
}

/**
 * Cria a política de DELETE para categorias
 */
async function createDeletePolicy() {
  try {
    // Verificar se o RLS está ativado
    const rlsQuery = `
      SELECT relrowsecurity
      FROM pg_class
      WHERE oid = 'public.categorias'::regclass;
    `;
    
    let rlsEnabled = false;
    try {
      const rlsResult = await executeSql(rlsQuery);
      rlsEnabled = rlsResult && rlsResult.length > 0 && rlsResult[0].relrowsecurity;
    } catch (error) {
      console.warn('Não foi possível verificar o status do RLS:', error);
    }
    
    console.log(`RLS está ${rlsEnabled ? 'ativado' : 'desativado'} para a tabela categorias`);
    
    // Ativar RLS se necessário
    if (!rlsEnabled) {
      console.log('Ativando RLS para a tabela categorias...');
      try {
        await executeSql(`
          ALTER TABLE public.categorias
          ENABLE ROW LEVEL SECURITY;
        `);
        console.log('RLS ativado com sucesso');
      } catch (error) {
        console.error('Erro ao ativar RLS:', error);
      }
    }
    
    // Verificar se a política já existe
    const policyExists = await checkIfPolicyExists();
    
    if (policyExists) {
      console.log('A política de DELETE para categorias já existe');
    } else {
      console.log('Criando política de DELETE para categorias...');
      
      try {
        await executeSql(`
          CREATE POLICY "Permitir exclusão de categorias"
          ON public.categorias
          FOR DELETE
          TO authenticated
          USING (true);
        `);
        console.log('Política de DELETE criada com sucesso');
      } catch (error: any) {
        if (error.message?.includes('already exists')) {
          console.log('Política já existia');
        } else {
          console.error('Erro ao criar a política:', error);
        }
      }
    }
    
    // Verificar a configuração da chave estrangeira
    const fkConfig = await checkForeignKeyConfig();
    
    if (fkConfig) {
      console.log(`Configuração atual da chave estrangeira: ${fkConfig.constraint_name}, DELETE RULE: ${fkConfig.delete_rule}`);
      
      if (fkConfig.delete_rule === 'RESTRICT' || fkConfig.delete_rule === 'NO ACTION') {
        console.log('Alterando a configuração da chave estrangeira para ON DELETE SET NULL...');
        
        try {
          await executeSql(`
            ALTER TABLE public.posts
            DROP CONSTRAINT ${fkConfig.constraint_name},
            ADD CONSTRAINT ${fkConfig.constraint_name}
            FOREIGN KEY (category_id)
            REFERENCES public.categorias(id)
            ON DELETE SET NULL;
          `);
          console.log('Chave estrangeira alterada com sucesso para ON DELETE SET NULL');
        } catch (error) {
          console.error('Erro ao alterar a chave estrangeira:', error);
        }
      } else if (fkConfig.delete_rule === 'SET NULL') {
        console.log('A chave estrangeira já está configurada com ON DELETE SET NULL');
      } else {
        console.log(`A chave estrangeira tem uma regra de exclusão diferente: ${fkConfig.delete_rule}`);
      }
    } else {
      console.log('Nenhuma chave estrangeira encontrada entre posts e categorias');
    }
    
  } catch (error) {
    console.error('Erro ao criar política ou configurar chave estrangeira:', error);
    throw error;
  }
}

/**
 * Função principal que executa o script
 */
async function main() {
  try {
    console.log('Iniciando configuração de política DELETE para categorias...');
    await createDeletePolicy();
    console.log('Configuração concluída com sucesso');
  } catch (error) {
    console.error('Erro geral:', error);
  } finally {
    // Fechar o pool de conexões
    await pool.end();
  }
}

// Executar a função principal
main();