import { useState } from "react";
import { useLocation } from "wouter";
import { Search, X } from "lucide-react";
import { usePixelUserActions } from "@/hooks/use-facebook-pixel";

export function MobileSearchBar() {
  const [location, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { trackSearch } = usePixelUserActions();

  // Se esconder em rotas onde a barra de pesquisa/modal não faz sentido, mas no App.tsx já tem a lógica.
  // Porém App.tsx renderiza o MobileSearchBar.

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Track search event no Facebook Pixel
      trackSearch(searchQuery.trim(), undefined);

      // Verificar se o termo de busca é um número (possível ID)
      const isNumeric = /^\d+$/.test(searchQuery.trim());
      if (isNumeric) {
        try {
          const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery.trim())}`);
          const results = await response.json();

          if (results && results.length > 0) {
            navigate(`/preview/${searchQuery.trim()}`);
            setIsModalOpen(false);
            return;
          }
        } catch (error) {
          console.error('Erro ao buscar post:', error);
        }
      }

      // Busca normal
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsModalOpen(false);
    }
  };

  return (
    <>
      {/* Ícone fixo de pesquisa (Floating Action Button) */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="md:hidden fixed bottom-6 right-6 w-14 h-14 bg-primary text-white rounded-full flex items-center justify-center shadow-[0_8px_30px_rgb(0,0,0,0.3)] z-40 hover:scale-105 transition-transform"
        aria-label="Abrir pesquisa"
      >
        <Search className="w-6 h-6" />
      </button>

      {/* Modal de Pesquisa */}
      {isModalOpen && (
        <div className="md:hidden fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Fundo escuro */}
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
          />

          {/* Conteúdo do modal */}
          <div className="relative w-full max-w-sm animate-in fade-in zoom-in-95 duration-200">
            <form onSubmit={handleSearch} className="space-y-4">
              {/* Campo de input */}
              <div className="relative flex items-center w-full">
                <Search className="absolute left-4 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Busque por arquivos"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-14 pl-12 pr-12 bg-[#121212] border border-primary rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground shadow-lg"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="absolute right-3 p-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Botão de buscar */}
              <button
                type="submit"
                className="w-full h-14 bg-primary text-white font-semibold text-lg rounded-2xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
              >
                Buscar
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}