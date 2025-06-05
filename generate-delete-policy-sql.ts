/**
 * Script para gerar os comandos SQL necessários para:
 * 1. Ativar RLS na tabela categorias
 * 2. Criar uma política DELETE para categorias
 * 3. Configurar a chave estrangeira para ON DELETE SET NULL
 * 
 * Estes comandos devem ser executados manualmente no SQL Editor do Supabase
 * 
 * Para executar:
 * npx tsx generate-delete-policy-sql.ts
 */

// Função que gera os comandos SQL
function generateSql() {
  console.log(`
-----------------------------------------------------
INSTRUÇÕES PARA CONFIGURAR POLÍTICAS DE EXCLUSÃO NO SUPABASE
-----------------------------------------------------

Acesse o painel do Supabase > SQL Editor e execute os seguintes comandos
um a um, verificando o resultado de cada operação:

---------------------------------------
1. Primeiro, ative o RLS na tabela categorias:
---------------------------------------

ALTER TABLE public.categorias 
ENABLE ROW LEVEL SECURITY;

---------------------------------------
2. Crie uma política que permita a exclusão de categorias:
---------------------------------------

CREATE POLICY "Permitir exclusão de categorias"
ON public.categorias
FOR DELETE
TO authenticated
USING (true);

---------------------------------------
3. Configure a chave estrangeira entre posts e categorias para SET NULL:
---------------------------------------

-- Primeiro, verifique o nome da constraint
SELECT 
  tc.constraint_name 
FROM 
  information_schema.table_constraints tc
  JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
WHERE 
  tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'posts' 
  AND ccu.table_name = 'categorias';

-- Em seguida, use o nome da constraint para alterar a regra de exclusão
-- Substitua "nome_da_constraint" pelo nome real obtido acima
ALTER TABLE public.posts 
DROP CONSTRAINT nome_da_constraint,
ADD CONSTRAINT nome_da_constraint 
FOREIGN KEY (category_id) 
REFERENCES public.categorias(id)
ON DELETE SET NULL;

---------------------------------------
Após executar esses comandos, tente excluir uma categoria pelo painel
administrativo. A categoria deverá ser excluída com sucesso.
-----------------------------------------------------
`);
}

// Executar a função geradora
generateSql();