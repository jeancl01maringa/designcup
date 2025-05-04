/**
 * Script para criar diretamente uma política de exclusão (DELETE) para a tabela categorias no Supabase
 * Utilizando apenas consultas SQL simples via API REST do Supabase
 * 
 * Para executar:
 * npx tsx create-delete-policy-direct.ts
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Obtendo a URL e chave do Supabase das variáveis de ambiente
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Erro: SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY devem estar definidos nas variáveis de ambiente');
  process.exit(1);
}

console.log('URL do Supabase:', supabaseUrl);
console.log('Chave do Supabase válida:', supabaseKey.length > 0);

// Criando o cliente Supabase com a chave de serviço (role key) que tem permissões de admin
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Executa uma consulta SQL direto no Supabase
 */
async function executeSql(sql: string, params: any[] = []): Promise<any> {
  try {
    const { data, error } = await supabase.rpc('pgaudit_exec_sql', { cmd: sql, params });
    
    if (error) throw error;
    
    return data;
  } catch (error: any) {
    // Se a função pgaudit_exec_sql não existir, tentamos usar a função execute_sql
    try {
      const { data, error: execError } = await supabase.rpc('execute_sql', { sql });
      
      if (execError) throw execError;
      
      return data;
    } catch (execError: any) {
      // Se ambas falharem, tentamos fazer uma solicitação REST direta
      console.error('Erro ao executar SQL via funções RPC:', execError.message);
      
      // Como uma alternativa, vamos tentar uma consulta na tabela pg_policies
      if (sql.toLowerCase().includes('select')) {
        if (sql.toLowerCase().includes('pg_policies')) {
          const { data, error: queryError } = await supabase
            .from('pg_policies')
            .select('*');
            
          if (queryError) throw queryError;
          
          return data;
        }
      }
      
      throw new Error(`Não foi possível executar a consulta SQL: ${execError.message}`);
    }
  }
}

/**
 * Verifica se a policy já existe
 */
async function checkIfPolicyExists(): Promise<boolean> {
  try {
    // Tentando verificar diretamente via pg_policies
    const { data, error } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'categorias')
      .eq('cmd', 'DELETE');
      
    if (error) {
      console.error('Erro ao verificar policies:', error);
      // Se não conseguimos acessar pg_policies, vamos assumir que não existe
      return false;
    }
    
    return data && data.length > 0;
  } catch (error) {
    console.error('Erro ao verificar se a policy existe:', error);
    return false;
  }
}

/**
 * Cria a política de DELETE para categorias usando SQL direto
 */
async function createDeletePolicy() {
  try {
    // Verificamos primeiro se a policy já existe
    const policyExists = await checkIfPolicyExists();
    
    if (policyExists) {
      console.log('A política de DELETE para categorias já existe');
      return;
    }
    
    // Criar a política de DELETE para categorias
    console.log('Criando política de DELETE para categorias...');
    
    // Como não conseguimos verificar corretamente, vamos tentar criar diretamente
    // e tratar erros de "já existe" como sucesso
    try {
      const sql = `
        alter table public.categorias
        enable row level security;
      `;
      
      await executeSql(sql);
      console.log('RLS ativado para a tabela categorias');
    } catch (error: any) {
      if (error.message.includes('already')) {
        console.log('RLS já estava ativado para a tabela categorias');
      } else {
        throw error;
      }
    }
    
    try {
      const sql = `
        create policy "Permitir exclusão de categorias"
        on public.categorias
        for delete
        to authenticated
        using (true);
      `;
      
      await executeSql(sql);
      console.log('Política de DELETE adicionada com sucesso!');
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        console.log('Política já existia');
      } else {
        throw error;
      }
    }
    
    // Alterar chave estrangeira para ON DELETE SET NULL
    try {
      console.log('Verificando se é necessário alterar a chave estrangeira entre posts e categorias...');
      
      // Primeiro, verificamos o nome da constraint
      const constraintSql = `
        SELECT 
          tc.constraint_name 
        FROM 
          information_schema.table_constraints tc
          JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
        WHERE 
          tc.constraint_type = 'FOREIGN KEY' 
          AND tc.table_name = 'posts' 
          AND ccu.table_name = 'categorias';
      `;
      
      const constraintData = await executeSql(constraintSql);
      
      if (constraintData && constraintData.length > 0) {
        const constraintName = constraintData[0].constraint_name;
        
        console.log(`Constraint encontrada: ${constraintName}`);
        console.log('Alterando para ON DELETE SET NULL...');
        
        const alterSql = `
          ALTER TABLE public.posts 
          DROP CONSTRAINT ${constraintName},
          ADD CONSTRAINT ${constraintName} 
          FOREIGN KEY (category_id) 
          REFERENCES public.categorias(id)
          ON DELETE SET NULL;
        `;
        
        await executeSql(alterSql);
        console.log('Chave estrangeira alterada com sucesso para ON DELETE SET NULL!');
      } else {
        console.log('Não foi possível encontrar a constraint ou ela não existe');
      }
    } catch (error: any) {
      console.error('Erro ao alterar a chave estrangeira:', error.message);
    }
    
    console.log('Processo concluído com sucesso!');
    
  } catch (error: any) {
    console.error('Erro ao criar policy:', error.message);
  }
}

// Função principal para executar o script
async function main() {
  try {
    console.log('Iniciando criação de política DELETE para categorias no Supabase...');
    await createDeletePolicy();
  } catch (error: any) {
    console.error('Erro geral:', error.message);
  }
}

// Executar a função principal
main();