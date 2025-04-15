import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useMobileMenu } from "@/hooks/use-mobile-menu";

const Logo = () => (
  <div className="flex items-center">
    <Link href="/" className="flex items-center">
      <svg className="h-8 w-8 text-primary" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
        <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
        <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
      </svg>
      <span className="ml-2 text-gray-900 font-serif font-semibold text-lg md:text-xl">Design para Estética</span>
    </Link>
  </div>
);

const NavLinks = () => {
  const [location] = useLocation();
  
  const navItems = [
    { name: "Início", path: "/" },
    { name: "Categorias", path: "/categorias" },
    { name: "Vídeo Aulas", path: "/video-aulas" },
    { name: "Mais", path: "/mais" }
  ];
  
  return (
    <nav className="hidden md:flex items-center space-x-6">
      {navItems.map((item) => (
        <Link 
          key={item.path} 
          href={item.path}
          className={`text-gray-900 hover:text-primary font-medium text-sm ${location === item.path ? 'text-primary' : ''}`}
        >
          {item.name}
        </Link>
      ))}
    </nav>
  );
};

const AuthButtons = () => (
  <div className="hidden md:flex items-center space-x-3">
    <Button variant="outline" className="text-primary border-primary hover:bg-primary/10">
      Entrar
    </Button>
    <Button className="bg-primary text-white hover:bg-primary/90">
      Cadastre-se
    </Button>
  </div>
);

const MobileMenu = () => {
  const [location] = useLocation();
  const { isOpen, setIsOpen } = useMobileMenu();
  
  const navItems = [
    { name: "Início", path: "/" },
    { name: "Categorias", path: "/categorias" },
    { name: "Vídeo Aulas", path: "/video-aulas" },
    { name: "Mais", path: "/mais" }
  ];
  
  if (!isOpen) return null;
  
  return (
    <div className="md:hidden">
      <div className="px-4 pt-2 pb-4 space-y-3 bg-white">
        {navItems.map((item) => (
          <Link 
            key={item.path} 
            href={item.path}
            className={`block text-gray-900 hover:text-primary font-medium text-base py-2 ${location === item.path ? 'text-primary' : ''}`}
            onClick={() => setIsOpen(false)}
          >
            {item.name}
          </Link>
        ))}
        <div className="flex flex-col pt-2 space-y-2">
          <Button variant="outline" className="text-primary border-primary hover:bg-primary/10 w-full">
            Entrar
          </Button>
          <Button className="bg-primary text-white hover:bg-primary/90 w-full">
            Cadastre-se
          </Button>
        </div>
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
      className="md:hidden text-gray-900 hover:text-primary"
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
        <AuthButtons />
        <MobileMenuButton />
      </div>
      <MobileMenu />
    </header>
  );
}
