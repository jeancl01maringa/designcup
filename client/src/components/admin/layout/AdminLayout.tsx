import React, { useState } from "react";
import { useLocation } from "wouter";
import { Sidebar } from "./Sidebar";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { useMediaQuery } from "@/hooks/use-media-query";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const { user, isLoading } = useAuth();
  const [location] = useLocation();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);

  // Verificar se o usuário é administrador
  const isAdmin = user?.isAdmin === true;

  // Mostrar tela de carregamento enquanto verificamos a autenticação
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary/70" />
      </div>
    );
  }

  // Se não for administrador, mostrar mensagem de acesso negado
  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold mb-2">Acesso Restrito</h1>
        <p className="text-muted-foreground mb-6">
          Você não tem permissão para acessar esta área.
        </p>
        <a href="/" className="text-primary hover:underline">
          Voltar para a página inicial
        </a>
      </div>
    );
  }

  // Renderizar o layout do painel admin
  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onToggle={() => setSidebarOpen(!sidebarOpen)} 
        currentPath={location}
        userData={user}
      />

      {/* Conteúdo principal */}
      <main className={`flex-1 transition-all duration-200 ${sidebarOpen ? 'md:ml-60' : 'ml-0'}`}>
        <div className="p-4 md:p-6 max-w-[1600px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}