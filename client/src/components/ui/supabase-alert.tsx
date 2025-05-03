import React from 'react';
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SupabaseAlertProps {
  supabaseUrl?: string;
}

/**
 * Alerta que mostra informações sobre como configurar o bucket e as políticas RLS do Supabase
 */
export function SupabaseRLSAlert({ supabaseUrl }: SupabaseAlertProps) {
  const cleanSupabaseUrl = supabaseUrl?.replace(/\.supabase\.co.*/, '.supabase.co') || '';
  const supabaseUrlBase = cleanSupabaseUrl ? `https://${cleanSupabaseUrl}` : 'https://app.supabase.com';
  
  return (
    <Alert className="my-4 border-amber-300 bg-amber-50">
      <AlertTriangle className="h-4 w-4 text-amber-600" />
      <AlertTitle className="text-amber-800 font-medium">
        Configuração do Supabase Storage necessária
      </AlertTitle>
      <AlertDescription className="text-amber-700 mt-2">
        <p className="mb-2">
          As imagens não estão sendo salvas no Supabase devido a configurações de segurança.
          Você precisa configurar as políticas de acesso (RLS) do bucket no painel do Supabase:
        </p>
        
        <ol className="list-decimal pl-5 space-y-1 mb-3 text-sm">
          <li>Acesse o painel do Supabase e vá para a seção "Storage"</li>
          <li>Crie um bucket chamado "images" se ainda não existir</li>
          <li>Acesse o bucket e clique na aba "Policies"</li>
          <li>Adicione políticas para permitir acesso público e upload</li>
        </ol>
        
        <div className="text-sm mt-3 border border-amber-200 p-2 bg-amber-100 rounded">
          <p className="font-semibold mb-1">Política de exemplo (upload):</p>
          <pre className="whitespace-pre-wrap text-xs bg-white p-1 rounded">
            {`CREATE POLICY "Public Upload" 
ON storage.objects
FOR INSERT 
TO authenticated
WITH CHECK (true);`}
          </pre>
          
          <p className="font-semibold mb-1 mt-2">Política de exemplo (acesso público):</p>
          <pre className="whitespace-pre-wrap text-xs bg-white p-1 rounded">
            {`CREATE POLICY "Public Access" 
ON storage.objects
FOR SELECT 
TO public
USING (true);`}
          </pre>
        </div>
        
        <div className="mt-3">
          <Button 
            size="sm" 
            variant="outline" 
            className="text-amber-700 border-amber-300 hover:bg-amber-100"
            onClick={() => window.open(`${supabaseUrlBase}/project/storage/buckets`, '_blank')}
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            Abrir Painel Supabase
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}