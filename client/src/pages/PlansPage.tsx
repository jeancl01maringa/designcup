import React, { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Check, Star, BadgeCheck, X, Crown, Palette, Headphones, RefreshCw, Sparkles, CheckCircle, Zap, Infinity, Calendar, Gift, Clock } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Tipo para planos
interface Plan {
  id: number;
  name: string;
  valor?: string;
  valorOriginal?: string;
  porcentagemEconomia?: string;
  price?: number;
  period?: string;
  originalPrice?: number;
  isGratuito?: boolean;
  isPrincipal?: boolean;
  itensInclusos?: string[];
  itensRestritos?: string[] | string;
  urlHotmart?: string;
  active?: boolean;
  periodo?: string;
  beneficios?: string;
}

export default function PlansPage() {
  const [isAnnual, setIsAnnual] = useState(false);
  const { toast } = useToast();

  // Scroll para o topo quando a página carrega
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const {
    data: plans = [],
    isLoading,
    error,
  } = useQuery<Plan[]>({
    queryKey: ["/api/plans"],
    staleTime: 5 * 60 * 1000, // Cache por 5 minutos
    refetchOnWindowFocus: false, // Não recarregar ao focar na janela
    retry: 1, // Tentar apenas 1 vez em caso de erro
  });

  // Função para converter valor string para number
  const parsePrice = (valor: string) => {
    if (!valor) return 0;
    const cleanValue = valor.replace(/[R$\s]/g, '').replace(',', '.');
    return parseFloat(cleanValue) || 0;
  };

  // Otimizar processamento dos planos com useMemo
  const sortedPlans = useMemo(() => {
    if (!plans.length) return [];
    
    // Filtrar planos ativos
    const activePlans = plans.filter((plan: Plan) => plan.active !== false);
    
    // Filtrar por período selecionado
    const filteredPlans = activePlans.filter((plan: Plan) => {
      // Sempre mostrar plano gratuito
      if (plan.isGratuito) return true;
      
      const periodo = plan.periodo?.toLowerCase();
      
      if (isAnnual) {
        // No modo anual, mostrar planos anuais e vitalício
        return periodo === 'anual' || periodo === 'vitalicio';
      } else {
        // No modo mensal, mostrar planos mensais e trimestral
        return periodo === 'mensal' || periodo === 'trimestral';
      }
    });

    // Ordenar planos
    return filteredPlans.sort((a: Plan, b: Plan) => {
      if (a.isGratuito && !b.isGratuito) return -1;
      if (!a.isGratuito && b.isGratuito) return 1;
      if (a.isGratuito && b.isGratuito) return 0;
      const priceA = parsePrice(a.valor || '0');
      const priceB = parsePrice(b.valor || '0');
      return priceA - priceB;
    });
  }, [plans, isAnnual]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  const formatPeriod = (period: string) => {
    const periodMap: { [key: string]: string } = {
      'mensal': 'mês',
      'anual': 'ano',
      'vitalicio': 'vitalício',
      'sempre': 'sempre',
    };
    return periodMap[period?.toLowerCase()] || period;
  };

  const getPlanPrice = (plan: Plan) => {
    if (plan.isGratuito) return 0;
    
    // Sempre retorna o valor real do plano sem modificações
    return parsePrice(plan.valor || '0');
  };

  const getPlanPeriod = (plan: Plan) => {
    if (plan.isGratuito) return 'Para sempre';
    
    // Retorna o período real do plano sem modificações
    const periodo = plan.periodo?.toLowerCase();
    if (periodo === 'anual') return 'por ano';
    if (periodo === 'vitalicio') return 'vitalício';
    if (periodo === 'trimestral') return 'por trimestre';
    if (periodo === 'mensal') return 'por mês';
    if (periodo === 'sempre') return 'para sempre';
    
    return 'por mês';
  };

  const renderPlanItems = (plan: Plan) => {
    const beneficios = plan.beneficios ? plan.beneficios.split('\n').filter((item: string) => item.trim()) : [];
    
    let itensRestritos: string[] = [];
    if (plan.itensRestritos) {
      if (typeof plan.itensRestritos === 'string') {
        itensRestritos = plan.itensRestritos.split('\n').filter((item: string) => item.trim());
      } else if (Array.isArray(plan.itensRestritos)) {
        itensRestritos = plan.itensRestritos.filter((item: string) => item.trim());
      }
    }
    
    const allItems: string[] = [
      ...beneficios,
      ...itensRestritos.map((item: string) => `❌ ${item}`)
    ];

    if (allItems.length === 0) {
      const defaultItems = plan.isGratuito 
        ? [
            "Acesso limitado a templates",
            "Suporte básico",
            "❌ Templates premium",
            "❌ Suporte prioritário"
          ]
        : [
            "Acesso completo aos templates",
            "Suporte premium 24/7",
            "Downloads ilimitados",
            "Atualizações automáticas"
          ];
      
      return defaultItems.map((item, index) => (
        <li key={index} className={`flex items-start gap-3 ${item.startsWith('❌') ? 'text-gray-400' : ''}`}>
          <div className={`mt-1 ${item.startsWith('❌') ? 'text-red-500' : 'text-green-500'}`}>
            {item.startsWith('❌') ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
          </div>
          <span className="text-sm">{item.replace('❌ ', '')}</span>
        </li>
      ));
    }

    return allItems.map((item, index) => (
      <li key={index} className={`flex items-start gap-3 ${item.startsWith('❌') ? 'text-gray-400' : ''}`}>
        <div className={`mt-1 ${item.startsWith('❌') ? 'text-red-500' : 'text-green-500'}`}>
          {item.startsWith('❌') ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
        </div>
        <span className="text-sm">{item.replace('❌ ', '')}</span>
      </li>
    ));
  };

  const getPlanIcon = (plan: Plan) => {
    if (plan.isGratuito) {
      return <Gift className="h-8 w-8 text-green-600 mb-2" />;
    }
    
    const periodo = plan.periodo?.toLowerCase();
    if (periodo === 'mensal') {
      return <Calendar className="h-8 w-8 text-blue-600 mb-2" />;
    }
    if (periodo === 'trimestral') {
      return <Clock className="h-8 w-8 text-purple-600 mb-2" />;
    }
    if (periodo === 'anual') {
      return <Star className="h-8 w-8 text-orange-600 mb-2" />;
    }
    if (periodo === 'vitalicio') {
      return <Crown className="h-8 w-8 text-amber-600 mb-2" />;
    }
    
    return <Sparkles className="h-8 w-8 text-blue-600 mb-2" />;
  };

  const getButtonLink = (plan: Plan) => {
    if (plan.urlHotmart) return plan.urlHotmart;
    if (plan.isGratuito) return "/loguin/cadastro";
    return "#";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-white text-gray-900 pt-4 pb-6 border-b">
        <div className="container-global text-center">
          <div className="inline-flex items-center gap-2 bg-blue-100 rounded-full px-4 py-2 mb-2">
            <Sparkles className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">Escolha o plano ideal para você</span>
          </div>
          
          <h1 className="text-3xl md:text-4xl font-bold mb-2 text-black">
            Junte-se ao <span className="text-amber-700">premium</span>
          </h1>
          
          <p className="text-lg mb-4 text-gray-600 max-w-3xl mx-auto">
            Templates profissionais para seu negócio. Comece grátis ou escolha um plano premium.
          </p>
          
          {/* Seletor de Período */}
          <div className="inline-flex items-center bg-gray-100 rounded-lg p-1 mb-12">
            <button
              onClick={() => setIsAnnual(false)}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
                !isAnnual
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Mensal
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={`relative px-6 py-2 rounded-md text-sm font-medium transition-all ml-1 ${
                isAnnual
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Anual
              <Badge className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-1 py-0.5">
                -25%
              </Badge>
            </button>
          </div>


          {/* Plans Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto mt-8">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="relative flex flex-col h-full">
                  <CardHeader className="text-center pb-4">
                    <div className="flex flex-col items-center">
                      <Skeleton className="h-8 w-8 rounded mb-2" />
                      <Skeleton className="h-6 w-32 mb-4" />
                    </div>
                    <div className="mt-4">
                      <Skeleton className="h-12 w-24 mx-auto mb-2" />
                      <Skeleton className="h-4 w-16 mx-auto" />
                    </div>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <div className="space-y-3">
                      {[1, 2, 3, 4].map((j) => (
                        <div key={j} className="flex items-center gap-3">
                          <Skeleton className="h-4 w-4" />
                          <Skeleton className="h-4 flex-1" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                  <CardFooter className="pt-6">
                    <Skeleton className="h-12 w-full" />
                  </CardFooter>
                </Card>
              ))}
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto mt-8">
              {sortedPlans.map((plan) => (
                <Card key={plan.id} className={`relative flex flex-col h-full transition-all duration-300 hover:shadow-2xl hover:scale-105 ${
                  plan.isPrincipal 
                    ? 'border-blue-500 border shadow-xl bg-gradient-to-br from-blue-50 to-white' 
                    : 'border-gray-200 hover:border-blue-300 bg-white'
                }`}>
                  {/* Badge Superior */}
                  {plan.isPrincipal && (
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 z-10">
                      <Badge className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-2 text-sm font-semibold shadow-lg">
                        <Crown className="h-4 w-4 mr-1" /> MAIS POPULAR
                      </Badge>
                    </div>
                  )}

                  <CardHeader className="text-center pb-4">
                    <div className="flex flex-col items-center">
                      {getPlanIcon(plan)}
                      <CardTitle className="text-xl font-bold text-gray-900">{plan.name}</CardTitle>
                    </div>
                    <div className="mt-4">
                      {plan.isGratuito ? (
                        <div className="text-4xl font-bold text-gray-900">Grátis</div>
                      ) : (
                        <div className="flex flex-col items-center justify-center">
                          {plan.valorOriginal && (
                            <div className="text-sm text-gray-500 line-through mb-1">
                              De R$ {parseFloat(plan.valorOriginal).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                          )}
                          <div className="flex items-baseline">
                            <span className="text-2xl font-bold text-gray-900">R$</span>
                            <span className="text-4xl font-bold text-gray-900 ml-1">
                              {getPlanPrice(plan).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                            <span className="text-sm text-gray-600 ml-1">
                              /{getPlanPeriod(plan).replace('por ', '').replace('para ', '')}
                            </span>
                          </div>
                          {plan.porcentagemEconomia && (
                            <div className="mt-2">
                              <span className="bg-green-100 text-green-800 text-sm font-medium px-3 py-1 rounded-full">
                                Economize {plan.porcentagemEconomia}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                      <div className="text-sm text-gray-600 mt-1">
                        {plan.isGratuito ? 'Para sempre' : ''}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="flex-grow">
                    <ul className="space-y-3">
                      {renderPlanItems(plan)}
                    </ul>
                  </CardContent>

                  <CardFooter className="pt-6">
                    {plan.urlHotmart ? (
                      <a
                        href={plan.urlHotmart}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full"
                      >
                        <Button 
                          className={`w-full py-3 text-base font-semibold transition-all duration-300 ${
                            plan.isPrincipal
                              ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl'
                              : plan.isGratuito
                              ? 'bg-gray-500 hover:bg-gray-600 text-white'
                              : 'bg-blue-600 hover:bg-blue-700 text-white'
                          }`}
                        >
                          {plan.isGratuito ? 'Começar Grátis' : 'Assinar Agora'}
                        </Button>
                      </a>
                    ) : (
                      <Link href={getButtonLink(plan)} className="w-full">
                        <Button 
                          className={`w-full py-3 text-base font-semibold transition-all duration-300 ${
                            plan.isPrincipal
                              ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl'
                              : plan.isGratuito
                              ? 'bg-gray-500 hover:bg-gray-600 text-white'
                              : 'bg-blue-600 hover:bg-blue-700 text-white'
                          }`}
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
      </div>

      {/* Seção de garantias e benefícios adicionais */}
      <div className="bg-gray-50 py-10">
        <div className="container-global max-w-6xl">
          <div className="text-center mb-8">
            <h3 className="text-3xl font-bold text-gray-900 mb-3">Por que escolher nossos planos?</h3>
            <p className="text-lg text-gray-600">Benefícios exclusivos para todos os nossos clientes</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-white rounded-lg shadow-lg">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 text-blue-600 rounded-full mb-4">
                <Crown className="h-8 w-8" />
              </div>
              <h4 className="text-xl font-semibold mb-2">+500 Templates Premium</h4>
              <p className="text-gray-600">Acesso completo à nossa biblioteca com centenas de templates profissionais.</p>
            </div>
            
            <div className="text-center p-6 bg-white rounded-lg shadow-lg">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 text-green-600 rounded-full mb-4">
                <RefreshCw className="h-8 w-8" />
              </div>
              <h4 className="text-xl font-semibold mb-2">Qualidade Premium</h4>
              <p className="text-gray-600">Artes de altíssima qualidade criadas por designers profissionais experientes.</p>
            </div>
            
            <div className="text-center p-6 bg-white rounded-lg shadow-lg">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 text-purple-600 rounded-full mb-4">
                <Headphones className="h-8 w-8" />
              </div>
              <h4 className="text-xl font-semibold mb-2">Suporte Exclusivo</h4>
              <p className="text-gray-600">Atendimento premium disponível 24 horas por dia, 7 dias por semana.</p>
            </div>
            
            <div className="text-center p-6 bg-white rounded-lg shadow-lg">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-100 text-amber-600 rounded-full mb-4">
                <BadgeCheck className="h-8 w-8" />
              </div>
              <h4 className="text-xl font-semibold mb-2">Garantia de 7 dias</h4>
              <p className="text-gray-600">Não ficou satisfeito? Devolvemos 100% do seu dinheiro em até 7 dias.</p>
            </div>
            
            <div className="text-center p-6 bg-white rounded-lg shadow-lg">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full mb-4">
                <Infinity className="h-8 w-8" />
              </div>
              <h4 className="text-xl font-semibold mb-2">Download Ilimitado</h4>
              <p className="text-gray-600">Baixe quantos templates quiser, sem limites de download.</p>
            </div>
            
            <div className="text-center p-6 bg-white rounded-lg shadow-lg">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-pink-100 text-pink-600 rounded-full mb-4">
                <Zap className="h-8 w-8" />
              </div>
              <h4 className="text-xl font-semibold mb-2">Sempre Atualizado</h4>
              <p className="text-gray-600">Plataforma constantemente atualizada com novos recursos e melhorias.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}