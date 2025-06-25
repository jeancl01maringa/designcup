import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useSupportNumber } from "@/hooks/use-support-number";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { ProfileLayout } from "@/components/layout/ProfileLayout";
import { Calendar, Clock, MessageSquare, CheckCircle, CreditCard, Info } from "lucide-react";

interface UserPlan {
  planName: string;
  periodo: string;
  valor: string;
  isActive: boolean;
  startDate?: string;
  expirationDate?: string;
  source?: string;
  transactionId?: string;
}

export default function AssinaturaPage() {
  const { user } = useAuth();
  const { supportNumber, whatsappUrl } = useSupportNumber();
  const [activeTab, setActiveTab] = useState("status");

  // Type assertion for user data with subscription properties
  const userData = user as any;

  // Buscar informações do plano do usuário
  const { data: userPlan, isLoading: planLoading } = useQuery<UserPlan>({
    queryKey: ["/api/user/plan"],
    enabled: !!user,
  });

  if (!user) {
    return (
      <ProfileLayout>
        <div className="text-center py-12">
          <p className="text-gray-500">Usuário não encontrado.</p>
        </div>
      </ProfileLayout>
    );
  }

  return (
    <ProfileLayout>
      <div className="max-w-4xl space-y-6">
        {/* Cabeçalho */}
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Assinatura</h1>
          <p className="text-gray-600 mt-1 text-sm lg:text-base">
            Gerencie sua assinatura e veja detalhes do seu plano.
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="status" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Status
            </TabsTrigger>
            <TabsTrigger value="plano" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Plano Atual
            </TabsTrigger>
            <TabsTrigger value="suporte" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Suporte
            </TabsTrigger>
          </TabsList>

          {/* Tab: Status */}
          <TabsContent value="status">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Status da Assinatura
                </CardTitle>
                <CardDescription>
                  Informações atuais sobre sua conta e plano ativo.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg bg-green-50">
                  <div>
                    <h3 className="font-semibold text-green-800">Assinatura Ativa</h3>
                    <p className="text-sm text-green-600">Sua assinatura está funcionando normalmente</p>
                  </div>
                  <Badge variant="default" className="bg-green-500 text-white">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Ativa
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="h-4 w-4 text-blue-500" />
                      <h4 className="font-medium">Data de Início</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {planLoading ? (
                        <div className="animate-pulse bg-gray-200 h-4 w-24 rounded"></div>
                      ) : (() => {
                        // Priorizar data de início da assinatura Hotmart
                        if (userPlan?.startDate) {
                          return new Date(userPlan.startDate).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit', 
                            year: 'numeric'
                          });
                        }
                        
                        // Fallback para data de criação do usuário
                        if (userData?.createdAt) {
                          return new Date(userData.createdAt).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit', 
                            year: 'numeric'
                          });
                        }
                        
                        return 'Não disponível';
                      })()}
                    </p>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-4 w-4 text-orange-500" />
                      <h4 className="font-medium">Data de Expiração</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {planLoading ? (
                        <div className="animate-pulse bg-gray-200 h-4 w-24 rounded"></div>
                      ) : (() => {
                        // Verificar se é plano vitalício
                        if (userPlan?.periodo?.toLowerCase().includes('vitalício') || userPlan?.periodo?.toLowerCase().includes('vitalicio')) {
                          return 'Vitalício (sem expiração)';
                        }
                        
                        // Priorizar data de expiração da Hotmart
                        if (userPlan?.expirationDate) {
                          return new Date(userPlan.expirationDate).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          });
                        }
                        
                        // Fallback para data de vencimento do usuário
                        if (userData?.data_vencimento) {
                          return new Date(userData.data_vencimento).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          });
                        }
                        
                        // Se é premium mas não tem data de expiração definida
                        if (userData?.tipo === 'premium') {
                          return 'Não definida';
                        }
                        
                        return 'Não aplicável';
                      })()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Plano Atual */}
          <TabsContent value="plano">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-blue-500" />
                  Plano Atual
                </CardTitle>
                <CardDescription>
                  Detalhes do seu plano de assinatura e benefícios inclusos.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 border rounded-lg bg-gradient-to-r from-blue-50 to-purple-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-lg">
                        {planLoading ? (
                          <div className="animate-pulse bg-gray-200 h-6 w-48 rounded"></div>
                        ) : userPlan ? (
                          userPlan.planName
                        ) : (
                          'Plano Gratuito'
                        )}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {userData?.tipo === 'premium' ? 'Acesso completo a todos os recursos premium' : 'Acesso básico à plataforma'}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant={userData?.tipo === 'premium' ? "default" : "secondary"} className="text-xs">
                        {userData?.tipo === 'premium' ? 'PREMIUM' : 'GRATUITO'}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <h4 className="font-medium mb-3">Benefícios inclusos</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Acesso a todos os templates premium</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Downloads ilimitados</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Suporte prioritário</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Novos templates semanais</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Suporte */}
          <TabsContent value="suporte">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-green-500" />
                  Suporte ao Cliente
                </CardTitle>
                <CardDescription>
                  Precisa de ajuda? Entre em contato conosco através do WhatsApp.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg bg-green-50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                      <MessageSquare className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-green-800">Suporte via WhatsApp</h4>
                      <p className="text-sm text-green-600">{supportNumber || "Carregando número..."}</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-green-300 text-green-700 hover:bg-green-100"
                    disabled={!whatsappUrl}
                    onClick={() => whatsappUrl && window.open(`${whatsappUrl}?text=Olá, preciso de ajuda com minha conta!`, '_blank')}
                  >
                    Entrar em contato
                  </Button>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Horário de Atendimento</h4>
                    <p className="text-sm text-gray-600">Segunda a Sexta, das 9h às 18h</p>
                    <p className="text-sm text-gray-500 mt-1">Respondemos em até 24 horas úteis</p>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Perguntas Frequentes</h4>
                    <p className="text-sm text-gray-600">Consulte nossa central de ajuda para respostas rápidas às dúvidas mais comuns sobre planos e funcionalidades.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ProfileLayout>
  );
}