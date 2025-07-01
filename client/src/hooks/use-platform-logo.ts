import { useQuery } from "@tanstack/react-query";

interface LogoData {
  dataUrl: string;
  filename: string;
  mimeType: string;
}

export function usePlatformLogo() {
  const { data: logoData, isLoading, error } = useQuery<LogoData>({
    queryKey: ["/api/logo"],
    queryFn: async () => {
      const response = await fetch('/api/logo');
      if (!response.ok) {
        throw new Error('Logo não encontrado');
      }
      return response.json();
    },
    retry: false,
    refetchOnWindowFocus: false,
  });

  return {
    logoUrl: logoData?.dataUrl || null,
    hasCustomLogo: !!logoData?.dataUrl,
    isLoading,
    error
  };
}