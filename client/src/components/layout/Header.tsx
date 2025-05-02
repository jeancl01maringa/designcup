import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useMobileMenu } from "@/hooks/use-mobile-menu";
import { User } from "lucide-react";

const Logo = () => (
  <div className="flex items-center">
    <Link href="/" className="flex items-center">
      <svg className="h-7 w-7 text-[#A85C20]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
        <path d="M8 12a4 4 0 108 0 4 4 0 00-8 0z" stroke="currentColor" strokeWidth="2" fill="none" />
      </svg>
      <span className="ml-2 font-bold text-lg md:text-xl">
        <span className="text-[#2D2D2D]">Design</span><span className="text-[#A85C20]">paraEstética</span>
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
          className={`text-[#2D2D2D] hover:text-[#A85C20] font-medium text-sm ${location === item.path ? 'text-[#A85C20]' : ''}`}
        >
          {item.name}
        </Link>
      ))}
    </nav>
  );
};

const UserAvatar = () => (
  <div className="hidden md:flex items-center">
    <Button variant="ghost" size="icon" className="rounded-full overflow-hidden w-9 h-9 p-0">
      <img 
        src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=120&q=80" 
        alt="User Profile"
        className="w-full h-full object-cover"
      />
    </Button>
  </div>
);

const MobileMenu = () => {
  const [location] = useLocation();
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
            className={`block text-[#2D2D2D] hover:text-[#A85C20] font-medium text-base py-2 ${location === item.path ? 'text-[#A85C20]' : ''}`}
            onClick={() => setIsOpen(false)}
          >
            {item.name}
          </Link>
        ))}
        <div className="flex items-center gap-3 pt-2">
          <img 
            src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=120&q=80" 
            alt="User Profile"
            className="w-8 h-8 rounded-full object-cover"
          />
          <span className="text-[#2D2D2D] font-medium">Meu Perfil</span>
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
      className="md:hidden text-[#2D2D2D] hover:text-[#A85C20]"
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
          <UserAvatar />
          <MobileMenuButton />
        </div>
      </div>
      <MobileMenu />
    </header>
  );
}
