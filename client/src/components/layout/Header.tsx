import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useMobileMenu } from "@/hooks/use-mobile-menu";
import { ProfileMobileNav } from "@/components/layout/ProfileMobileNav";
import { useAuth } from "@/hooks/use-auth";
import { useSupportNumber } from "@/hooks/use-support-number";
import { usePlatformLogo } from "@/hooks/use-platform-logo";
import { 
  User, 
  LogOut, 
  LogIn, 
  UserPlus,
  ChevronDown,
  MessageSquare,
  Crown,
  Search
} from "lucide-react";
import { UserDropdownMenu } from "./UserDropdownMenu";
import { SupportContact } from "@/components/ui/SupportContact";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

const Logo = () => {
  const { logoUrl, hasCustomLogo, isLoading } = usePlatformLogo();
  
  // Se ainda está carregando, não mostra nada para evitar flash do logo padrão
  if (isLoading) {
    return (
      <div className="flex items-center">
        <Link href="/" className="flex items-center">
          <div className="h-6 md:h-8 w-32 md:w-40 bg-transparent" />
        </Link>
      </div>
    );
  }
  
  return (
    <div className="flex items-center">
      <Link href="/" className="flex items-center">
        {hasCustomLogo ? (
          <img 
            src={logoUrl} 
            alt="Logo da Plataforma" 
            className="h-6 md:h-8 w-auto max-w-[150px] md:max-w-[200px] object-contain"
            onError={(e) => {
              // Em caso de erro, mostra o logo padrão
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const fallback = document.createElement('div');
              fallback.className = 'flex items-center';
              fallback.innerHTML = `
                <svg class="h-5 md:h-7 w-5 md:w-7 text-[#AA5E2F]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none" />
                  <path d="M8 12a4 4 0 108 0 4 4 0 00-8 0z" stroke="currentColor" stroke-width="2" fill="none" />
                </svg>
                <span class="ml-2 font-bold text-sm md:text-lg lg:text-xl">
                  <span class="text-[#1D1D1D]">Design</span><span class="text-[#AA5E2F]">paraEstética</span>
                </span>
              `;
              target.parentNode?.appendChild(fallback);
            }}
          />
        ) : (
          <div className="flex items-center">
            <svg className="h-5 md:h-7 w-5 md:w-7 text-[#AA5E2F]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
              <path d="M8 12a4 4 0 108 0 4 4 0 00-8 0z" stroke="currentColor" strokeWidth="2" fill="none" />
            </svg>
            <span className="ml-2 font-bold text-sm md:text-lg lg:text-xl">
              <span className="text-[#1D1D1D]">Design</span><span className="text-[#AA5E2F]">paraEstética</span>
            </span>
          </div>
        )}
      </Link>
    </div>
  );
};



const NavLinks = () => {
  const [location] = useLocation();
  
  const navItems = [
    { name: "Início", path: "/" },
    { name: "Categorias", path: "/categorias" },
    { name: "Cursos", path: "/cursos" },
    { name: "Planos", path: "/planos" }
  ];
  
  return (
    <nav className="hidden md:flex items-center space-x-5">
      {navItems.map((item) => (
        <Link 
          key={item.path} 
          href={item.path}
          className={`text-[#1D1D1D] hover:text-[#AA5E2F] font-medium text-sm transition-colors ${location === item.path ? 'text-[#AA5E2F]' : ''}`}
        >
          {item.name}
        </Link>
      ))}
      <SupportContact 
        variant="ghost" 
        size="sm" 
        showIcon={false}
        className="text-[#1D1D1D] hover:text-[#AA5E2F] font-medium text-sm transition-colors p-0 h-auto"
      />
    </nav>
  );
};

