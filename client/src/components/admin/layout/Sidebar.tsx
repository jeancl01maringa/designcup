import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
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
  Database,
  Globe,
  ExternalLink,
  Hash,
  Tag,
  DollarSign,
  Megaphone,
  Zap,
  ChevronDown,
  ChevronRight,
  Phone,
  Image
} from "lucide-react";
import { cn } from "@/lib/utils";
import { User } from "@shared/schema";
import { usePlatformLogo } from "@/hooks/use-platform-logo";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  currentPath: string;
  userData: User | null;
}

export function Sidebar({ isOpen, onToggle, currentPath, userData }: SidebarProps) {
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  const [, setLocation] = useLocation();
  const { logoUrl, hasCustomLogo } = usePlatformLogo();

  // Itens do menu da sidebar com seus respectivos ícones e caminhos
  const menuItems = [
    {
      id: "home",
      label: "Ir para o Site",
      path: "/",
      icon: <ExternalLink className="h-4 w-4" />,
      separator: true,
    },
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
      id: "monetizacao",
      label: "Monetização",
      icon: <Database className="h-4 w-4" />,
      hasSubmenu: true,
      subItems: [
        {
          id: "monetizacao",
          label: "Monetização",
          path: "/admin/gerenciamento/monetizacao",
          icon: <DollarSign className="h-4 w-4" />,
        },
        {
          id: "usuarios",
          label: "Usuários",
          path: "/admin/gerenciamento/usuarios",
          icon: <Users className="h-4 w-4" />,
        },
        {
          id: "assinantes",
          label: "Assinantes",
          path: "/admin/gerenciamento/assinantes",
          icon: <Users className="h-4 w-4 text-blue-500" />,
        },
        {
          id: "planos",
          label: "Planos",
          path: "/admin/planos",
          icon: <LayoutTemplate className="h-4 w-4" />,
        }
      ],
    },
    {
      id: "conteudos",
      label: "Conteúdos",
      icon: <FolderOpen className="h-4 w-4" />,
      hasSubmenu: true,
      subItems: [
        {
          id: "categorias",
          label: "Categorias",
          path: "/admin/categorias",
          icon: <FolderOpen className="h-4 w-4" />,
        },
        {
          id: "formatos",
          label: "Formatos de Arquivo",
          path: "/admin/gerenciamento/formatos",
          icon: <FileType className="h-4 w-4" />,
        },
        {
          id: "formatos-post",
          label: "Formatos de Post",
          path: "/admin/gerenciamento/formatos-post",
          icon: <LayoutTemplate className="h-4 w-4" />,
        },
        {
          id: "tags",
          label: "Gerenciar Tags",
          path: "/admin/gerenciamento/tags",
          icon: <Tag className="h-4 w-4" />,
        }
      ],
    },
    {
      id: "marketing",
      label: "Marketing",
      icon: <Megaphone className="h-4 w-4" />,
      hasSubmenu: true,
      subItems: [
        {
          id: "marketing-dashboard",
          label: "Marketing",
          path: "/admin/marketing",
          icon: <Megaphone className="h-4 w-4" />,
        },
        {
          id: "popups",
          label: "Popups",
          path: "/admin/marketing/popups",
          icon: <Zap className="h-4 w-4" />,
        }
      ],
      separator: true,
    },
    {
      id: "configuracoes",
      label: "Configurações",
      path: "/admin/configuracoes",
      icon: <Settings className="h-4 w-4" />,
      hasSubmenu: true,
      subItems: [
        {
          id: "suporte",
          label: "Gerenciar Suporte",
          path: "/admin/configuracoes/suporte",
          icon: <Phone className="h-4 w-4" />,
        },
        {
          id: "logo",
          label: "Alterar Logo",
          path: "/admin/configuracoes/logo",
          icon: <Image className="h-4 w-4" />,
        }
      ],
    },
  ];

  // Função para verificar se um item de menu está ativo
  const isActive = (path: string) => {
    return currentPath === path || currentPath.startsWith(`${path}/`);
  };

  const toggleSubmenu = (menuId: string) => {
    setExpandedMenus(prev => 
      prev.includes(menuId) 
        ? prev.filter(id => id !== menuId)
        : [...prev, menuId]
    );
  };

  // Função para encontrar qual dropdown contém a página atual
  const findParentMenu = (path: string) => {
    return menuItems.find(item => 
      item.hasSubmenu && 
      item.subItems?.some(subItem => subItem.path === path)
    )?.id;
  };

  // Effect para manter o dropdown aberto quando navegar para uma página dentro dele
  useEffect(() => {
    const parentMenuId = findParentMenu(currentPath);
    if (parentMenuId && !expandedMenus.includes(parentMenuId)) {
      setExpandedMenus(prev => [...prev, parentMenuId]);
    }
  }, [currentPath]);

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
              {/* Logo/Ícone com link para home */}
              <Link href="/">
                <div className="flex-shrink-0 text-primary font-bold hover:text-primary/90 transition-colors cursor-pointer flex items-center">
                  {isOpen ? (
                    <div className="flex items-center gap-2">
                      {hasCustomLogo ? (
                        <img 
                          src={logoUrl} 
                          alt="Logo da Plataforma" 
                          className="h-6 w-auto max-w-[120px] object-contain"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                      ) : (
                        <span className="mr-1">Design para Estética</span>
                      )}
                      <Home className="h-3.5 w-3.5" />
                    </div>
                  ) : (
                    hasCustomLogo ? (
                      <img 
                        src={logoUrl} 
                        alt="Logo" 
                        className="h-6 w-6 object-contain"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.insertAdjacentHTML('afterend', 'DE');
                        }}
                      />
                    ) : (
                      "DE"
                    )
                  )}
                </div>
              </Link>
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
            <Avatar className="h-10 w-10">
              <AvatarImage 
                src={userData?.profileImage || ""} 
                alt={userData?.username || "Admin"}
                className="object-cover"
              />
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
                  {item.hasSubmenu ? (
                    // Item com submenu
                    <div>
                      <Button
                        variant="ghost"
                        onClick={() => toggleSubmenu(item.id)}
                        className={cn(
                          "w-full justify-start",
                          !isOpen && "md:justify-center"
                        )}
                        size="sm"
                      >
                        <span className={cn(
                          "mr-2",
                          "text-muted-foreground",
                          !isOpen && "md:mr-0"
                        )}>
                          {item.icon}
                        </span>
                        {isOpen && (
                          <>
                            <span className="flex-1 text-left">{item.label}</span>
                            {expandedMenus.includes(item.id) ? 
                              <ChevronDown className="h-4 w-4" /> : 
                              <ChevronRight className="h-4 w-4" />
                            }
                          </>
                        )}
                      </Button>
                      
                      {/* Submenu items */}
                      {isOpen && expandedMenus.includes(item.id) && item.subItems && (
                        <div className="ml-4 mt-1 space-y-1">
                          {item.subItems.map((subItem) => (
                            <Button
                              key={subItem.id}
                              variant={isActive(subItem.path) ? "default" : "ghost"}
                              className={cn(
                                "w-full justify-start text-sm",
                                isActive(subItem.path) ? "bg-primary/10 text-primary hover:bg-primary/15" : ""
                              )}
                              size="sm"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setLocation(subItem.path);
                              }}
                            >
                              <span className={cn(
                                "mr-2",
                                isActive(subItem.path) ? "text-primary" : "text-muted-foreground"
                              )}>
                                {subItem.icon}
                              </span>
                              <span>{subItem.label}</span>
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    // Item normal sem submenu
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
                  )}
                  
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