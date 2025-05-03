import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ExternalLink } from '@/components/ui/external-link';
import { CheckCircle2, AlertTriangle, Copy, ExternalLink as ExternalLinkIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { SiSupabase } from 'react-icons/si';

interface SupabaseRLSAlertProps {
  supabaseUrl: string;
}

export function SupabaseRLSAlert({ supabaseUrl }: SupabaseRLSAlertProps) {
  // Verificar se o URL do Supabase é válido
  const isValidUrl = /^https?:\/\/.+\.supabase\.co/.test(supabaseUrl);
  
  // Obter URL do painel de administração
  let dashboardUrl = '';
  if (isValidUrl) {
    const baseUrl = supabaseUrl.replace(/^(https?:\/\/)/, '').split('.')[0];
    dashboardUrl = `https://app.supabase.com/project/${baseUrl}/storage/buckets`;
  }
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('Código copiado para a área de transferência');
    });
  };
  
  const bucketPolicyCode = `// Para criar uma política que permite leitura pública e escrita autenticada:

// 1. Política para leitura pública (SELECT)
CREATE POLICY "Permitir leitura pública" ON storage.objects
  FOR SELECT TO anon
  USING (bucket_id = 'images');

// 2. Política para upload autenticado (INSERT)
CREATE POLICY "Permitir upload para usuários autenticados" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'images');

// 3. Política para permitir que usuários atualizem seus próprios uploads (UPDATE)
CREATE POLICY "Permitir atualização dos próprios uploads" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'images' AND auth.uid() = owner);

// 4. Política para permitir que usuários excluam seus próprios uploads (DELETE)
CREATE POLICY "Permitir exclusão dos próprios uploads" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'images' AND auth.uid() = owner);`;

  if (!isValidUrl) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Configuração do Supabase incompleta</AlertTitle>
        <AlertDescription>
          O URL do Supabase não foi configurado corretamente. Verifique a variável de ambiente VITE_SUPABASE_URL.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert variant="default" className="mb-6 border-amber-300 bg-amber-50">
      <div className="flex-shrink-0 mr-2">
        <SiSupabase className="h-4 w-4 text-amber-600" />
      </div>
      <AlertTitle className="text-amber-800">Configuração do Supabase necessária</AlertTitle>
      <AlertDescription className="mt-2">
        <p className="mb-2 text-amber-700">
          Algumas operações de upload estão falhando devido a políticas de segurança do Supabase. 
          Para resolver isso, você precisa configurar as políticas de Row Level Security (RLS) para o bucket de imagens.
        </p>
        
        <Accordion type="single" collapsible className="mt-4">
          <AccordionItem value="instructions">
            <AccordionTrigger className="text-amber-800 hover:no-underline hover:text-amber-700">
              <span className="text-left">Instruções passo a passo</span>
            </AccordionTrigger>
            <AccordionContent>
              <ol className="list-decimal space-y-3 ml-5 mt-2 text-amber-700">
                <li>
                  Acesse o painel do Supabase{' '}
                  <ExternalLink 
                    href={dashboardUrl}
                    className="text-blue-600 hover:underline inline-flex items-center"
                  >
                    <span>Dashboard do Supabase</span>
                    <ExternalLinkIcon className="ml-1 h-3 w-3" />
                  </ExternalLink>
                </li>
                <li>Navegue até "Storage" → "Buckets"</li>
                <li>Crie um bucket chamado "images" se ainda não existir</li>
                <li>Selecione o bucket "images" e clique na aba "Policies"</li>
                <li>
                  Adicione as seguintes políticas RLS:
                  <div className="bg-slate-800 text-slate-100 p-3 rounded-md mt-2 relative">
                    <pre className="text-xs overflow-x-auto whitespace-pre-wrap">
                      {bucketPolicyCode}
                    </pre>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2 h-8 w-8 p-0 text-slate-300 hover:text-white hover:bg-slate-700"
                      onClick={() => copyToClipboard(bucketPolicyCode)}
                    >
                      <Copy className="h-4 w-4" />
                      <span className="sr-only">Copiar código</span>
                    </Button>
                  </div>
                </li>
                <li>Depois de configurar as políticas, tente fazer upload novamente</li>
              </ol>
              
              <div className="bg-amber-100 border border-amber-200 rounded-md p-3 mt-4">
                <h4 className="text-amber-800 font-medium flex items-center text-sm">
                  <CheckCircle2 className="h-4 w-4 mr-2 text-amber-600" />
                  Dica rápida
                </h4>
                <p className="text-amber-700 text-sm mt-1">
                  Como alternativa às políticas SQL acima, você pode usar a interface do Supabase para:
                </p>
                <ul className="list-disc ml-5 mt-2 text-sm text-amber-700">
                  <li>Selecionar "Get all objects" em "Access Control Templates"</li>
                  <li>Configurar "SELECT" como "public" para permitir leitura pública</li>
                  <li>Configurar "INSERT", "UPDATE" e "DELETE" como "authenticated" para acesso autenticado</li>
                </ul>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </AlertDescription>
    </Alert>
  );
}

export function ImageUploadAlert() {
  return (
    <Alert variant="default" className="my-4 bg-blue-50 border-blue-200">
      <div className="flex items-start">
        <CheckCircle2 className="h-5 w-5 text-blue-500 mt-0.5 mr-2" />
        <div>
          <AlertTitle className="text-blue-800">Práticas recomendadas para upload</AlertTitle>
          <AlertDescription className="text-blue-700 mt-1">
            <p>
              Para evitar problemas com o upload de imagens no Supabase, siga estas práticas:
            </p>
            <ul className="list-disc ml-5 mt-2 space-y-1">
              <li>Verifique se a autenticação está funcionando corretamente antes de fazer upload</li>
              <li>Use caminhos de arquivo consistentes como <code>posts/[ID_UNICO]/[NOME_ARQUIVO]</code></li>
              <li>Evite nomes de arquivo muito longos ou com caracteres especiais</li>
              <li>Certifique-se de que as políticas RLS estão configuradas corretamente</li>
            </ul>
          </AlertDescription>
        </div>
      </div>
    </Alert>
  );
}