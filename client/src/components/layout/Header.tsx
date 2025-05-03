import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useMobileMenu } from "@/hooks/use-mobile-menu";
import { useAuth } from "@/hooks/use-auth";
import { 
  User, 
  LogOut, 
  LogIn, 
  UserPlus,
  ChevronDown
} from "lucide-react";
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
    { name: "Designers", path: "/designers" },
    { name: "Formatos", path: "/formatos" },
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
  
  return (
    <div className="hidden md:flex items-center">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex items-center gap-2 font-normal hover:bg-muted/60">
            <div className="rounded-full overflow-hidden w-8 h-8 p-0">
              <div className="w-full h-full bg-primary/20 flex items-center justify-center text-primary">
                <User className="h-4 w-4" />
              </div>
            </div>
            <span className="max-w-[100px] truncate">{user.username}</span>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => navigate("/perfil")}>
            <User className="mr-2 h-4 w-4" />
            <span>Meu Perfil</span>
          </DropdownMenuItem>
          
          {user.isAdmin && (
            <DropdownMenuItem onClick={() => navigate("/admin")}>
              <span>Painel Admin</span>
            </DropdownMenuItem>
          )}
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={() => logoutMutation.mutate()}
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>Sair</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
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
    { name: "Designers", path: "/designers" },
    { name: "Formatos", path: "/formatos" },
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
        
        {user ? (
          <>
            <div className="flex items-center gap-3 border-t border-muted pt-4 mt-2">
              <div className="rounded-full overflow-hidden w-8 h-8 bg-primary/20 flex items-center justify-center text-primary">
                <User className="h-4 w-4" />
              </div>
              <span className="text-[#1D1D1D] font-medium">{user.username}</span>
            </div>
            
            {user.is_admin && (
              <Link 
                href="/admin"
                className="block text-primary hover:text-primary/80 font-medium text-base py-2 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                Painel Admin
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
          <UserMenu />
          <MobileMenuButton />
        </div>
      </div>
      <MobileMenu />
    </header>
  );
}
