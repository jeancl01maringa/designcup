import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";

export function usePlatformLogo() {
  const { data: logoSetting, isLoading, error } = useQuery({
    queryKey: ["/api/settings/logo_url"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  const logoUrl = (logoSetting as any)?.value || null;

  return {
    logoUrl,
    hasCustomLogo: !!logoUrl,
    isLoading,
    error
  };
}