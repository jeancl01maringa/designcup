import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { Search, ChevronDown } from "lucide-react";

export function MobileSearchBar() {
  const [location, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFormat, setSelectedFormat] = useState("all");
  const [showFormatDropdown, setShowFormatDropdown] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
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

  // Handle scroll to show/hide mobile search bar
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // No topo da página - sempre mostrar
      if (currentScrollY <= 50) {
        setIsVisible(true);
      } else {
        // Detectar direção do scroll - simples e direto
        if (currentScrollY < lastScrollY) {
          // Rolando para cima - sempre mostrar
          setIsVisible(true);
        } else if (currentScrollY > lastScrollY) {
          // Rolando para baixo - ocultar
          setIsVisible(false);
        }
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

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
    <div className={`md:hidden bg-gray-100 border-b border-gray-200 relative z-10 transition-transform duration-300 ${
      isVisible ? 'translate-y-0' : '-translate-y-full'
    }`}>
      <div className="container-global py-3">
        <form onSubmit={handleSearch} className="flex items-center">
          <div className="relative flex items-center w-full border border-gray-300 rounded-full focus-within:ring-2 focus-within:ring-[#AA5E2F]/40 focus-within:border-[#AA5E2F] overflow-hidden bg-white">
            {/* Hambúrguer dos formatos à esquerda */}
            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowFormatDropdown(prev => !prev);
                }}
                className="flex items-center justify-center py-3 px-3 text-gray-400 hover:text-gray-600 transition-colors duration-150 focus:outline-none border-r border-gray-200 bg-gray-50"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                <ChevronDown className="ml-1 h-3 w-3" />
              </button>
              
              {/* Dropdown dos formatos */}
              {showFormatDropdown && (
                <div className="absolute left-0 top-full mt-1 w-32 bg-white border border-gray-200 rounded-lg shadow-xl z-[9999] overflow-hidden" ref={dropdownRef}>
                  <div className="py-1">
                    {formats.map((format) => (
                      <button
                        key={format.id}
                        type="button"
                        onClick={() => selectFormat(format.id)}
                        className={`block w-full text-left px-3 py-2 text-xs hover:bg-gray-50 transition-colors ${
                          selectedFormat === format.id ? 'bg-[#AA5E2F]/10 text-[#AA5E2F]' : 'text-gray-700'
                        }`}
                      >
                        {format.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Campo de pesquisa no meio */}
            <input
              type="text"
              placeholder="Busque por artes, categorias..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 py-3 px-3 border-0 focus:outline-none text-sm bg-transparent placeholder:truncate"
            />
            
            {/* Botão de pesquisa à direita */}
            <button
              type="submit"
              className="flex items-center justify-center w-10 h-10 bg-[#191c2c] text-white hover:bg-[#14182a] transition-colors duration-150 focus:outline-none rounded-full mx-1"
            >
              <Search className="h-4 w-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}