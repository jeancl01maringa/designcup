import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export function useSupportNumber() {
  const { data: supportSetting, isLoading } = useQuery({
    queryKey: ["/api/settings/numero_suporte"],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", "/api/settings/numero_suporte");
        return await response.json();
      } catch (error) {
        return null;
      }
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const formatSupportNumber = (number: string) => {
    // Remove all non-digit characters
    const cleaned = number.replace(/\D/g, '');
    // Return formatted for WhatsApp link
    return cleaned;
  };

  const getSupportWhatsAppUrl = () => {
    if (!supportSetting?.value) return null;
    const cleanNumber = formatSupportNumber(supportSetting.value);
    return `https://wa.me/55${cleanNumber}`;
  };

  return {
    supportNumber: supportSetting?.value || null,
    whatsappUrl: getSupportWhatsAppUrl(),
    isLoading,
  };
}