const UserMenu = () => {
  const { user, logoutMutation } = useAuth();
  const [location, navigate] = useLocation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  // Debug para verificar a propriedade isAdmin
  console.log("[HEADER] UserMenu renderizado");
  if (user) {
    console.log("[HEADER] User object:", user);
    console.log("[HEADER] isAdmin:", user.isAdmin);
    console.log("[HEADER] Tipo do isAdmin:", typeof user.isAdmin);
  } else {
    console.log("[HEADER] Usuário não está logado");
  }
  
  if (!user) {
    return (
      <div className="hidden md:flex items-center gap-3">
        <Button 
          variant="default" 
          size="sm"
          className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg transition-all duration-300 rounded-full font-medium px-5 py-2 h-10 text-sm border-0"
          onClick={() => navigate("/planos")}
        >
          <Crown className="h-4 w-4" />
          <span>Assine o Premium</span>
        </Button>
        <Button 
          variant="outline" 
          size="sm"
          className="flex items-center gap-2 border-[#191c2c] text-[#191c2c] hover:bg-[#191c2c] hover:text-white bg-transparent transition-all duration-200 rounded-full px-5 py-2 h-10 text-sm"
          onClick={() => {
            navigate("/auth");
            // Ativar a tab de registro
            setTimeout(() => {
              document.querySelector('[value="register"]')?.dispatchEvent(
                new MouseEvent('click', { bubbles: true })
              );
            }, 100);
          }}
        >
          <UserPlus className="h-4 w-4" />
          <span>Cadastre-se</span>
        </Button>
        <Button 
          variant="default" 
          size="sm" 
          className="flex items-center gap-2 bg-[#191c2c] hover:bg-[#14182a] text-white shadow-sm transition-all duration-200 rounded-full px-5 py-2 h-10 text-sm"
          onClick={() => navigate("/auth")}
        >
          <LogIn className="h-4 w-4" />
          <span>Entrar</span>
        </Button>
      </div>
    );
  }
  
  // Conversão explícita para booleano, em caso de o isAdmin ser undefined ou outro valor
  const isAdmin = Boolean(user.isAdmin);
  console.log("[HEADER] isAdmin após conversão:", isAdmin);
  
  // Verificar se o usuário tem plano gratuito
  const isFreeUser = !user.tipo || user.tipo === 'free';
  
  return (
    <div className="hidden md:flex items-center gap-2">
      {isAdmin && (
        <Button
          variant="outline"
          className="flex items-center gap-1 border-amber-500 text-amber-600 hover:bg-amber-50 rounded-full px-3 h-[35px] text-xs"
          onClick={() => navigate("/admin")}
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="14" 
            height="14" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
          <span>Admin</span>
        </Button>
      )}
      
      {isFreeUser && (
        <Button 
          variant="default" 
          className="flex items-center gap-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg transition-all duration-300 rounded-full font-medium px-3 h-[35px] text-xs border-0"
          onClick={() => navigate("/planos")}
        >
          <Crown className="h-3 w-3" />
          <span>Assine o Premium</span>
        </Button>
      )}
      
      {/* Botão que abre nosso dropdown novo */}
      <Button 
        variant="ghost" 
        className="flex items-center gap-2 font-normal hover:bg-muted/60"
        onClick={() => setIsDropdownOpen(true)}
      >
        <div className="rounded-full overflow-hidden w-8 h-8 p-0">
          {user.profileImage ? (
            <img 
              src={user.profileImage} 
              alt={user.username}
              className="w-full h-full object-cover"
              key={user.profileImage}
            />
          ) : (
            <div className="w-full h-full bg-primary/20 flex items-center justify-center text-primary">
              <User className="h-4 w-4" />
            </div>
          )}
        </div>
        <span className="max-w-[100px] truncate">{user.username}</span>
        <ChevronDown className="h-4 w-4" />
      </Button>
      
      {/* Novo componente de dropdown menu personalizado */}
      <UserDropdownMenu 
        isOpen={isDropdownOpen} 
        onClose={() => setIsDropdownOpen(false)} 
      />
    </div>
  );
};

// Novo componente para mobile header
const MobileUserMenu = () => {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  if (!user) {
    return (
      <div className="flex md:hidden items-center gap-2">
        <Button 
          variant="default" 
          size="lg" 
          className="flex items-center gap-2 bg-[#191c2c] hover:bg-[#14182a] text-white px-4 py-2 text-sm rounded-full min-h-[44px]"
          onClick={() => navigate("/auth")}
        >
          <LogIn className="h-5 w-5" />
          <span>Entrar</span>
        </Button>
      </div>
    );
  }
  
  const isAdmin = Boolean(user.isAdmin);
  const isFreeUser = !user.tipo || user.tipo === 'free';
  
  return (
    <div className="flex md:hidden items-center gap-2">
      {/* Admin Button for Mobile */}
      {isAdmin && (
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-1 border-primary text-primary hover:bg-primary/10 px-2"
          onClick={() => navigate("/admin")}
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="16" 
            height="16" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
        </Button>
      )}
      
      {isFreeUser && (
        <Button 
          variant="default" 
          size="sm"
          className="flex items-center gap-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg transition-all duration-300 rounded-full font-medium px-4 py-2 h-10 text-sm"
          onClick={() => navigate("/planos")}
        >
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732L14.146 12.8l-1.179 4.456a1 1 0 01-1.934 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732L9.854 7.2l1.179-4.456A1 1 0 0112 2z" clipRule="evenodd" />
          </svg>
          <span>Premium</span>
        </Button>
      )}
      
      {/* Profile Photo Button for Mobile */}
      <Button 
        variant="ghost" 
        size="lg"
        className="flex items-center gap-1 p-1 min-w-[44px] min-h-[44px]"
        onClick={() => setIsDropdownOpen(true)}
      >
        <div className="rounded-full overflow-hidden w-10 h-10">
          {user.profileImage ? (
            <img 
              src={user.profileImage} 
              alt={user.username}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-primary/20 flex items-center justify-center text-primary">
              <User className="h-5 w-5" />
            </div>
          )}
        </div>
      </Button>
      
      {/* Dropdown Menu for Mobile */}
      <UserDropdownMenu 
        isOpen={isDropdownOpen} 
        onClose={() => setIsDropdownOpen(false)} 
      />
    </div>
  );
};

