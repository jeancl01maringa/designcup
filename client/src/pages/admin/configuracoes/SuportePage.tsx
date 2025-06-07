import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AdminLayout } from "@/components/admin/layout/AdminLayout";
import { PageHeader } from "@/components/admin/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Phone, Save, Loader2, Instagram, Facebook } from "lucide-react";

const supportSchema = z.object({
  numero_suporte: z.string()
    .min(1, "Número de suporte é obrigatório")
    .regex(/^[\d\s\(\)\-\+]+$/, "Formato de telefone inválido"),
});

const socialMediaSchema = z.object({
  instagram_link: z.string().optional(),
  facebook_link: z.string().optional(),
  pinterest_link: z.string().optional(),
});

type SupportFormData = z.infer<typeof supportSchema>;
type SocialMediaFormData = z.infer<typeof socialMediaSchema>;

export default function SuportePage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [isSocialLoading, setIsSocialLoading] = useState(false);

  // Buscar configuração atual do número de suporte
  const { data: supportSetting, isLoading: isLoadingSetting } = useQuery({
    queryKey: ["/api/settings/numero_suporte"],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", "/api/settings/numero_suporte");
        return await response.json();
      } catch (error) {
        // Se não existir a configuração, retorna null
        return null;
      }
    },
  });

  // Buscar configurações das redes sociais
  const { data: socialSettings, isLoading: isLoadingSocialSettings } = useQuery({
    queryKey: ["/api/settings/social-media"],
    queryFn: async () => {
      try {
        const [instagram, facebook, pinterest] = await Promise.all([
          apiRequest("GET", "/api/settings/instagram_link").then(r => r.json()).catch(() => null),
          apiRequest("GET", "/api/settings/facebook_link").then(r => r.json()).catch(() => null),
          apiRequest("GET", "/api/settings/pinterest_link").then(r => r.json()).catch(() => null),
        ]);
        
        return {
          instagram_link: instagram?.value || "",
          facebook_link: facebook?.value || "",
          pinterest_link: pinterest?.value || "",
          lastUpdated: Math.max(
            instagram?.updatedAt ? new Date(instagram.updatedAt).getTime() : 0,
            facebook?.updatedAt ? new Date(facebook.updatedAt).getTime() : 0,
            pinterest?.updatedAt ? new Date(pinterest.updatedAt).getTime() : 0
          )
        };
      } catch (error) {
        return {
          instagram_link: "",
          facebook_link: "",
          pinterest_link: "",
          lastUpdated: null
        };
      }
    },
  });

  const form = useForm<SupportFormData>({
    resolver: zodResolver(supportSchema),
    defaultValues: {
      numero_suporte: supportSetting?.value || "",
    },
  });

  const socialForm = useForm<SocialMediaFormData>({
    resolver: zodResolver(socialMediaSchema),
    defaultValues: {
      instagram_link: "",
      facebook_link: "",
      pinterest_link: "",
    },
  });

  // Atualizar o form quando os dados chegarem
  React.useEffect(() => {
    if (supportSetting?.value) {
      form.setValue("numero_suporte", supportSetting.value);
    }
  }, [supportSetting, form]);

  // Atualizar o form de redes sociais quando os dados chegarem
  React.useEffect(() => {
    if (socialSettings) {
      socialForm.setValue("instagram_link", socialSettings.instagram_link);
      socialForm.setValue("facebook_link", socialSettings.facebook_link);
      socialForm.setValue("pinterest_link", socialSettings.pinterest_link);
    }
  }, [socialSettings, socialForm]);

  const updateSupportMutation = useMutation({
    mutationFn: async (data: SupportFormData) => {
      if (supportSetting) {
        // Atualizar configuração existente
        const response = await apiRequest("PUT", `/api/settings/numero_suporte`, {
          value: data.numero_suporte,
        });
        return await response.json();
      } else {
        // Criar nova configuração
        const response = await apiRequest("POST", "/api/settings", {
          key: "numero_suporte",
          value: data.numero_suporte,
          description: "Número de telefone para suporte da plataforma",
        });
        return await response.json();
      }
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Número de suporte atualizado com sucesso!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/settings/numero_suporte"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar número de suporte",
        variant: "destructive",
      });
    },
  });

  const updateSocialMediaMutation = useMutation({
    mutationFn: async (data: SocialMediaFormData) => {
      const promises = [];
      
      // Instagram
      if (data.instagram_link) {
        promises.push(
          apiRequest("POST", "/api/settings", {
            key: "instagram_link",
            value: data.instagram_link,
            description: "Link do Instagram da plataforma",
          })
        );
      }
      
      // Facebook
      if (data.facebook_link) {
        promises.push(
          apiRequest("POST", "/api/settings", {
            key: "facebook_link",
            value: data.facebook_link,
            description: "Link do Facebook da plataforma",
          })
        );
      }
      
      // Pinterest
      if (data.pinterest_link) {
        promises.push(
          apiRequest("POST", "/api/settings", {
            key: "pinterest_link",
            value: data.pinterest_link,
            description: "Link do Pinterest da plataforma",
          })
        );
      }
      
      return await Promise.all(promises);
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Links das redes sociais atualizados com sucesso!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/settings/social-media"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar redes sociais",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: SupportFormData) => {
    setIsLoading(true);
    try {
      await updateSupportMutation.mutateAsync(data);
    } finally {
      setIsLoading(false);
    }
  };

  const onSocialSubmit = async (data: SocialMediaFormData) => {
    setIsSocialLoading(true);
    try {
      await updateSocialMediaMutation.mutateAsync(data);
    } finally {
      setIsSocialLoading(false);
    }
  };

  const formatPhoneNumber = (value: string) => {
    // Remove tudo que não for número
    const cleaned = value.replace(/\D/g, '');
    
    // Aplica formatação brasileira: (XX) X XXXX-XXXX
    if (cleaned.length <= 11) {
      return cleaned
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{4})(\d)/, '$1-$2')
        .replace(/(\d{4})-(\d)(\d{4})/, '$1$2-$3');
    }
    
    return value;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <PageHeader
          title="Gerenciar Suporte"
          description="Configure o número de telefone para suporte da plataforma"
        />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Número de Suporte
            </CardTitle>
            <CardDescription>
              Este número será exibido em toda a plataforma para contato de suporte via WhatsApp.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="numero_suporte"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número de WhatsApp</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="(11) 9 9999-9999"
                          disabled={isLoadingSetting || isLoading}
                          onChange={(e) => {
                            const formatted = formatPhoneNumber(e.target.value);
                            field.onChange(formatted);
                          }}
                          className="max-w-md"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex items-center gap-4">
                  <Button 
                    type="submit" 
                    disabled={isLoading || updateSupportMutation.isPending}
                    className="min-w-[120px]"
                  >
                    {(isLoading || updateSupportMutation.isPending) ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Salvar
                      </>
                    )}
                  </Button>

                  {supportSetting && (
                    <div className="text-sm text-muted-foreground">
                      Última atualização: {new Date(supportSetting.updatedAt).toLocaleString('pt-BR')}
                    </div>
                  )}
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Instagram className="h-5 w-5" />
                <Facebook className="h-5 w-5" />
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.477 2 2 6.477 2 12c0 4.237 2.636 7.855 6.356 9.312-.088-.791-.167-2.005.035-2.868.181-.78 1.172-4.97 1.172-4.97s-.299-.6-.299-1.486c0-1.39.806-2.428 1.81-2.428.853 0 1.264.641 1.264 1.408 0 .858-.546 2.14-.828 3.33-.236.995.499 1.807 1.481 1.807 1.778 0 3.144-1.874 3.144-4.58 0-2.393-1.72-4.068-4.176-4.068-2.845 0-4.516 2.135-4.516 4.34 0 .859.331 1.781.745 2.281a.3.3 0 01.069.288l-.278 1.133c-.044.183-.145.223-.335.134-1.249-.581-2.03-2.407-2.03-3.874 0-3.154 2.292-6.052 6.608-6.052 3.469 0 6.165 2.473 6.165 5.776 0 3.447-2.173 6.22-5.19 6.22-1.013 0-1.965-.525-2.291-1.148l-.623 2.378c-.226.869-.835 1.958-1.244 2.621.937.29 1.931.446 2.962.446 5.523 0 10-4.477 10-10S17.523 2 12 2z"/>
                </svg>
              </div>
              Redes Sociais
            </CardTitle>
            <CardDescription>
              Configure os links das redes sociais que serão exibidos automaticamente no rodapé e outras páginas da plataforma.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...socialForm}>
              <form onSubmit={socialForm.handleSubmit(onSocialSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 gap-6">
                  <FormField
                    control={socialForm.control}
                    name="instagram_link"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Instagram className="h-4 w-4" />
                          Link do Instagram
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="https://instagram.com/seuusuario"
                            disabled={isLoadingSocialSettings || isSocialLoading}
                            className="max-w-md"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={socialForm.control}
                    name="facebook_link"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Facebook className="h-4 w-4" />
                          Link do Facebook
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="https://facebook.com/suapagina"
                            disabled={isLoadingSocialSettings || isSocialLoading}
                            className="max-w-md"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={socialForm.control}
                    name="pinterest_link"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2C6.477 2 2 6.477 2 12c0 4.237 2.636 7.855 6.356 9.312-.088-.791-.167-2.005.035-2.868.181-.78 1.172-4.97 1.172-4.97s-.299-.6-.299-1.486c0-1.39.806-2.428 1.81-2.428.853 0 1.264.641 1.264 1.408 0 .858-.546 2.14-.828 3.33-.236.995.499 1.807 1.481 1.807 1.778 0 3.144-1.874 3.144-4.58 0-2.393-1.72-4.068-4.176-4.068-2.845 0-4.516 2.135-4.516 4.34 0 .859.331 1.781.745 2.281a.3.3 0 01.069.288l-.278 1.133c-.044.183-.145.223-.335.134-1.249-.581-2.03-2.407-2.03-3.874 0-3.154 2.292-6.052 6.608-6.052 3.469 0 6.165 2.473 6.165 5.776 0 3.447-2.173 6.22-5.19 6.22-1.013 0-1.965-.525-2.291-1.148l-.623 2.378c-.226.869-.835 1.958-1.244 2.621.937.29 1.931.446 2.962.446 5.523 0 10-4.477 10-10S17.523 2 12 2z"/>
                          </svg>
                          Link do Pinterest
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="https://pinterest.com/seuusuario"
                            disabled={isLoadingSocialSettings || isSocialLoading}
                            className="max-w-md"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex items-center gap-4">
                  <Button 
                    type="submit" 
                    disabled={isSocialLoading || updateSocialMediaMutation.isPending}
                    className="min-w-[120px]"
                  >
                    {(isSocialLoading || updateSocialMediaMutation.isPending) ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Salvar
                      </>
                    )}
                  </Button>

                  {socialSettings && socialSettings.lastUpdated && (
                    <div className="text-sm text-muted-foreground">
                      Última atualização: {new Date(socialSettings.lastUpdated).toLocaleString('pt-BR')}
                    </div>
                  )}
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Onde este número aparece</CardTitle>
            <CardDescription>
              O número de suporte configurado será exibido automaticamente nos seguintes locais:
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                Página de assinatura no painel do usuário
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                Cabeçalho da página inicial (se habilitado)
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                Páginas de erro e suporte
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                Notificações e emails automáticos
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}