-- Script SQL completo para resolver o problema de exclusão de categorias
-- Copie e cole este script completo no SQL Editor do Supabase

-- 1. Verificar se a tabela categorias existe antes de aplicar as alterações
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'categorias'
  ) THEN
    -- 2. Habilitar RLS na tabela categorias
    ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
    
    -- 3. Verificar se a política de exclusão já existe, e criar se não existir
    IF NOT EXISTS (
      SELECT FROM pg_policies 
      WHERE tablename = 'categorias' 
      AND operation = 'DELETE'
    ) THEN
      CREATE POLICY "Permitir exclusão de categorias"
      ON public.categorias
      FOR DELETE
      TO authenticated
      USING (true);
      
      RAISE NOTICE 'Política de DELETE criada com sucesso para a tabela categorias';
    ELSE
      RAISE NOTICE 'Política de DELETE já existe para a tabela categorias';
    END IF;
    
    -- 4. Verificar e configurar chave estrangeira
    IF EXISTS (
      SELECT 
        tc.constraint_name 
      FROM 
        information_schema.table_constraints tc
        JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
      WHERE 
        tc.constraint_type = 'FOREIGN KEY' 
        AND tc.table_name = 'posts' 
        AND ccu.table_name = 'categorias'
    ) THEN
      -- Obter nome da constraint
      CREATE TEMP TABLE IF NOT EXISTS temp_constraint AS
      SELECT 
        tc.constraint_name,
        rc.delete_rule
      FROM 
        information_schema.table_constraints tc
        JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
        JOIN information_schema.referential_constraints rc ON tc.constraint_name = rc.constraint_name
      WHERE 
        tc.constraint_type = 'FOREIGN KEY' 
        AND tc.table_name = 'posts' 
        AND ccu.table_name = 'categorias';
        
      -- Verificar se a constraint precisa ser alterada para ON DELETE SET NULL
      DO $$
      DECLARE
        v_constraint_name text;
        v_delete_rule text;
      BEGIN
        SELECT constraint_name, delete_rule INTO v_constraint_name, v_delete_rule FROM temp_constraint LIMIT 1;
        
        IF v_constraint_name IS NOT NULL THEN
          IF v_delete_rule != 'SET NULL' THEN
            -- Alterar a constraint para ON DELETE SET NULL
            EXECUTE format('
              ALTER TABLE public.posts 
              DROP CONSTRAINT %I,
              ADD CONSTRAINT %I
              FOREIGN KEY (category_id) 
              REFERENCES public.categorias(id)
              ON DELETE SET NULL',
              v_constraint_name, v_constraint_name
            );
            
            RAISE NOTICE 'Chave estrangeira % alterada com sucesso para ON DELETE SET NULL', v_constraint_name;
          ELSE
            RAISE NOTICE 'Chave estrangeira % já está configurada com ON DELETE SET NULL', v_constraint_name;
          END IF;
        ELSE
          RAISE NOTICE 'Nenhuma chave estrangeira encontrada entre posts e categorias';
        END IF;
      END $$;
      
      -- Limpar tabela temporária
      DROP TABLE IF EXISTS temp_constraint;
    ELSE
      RAISE NOTICE 'Nenhuma chave estrangeira encontrada entre posts e categorias';
    END IF;
    
    RAISE NOTICE 'Configuração concluída com sucesso!';
  ELSE
    RAISE NOTICE 'A tabela categorias não existe no banco de dados.';
  END IF;
END $$;