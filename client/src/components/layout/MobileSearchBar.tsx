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
                <div 
                  className="absolute left-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50" 
                  ref={dropdownRef}
                >
                  <div className="py-2">
                    <div className="px-4 py-2 text-sm font-medium border-b border-gray-200 text-gray-900">
                      Formatos
                    </div>
                    {formats.map((format) => (
                      <button
                        key={format.id}
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          selectFormat(format.id);
                        }}
                        className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-50 flex items-center gap-3 text-gray-700 ${
                          selectedFormat === format.id ? 'bg-gray-50' : ''
                        }`}
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
                              <path fillRule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5zm5.771 7H5V5h10v7H8.771z" clipRule="evenodd" />
                            </svg>
                          )}
                          {format.id === 'images' && (
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
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