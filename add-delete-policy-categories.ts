/**
 * Script para adicionar uma política de exclusão (DELETE) para a tabela categorias no Supabase
 * 
 * Este script verifica se RLS está ativado e adiciona uma policy que permite a exclusão de categorias
 * 
 * Para executar:
 * npx tsx add-delete-policy-categories.ts
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

// Criando o cliente Supabase com a chave de serviço (role key) que tem permissões de admin
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAndAddDeletePolicy() {
  try {
    console.log('Verificando a tabela categorias no Supabase...');
    
    // Verificar se a tabela existe e tem RLS ativado
    const { data: tableInfo, error: tableError } = await supabase
      .rpc('get_table_info', { target_table: 'categorias' });
      
    if (tableError) {
      console.error('Erro ao verificar a tabela:', tableError);
      return;
    }
    
    if (!tableInfo || tableInfo.length === 0) {
      console.error('A tabela categorias não foi encontrada');
      return;
    }
    
    const table = tableInfo[0];
    console.log(`Tabela categorias encontrada. RLS ativado: ${table.rls_enabled}`);
    
    // Verificar se já existe uma política de DELETE
    const { data: policies, error: policiesError } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'categorias')
      .eq('cmd', 'DELETE');
      
    if (policiesError) {
      console.error('Erro ao verificar as políticas:', policiesError);
      return;
    }
    
    if (policies && policies.length > 0) {
      console.log('Já existe uma política de DELETE para a tabela categorias:');
      policies.forEach(policy => {
        console.log(`- ${policy.policyname}: ${policy.qual}`);
      });
    } else {
      console.log('Nenhuma política de DELETE encontrada para a tabela categorias');
      
      // Adicionar política de DELETE
      console.log('Adicionando política de DELETE...');
      
      // Utilizando SQL diretamente para adicionar a política
      const { error: createPolicyError } = await supabase
        .rpc('execute_sql', {
          sql: `
            create policy "Permitir exclusão de categorias"
            on public.categorias
            for delete
            to authenticated
            using (true);
          `
        });
        
      if (createPolicyError) {
        console.error('Erro ao criar a política:', createPolicyError);
        return;
      }
      
      console.log('Política de DELETE adicionada com sucesso!');
    }
    
    // Verificar a configuração da chave estrangeira entre posts e categorias
    console.log('Verificando a chave estrangeira entre posts e categorias...');
    
    const { data: fkData, error: fkError } = await supabase
      .rpc('execute_sql', {
        sql: `
          SELECT tc.constraint_name, 
                 tc.table_name, 
                 kcu.column_name, 
                 ccu.table_name AS foreign_table_name, 
                 ccu.column_name AS foreign_column_name,
                 rc.delete_rule
          FROM information_schema.table_constraints AS tc 
          JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
          JOIN information_schema.constraint_column_usage AS ccu 
            ON ccu.constraint_name = tc.constraint_name
          JOIN information_schema.referential_constraints AS rc
            ON rc.constraint_name = tc.constraint_name
          WHERE tc.constraint_type = 'FOREIGN KEY' 
            AND ccu.table_name = 'categorias'
            AND tc.table_name = 'posts';
        `
      });
    
    if (fkError) {
      console.error('Erro ao verificar a chave estrangeira:', fkError);
      return;
    }
    
    if (fkData && fkData.result && fkData.result.length > 0) {
      const fk = fkData.result[0];
      console.log(`Chave estrangeira encontrada: ${fk.constraint_name}`);
      console.log(`Regra de exclusão atual: ${fk.delete_rule}`);
      
      if (fk.delete_rule === 'RESTRICT' || fk.delete_rule === 'NO ACTION') {
        console.log('Atualizando a regra de exclusão para SET NULL...');
        
        // Obtém o nome da constraint
        const constraintName = fk.constraint_name;
        
        // Altera a chave estrangeira para ON DELETE SET NULL
        const { error: alterFkError } = await supabase
          .rpc('execute_sql', {
            sql: `
              ALTER TABLE public.posts 
              DROP CONSTRAINT ${constraintName},
              ADD CONSTRAINT ${constraintName} 
              FOREIGN KEY (category_id) 
              REFERENCES public.categorias(id)
              ON DELETE SET NULL;
            `
          });
          
        if (alterFkError) {
          console.error('Erro ao alterar a chave estrangeira:', alterFkError);
          return;
        }
        
        console.log('Chave estrangeira alterada com sucesso para ON DELETE SET NULL!');
      } else if (fk.delete_rule === 'SET NULL') {
        console.log('A chave estrangeira já está configurada com ON DELETE SET NULL');
      } else {
        console.log(`A chave estrangeira tem uma regra de exclusão diferente: ${fk.delete_rule}`);
      }
    } else {
      console.log('Nenhuma chave estrangeira encontrada entre posts e categorias');
    }
    
    console.log('Verificação e ajustes concluídos com sucesso!');
    
  } catch (error) {
    console.error('Erro inesperado:', error);
  }
}

// Executar a função principal
checkAndAddDeletePolicy();