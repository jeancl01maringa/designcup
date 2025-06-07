import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useQuery } from "@tanstack/react-query";
import { ProfileLayout } from "@/components/layout/ProfileLayout";
import { Calendar, Clock, MessageSquare, CheckCircle } from "lucide-react";

interface UserPlan {
  planName: string;
  periodo: string;
  valor: string;
  isActive: boolean;
}

export default function AssinaturaPage() {
  const { user } = useAuth();

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
      <div className="space-y-6">
        {/* Cabeçalho */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Status da Assinatura</h1>
          <p className="text-gray-600 mt-1">
            Informações atuais sobre sua conta e plano ativo.
          </p>
        </div>

        {/* Status da Assinatura */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Assinatura Ativa</CardTitle>
                <CardDescription>Sua assinatura está funcionando normalmente</CardDescription>
              </div>
              <Badge variant="default" className="bg-green-500 text-white">
                <CheckCircle className="h-3 w-3 mr-1" />
                Ativa
              </Badge>
            </div>
          </CardHeader>
        </Card>

        {/* Plano Atual */}
        <Card>
          <CardHeader>
            <CardTitle>Plano Atual</CardTitle>
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
                      `${userPlan.planName} (${userPlan.periodo} - R$ ${userPlan.valor})`
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
          </CardContent>
        </Card>

        {/* Datas Importantes */}
        <Card>
          <CardHeader>
            <CardTitle>Datas Importantes</CardTitle>
            <CardDescription>
              Informações sobre início e vencimento da sua assinatura.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-blue-500" />
                  <h4 className="font-medium">Data de Início</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  {userData?.createdAt ? 
                    new Date(userData.createdAt).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit', 
                      year: 'numeric'
                    }) : 
                    'Não disponível'
                  }
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
                    // Se o plano tem periodo "Vitalício" ou é um plano vitalício
                    if (userPlan?.periodo?.toLowerCase().includes('vitalício') || userPlan?.periodo?.toLowerCase().includes('vitalicio')) {
                      return 'Vitalício (sem expiração)';
                    }
                    
                    if (userData?.data_vencimento) {
                      return new Date(userData.data_vencimento).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                      });
                    }
                    
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

        {/* Suporte */}
        <Card>
          <CardHeader>
            <CardTitle>Suporte ao Cliente</CardTitle>
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
                  <p className="text-sm text-green-600">Dúvidas e perguntas</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="border-green-300 text-green-700 hover:bg-green-100"
                onClick={() => window.open(`https://wa.me/5544999419907?text=Olá, preciso de ajuda com minha conta!`, '_blank')}
              >
                Entrar em contato
              </Button>
            </div>

            <Separator />

            <div className="text-center text-sm text-gray-500">
              <p>Horário de atendimento: Segunda a Sexta, das 9h às 18h</p>
              <p className="mt-1">Respondemos em até 24 horas úteis</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </ProfileLayout>
  );
}