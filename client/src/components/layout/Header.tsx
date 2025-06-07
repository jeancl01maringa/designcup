import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useMobileMenu } from "@/hooks/use-mobile-menu";
import { useAuth } from "@/hooks/use-auth";
import { useSupportNumber } from "@/hooks/use-support-number";
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

const Logo = () => (
  <div className="flex items-center">
    <Link href="/" className="flex items-center">
      <svg className="h-7 w-7 text-[#AA5E2F]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
        <path d="M8 12a4 4 0 108 0 4 4 0 00-8 0z" stroke="currentColor" strokeWidth="2" fill="none" />
      </svg>
      <span className="ml-2 font-bold text-lg md:text-xl">
        <span className="text-[#1D1D1D]">Design</span><span className="text-[#AA5E2F]">paraEstética</span>
      </span>
    </Link>
  </div>
);

const NavLinks = () => {
  const [location] = useLocation();
  
  const navItems = [
    { name: "Início", path: "/" },
    { name: "Categorias", path: "/categorias" },
    { name: "Planos", path: "/planos" },
    { name: "Tutoriais", path: "/tutoriais" },
    { name: "Suporte", path: "/suporte" }
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
          variant="ghost" 
          size="sm" 
          className="flex items-center gap-1"
          onClick={() => navigate("/auth")}
        >
          <LogIn className="h-4 w-4" />
          <span>Entrar</span>
        </Button>
        <Button 
          variant="default" 
          size="sm"
          className="flex items-center gap-1"
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
          className="flex items-center gap-1 border-primary text-primary hover:bg-primary/10"
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
          <span>Painel Admin</span>
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

const MobileMenu = () => {
  const [location, navigate] = useLocation();
  const { user, logoutMutation } = useAuth();
  const { isOpen, setIsOpen } = useMobileMenu();
  
  const navItems = [
    { name: "Início", path: "/" },
    { name: "Categorias", path: "/categorias" },
    { name: "Planos", path: "/planos" },
    { name: "Tutoriais", path: "/tutoriais" },
    { name: "Suporte", path: "/suporte" }
  ];
  
  if (!isOpen) return null;
  
  return (
    <div className="md:hidden">
      <div className="px-4 pt-2 pb-4 space-y-3 bg-white">
        {navItems.map((item) => (
          <Link 
            key={item.path} 
            href={item.path}
            className={`block text-[#1D1D1D] hover:text-[#AA5E2F] font-medium text-base py-2 transition-colors ${location === item.path ? 'text-[#AA5E2F]' : ''}`}
            onClick={() => setIsOpen(false)}
          >
            {item.name}
          </Link>
        ))}
        
        {/* Support Contact for Mobile */}
        <div className="border-t border-muted pt-4 mt-2">
          <SupportContact 
            variant="ghost" 
            size="default" 
            className="w-full justify-start text-primary hover:text-primary/80"
          />
        </div>
        
        {user ? (
          <>
            <div className="flex items-center gap-3 border-t border-muted pt-4 mt-2">
              <div className="rounded-full overflow-hidden w-8 h-8 bg-primary/20 flex items-center justify-center text-primary">
                <User className="h-4 w-4" />
              </div>
              <span className="text-[#1D1D1D] font-medium">{user.username}</span>
            </div>
            
            {Boolean(user.isAdmin) && (
              <Link 
                href="/admin"
                className="flex items-center gap-2 text-primary hover:text-primary/80 font-medium text-base py-3 transition-colors border border-primary/50 rounded-md px-3 mt-3 mb-1"
                onClick={() => setIsOpen(false)}
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="18" 
                  height="18" 
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
                <span>Painel Admin</span>
              </Link>
            )}
            
            <button
              className="flex items-center gap-2 text-destructive hover:text-destructive/80 font-medium text-base py-2 transition-colors w-full text-left"
              onClick={() => {
                logoutMutation.mutate();
                setIsOpen(false);
              }}
            >
              <LogOut className="h-4 w-4" />
              <span>Sair</span>
            </button>
          </>
        ) : (
          <div className="flex flex-col gap-2 border-t border-muted pt-4 mt-2">
            <button
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground font-medium text-base py-2 transition-colors"
              onClick={() => {
                navigate("/auth");
                setIsOpen(false);
              }}
            >
              <LogIn className="h-4 w-4" />
              <span>Entrar</span>
            </button>
            
            <button
              className="flex items-center gap-2 text-primary hover:text-primary/80 font-medium text-base py-2 transition-colors"
              onClick={() => {
                navigate("/auth");
                setIsOpen(false);
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
          <SupportContact className="hidden md:flex" />
          <UserMenu />
          <MobileMenuButton />
        </div>
      </div>
      <MobileMenu />
    </header>
  );
}
