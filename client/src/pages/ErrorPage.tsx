import { AlertTriangle, Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SupportContact } from "@/components/ui/SupportContact";
import { useLocation } from "wouter";

interface ErrorPageProps {
  title?: string;
  message?: string;
  statusCode?: number;
}

export default function ErrorPage({ 
  title = "Ops! Algo deu errado",
  message = "Não conseguimos encontrar a página que você está procurando ou ocorreu um erro inesperado.",
  statusCode = 404
}: ErrorPageProps) {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
          {/* Error Icon */}
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-10 h-10 text-red-600" />
          </div>

          {/* Status Code */}
          <div className="text-6xl font-bold text-gray-300 mb-4">
            {statusCode}
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            {title}
          </h1>

          {/* Message */}
          <p className="text-gray-600 mb-8 leading-relaxed">
            {message}
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <Button
              onClick={() => navigate("/")}
              className="flex items-center gap-2 flex-1"
            >
              <Home className="w-4 h-4" />
              Voltar ao Início
            </Button>
            
            <Button
              variant="outline"
              onClick={() => window.history.back()}
              className="flex items-center gap-2 flex-1"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </Button>
          </div>

          {/* Support Contact */}
          <div className="border-t border-gray-200 pt-6">
            <p className="text-sm text-gray-500 mb-3">
              Precisa de ajuda? Entre em contato conosco:
            </p>
            <SupportContact 
              variant="outline" 
              size="sm" 
              className="w-full"
            />
          </div>
        </div>

        {/* Additional Help Text */}
        <p className="text-sm text-gray-500 mt-6">
          Se o problema persistir, nossa equipe de suporte está pronta para ajudar.
        </p>
      </div>
    </div>
  );
}