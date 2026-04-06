/**
 * Script para criar a tabela popups no Supabase
 * 
 * Para executar: npx tsx create-popups-table.ts
 */

import { supabase } from './server/supabase-client';

async function createPopupsTable() {
  try {
    console.log('Criando tabela popups...');

    // Criar enums primeiro
    const enumQueries = [
      `DO $$ BEGIN
        CREATE TYPE popup_target_page AS ENUM ('home', 'categories', 'art', 'plans', 'all');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;`,

      `DO $$ BEGIN
        CREATE TYPE popup_user_type AS ENUM ('free', 'premium', 'designers', 'admins', 'all');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;`,

      `DO $$ BEGIN
        CREATE TYPE popup_frequency AS ENUM ('always', 'once_per_session', 'once_per_day', 'once_per_week');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;`,

      `DO $$ BEGIN
        CREATE TYPE popup_animation AS ENUM ('fade', 'slide', 'zoom', 'bounce');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;`,

      `DO $$ BEGIN
        CREATE TYPE popup_position AS ENUM ('center', 'top', 'bottom', 'left', 'right');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;`,

      `DO $$ BEGIN
        CREATE TYPE popup_size AS ENUM ('small', 'medium', 'large');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;`
    ];

    for (const query of enumQueries) {
      const { error } = await supabase.rpc('exec_sql', { sql: query });
      if (error) {
        console.log('Enum already exists or created:', error.message);
      }
    }

    // Criar tabela popups
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS public.popups (
        id SERIAL PRIMARY KEY,
        title TEXT,
        content TEXT,
        image_url TEXT,
        button_text TEXT,
        button_url TEXT,
        
        -- Appearance settings
        background_color TEXT DEFAULT '#ffffff',
        text_color TEXT DEFAULT '#000000',
        button_color TEXT DEFAULT '#1f4ed8',
        button_text_color TEXT DEFAULT '#ffffff',
        border_radius INTEGER DEFAULT 8,
        button_width TEXT DEFAULT 'auto',
        animation popup_animation DEFAULT 'fade',
        position popup_position DEFAULT 'center',
        size popup_size DEFAULT 'medium',
        delay_seconds INTEGER DEFAULT 3,
        
        -- Targeting settings
        target_pages popup_target_page[] DEFAULT ARRAY['all']::popup_target_page[],
        target_user_types popup_user_type[] DEFAULT ARRAY['all']::popup_user_type[],
        start_date TIMESTAMP WITH TIME ZONE,
        end_date TIMESTAMP WITH TIME ZONE,
        frequency popup_frequency DEFAULT 'once_per_session',
        
        -- Status
        is_active BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      -- Adicionar políticas RLS
      ALTER TABLE public.popups ENABLE ROW LEVEL SECURITY;
      
      -- Política para administradores poderem ver todos os popups
      CREATE POLICY "Admins can view all popups" ON public.popups
        FOR SELECT USING (
          EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() AND users.is_admin = true
          )
        );
      
      -- Política para administradores poderem criar popups
      CREATE POLICY "Admins can insert popups" ON public.popups
        FOR INSERT WITH CHECK (
          EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() AND users.is_admin = true
          )
        );
      
      -- Política para administradores poderem atualizar popups
      CREATE POLICY "Admins can update popups" ON public.popups
        FOR UPDATE USING (
          EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() AND users.is_admin = true
          )
        );
      
      -- Política para administradores poderem deletar popups
      CREATE POLICY "Admins can delete popups" ON public.popups
        FOR DELETE USING (
          EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() AND users.is_admin = true
          )
        );
      
      -- Índices para melhorar performance
      CREATE INDEX IF NOT EXISTS idx_popups_is_active ON public.popups(is_active);
      CREATE INDEX IF NOT EXISTS idx_popups_start_date ON public.popups(start_date);
      CREATE INDEX IF NOT EXISTS idx_popups_end_date ON public.popups(end_date);
      CREATE INDEX IF NOT EXISTS idx_popups_target_pages ON public.popups USING GIN(target_pages);
      CREATE INDEX IF NOT EXISTS idx_popups_target_user_types ON public.popups USING GIN(target_user_types);
    `;

    const { error } = await supabase.rpc('exec_sql', { sql: createTableQuery });

    if (error) {
      console.error('Erro ao criar tabela popups:', error);
      throw error;
    }

    console.log('Tabela popups criada com sucesso!');

    // Inserir um popup de exemplo
    const { data: samplePopup, error: insertError } = await supabase
      .from('popups')
      .insert({
        title: 'Bem-vindo ao Designcup!',
        content: 'Descubra milhares de templates profissionais para sua clínica de estética. Comece sua avaliação gratuita hoje mesmo!',
        button_text: 'Começar Agora',
        button_url: '/plans',
        background_color: '#ffffff',
        text_color: '#1f2937',
        button_color: '#1f4ed8',
        button_text_color: '#ffffff',
        border_radius: 12,
        animation: 'fade',
        position: 'center',
        size: 'medium',
        delay_seconds: 3,
        target_pages: ['home'],
        target_user_types: ['free'],
        frequency: 'once_per_session',
        is_active: false
      })
      .select()
      .single();

    if (insertError) {
      console.error('Erro ao inserir popup de exemplo:', insertError);
    } else {
      console.log('Popup de exemplo criado:', samplePopup?.id);
    }

  } catch (error) {
    console.error('Erro geral:', error);
    throw error;
  }
}

// Executar o script
createPopupsTable()
  .then(() => {
    console.log('Script concluído com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script falhou:', error);
    process.exit(1);
  });