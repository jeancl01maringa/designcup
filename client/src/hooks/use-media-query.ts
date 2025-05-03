import { useEffect, useState } from "react";

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(() => {
    // Verificar se está no navegador
    if (typeof window !== "undefined") {
      return window.matchMedia(query).matches;
    }
    // Padrão para desktop no servidor
    return false;
  });

  useEffect(() => {
    // Executar apenas no cliente
    if (typeof window !== "undefined") {
      const mediaQuery = window.matchMedia(query);
      
      // Definir o valor inicial
      setMatches(mediaQuery.matches);
      
      // Ouvir por mudanças
      const handleChange = (event: MediaQueryListEvent) => {
        setMatches(event.matches);
      };
      
      // Adicionar o listener para o evento change (compatível com navegadores modernos)
      mediaQuery.addEventListener("change", handleChange);
      
      // Cleanup function
      return () => {
        mediaQuery.removeEventListener("change", handleChange);
      };
    }
  }, [query]);

  return matches;
}