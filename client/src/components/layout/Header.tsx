import { useState, useEffect, useRef } from "react";
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
  MessageSquare,
  X,
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

const HeaderSearchBar = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFormat, setSelectedFormat] = useState("all");
  const [showFormatDropdown, setShowFormatDropdown] = useState(false);
  const [, navigate] = useLocation();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const formats = [
    { id: "all", name: "Formatos" },
    { id: "feed", name: "Feed" },
    { id: "poster", name: "Cartaz" },
    { id: "stories", name: "Stories" },
    { id: "images", name: "Imagens" }
  ];

  const selectFormat = (formatId: string) => {
    setSelectedFormat(formatId);
    setShowFormatDropdown(false);
  };

  const getFormatName = (formatId: string) => {
    return formats.find(f => f.id === formatId)?.name || "Formatos";
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const formatParam = selectedFormat !== "all" ? `&format=${selectedFormat}` : "";
      navigate(`/todas-artes?search=${encodeURIComponent(searchQuery.trim())}${formatParam}`);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowFormatDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <form onSubmit={handleSearch} className="flex items-center w-full max-w-2xl">
      <div className="relative flex items-center w-full border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-[#AA5E2F]/40 focus-within:border-[#AA5E2F] overflow-hidden">
        <input
          type="text"
          placeholder="Busque por artes, categorias, temas..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 py-2.5 px-3 border-0 focus:outline-none text-sm bg-transparent"
        />
        
        {/* Format Dropdown */}
        <div className="relative">
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setShowFormatDropdown(!showFormatDropdown)}
              className="flex items-center justify-between text-xs px-2 py-2.5 min-w-[75px] text-gray-700 bg-gray-50 hover:bg-gray-100 transition-colors duration-150 focus:outline-none border-l border-gray-200"
            >
              <span className="text-xs">{getFormatName(selectedFormat)}</span>
              <ChevronDown className="ml-1 h-3 w-3 text-gray-500" />
            </button>
            
            {showFormatDropdown && (
              <div className="absolute right-0 top-full mt-1 w-32 bg-white border border-gray-200 rounded-lg shadow-xl z-[9999] overflow-hidden">
                <div className="py-1">
                  {formats.map(format => (
                    <button
                      key={format.id}
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        selectFormat(format.id);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs transition-colors duration-150 hover:bg-gray-100 focus:outline-none focus:bg-gray-100
                        ${format.id === selectedFormat 
                          ? 'bg-blue-50 text-blue-700 font-medium' 
                          : 'text-gray-700'}`}
                    >
                      {format.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        
        <Button 
          type="submit"
          className="h-[35px] px-3 bg-black hover:bg-black/80 text-white border-0 rounded-r-lg"
        >
          <Search className="h-4 w-4" />
        </Button>
      </div>
    </form>
  );
};

const NavLinks = ({ showSearchBar }: { showSearchBar: boolean }) => {
  const [location] = useLocation();
  
  const navItems = [
    { name: "Início", path: "/" },
    { name: "Categorias", path: "/categorias" },
    { name: "Cursos", path: "/cursos" },
    { name: "Planos", path: "/planos" }
  ];
  
  if (showSearchBar) {
    return <HeaderSearchBar />;
  }
  
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
          size="sm" 
          className="flex items-center gap-1 bg-[#191c2c] hover:bg-[#14182a] text-white px-3 py-1.5 text-xs rounded-full"
          onClick={() => navigate("/auth")}
        >
          <LogIn className="h-3 w-3" />
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
    { name: "Tutoriais", path: "/tutoriais" },
    { name: "Suporte", path: "/suporte" }
  ];
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/20" onClick={() => setIsOpen(false)} />
      
      {/* Menu Content */}
      <div className="fixed inset-0 bg-white">
        {/* Header do Menu */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>
        
        {/* Content do Menu */}
        <div className="px-4 py-6 space-y-6">
          {/* Seção Navegação */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
              Navegação
            </h3>
            <div className="space-y-1">
              {navItems.map((item) => (
                <Link 
                  key={item.path} 
                  href={item.path}
                  className={`flex items-center px-3 py-3 rounded-lg text-base font-medium transition-all duration-200 ${
                    location === item.path 
                      ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600' 
                      : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
          
          {/* Seção Conta */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
              Conta
            </h3>
            <div className="space-y-1">
              {user ? (
                <>
                  {/* Informações do usuário logado */}
                  <div className="flex items-center px-3 py-3 rounded-lg bg-gray-50">
                    <div className="w-10 h-10 rounded-full overflow-hidden mr-3">
                      {user.profileImage ? (
                        <img 
                          src={user.profileImage} 
                          alt={user.username}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-blue-100 flex items-center justify-center text-blue-600">
                          <User className="h-5 w-5" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-medium text-gray-900 truncate">{user.username}</p>
                      <p className="text-sm text-gray-500 capitalize">{user.tipo}</p>
                    </div>
                  </div>
                  
                  <button
                    className="flex items-center w-full px-3 py-3 rounded-lg text-base font-medium text-red-600 hover:bg-red-50 transition-all duration-200"
                    onClick={() => {
                      logoutMutation.mutate();
                      setIsOpen(false);
                    }}
                  >
                    <LogOut className="h-5 w-5 mr-3" />
                    <span>Sair da conta</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    className="flex items-center w-full px-4 py-4 rounded-full text-lg font-medium bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg transition-all duration-300 h-14"
                    onClick={() => {
                      navigate("/planos");
                      setIsOpen(false);
                    }}
                  >
                    <svg className="h-6 w-6 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732L14.146 12.8l-1.179 4.456a1 1 0 01-1.934 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732L9.854 7.2l1.179-4.456A1 1 0 0112 2z" clipRule="evenodd" />
                    </svg>
                    <span>Assine o Premium</span>
                  </button>
                  
                  <button
                    className="flex items-center w-full px-4 py-4 rounded-full text-lg font-medium border border-black text-black hover:bg-black hover:text-white bg-transparent transition-all duration-200 h-14"
                    onClick={() => {
                      navigate("/auth");
                      setIsOpen(false);
                      // Ativar a tab de registro após navegar
                      setTimeout(() => {
                        document.querySelector('[value="register"]')?.dispatchEvent(
                          new MouseEvent('click', { bubbles: true })
                        );
                      }, 100);
                    }}
                  >
                    <UserPlus className="h-6 w-6 mr-3" />
                    <span>Criar uma conta</span>
                  </button>
                  
                  <button
                    className="flex items-center w-full px-4 py-4 rounded-full text-lg font-medium bg-black text-white hover:bg-gray-800 transition-all duration-200 h-14"
                    onClick={() => {
                      navigate("/auth");
                      setIsOpen(false);
                    }}
                  >
                    <LogIn className="h-6 w-6 mr-3" />
                    <span>Entrar na minha conta</span>
                  </button>
                </>
              )}
            </div>
          </div>
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
  const { isOpen } = useMobileMenu();
  const [location] = useLocation();
  const [showSearchInHeader, setShowSearchInHeader] = useState(false);

  // Only show search bar in header on home page when scrolled below original search section
  useEffect(() => {
    if (location !== '/') {
      setShowSearchInHeader(false);
      return;
    }

    const handleScroll = () => {
      // Check if user scrolled past the hero section (approximately 400px)
      const scrollY = window.scrollY;
      const heroSectionHeight = 400; // Approximate height where search bar is no longer visible
      
      setShowSearchInHeader(scrollY > heroSectionHeight);
    };

    window.addEventListener('scroll', handleScroll);
    
    // Check initial scroll position
    handleScroll();
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [location]);
  
  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      {/* Cabeçalho principal - oculto quando menu mobile está aberto */}
      <div className={`container-global py-5 flex items-center transition-all duration-300 h-[94px] ${isOpen ? 'md:flex hidden' : 'flex'} ${showSearchInHeader ? 'justify-between' : 'justify-between'}`}>
        
        {/* Layout Desktop - mantém estrutura original */}
        <div className="hidden md:flex items-center justify-between w-full">
          {/* Logo - posicionado à esquerda */}
          <div className="flex-shrink-0 w-36">
            <Logo />
          </div>
          
          {/* Barra de pesquisa centralizada ou links de navegação */}
          <div className={`${showSearchInHeader ? 'flex-1 flex justify-center max-w-3xl' : ''}`}>
            <NavLinks showSearchBar={showSearchInHeader} />
          </div>
          
          {/* Botões do usuário - posicionados à direita */}
          <div className="flex items-center space-x-2 flex-shrink-0 w-36 justify-end">
            <UserMenu />
          </div>
        </div>

        {/* Layout Mobile - nova estrutura */}
        <div className="flex md:hidden items-center justify-between w-full">
          {/* Botão Entrar - lado esquerdo */}
          <div className="flex-shrink-0">
            <MobileUserMenu />
          </div>
          
          {/* Logo - centralizado */}
          <div className="flex-1 flex justify-center">
            <Logo />
          </div>
          
          {/* Menu hambúrguer - lado direito */}
          <div className="flex-shrink-0">
            <MobileMenuButton />
          </div>
        </div>
        
      </div>
      
      {/* Barra de pesquisa mobile - aparece quando a original sai de vista */}
      {showSearchInHeader && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 py-3">
          <HeaderSearchBar />
        </div>
      )}
      
      <MobileMenu />
    </header>
  );
}
