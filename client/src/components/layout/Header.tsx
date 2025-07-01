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
    <nav className="hidden md:flex items-center space-x-2">
      {navItems.map((item) => (
        <Link 
          key={item.path} 
          href={item.path}
          className={`relative text-[#1D1D1D] font-medium text-sm px-4 py-2.5 rounded-xl transition-all duration-300 ease-out hover:scale-[1.02] hover:shadow-sm ${location === item.path ? 'text-[#393B40] bg-gray-100/80 shadow-sm' : 'hover:bg-gray-50/80'}`}
        >
          {item.name}
          {/* Underline indicator para página ativa */}
          {location === item.path && (
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1/2 h-0.5 bg-gradient-to-r from-gray-400 to-gray-500 rounded-full"></div>
          )}
        </Link>
      ))}
      <SupportContact 
        variant="ghost" 
        size="sm" 
        showIcon={false}
        className="text-[#1D1D1D] font-medium text-sm px-4 py-2.5 rounded-xl transition-all duration-300 ease-out hover:scale-[1.02] hover:shadow-sm hover:bg-gray-50/80"
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
          className="flex items-center gap-1 border-blue-300 text-blue-500 hover:bg-blue-50 px-2"
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
            className="text-[#1D1D1D] hover:text-[#AA5E2F] min-w-[80px] min-h-[80px] p-5"
          >
            <svg className="h-20 w-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.5" d="M4 6h16M4 12h16M4 18h16"></path>
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
            <div className="px-6 py-6 space-y-6">
              {/* Lista de opções estilo Instagram */}
              <div className="space-y-1">
                {navItems.map((item) => {
                  // Função para obter o ícone correto baseado no nome
                  const getIcon = (name: string) => {
                    if (name.toLowerCase().includes('curso') || name.toLowerCase().includes('tutorial') || name.toLowerCase().includes('aula')) {
                      return (
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                        </svg>
                      );
                    }
                    if (name.toLowerCase().includes('categoria')) {
                      return (
                        <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
                        </svg>
                      );
                    }
                    if (name.toLowerCase().includes('arte') || name.toLowerCase().includes('todas')) {
                      return (
                        <svg className="w-5 h-5 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                        </svg>
                      );
                    }
                    if (name.toLowerCase().includes('plano')) {
                      return (
                        <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/>
                        </svg>
                      );
                    }
                    if (name.toLowerCase().includes('admin') || name.toLowerCase().includes('painel')) {
                      return (
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                        </svg>
                      );
                    }
                    if (name.toLowerCase().includes('suporte')) {
                      return (
                        <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                        </svg>
                      );
                    }
                    // Ícone padrão para home
                    return (
                      <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
                      </svg>
                    );
                  };

                  // Tratar suporte de forma especial para abrir WhatsApp
                  if (item.path === "whatsapp") {
                    return (
                      <div
                        key={item.name}
                        className="flex items-center px-4 py-3 text-base font-medium text-gray-700 transition-all duration-200 hover:bg-gray-50/80 rounded-xl cursor-pointer group"
                        onClick={() => {
                          if (whatsappUrl) {
                            window.open(`${whatsappUrl}?text=Olá, preciso de ajuda!`, '_blank');
                          }
                          setIsOpen(false);
                        }}
                      >
                        <div className="w-10 h-10 bg-white border border-gray-100 rounded-xl flex items-center justify-center mr-4 shadow-sm group-hover:shadow-md transition-all duration-200">
                          {getIcon(item.name)}
                        </div>
                        <span className="flex-1 text-gray-800">{item.name}</span>
                        <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/>
                        </svg>
                      </div>
                    );
                  }

                  return (
                    <Link 
                      key={item.path} 
                      href={item.path}
                    >
                      <a
                        className="flex items-center px-4 py-3 text-base font-medium text-gray-700 transition-all duration-200 hover:bg-gray-50/80 rounded-xl group"
                        onClick={() => setIsOpen(false)}
                      >
                        <div className="w-10 h-10 bg-white border border-gray-100 rounded-xl flex items-center justify-center mr-4 shadow-sm group-hover:shadow-md transition-all duration-200">
                          {getIcon(item.name)}
                        </div>
                        <span className="flex-1 text-gray-800">{item.name}</span>
                        <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/>
                        </svg>
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
    <header className="bg-white sticky top-0 z-50 overflow-visible" style={{ borderBottom: '1px solid #f8f8f8' }}>
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
