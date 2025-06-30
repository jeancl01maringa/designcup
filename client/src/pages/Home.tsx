import HeroSection from "@/components/home/HeroSection";
import CategorySection from "@/components/home/CategorySection";
import ArtworkGrid from "@/components/home/ArtworkGrid";
import { useState, useEffect } from "react";
import { ChevronDown, Filter, TrendingUp, Clock, Calendar } from "lucide-react";

export default function Home() {
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [selectedSort, setSelectedSort] = useState("Em alta");

  const sortOptions = [
    { value: "trending", label: "Em alta", icon: TrendingUp },
    { value: "recent", label: "Recentes", icon: Clock },
    { value: "oldest", label: "Antigos", icon: Calendar }
  ];

  // Fechar dropdowns quando clicar fora
  useEffect(() => {
    const handleClickOutside = () => {
      setFilterDropdownOpen(false);
      setSortDropdownOpen(false);
    };

    if (filterDropdownOpen || sortDropdownOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [filterDropdownOpen, sortDropdownOpen]);

  return (
    <div className="min-h-screen bg-gray-50">
      <HeroSection />
      <CategorySection />
      
      {/* Feed Section with Title and Proper Margins */}
      <section className="py-16">
        <div className="container-global">
          {/* Header seguindo o mesmo padrão da seção de categorias */}
          <div className="mb-4 flex items-start justify-between">
            <div>
              <h3 className="text-black font-semibold text-lg font-inter mb-1 flex items-center">
                <span className="mr-2">🎨</span>
                Artes de alta qualidade para sua Clínica
              </h3>
              <p className="text-gray-600 text-sm font-light">
                Modelos premium, editáveis e prontos para usar
              </p>
              <div className="flex items-center mt-2">
                <div className="flex mt-1">
                  <span className="inline-block h-1 w-6 rounded-full bg-black mr-1"></span>
                  <span className="inline-block h-1 w-1 rounded-full bg-black/30 mr-1"></span>
                  <span className="inline-block h-1 w-1 rounded-full bg-black/30"></span>
                </div>
              </div>
            </div>
            
            {/* Filtros no canto superior direito */}
            <div className="flex items-center gap-2 md:gap-3">
              {/* Botão Filtros */}
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setFilterDropdownOpen(!filterDropdownOpen);
                    setSortDropdownOpen(false);
                  }}
                  className="bg-gray-800 hover:bg-gray-900 text-white px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium flex items-center gap-2 transition-colors"
                >
                  <Filter className="w-4 h-4" />
                  <span className="hidden sm:inline">Filtros</span>
                </button>
                
                {filterDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-gray-800 text-white rounded-lg shadow-lg z-50">
                    <div className="py-2">
                      <div className="px-4 py-2 text-sm font-medium border-b border-gray-600">
                        Filtros
                      </div>
                      <button 
                        onClick={() => {
                          setSelectedSort("Em alta");
                          setFilterDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-700 flex items-center gap-3 ${
                          selectedSort === "Em alta" ? 'bg-gray-700' : ''
                        }`}
                      >
                        <TrendingUp className="w-4 h-4" />
                        Em alta
                      </button>
                      <button 
                        onClick={() => {
                          setSelectedSort("Recentes");
                          setFilterDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-700 flex items-center gap-3 ${
                          selectedSort === "Recentes" ? 'bg-gray-700' : ''
                        }`}
                      >
                        <Clock className="w-4 h-4" />
                        Recentes
                      </button>
                      <button 
                        onClick={() => {
                          setSelectedSort("Antigos");
                          setFilterDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-700 flex items-center gap-3 ${
                          selectedSort === "Antigos" ? 'bg-gray-700' : ''
                        }`}
                      >
                        <Calendar className="w-4 h-4" />
                        Antigos
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Botão Destaques */}
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSortDropdownOpen(!sortDropdownOpen);
                    setFilterDropdownOpen(false);
                  }}
                  className="bg-gray-800 hover:bg-gray-900 text-white px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium flex items-center gap-2 transition-colors"
                >
                  <TrendingUp className="w-4 h-4" />
                  <span className="hidden sm:inline">Destaques</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
                
                {sortDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-gray-800 text-white rounded-lg shadow-lg z-50">
                    <div className="py-2">
                      <div className="px-4 py-2 text-sm font-medium border-b border-gray-600">
                        Destaques
                      </div>
                      {sortOptions.map((option) => {
                        const IconComponent = option.icon;
                        return (
                          <button
                            key={option.value}
                            onClick={() => {
                              setSelectedSort(option.label);
                              setSortDropdownOpen(false);
                            }}
                            className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-700 flex items-center gap-3 ${
                              selectedSort === option.label ? 'bg-gray-700' : ''
                            }`}
                          >
                            <IconComponent className="w-4 h-4" />
                            {option.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          <ArtworkGrid />
        </div>
      </section>
    </div>
  );
}
