import React from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { 
  Home, 
  FileText, 
  Settings, 
  LogOut, 
  Menu, 
  ChevronLeft,
  Users,
  FolderOpen,
  LayoutTemplate,
  FileType,
  Database
} from "lucide-react";
import { cn } from "@/lib/utils";
import { User } from "@shared/schema";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  currentPath: string;
  userData: User | null;
}

export function Sidebar({ isOpen, onToggle, currentPath, userData }: SidebarProps) {
  // Função para verificar se um item de menu está ativo
  const isActive = (path: string) => {
    return currentPath === path || currentPath.startsWith(`${path}/`);
  };

  // Itens do menu da sidebar com seus respectivos ícones e caminhos
  const menuItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      path: "/admin",
      icon: <Home className="h-4 w-4" />,
    },
    {
      id: "postagens",
      label: "Postagens",
      path: "/admin/postagens",
      icon: <FileText className="h-4 w-4" />,
    },
    {
      id: "categorias",
      label: "Categorias",
      path: "/admin/categorias",
      icon: <FolderOpen className="h-4 w-4" />,
    },
    {
      id: "planos",
      label: "Planos",
      path: "/admin/planos",
      icon: <LayoutTemplate className="h-4 w-4" />,
      separator: true,
    },
    {
      id: "gerenciamento",
      label: "Gerenciamento",
      path: "/admin/gerenciamento",
      icon: <Database className="h-4 w-4" />,
      separator: false,
    },
    {
      id: "usuarios",
      label: "Usuários",
      path: "/admin/gerenciamento/usuarios",
      icon: <Users className="h-4 w-4" />,
    },
    {
      id: "formatos",
      label: "Formatos de Arquivo",
      path: "/admin/gerenciamento/formatos",
      icon: <FileType className="h-4 w-4" />,
      separator: true,
    },
    {
      id: "configuracoes",
      label: "Configurações",
      path: "/admin/configuracoes",
      icon: <Settings className="h-4 w-4" />,
    },
  ];

  return (
    <>
      {/* Overlay para dispositivos móveis */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={onToggle}
        />
      )}
      
      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed z-50 flex flex-col h-full bg-background border-r transition-all duration-300 ease-in-out",
          isOpen 
            ? "w-60 left-0" 
            : "w-0 -left-full md:left-0 md:w-16"
        )}
      >
        <div className="h-full flex flex-col overflow-hidden">
          {/* Cabeçalho da sidebar */}
          <div className="p-4 border-b flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Logo/Ícone */}
              <div className="flex-shrink-0 text-primary font-bold">
                {isOpen ? "Design para Estética" : "DE"}
              </div>
            </div>
            
            {/* Botão para recolher a sidebar */}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onToggle}
              className="h-6 w-6"
            >
              {isOpen ? <ChevronLeft className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
          </div>
          
          {/* Perfil do usuário */}
          <div className={cn(
            "flex items-center gap-3 p-4 border-b",
            !isOpen && "justify-center"
          )}>
            <Avatar className="h-8 w-8">
              <AvatarImage src="" alt={userData?.username || "Admin"} />
              <AvatarFallback>
                {userData?.username?.slice(0, 2)?.toUpperCase() || "AD"}
              </AvatarFallback>
            </Avatar>
            
            {isOpen && (
              <div className="overflow-hidden">
                <p className="text-sm font-medium truncate">
                  {userData?.username || "Admin"}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {userData?.email || "admin@example.com"}
                </p>
              </div>
            )}
          </div>
          
          {/* Links de navegação */}
          <nav className="flex-1 overflow-y-auto py-4 px-2">
            <ul className="space-y-1">
              {menuItems.map((item) => (
                <li key={item.id}>
                  <Link href={item.path}>
                    <Button
                      variant={isActive(item.path) ? "default" : "ghost"}
                      className={cn(
                        "w-full justify-start",
                        isActive(item.path) ? "bg-primary/10 text-primary hover:bg-primary/15" : "",
                        !isOpen && "md:justify-center"
                      )}
                      size="sm"
                    >
                      <span className={cn(
                        "mr-2",
                        isActive(item.path) ? "text-primary" : "text-muted-foreground",
                        !isOpen && "md:mr-0"
                      )}>
                        {item.icon}
                      </span>
                      {isOpen && <span>{item.label}</span>}
                    </Button>
                  </Link>
                  {item.separator && (
                    <div>
                      {isOpen && <Separator className="my-4" />}
                      {!isOpen && <div className="my-4" />}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </nav>
          
          {/* Rodapé da sidebar */}
          <div className="p-4 mt-auto">
            {isOpen && (
              <div className="text-xs text-center text-muted-foreground">
                <p>Design para Estética</p>
                <p className="mt-1">v1.0.0</p>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}