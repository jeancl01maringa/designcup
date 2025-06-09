import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useMobileMenu } from "@/hooks/use-mobile-menu";
import { useAuth } from "@/hooks/use-auth";
import { useSupportNumber } from "@/hooks/use-support-number";
import { usePlatformLogo } from "@/hooks/use-platform-logo";
import { 
  User, 
  LogOut, 
  LogIn, 
  UserPlus,
  ChevronDown,
  MessageSquare
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

const Logo = () => {
  const { logoUrl, hasCustomLogo } = usePlatformLogo();
  
  return (
    <div className="flex items-center">
      <Link href="/" className="flex items-center">
        {hasCustomLogo ? (
          <img 
            src={logoUrl} 
            alt="Logo da Plataforma" 
            className="h-6 md:h-8 w-auto max-w-[150px] md:max-w-[200px] object-contain"
            onError={(e) => {
              // Fallback para o logo padrão em caso de erro
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              target.nextElementSibling?.classList.remove('hidden');
            }}
          />
        ) : (
          <svg className="h-5 md:h-7 w-5 md:w-7 text-[#AA5E2F]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
            <path d="M8 12a4 4 0 108 0 4 4 0 00-8 0z" stroke="currentColor" strokeWidth="2" fill="none" />
          </svg>
        )}
        
        {/* Logo padrão como fallback, oculto quando há logo personalizado */}
        <div className={hasCustomLogo ? 'hidden' : 'flex items-center'}>
          {!hasCustomLogo && (
            <svg className="h-5 md:h-7 w-5 md:w-7 text-[#AA5E2F]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
              <path d="M8 12a4 4 0 108 0 4 4 0 00-8 0z" stroke="currentColor" strokeWidth="2" fill="none" />
            </svg>
          )}
          <span className="ml-2 font-bold text-sm md:text-lg lg:text-xl">
            <span className="text-[#1D1D1D]">Design</span><span className="text-[#AA5E2F]">paraEstética</span>
          </span>
        </div>
      </Link>
    </div>
  );
};

const NavLinks = () => {
  const [location] = useLocation();
  
  const navItems = [
    { name: "Início", path: "/" },
    { name: "Categorias", path: "/categorias" },
    { name: "Planos", path: "/planos" },
    { name: "Tutoriais", path: "/tutoriais" }
  ];
  
  return (
    <nav className="hidden md:flex items-center space-x-6">
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
      <div className="hidden md:flex items-center gap-2">
        <Button 
          variant="default" 
          size="sm" 
          className="flex items-center gap-1 bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-sm transition-all duration-200"
          onClick={() => navigate("/auth")}
        >
          <LogIn className="h-4 w-4" />
          <span>Entrar</span>
        </Button>
        <Button 
          variant="outline" 
          size="sm"
          className="flex items-center gap-1 border-[#2563EB] text-[#2563EB] hover:bg-[#2563EB] hover:text-white bg-transparent transition-all duration-200"
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
      </div>
    );
  }
  
  // Conversão explícita para booleano, em caso de o isAdmin ser undefined ou outro valor
  const isAdmin = Boolean(user.isAdmin);
  console.log("[HEADER] isAdmin após conversão:", isAdmin);
  
  return (
    <div className="hidden md:flex items-center gap-2">
      {isAdmin && (
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-1 border-yellow-500 text-yellow-600 hover:bg-yellow-50"
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
            className="mr-1"
          >
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
          <span>Admin</span>
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
          size="sm" 
          className="flex items-center gap-1 bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-3 py-1.5 text-xs"
          onClick={() => navigate("/auth")}
        >
          <LogIn className="h-3 w-3" />
          <span>Entrar</span>
        </Button>
      </div>
    );
  }
  
  const isAdmin = Boolean(user.isAdmin);
  
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
      
      {/* Profile Photo Button for Mobile */}
      <Button 
        variant="ghost" 
        size="sm"
        className="flex items-center gap-1 p-1"
        onClick={() => setIsDropdownOpen(true)}
      >
        <div className="rounded-full overflow-hidden w-8 h-8">
          {user.profileImage ? (
            <img 
              src={user.profileImage} 
              alt={user.username}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-primary/20 flex items-center justify-center text-primary">
              <User className="h-4 w-4" />
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
  
  const navItems = [
    { name: "Início", path: "/" },
    { name: "Categorias", path: "/categorias" },
    { name: "Planos", path: "/planos" },
    { name: "Tutoriais", path: "/tutoriais" }
  ];
  
  if (!isOpen) return null;
  
  return (
    <div className="md:hidden">
      <div className="px-4 pt-4 pb-6 space-y-1 bg-white border-t border-gray-100 shadow-lg">
        {/* Navigation Links */}
        <div className="space-y-1">
          {navItems.map((item) => (
            <Link 
              key={item.path} 
              href={item.path}
              className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                location === item.path 
                  ? 'bg-[#AA5E2F]/10 text-[#AA5E2F] border-l-4 border-[#AA5E2F]' 
                  : 'text-gray-700 hover:bg-gray-50 hover:text-[#AA5E2F]'
              }`}
              onClick={() => setIsOpen(false)}
            >
              {item.name}
            </Link>
          ))}
        </div>
        
        {/* Support Contact for Mobile */}
        <div className="border-t border-gray-100 pt-3 mt-3">
          <SupportContact 
            variant="ghost" 
            size="sm" 
            className="w-full justify-start text-gray-600 hover:text-[#AA5E2F] hover:bg-gray-50 px-3 py-2.5 rounded-lg text-sm"
          />
        </div>
        
        {user ? (
          <>
            {/* User Info Section */}
            <div className="border-t border-gray-100 pt-3 mt-3">
              <div className="flex items-center px-3 py-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#AA5E2F] to-[#8B4513] flex items-center justify-center text-white text-xs font-bold mr-3">
                  {user.username?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{user.username}</p>
                  <p className="text-xs text-gray-500 capitalize">{user.tipo}</p>
                </div>
              </div>
              
              {/* Logout button */}
              <button
                className="flex items-center w-full px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-200"
                onClick={() => {
                  logoutMutation.mutate();
                  setIsOpen(false);
                }}
              >
                <LogOut className="h-4 w-4 mr-3" />
                <span>Sair</span>
              </button>
            </div>
          </>
        ) : (
          <div className="border-t border-gray-100 pt-3 mt-3">
            <button
              className="flex items-center w-full px-3 py-2.5 rounded-lg text-sm font-medium text-[#AA5E2F] hover:bg-[#AA5E2F]/10 transition-all duration-200"
              onClick={() => {
                navigate("/auth");
                setIsOpen(false);
              }}
            >
              <LogIn className="h-4 w-4 mr-3" />
              <span>Entrar</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const MobileMenuButton = () => {
  const { isOpen, setIsOpen } = useMobileMenu();
  
  return (
    <Button 
      variant="ghost" 
      size="icon"
      className="md:hidden text-[#1D1D1D] hover:text-[#AA5E2F]"
      onClick={() => setIsOpen(!isOpen)}
    >
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
      </svg>
    </Button>
  );
};

export default function Header() {
  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 md:py-4 flex items-center justify-between">
        <Logo />
        <NavLinks />
        <div className="flex items-center space-x-3">
          <UserMenu />
          <MobileUserMenu />
          <MobileMenuButton />
        </div>
      </div>
      <MobileMenu />
    </header>
  );
}
