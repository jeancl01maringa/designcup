import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Check, Star, BadgeCheck, X } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Tipo para planos
interface Plan {
  id: number;
  name: string;
  periodo: string;
  valor: string;
  isActive: boolean;
  isPrincipal: boolean;
  isGratuito: boolean;
  codigoHotmart: string | null;
  urlHotmart: string | null;
  beneficios: string | null;
  createdAt: string;
}

export default function PlansPage() {
  const { toast } = useToast();

  // Buscar planos
  const { data: plans, isLoading, error } = useQuery<Plan[]>({
    queryKey: ['/api/plans'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/plans');
        return response.json();
      } catch (error) {
        console.error("Erro ao buscar planos:", error);
        toast({
          title: "Erro ao carregar planos",
          description: "Não foi possível carregar os planos no momento.",
          variant: "destructive",
        });
        return [];
      }
    }
  });

  // Filtramos apenas os planos ativos
  const activePlans = plans?.filter(plan => plan.isActive) || [];

  // Ordenados para garantir que o plano principal apareça primeiro
  const sortedPlans = [...activePlans].sort((a, b) => {
    // Plano principal sempre primeiro
    if (a.isPrincipal && !b.isPrincipal) return -1;
    if (!a.isPrincipal && b.isPrincipal) return 1;
    // Gratuito depois do principal e antes dos pagos
    if (a.isGratuito && !b.isGratuito) return -1;
    if (!a.isGratuito && b.isGratuito) return 1;
    // Por preço (do mais barato ao mais caro)
    const valorA = parseFloat(a.valor.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
    const valorB = parseFloat(b.valor.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
    return valorA - valorB;
  });

  // Função para formatar benefícios em array
  const formatBeneficios = (beneficios: string | null): string[] => {
    if (!beneficios) return [];
    return beneficios.split('\n').filter(b => b.trim() !== '');
  };

  // Função para obter URL de ação do plano
  const getPlanActionUrl = (plan: Plan): string => {
    if (plan.urlHotmart) return plan.urlHotmart;
    if (plan.isGratuito) return "/register"; // Rota para registro gratuito
    return "#"; // Fallback
  };

  return (
    <Layout>
      <div className="container px-4 py-12 mx-auto max-w-7xl">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            Nossos Planos
          </h1>
          <p className="mt-4 text-lg text-gray-600 max-w-3xl mx-auto">
            Escolha o melhor plano para suas necessidades e tenha acesso a templates profissionais
            para elevar sua estética a outro nível.
          </p>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
            <p className="mt-4 text-gray-600">Carregando planos...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <X className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">Erro ao carregar planos</h3>
            <p className="mt-2 text-gray-600">Tente novamente mais tarde.</p>
          </div>
        ) : sortedPlans.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Nenhum plano disponível no momento.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {sortedPlans.map((plan) => (
              <Card key={plan.id} className={`flex flex-col h-full ${plan.isPrincipal ? 'border-blue-600 ring-1 ring-blue-600 shadow-lg' : ''}`}>
                <CardHeader className="relative pb-2">
                  {plan.isPrincipal && (
                    <div className="absolute -top-4 left-0 right-0 mx-auto w-max">
                      <Badge className="bg-blue-600 px-3 py-1 text-xs font-semibold">
                        <Star className="h-3 w-3 mr-1" /> Recomendado
                      </Badge>
                    </div>
                  )}
                  {plan.isGratuito && (
                    <div className="absolute -top-4 left-0 right-0 mx-auto w-max">
                      <Badge className="bg-green-600 px-3 py-1 text-xs font-semibold">
                        <BadgeCheck className="h-3 w-3 mr-1" /> Gratuito
                      </Badge>
                    </div>
                  )}
                  <CardTitle className="text-xl font-bold text-center">
                    {plan.name}
                  </CardTitle>
                  <CardDescription className="text-center">
                    {plan.periodo}
                  </CardDescription>
                </CardHeader>
                <div className="text-center px-6 py-4">
                  <p className="text-3xl font-bold">
                    {plan.isGratuito ? (
                      "Grátis"
                    ) : (
                      <>
                        <span className="text-lg align-top">R$</span> {plan.valor}
                      </>
                    )}
                  </p>
                </div>
                <Separator />
                <CardContent className="flex-grow pt-6">
                  <ul className="space-y-3">
                    {formatBeneficios(plan.beneficios).map((beneficio, index) => (
                      <li key={index} className="flex items-start">
                        <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                        <span>{beneficio}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  {plan.urlHotmart ? (
                    <a 
                      href={plan.urlHotmart} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-full"
                    >
                      <Button 
                        className={`w-full ${plan.isPrincipal ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                        variant={plan.isPrincipal ? 'default' : 'outline'}
                      >
                        {plan.isGratuito ? 'Começar Grátis' : 'Assinar Agora'}
                      </Button>
                    </a>
                  ) : (
                    <Link href={plan.isGratuito ? "/register" : "#"} className="w-full">
                      <Button 
                        className={`w-full ${plan.isPrincipal ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                        variant={plan.isPrincipal ? 'default' : 'outline'}
                      >
                        {plan.isGratuito ? 'Começar Grátis' : 'Assinar Agora'}
                      </Button>
                    </Link>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}