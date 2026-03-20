import HeroSection from "@/components/home/HeroSection";
import CategorySection from "@/components/home/CategorySection";
import ArtworkGrid from "@/components/home/ArtworkGrid";
import { useState, useEffect } from "react";
import { Filter, TrendingUp, Clock, Calendar } from "lucide-react";

export default function Home() {
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const [selectedSort, setSelectedSort] = useState("Em alta");

  // Fechar dropdown quando clicar fora
  useEffect(() => {
    const handleClickOutside = () => {
      setFilterDropdownOpen(false);
    };

    if (filterDropdownOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [filterDropdownOpen]);

  return (
    <div className="min-h-screen bg-background">
      <HeroSection />
      <CategorySection />

      {/* Feed Section with Title and Proper Margins */}
      <section className="py-16">
        <div className="container-global">
          {/* Header seguindo o mesmo padrão da seção de categorias */}
          <div className="mb-4 flex items-start justify-between">
            <div>
              <h3 className="text-foreground font-semibold text-sm sm:text-base md:text-lg font-inter mb-1 flex items-center">
                Artes de alta qualidade para sua Loja
              </h3>
              <p className="text-muted-foreground text-xs sm:text-sm font-light">
                Modelos premium, profissionais e prontos para uso
              </p>
              <div className="flex items-center mt-2">
                <div className="flex mt-1">
                  <span className="inline-block h-1 w-6 rounded-full bg-foreground mr-1"></span>
                  <span className="inline-block h-1 w-1 rounded-full bg-foreground/30 mr-1"></span>
                  <span className="inline-block h-1 w-1 rounded-full bg-foreground/30"></span>
                </div>
              </div>
            </div>

            {/* Filtros no canto superior direito */}
            <div className="flex items-center">
              {/* Botão Filtros */}
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setFilterDropdownOpen(!filterDropdownOpen);
                  }}
                  className="bg-background hover:bg-accent text-foreground px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors border border-border shadow-sm"
                >
                  <Filter className="w-3 h-3" />
                  Filtros
                </button>

                {filterDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-popover border border-border rounded-lg shadow-lg z-50">
                    <div className="py-2">
                      <div className="px-4 py-2 text-sm font-medium border-b border-border text-foreground">
                        Filtros
                      </div>
                      <button
                        onClick={() => {
                          setSelectedSort("Em alta");
                          setFilterDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-3 text-sm hover:bg-accent flex items-center gap-3 text-foreground ${selectedSort === "Em alta" ? 'bg-accent' : ''
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
                        className={`w-full text-left px-4 py-3 text-sm hover:bg-accent flex items-center gap-3 text-foreground ${selectedSort === "Recentes" ? 'bg-accent' : ''
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
                        className={`w-full text-left px-4 py-3 text-sm hover:bg-accent flex items-center gap-3 text-foreground ${selectedSort === "Antigos" ? 'bg-accent' : ''
                          }`}
                      >
                        <Calendar className="w-4 h-4" />
                        Antigos
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          <ArtworkGrid sortOrder={selectedSort} />
        </div>
      </section>
    </div>
  );
}
