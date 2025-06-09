import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Check, Star, BadgeCheck, X, Crown, Palette, Headphones, RefreshCw, Sparkles, CheckCircle } from "lucide-react";
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
  const [isAnnual, setIsAnnual] = useState(false);

  // Buscar planos
  const { data: allPlans, isLoading, error } = useQuery<Plan[]>({
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

  // Filtrar planos por período
  const filteredPlans = allPlans?.filter(plan => {
    if (isAnnual) {
      return plan.periodo.toLowerCase().includes('anual') || 
             plan.periodo.toLowerCase().includes('ano');
    } else {
      return plan.periodo.toLowerCase().includes('mensal') || 
             plan.periodo.toLowerCase().includes('mês') ||
             plan.periodo.toLowerCase().includes('trimestral');
    }
  }) || [];

  // Função para calcular preço com desconto anual
  const calculatePrice = (originalPrice: string) => {
    const price = parseFloat(originalPrice.replace(',', '.'));
    if (isAnnual && !isNaN(price)) {
      const discountedPrice = price * 0.75; // 25% de desconto
      return discountedPrice.toFixed(2).replace('.', ',');
    }
    return originalPrice;
  };

  // Função para calcular preço original (sem desconto)
  const getOriginalPrice = (price: string) => {
    const priceNum = parseFloat(price.replace(',', '.'));
    if (isAnnual && !isNaN(priceNum)) {
      const originalPrice = priceNum / 0.75; // Preço original antes do desconto
      return originalPrice.toFixed(2).replace('.', ',');
    }
    return null;
  };

  // Filtramos apenas os planos ativos do período selecionado
  const activePlans = filteredPlans?.filter(plan => plan.isActive) || [];

  // Vantagens premium destacadas
  const premiumFeatures = [
    {
      icon: <Palette className="h-5 w-5 text-white" />,
      title: "+500",
      description: "Templates Premium"
    },
    {
      icon: <RefreshCw className="h-5 w-5 text-white" />,
      title: "50+",
      description: "Novos por Semana"
    },
    {
      icon: <Headphones className="h-5 w-5 text-white" />,
      title: "24/7",
      description: "Suporte Premium"
    }
  ];

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

  // Função para obter URL de ação do plano
  const getPlanActionUrl = (plan: Plan): string => {
    if (plan.urlHotmart) return plan.urlHotmart;
    if (plan.isGratuito) return "/register";
    return "#";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-white text-gray-900 py-16 border-b">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-blue-100 rounded-full px-4 py-2 mb-6">
            <Sparkles className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">Escolha o plano ideal para você</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-6 text-black">
            Junte-se ao <span className="text-amber-700">premium</span>
          </h1>
          
          <p className="text-xl md:text-2xl mb-8 text-gray-600 max-w-4xl mx-auto">
            Desbloqueie todo o potencial criativo com nossos templates profissionais. Comece grátis ou escolha um plano premium para acesso ilimitado.
          </p>
          
          {/* Estatísticas Destacadas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {premiumFeatures.map((feature, index) => (
              <div key={index} className="text-center">
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-4 ${
                  index === 0 ? 'bg-blue-100 text-blue-600' :
                  index === 1 ? 'bg-green-100 text-green-600' :
                  'bg-purple-100 text-purple-600'
                }`}>
                  {React.cloneElement(feature.icon, {
                    className: "h-5 w-5"
                  })}
                </div>
                <div className="text-3xl font-bold mb-2 text-gray-900">{feature.title}</div>
                <div className="text-gray-600">{feature.description}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Plans Section */}
      <div className="container px-4 py-16 mx-auto max-w-7xl">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 rounded-full px-4 py-2 mb-4">
            <Crown className="h-4 w-4" />
            <span className="text-sm font-medium">Todos os Planos</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Encontre o plano perfeito</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
            Escolha entre nossos planos flexíveis e comece a criar designs incríveis hoje mesmo
          </p>
          
          {/* Seletor de Período */}
          <div className="inline-flex items-center bg-gray-100 rounded-lg p-1 mb-8">
            <button
              onClick={() => setIsAnnual(false)}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
                !isAnnual
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Mensal
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-all relative ${
                isAnnual
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Anual
              <Badge className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-1 py-0.5">
                -25%
              </Badge>
            </button>
          </div>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {sortedPlans.map((plan) => (
              <Card key={plan.id} className={`relative flex flex-col h-full transition-all duration-300 hover:shadow-2xl hover:scale-105 ${
                plan.isPrincipal 
                  ? 'border-blue-500 border shadow-xl bg-gradient-to-br from-blue-50 to-white' 
                  : 'border-gray-200 hover:border-blue-300 bg-white'
              }`}>
                {/* Badge Superior */}
                {plan.isPrincipal && (
                  <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 z-10">
                    <Badge className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-2 text-sm font-semibold shadow-lg">
                      <Crown className="h-4 w-4 mr-1" /> MELHOR OFERTA
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center pt-8 pb-1">
                  <CardTitle className={`text-2xl font-bold ${
                    plan.isGratuito 
                      ? 'text-gray-500' 
                      : 'text-black'
                  }`}>
                    {plan.name}
                  </CardTitle>
                </CardHeader>
                
                <div className="text-center px-6 pt-1 pb-3">
                  <div className="text-4xl font-bold">
                    {plan.isGratuito ? (
                      <span className="text-gray-500">Grátis</span>
                    ) : (
                      <div className="flex flex-col items-center">
                        {isAnnual && getOriginalPrice(plan.valor) && (
                          <div className="text-sm text-gray-400 line-through mb-1">
                            De R$ {getOriginalPrice(plan.valor)}
                          </div>
                        )}
                        <div className="flex items-baseline justify-center gap-1">
                          <span className="text-xl text-gray-600">R$</span>
                          <span className="text-gray-900">{calculatePrice(plan.valor)}</span>
                          <span className="text-sm text-gray-500">/{isAnnual ? 'ano' : 'mês'}</span>
                        </div>
                        {isAnnual && (
                          <div className="text-sm text-green-600 font-medium mt-1">
                            Economize 25%
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                <Separator />
                
                <CardContent className="flex-1 py-6">
                  <ul className="space-y-3">
                    {plan.isGratuito ? (
                      <>
                        <li className="flex items-center text-sm">
                          <CheckCircle className="h-4 w-4 text-green-600 mr-3 flex-shrink-0" />
                          <span>5 downloads por mês</span>
                        </li>
                        <li className="flex items-center text-sm">
                          <CheckCircle className="h-4 w-4 text-green-600 mr-3 flex-shrink-0" />
                          <span>Acesso à galeria básica</span>
                        </li>
                        <li className="flex items-center text-sm">
                          <CheckCircle className="h-4 w-4 text-green-600 mr-3 flex-shrink-0" />
                          <span>Sem marca d'água</span>
                        </li>
                        <li className="flex items-center text-sm">
                          <CheckCircle className="h-4 w-4 text-green-600 mr-3 flex-shrink-0" />
                          <span>Suporte via e-mail</span>
                        </li>
                      </>
                    ) : (
                      <>
                        <li className="flex items-center text-sm">
                          <CheckCircle className="h-4 w-4 text-green-600 mr-3 flex-shrink-0" />
                          <span className="font-medium">+500 Artes Premium</span>
                        </li>
                        <li className="flex items-center text-sm">
                          <CheckCircle className="h-4 w-4 text-green-600 mr-3 flex-shrink-0" />
                          <span className="font-medium">Atualizações Mensais</span>
                        </li>
                        <li className="flex items-center text-sm">
                          <CheckCircle className="h-4 w-4 text-green-600 mr-3 flex-shrink-0" />
                          <span className="font-medium">Suporte Exclusivo</span>
                        </li>
                        <li className="flex items-center text-sm">
                          <CheckCircle className="h-4 w-4 text-green-600 mr-3 flex-shrink-0" />
                          <span className="font-medium">Downloads Ilimitados</span>
                        </li>
                        <li className="flex items-center text-sm">
                          <CheckCircle className="h-4 w-4 text-green-600 mr-3 flex-shrink-0" />
                          <span className="font-medium">Acesso a todas categorias</span>
                        </li>
                        <li className="flex items-center text-sm">
                          <CheckCircle className="h-4 w-4 text-green-600 mr-3 flex-shrink-0" />
                          <span className="font-medium">Novos designs semanais</span>
                        </li>
                      </>
                    )}
                  </ul>
                </CardContent>
                
                <CardFooter className="pt-0 pb-6">
                  {plan.urlHotmart ? (
                    <a href={plan.urlHotmart} target="_blank" rel="noopener noreferrer" className="w-full">
                      <Button 
                        className={`w-full ${plan.isPrincipal ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700' : ''}`}
                        variant={plan.isPrincipal ? 'default' : 'outline'}
                        size="lg"
                      >
                        {plan.isGratuito ? 'Começar Grátis' : 'Assinar Agora'}
                      </Button>
                    </a>
                  ) : (
                    <Link href={getPlanActionUrl(plan)} className="w-full">
                      <Button 
                        className={`w-full ${plan.isPrincipal ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700' : ''}`}
                        variant={plan.isPrincipal ? 'default' : 'outline'}
                        size="lg"
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

        {/* Seção de garantias e benefícios adicionais */}
        <div className="mt-20 bg-gray-50 py-16">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="text-center mb-12">
              <h3 className="text-3xl font-bold text-gray-900 mb-4">Por que escolher nossos planos?</h3>
              <p className="text-lg text-gray-600">Benefícios exclusivos para todos os nossos clientes</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center p-6 bg-white rounded-lg shadow-lg">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 text-green-600 rounded-full mb-4">
                  <BadgeCheck className="h-8 w-8" />
                </div>
                <h4 className="text-xl font-semibold mb-2">Garantia de 7 dias</h4>
                <p className="text-gray-600">Não ficou satisfeito? Devolvemos 100% do seu dinheiro em até 7 dias.</p>
              </div>
              
              <div className="text-center p-6 bg-white rounded-lg shadow-lg">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 text-blue-600 rounded-full mb-4">
                  <Headphones className="h-8 w-8" />
                </div>
                <h4 className="text-xl font-semibold mb-2">Suporte Premium</h4>
                <p className="text-gray-600">Nossa equipe está pronta para ajudar você a aproveitar ao máximo a plataforma.</p>
              </div>
              
              <div className="text-center p-6 bg-white rounded-lg shadow-lg">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 text-purple-600 rounded-full mb-4">
                  <RefreshCw className="h-8 w-8" />
                </div>
                <h4 className="text-xl font-semibold mb-2">Sempre Atualizado</h4>
                <p className="text-gray-600">Novos templates e recursos adicionados semanalmente, sem custo extra.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}