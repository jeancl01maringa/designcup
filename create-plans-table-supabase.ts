/**
 * Script para criar a tabela plans no Supabase
 * 
 * Para executar: npx tsx create-plans-table-supabase.ts
 */

import { supabase } from './server/supabase-client';

async function createPlansTableSupabase() {
  try {
    console.log('Verificando se a tabela plans existe no Supabase...');
    
    // Primeiro, vamos tentar usar a tabela plans para verificar se ela existe
    const { error: testError } = await supabase
      .from('plans')
      .select('id')
      .limit(1);
    
    if (!testError) {
      console.log('Tabela plans já existe no Supabase. Pulando criação.');
      return;
    }
    
    console.log('Tabela plans não existe. Tentando criar via Supabase API...');
    
    // Criar dados de exemplo para a tabela plans
    const { error } = await supabase
      .from('plans')
      .insert([
        {
          name: 'Plano Teste',
          periodo: 'Mensal',
          valor: '0,00',
          is_active: false,
          is_principal: false,
          is_gratuito: true,
          beneficios: 'Plano de teste para verificar criação da tabela'
        }
      ]);
    
    if (error) {
      console.error('Erro ao criar tabela plans via API:', error);
      console.log('Tabela plans não pôde ser criada automaticamente via Supabase API.');
      console.log('Você precisará criar manualmente esta tabela no painel do Supabase SQL Editor com a seguinte estrutura:');
      console.log(`
CREATE TABLE IF NOT EXISTS public.plans (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  periodo TEXT NOT NULL, 
  valor TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_principal BOOLEAN NOT NULL DEFAULT FALSE,
  is_gratuito BOOLEAN NOT NULL DEFAULT FALSE,
  codigo_hotmart TEXT,
  url_hotmart TEXT,
  beneficios TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Configurar permissões de acesso (opcional)
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

-- Criar políticas de acesso (opcional)
CREATE POLICY "Permitir leitura pública de planos ativos" ON public.plans
  FOR SELECT
  USING (is_active = true);
  
CREATE POLICY "Permitir todas as operações por usuários autenticados" ON public.plans
  FOR ALL
  USING (auth.role() = 'authenticated');
      `);
    } else {
      console.log('Tabela plans criada com sucesso via API do Supabase!');
      
      // Verifica se os dados foram inseridos
      const { data: checkData, error: checkError } = await supabase
        .from('plans')
        .select('*')
        .limit(5);
        
      if (!checkError && checkData) {
        console.log('Verificação: Tabela plans existe e contém dados:');
        console.log(checkData);
      }
    }
  } catch (error) {
    console.error('Erro ao verificar/criar tabela plans no Supabase:', error);
    throw error;
  }
}

// Executa a função principal
createPlansTableSupabase()
  .then(() => {
    console.log('Script executado com sucesso!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Erro ao executar script:', error);
    process.exit(1);
  });