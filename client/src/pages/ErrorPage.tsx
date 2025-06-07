import { AlertTriangle, MessageSquare, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSupportNumber } from "@/hooks/use-support-number";
import { Link } from "wouter";

interface ErrorPageProps {
  title?: string;
  message?: string;
  statusCode?: number;
}

export default function ErrorPage({ 
  title = "Algo deu errado", 
  message = "Ocorreu um erro inesperado. Nossa equipe foi notificada e está trabalhando para resolver o problema.",
  statusCode = 500 
}: ErrorPageProps) {
  const { supportNumber, whatsappUrl } = useSupportNumber();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
          <CardTitle className="text-xl font-semibold text-gray-900">
            {statusCode && <span className="text-red-600 font-mono">{statusCode} - </span>}
            {title}
          </CardTitle>
          <CardDescription className="text-gray-600">
            {message}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3">
            <Link href="/">
              <Button className="w-full" variant="default">
                <Home className="h-4 w-4 mr-2" />
                Voltar ao Início
              </Button>
            </Link>
            
            {whatsappUrl && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => window.open(`${whatsappUrl}?text=Olá, preciso de ajuda! Encontrei um erro na plataforma.`, '_blank')}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Falar com Suporte
              </Button>
            )}
          </div>
          
          {supportNumber && (
            <div className="text-center pt-4 border-t">
              <p className="text-sm text-gray-500 mb-2">Ou entre em contato via WhatsApp:</p>
              <p className="text-sm font-medium text-gray-700">{supportNumber}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}