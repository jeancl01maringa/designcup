import React from "react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { User } from "@shared/schema";
import { 
  ChevronLeft, 
  LayoutDashboard, 
  Tag, 
  CreditCard, 
  FileType, 
  LayoutTemplate,
  Upload, 
  Settings, 
  DollarSign, 
  GraduationCap, 
  Globe, 
  Webhook, 
  code as CodeIcon,
  Menu
} from "lucide-react";

// Definir os itens de menu
const menuItems = [
  { 
    id: 'dashboard', 
    label: 'Dashboard', 
    icon: <LayoutDashboard className="h-5 w-5" />, 
    path: '/admin',
    separator: false 
  },
  { 
    id: 'categorias', 
    label: 'Categorias', 
    icon: <Tag className="h-5 w-5" />, 
    path: '/admin/categorias',
    separator: false 
  },
  { 
    id: 'planos', 
    label: 'Planos', 
    icon: <CreditCard className="h-5 w-5" />, 
    path: '/admin/planos',
    separator: false 
  },
  { 
    id: 'formatos-arquivo', 
    label: 'Formatos de Arquivo', 
    icon: <FileType className="h-5 w-5" />, 
    path: '/admin/formatos-arquivo',
    separator: false 
  },
  { 
    id: 'formatos-post', 
    label: 'Formatos de Post', 
    icon: <LayoutTemplate className="h-5 w-5" />, 
    path: '/admin/formatos-post',
    separator: false 
  },
  { 
    id: 'postagens', 
    label: 'Postagens', 
    icon: <Upload className="h-5 w-5" />, 
    path: '/admin/postagens',
    separator: true
  },
  { 
    id: 'gerenciamento', 
    label: 'Gerenciamento', 
    icon: <Settings className="h-5 w-5" />, 
    path: '/admin/gerenciamento',
    separator: false 
  },
  { 
    id: 'monetizacao', 
    label: 'Monetização', 
    icon: <DollarSign className="h-5 w-5" />, 
    path: '/admin/monetizacao',
    separator: false 
  },
  { 
    id: 'cursos', 
    label: 'Cursos', 
    icon: <GraduationCap className="h-5 w-5" />, 
    path: '/admin/cursos',
    separator: false 
  },
  { 
    id: 'integracoes', 
    label: 'Integrações', 
    icon: <Globe className="h-5 w-5" />, 
    path: '/admin/integracoes',
    separator: false 
  },
  { 
    id: 'webhooks', 
    label: 'Webhooks & APIs', 
    icon: <Webhook className="h-5 w-5" />, 
    path: '/admin/webhooks',
    separator: false 
  },
  { 
    id: 'dev', 
    label: 'Dev', 
    icon: <CodeIcon className="h-5 w-5" />, 
    path: '/admin/dev',
    separator: false 
  },
];

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  currentPath: string;
  userData: User | null;
}

export function Sidebar({ isOpen, onToggle, currentPath, userData }: SidebarProps) {
  // Obter as iniciais do nome do usuário para o avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Verificar se o caminho atual corresponde ao item de menu
  const isActive = (path: string) => {
    if (path === '/admin' && currentPath === '/admin') {
      return true;
    }
    if (path !== '/admin' && currentPath.startsWith(path)) {
      return true;
    }
    return false;
  };

  return (
    <>
      {/* Overlay para mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed left-0 top-0 z-50 h-full bg-white border-r border-border shadow-sm",
          "w-60 transition-all duration-300 transform",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0 md:w-16",
          "md:relative md:z-auto"
        )}
      >
        {/* Botão Toggle no Mobile */}
        <button
          className="absolute right-0 translate-x-full top-4 bg-white p-2 rounded-r-md border border-l-0 border-border md:hidden"
          onClick={onToggle}
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Botão Toggle no Desktop */}
        <button
          className="absolute -right-3 top-20 hidden md:flex bg-white p-1 rounded-full border border-border shadow-sm"
          onClick={onToggle}
        >
          <ChevronLeft className={cn("h-4 w-4 transition-transform", !isOpen && "rotate-180")} />
        </button>
        
        <div className="flex flex-col h-full">
          {/* Cabeçalho do usuário */}
          <div className={cn(
            "p-4 flex items-center gap-3",
            !isOpen && "md:justify-center"
          )}>
            <Avatar className="h-10 w-10">
              <AvatarImage src="" alt={userData?.username || ""} />
              <AvatarFallback>{userData ? getInitials(userData.username) : "US"}</AvatarFallback>
            </Avatar>
            
            {isOpen && (
              <div className="flex flex-col overflow-hidden">
                <h3 className="font-medium text-sm truncate">{userData?.username || "Usuário"}</h3>
                <p className="text-xs text-muted-foreground truncate">{userData?.email || ""}</p>
                <span className="text-xs text-primary/80">Administrador</span>
              </div>
            )}
          </div>
          
          <Separator />

          {/* Menu de navegação */}
          <nav className="flex-1 overflow-y-auto py-4 px-2">
            <ul className="space-y-1">
              {menuItems.map((item) => (
                <React.Fragment key={item.id}>
                  <li>
                    <Link href={item.path}>
                      <a className="block">
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
                      </a>
                    </Link>
                  </li>
                  {item.separator && isOpen && <Separator className="my-4" />}
                  {item.separator && !isOpen && <div className="my-4" />}
                </React.Fragment>
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