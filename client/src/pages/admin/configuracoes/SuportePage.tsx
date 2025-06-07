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
import { Phone, Save, Loader2 } from "lucide-react";

const supportSchema = z.object({
  numero_suporte: z.string()
    .min(1, "Número de suporte é obrigatório")
    .regex(/^[\d\s\(\)\-\+]+$/, "Formato de telefone inválido"),
});

type SupportFormData = z.infer<typeof supportSchema>;

export default function SuportePage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

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

  const form = useForm<SupportFormData>({
    resolver: zodResolver(supportSchema),
    defaultValues: {
      numero_suporte: supportSetting?.value || "",
    },
  });

  // Atualizar o form quando os dados chegarem
  React.useEffect(() => {
    if (supportSetting?.value) {
      form.setValue("numero_suporte", supportSetting.value);
    }
  }, [supportSetting, form]);

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

  const onSubmit = async (data: SupportFormData) => {
    setIsLoading(true);
    try {
      await updateSupportMutation.mutateAsync(data);
    } finally {
      setIsLoading(false);
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