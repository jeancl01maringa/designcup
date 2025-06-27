import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Star, Users, Search, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HeroSection() {
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const formatParam = selectedFormat !== "all" ? `&format=${selectedFormat}` : "";
      navigate(`/todas-artes?search=${encodeURIComponent(searchQuery.trim())}${formatParam}`);
    }
  };
  return (
    <section className="bg-gradient-to-b from-[#FFF4E9] to-[#FFFCF9] pt-20 pb-8 md:pb-12">
      <div className="container-global flex flex-col items-center text-center">
        {/* Badges - Always side by side */}
        <div className="flex flex-row justify-center gap-2 sm:gap-4 md:gap-6 mb-4 sm:mb-6 px-4">
          <div className="bg-white/70 backdrop-blur-sm rounded-full py-1.5 sm:py-2 px-2 sm:px-3 md:px-4 flex items-center justify-center shadow-sm border border-white/20 text-center">
            <Users className="h-3 w-3 sm:h-4 sm:w-4 text-primary mr-1 sm:mr-1.5 flex-shrink-0" />
            <span className="text-xs font-medium text-[#1D1D1D] whitespace-nowrap">+3 mil membros</span>
          </div>
          <div className="bg-white/70 backdrop-blur-sm rounded-full py-1.5 sm:py-2 px-2 sm:px-3 md:px-4 flex items-center justify-center shadow-sm border border-white/20 text-center">
            <Star className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500 fill-yellow-500 mr-1 sm:mr-1.5 flex-shrink-0" />
            <span className="text-xs font-medium text-[#1D1D1D] whitespace-nowrap">Avaliado 5 estrelas</span>
          </div>
        </div>
        
        {/* Main Heading - Fixed line breaks */}
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-[#1D1D1D] leading-tight mb-4 sm:mb-6 font-montserrat px-4 sm:px-0">
          <span className="block">A Melhor plataforma</span>
          <span className="block text-[#AA5E2F] bg-gradient-to-r from-[#AA5E2F] to-[#C8763A] bg-clip-text text-transparent">de Artes para Estética</span>
          <span className="block text-[#AA5E2F] bg-gradient-to-r from-[#AA5E2F] to-[#C8763A] bg-clip-text text-transparent">do Brasil</span>
        </h1>
        
        {/* Description - Reduced font sizes */}
        <p className="text-[#4B4B4B] text-sm sm:text-base md:text-lg mb-6 sm:mb-8 max-w-3xl font-sans font-light leading-relaxed px-4 sm:px-0">
          <span className="text-[#1D1D1D] font-semibold">Artes 100% editáveis</span> para sua <span className="text-[#1D1D1D] font-semibold">clínica de estética,</span> criadas para facilitar<br className="hidden sm:block" /> 
          sua rotina com <span className="text-[#1D1D1D] font-semibold">qualidade profissional.</span>
        </p>
        
        {/* Search Bar with Format Dropdown - Hidden on mobile */}
        <div className="hidden md:block w-full max-w-2xl mt-8">
          <form onSubmit={handleSearch} className="relative flex items-center">
            <input
              type="text"
              placeholder="Busque por artes, categorias, temas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full py-4 px-6 pr-40 rounded-xl border border-gray-200 bg-white/90 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[#AA5E2F]/40 focus:border-[#AA5E2F] transition-all font-sans text-base placeholder:text-gray-400"
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
                  <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded-lg shadow-xl z-[9999]" style={{ zIndex: 9999 }}>
                    <div className="py-2">
                      {formats.map(format => (
                        <button
                          key={format.id}
                          type="button"
                          onClick={() => selectFormat(format.id)}
                          className={`w-full text-left px-4 py-3 text-sm transition-colors duration-150 flex items-center gap-3
                            ${format.id === selectedFormat 
                              ? 'bg-gray-100 text-gray-900 font-medium border-l-2 border-gray-400' 
                              : 'text-gray-700 hover:bg-gray-100'}`}
                        >
                          <div className="w-5 h-5 flex items-center justify-center">
                            {format.id === 'feed' && (
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clipRule="evenodd" />
                              </svg>
                            )}
                            {format.id === 'poster' && (
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                              </svg>
                            )}
                            {format.id === 'stories' && (
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                              </svg>
                            )}
                            {format.id === 'images' && (
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                              </svg>
                            )}
                            {format.id === 'all' && (
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                          <span>{format.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <Button 
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-12 px-4 rounded-xl bg-[#191c2c] hover:bg-[#14182a] shadow-lg transition-all duration-200"
            >
              <Search className="h-5 w-5 text-white" />
            </Button>
          </form>
        </div>
      </div>
    </section>
  );
}
