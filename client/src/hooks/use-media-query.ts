import { useState, useEffect } from 'react';

/**
 * Hook personalizado para verificar se uma media query corresponde ao tamanho atual da tela
 * @param query A media query a ser verificada, ex: "(max-width: 768px)"
 * @returns Um booleano indicando se a query corresponde ao tamanho atual da tela
 */
export function useMediaQuery(query: string): boolean {
  // Estado para armazenar o resultado da correspondência da media query
  const [matches, setMatches] = useState<boolean>(false);

  useEffect(() => {
    // Criar o objeto MediaQueryList para a query fornecida
    const mediaQuery = window.matchMedia(query);
    
    // Definir o estado inicial com base na correspondência atual
    setMatches(mediaQuery.matches);

    // Função para atualizar o estado quando a correspondência mudar
    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Adicionar o listener para mudanças na media query
    mediaQuery.addEventListener('change', handleChange);

    // Cleanup: Remover o listener quando o componente for desmontado
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [query]); // Apenas re-executar se a query mudar

  return matches;
}