const MobileMenu = () => {
  const [location, navigate] = useLocation();
  const { user, logoutMutation } = useAuth();
  const { isOpen, setIsOpen } = useMobileMenu();
  const { whatsappUrl } = useSupportNumber();
  
  const navItems = [
    { name: "Início", path: "/" },
    { name: "Categorias", path: "/categorias" },
    { name: "Planos", path: "/planos" },
    { name: "Cursos", path: "/cursos" },
    { name: "Suporte", path: "whatsapp" } // Especial para WhatsApp
  ];
  
  return (
    <div className="md:hidden">
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button 
            variant="ghost" 
            size="lg"
            className="text-[#1D1D1D] hover:text-[#AA5E2F] min-w-[44px] min-h-[44px] p-2"
          >
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
            </svg>
          </Button>
        </SheetTrigger>
        
        <SheetContent side="bottom" className="w-full h-auto p-0 rounded-t-3xl border-0">
          <div className="bg-white rounded-t-3xl">
            {/* Linha indicadora */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 bg-gray-300 rounded-full"></div>
            </div>
            

            
            {/* Content do Menu */}
            <div className="px-6 py-4 space-y-4">
              {/* Lista de opções estilo Instagram */}
              <div className="space-y-0">
                {navItems.map((item) => {
                  // Função para obter o ícone correto baseado no nome
                  const getIcon = (name: string) => {
                    if (name.toLowerCase().includes('curso') || name.toLowerCase().includes('tutorial') || name.toLowerCase().includes('aula')) {
                      return (
                        <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2 6a2 2 0 012-2h6l2 2h6a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM4 8a1 1 0 000 2h1v3a1 1 0 001 1h3a1 1 0 001-1V9a1 1 0 100-2H4z"/>
                        </svg>
                      );
                    }
                    if (name.toLowerCase().includes('categoria')) {
                      return (
                        <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/>
                        </svg>
                      );
                    }
                    if (name.toLowerCase().includes('arte') || name.toLowerCase().includes('todas')) {
                      return (
                        <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd"/>
                        </svg>
                      );
                    }
                    if (name.toLowerCase().includes('plano')) {
                      return (
                        <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732L14.146 12.8l-1.179 4.456a1 1 0 01-1.934 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732L9.854 7.2l1.179-4.456A1 1 0 0112 2z"/>
                        </svg>
                      );
                    }
                    if (name.toLowerCase().includes('admin') || name.toLowerCase().includes('painel')) {
                      return (
                        <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd"/>
                        </svg>
                      );
                    }
                    if (name.toLowerCase().includes('suporte')) {
                      return (
                        <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                        </svg>
                      );
                    }
                    // Ícone padrão para home
                    return (
                      <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/>
                      </svg>
                    );
                  };

                  // Tratar suporte de forma especial para abrir WhatsApp
                  if (item.path === "whatsapp") {
                    return (
                      <div
                        key={item.name}
                        className="flex items-center px-0 py-4 text-base font-normal text-gray-900 transition-all duration-200 hover:bg-gray-50 rounded-lg cursor-pointer"
                        onClick={() => {
                          if (whatsappUrl) {
                            window.open(`${whatsappUrl}?text=Olá, preciso de ajuda!`, '_blank');
                          }
                          setIsOpen(false);
                        }}
                      >
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mr-4">
                          {getIcon(item.name)}
                        </div>
                        <span className="flex-1">{item.name}</span>
                      </div>
                    );
                  }

                  return (
                    <Link 
                      key={item.path} 
                      href={item.path}
                    >
                      <a
                        className="flex items-center px-0 py-4 text-base font-normal text-gray-900 transition-all duration-200 hover:bg-gray-50 rounded-lg"
                        onClick={() => setIsOpen(false)}
                      >
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mr-4">
                          {getIcon(item.name)}
                        </div>
                        <span className="flex-1">{item.name}</span>
                      </a>
                    </Link>
                  );
                })}
              </div>
              
              {/* Espaçamento extra para deixar mais clean */}
              <div className="pb-4"></div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};



export default function Header() {
  const { isOpen } = useMobileMenu();
  const [location, navigate] = useLocation();
  
  // Detectar se estamos em páginas de perfil para mostrar o menu lateral
  const isProfilePage = location.startsWith('/perfil') || location.startsWith('/curtidas') || 
                       location.startsWith('/salvos') || location.startsWith('/seguindo') || 
                       location.startsWith('/edicoes-recentes') || location.startsWith('/assinatura');
  const [showScrollSearchBar, setShowScrollSearchBar] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFormat, setSelectedFormat] = useState("all");
  const [showFormatDropdown, setShowFormatDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const formats = [
    { id: "all", name: "Formato" },
    { id: "feed", name: "Feed" },
    { id: "poster", name: "Cartaz" },
    { id: "stories", name: "Stories" },
    { id: "images", name: "Imagens" }
  ];

  const getFormatName = (formatId: string) => {
    return formats.find(f => f.id === formatId)?.name || "Formato";
  };

  const handleScrollSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/todas-artes?search=${encodeURIComponent(searchQuery.trim())}&format=${selectedFormat}`);
    } else {
      navigate("/todas-artes");
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      // Só mostra a barra de pesquisa scroll na homepage
      if (location === "/") {
        const scrollY = window.scrollY;
        setShowScrollSearchBar(scrollY > 400); // Mostra após rolar 400px
      } else {
        setShowScrollSearchBar(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [location]);

  // Fechar dropdown quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowFormatDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 overflow-visible">
      {/* Cabeçalho principal - oculto quando menu mobile está aberto */}
      <div className={`container-global py-3 flex items-center transition-all duration-300 h-[70px] ${isOpen ? 'md:flex hidden' : 'flex'}`}>
        
        {/* Layout Desktop - mantém estrutura original */}
        <div className="hidden md:flex items-center justify-between w-full">
          {/* Logo - posicionado à esquerda */}
          <div className="flex-shrink-0 w-36">
            <Logo />
          </div>
          
          {/* Links de navegação ou barra de pesquisa scroll */}
          <div className="flex-1 flex justify-center">
            {showScrollSearchBar ? (
              <form onSubmit={handleScrollSearch} className="relative flex items-center max-w-2xl w-full">
                <input
                  type="text"
                  placeholder="Busque por artes, categorias, temas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full py-4 px-6 pr-48 rounded-xl border border-gray-200 bg-white/90 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[#AA5E2F]/40 focus:border-[#AA5E2F] transition-all font-sans text-base placeholder:text-gray-400"
                />
                
                {/* Format Dropdown - Positioned to the right */}
                <div className="absolute right-16 top-1/2 -translate-y-1/2 border-l border-gray-200 pl-4">
                  <div className="relative" ref={dropdownRef}>
                    <button
                      type="button"
                      onClick={() => setShowFormatDropdown(!showFormatDropdown)}
                      className="flex items-center justify-between text-sm font-medium px-3 py-2 min-w-[110px] text-gray-700 bg-transparent hover:bg-gray-50 rounded-md transition-colors duration-150 focus:outline-none"
                    >
                      <span>{getFormatName(selectedFormat)}</span>
                      <ChevronDown className="ml-2 h-4 w-4 text-gray-500" />
                    </button>
                    
                    {showFormatDropdown && (
                      <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded-lg shadow-xl z-[9999]">
                        <div className="py-2">
                          {formats.map(format => (
                            <button
                              key={format.id}
                              type="button"
                              onClick={() => {
                                setSelectedFormat(format.id);
                                setShowFormatDropdown(false);
                              }}
                              className={`w-full text-left px-4 py-3 text-sm transition-colors duration-150 flex items-center gap-3
                                ${format.id === selectedFormat 
                                  ? 'bg-gray-100 text-gray-900 font-medium border-l-2 border-gray-400' 
                                  : 'text-gray-700 hover:bg-gray-100'}`}
                            >
                              <span>{format.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Search Button */}
                <button
                  type="submit"
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-[#1a1d29] text-white px-4 py-2.5 rounded-lg hover:bg-[#151821] transition-colors text-sm font-medium flex items-center gap-2"
                >
                  <Search className="h-4 w-4" />
                </button>
              </form>
            ) : (
              <NavLinks />
            )}
          </div>
          
          {/* Botões do usuário - posicionados à direita */}
          <div className="flex items-center space-x-2 flex-shrink-0 w-36 justify-end">
            <UserMenu />
          </div>
        </div>

        {/* Layout Mobile - nova estrutura */}
        <div className="flex md:hidden items-center justify-between w-full">
          {/* Menu hambúrguer - lado esquerdo (ou menu de perfil se estivermos em páginas de perfil) */}
          <div className="flex-shrink-0">
            {isProfilePage ? <ProfileMobileNav /> : <MobileMenu />}
          </div>
          
          {/* Logo - centralizado */}
          <div className="flex-1 flex justify-center">
            <Logo />
          </div>
          
          {/* Botão Entrar - lado direito */}
          <div className="flex-shrink-0">
            <MobileUserMenu />
          </div>
        </div>
        
      </div>
    </header>
  );
}
