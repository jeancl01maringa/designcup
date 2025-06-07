import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export function useSocialMedia() {
  const { data: socialSettings, isLoading } = useQuery({
    queryKey: ["/api/settings/social-media"],
    queryFn: async () => {
      try {
        const [instagram, facebook, pinterest] = await Promise.all([
          apiRequest("GET", "/api/settings/instagram_link").then(r => r.json()).catch(() => null),
          apiRequest("GET", "/api/settings/facebook_link").then(r => r.json()).catch(() => null),
          apiRequest("GET", "/api/settings/pinterest_link").then(r => r.json()).catch(() => null),
        ]);
        
        return {
          instagram: instagram?.value || "",
          facebook: facebook?.value || "",
          pinterest: pinterest?.value || "",
        };
      } catch (error) {
        return {
          instagram: "",
          facebook: "",
          pinterest: "",
        };
      }
    },
  });

  return {
    instagram: socialSettings?.instagram || "",
    facebook: socialSettings?.facebook || "",
    pinterest: socialSettings?.pinterest || "",
    isLoading,
  };
}