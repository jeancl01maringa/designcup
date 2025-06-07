import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";

export function usePlatformLogo() {
  const { data: logoSetting, isLoading } = useQuery({
    queryKey: ["/api/settings/logo_plataforma"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    staleTime: 1000 * 60 * 5, // Cache por 5 minutos
  });

  const logoUrl = (logoSetting as any)?.value;
  
  return {
    logoUrl,
    hasCustomLogo: !!logoUrl,
    isLoading
  };
}