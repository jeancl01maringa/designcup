import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { Search, ChevronDown } from "lucide-react";

export function MobileSearchBar() {
  const [location, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFormat, setSelectedFormat] = useState("all");
  const [showFormatDropdown, setShowFormatDropdown] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const lastScrollY = useRef(0);
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down'>('up');

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

  // Scroll detection logic
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Show after scrolling down 100px
      if (currentScrollY > 100) {
        // Determine scroll direction
        if (currentScrollY > lastScrollY.current) {
          // Scrolling down - hide search bar
          setScrollDirection('down');
          setIsVisible(false);
        } else {
          // Scrolling up - show search bar
          setScrollDirection('up');
          setIsVisible(true);
        }
      } else {
        // At top of page - hide search bar
        setIsVisible(false);
      }
      
      lastScrollY.current = currentScrollY;
    };

    // Throttle scroll events
    let ticking = false;
    const scrollListener = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', scrollListener, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', scrollListener);
    };
  }, []);

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
    <div className={`md:hidden fixed top-[70px] left-0 right-0 bg-white shadow-lg border-b border-gray-200 z-40 transition-transform duration-300 ease-in-out ${
      isVisible ? 'translate-y-0' : '-translate-y-full'
    }`}>
      <div className="container-global py-3">
        <form onSubmit={handleSearch} className="flex items-center">
          <div className="relative flex items-center w-full border border-gray-300 rounded-full focus-within:ring-2 focus-within:ring-[#AA5E2F]/40 focus-within:border-[#AA5E2F] bg-white">
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
                <div 
                  className="absolute left-0 top-full mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-[9999]" 
                  ref={dropdownRef}
                >
                  <div className="py-1">
                    {formats.map((format) => (
                      <button
                        key={format.id}
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          selectFormat(format.id);
                        }}
                        className={`block w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${
                          selectedFormat === format.id ? 'bg-[#AA5E2F]/10 text-[#AA5E2F] font-medium' : 'text-gray-700'
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