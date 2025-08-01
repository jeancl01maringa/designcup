import { useAuth } from "@/hooks/use-auth";
import { Loader2, AlertTriangle } from "lucide-react";
import { Redirect, Route } from "wouter";

interface ProtectedRouteProps {
  path: string;
  component: () => React.JSX.Element;
  requireAdmin?: boolean;
}

export function ProtectedRoute({
  path,
  component: Component,
  requireAdmin = false,
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();

  // Exibindo o loader enquanto está verificando a autenticação
  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Route>
    );
  }

  // Redirecionando para login se não estiver autenticado
  if (!user) {
    return (
      <Route path={path}>
        <Redirect to="/loguin" />
      </Route>
    );
  }

  // Verificando permissão de administrador se necessário
  if (requireAdmin && !user.isAdmin) {
    return (
      <Route path={path}>
        <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-4 text-center">
          <AlertTriangle className="h-16 w-16 text-destructive" />
          <h1 className="text-2xl font-bold">Acesso Restrito</h1>
          <p className="max-w-md text-muted-foreground">
            Esta área é restrita apenas para administradores. Você não tem permissão para acessar esta página.
          </p>
          <a href="/" className="text-primary hover:underline mt-4">
            Voltar para a página inicial
          </a>
        </div>
      </Route>
    );
  }

  // Se passou por todas as verificações, renderiza o componente
  return <Route path={path} component={Component} />;
}