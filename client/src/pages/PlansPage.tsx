import React, { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  const { toast } = useToast();
  const [, navigate] = useLocation();

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
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
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

    const activePlans = plans.filter((plan: Plan) => plan.active !== false);

    return activePlans.sort((a: Plan, b: Plan) => {
      if (a.isGratuito && !b.isGratuito) return -1;
      if (!a.isGratuito && b.isGratuito) return 1;

      const periodoA = a.periodo?.toLowerCase();
      const periodoB = b.periodo?.toLowerCase();

      const orderA = periodoA === 'mensal' ? 1 : periodoA === 'anual' ? 2 : 3;
      const orderB = periodoB === 'mensal' ? 1 : periodoB === 'anual' ? 2 : 3;

      return orderA - orderB;
    });
  }, [plans]);

  const getPlanPrice = (plan: Plan) => {
    if (plan.isGratuito) return 0;
    return parsePrice(plan.valor || '0');
  };

  const getPlanPeriod = (plan: Plan) => {
    if (plan.isGratuito) return 'Para sempre';
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
        <li key={index} className={`flex items-start gap-3 ${item.startsWith('❌') ? 'text-gray-500' : 'text-gray-300'}`}>
          <div className={`mt-0.5 flex-shrink-0 ${item.startsWith('❌') ? 'text-red-400/60' : 'text-emerald-400'}`}>
            {item.startsWith('❌') ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
          </div>
          <span className="text-sm font-normal">{item.replace('❌ ', '')}</span>
        </li>
      ));
    }

    return allItems.map((item, index) => (
      <li key={index} className={`flex items-start gap-3 ${item.startsWith('❌') ? 'text-gray-500' : 'text-gray-300'}`}>
        <div className={`mt-0.5 flex-shrink-0 ${item.startsWith('❌') ? 'text-red-400/60' : 'text-emerald-400'}`}>
          {item.startsWith('❌') ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
        </div>
        <span className="text-sm font-normal">{item.replace('❌ ', '')}</span>
      </li>
    ));
  };

  const getPlanIcon = (plan: Plan) => {
    if (plan.isGratuito) return <Gift className="h-6 w-6 text-emerald-400" />;
    const periodo = plan.periodo?.toLowerCase();
    if (periodo === 'mensal') return <Calendar className="h-6 w-6 text-blue-400" />;
    if (periodo === 'trimestral') return <Clock className="h-6 w-6 text-purple-400" />;
    if (periodo === 'anual') return <Star className="h-6 w-6 text-amber-400" />;
    if (periodo === 'vitalicio') return <Crown className="h-6 w-6 text-amber-400" />;
    return <Sparkles className="h-6 w-6 text-blue-400" />;
  };

  const handlePlanClick = (plan: Plan) => {
    if (plan.urlHotmart) {
      window.open(plan.urlHotmart, '_blank');
    } else if (plan.isGratuito) {
      navigate('/loguin/cadastro');
    }
  };

  return (
    <div className="min-h-screen bg-[#121212]">
      {/* Hero Section */}
      <div className="pt-20 pb-10">
        <div className="container-global text-center">
          <div className="inline-flex items-center gap-2 bg-white/5 rounded-full px-4 py-2 mb-4 border border-white/10">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span className="text-xs font-normal text-gray-400">Escolha o plano ideal para você</span>
          </div>

          <h1 className="text-xl md:text-2xl font-medium mb-2 text-white">
            Junte-se ao <span className="text-amber-400">premium</span>
          </h1>

          <p className="text-sm mb-12 text-gray-400 max-w-2xl mx-auto font-normal">
            Templates profissionais para seu negócio. Comece grátis ou escolha um plano premium.
          </p>

          {/* Plans Grid */}
          <div className="flex justify-center w-full">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl w-full">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-[#1a1a1a] rounded-xl border border-white/5 p-6">
                    <Skeleton className="h-6 w-6 rounded mb-3 bg-white/10" />
                    <Skeleton className="h-5 w-32 mb-4 bg-white/10" />
                    <Skeleton className="h-10 w-24 mb-6 bg-white/10" />
                    <div className="space-y-3">
                      {[1, 2, 3, 4].map((j) => (
                        <div key={j} className="flex items-center gap-3">
                          <Skeleton className="h-4 w-4 bg-white/10" />
                          <Skeleton className="h-4 flex-1 bg-white/10" />
                        </div>
                      ))}
                    </div>
                    <Skeleton className="h-12 w-full mt-6 bg-white/10" />
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
                  <X className="h-6 w-6 text-red-400" />
                </div>
                <h3 className="mt-4 text-lg font-medium text-white">Erro ao carregar planos</h3>
                <p className="mt-2 text-gray-400 text-sm">Tente novamente mais tarde.</p>
              </div>
            ) : sortedPlans.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-400 text-sm">Nenhum plano disponível no momento.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl w-full">
                {sortedPlans.map((plan) => (
                  <div
                    key={plan.id}
                    className={`relative flex flex-col rounded-xl border transition-all duration-300 hover:scale-[1.02] ${plan.isPrincipal
                        ? 'border-amber-500/40 bg-[#1a1a1a] shadow-lg shadow-amber-500/5'
                        : 'border-white/8 bg-[#1a1a1a] hover:border-white/15'
                      }`}
                  >
                    {/* Badge Superior */}
                    {plan.isPrincipal && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                        <span className="bg-gradient-to-r from-amber-500 to-amber-600 text-white px-4 py-1 text-xs font-medium rounded-full shadow-lg inline-flex items-center gap-1">
                          <Crown className="h-3 w-3" /> MAIS POPULAR
                        </span>
                      </div>
                    )}

                    {/* Card Content */}
                    <div className="p-6 flex flex-col flex-grow">
                      {/* Icon + Name */}
                      <div className="flex items-center gap-2 mb-4">
                        {getPlanIcon(plan)}
                        <span className="text-base font-medium text-white">{plan.name}</span>
                      </div>

                      {/* Price */}
                      <div className="mb-6">
                        {plan.isGratuito ? (
                          <div className="text-3xl font-semibold text-white">Grátis</div>
                        ) : (
                          <div>
                            {plan.valorOriginal && (
                              <div className="text-xs text-gray-500 line-through mb-1">
                                De R$ {parseFloat(plan.valorOriginal).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </div>
                            )}
                            <div className="flex items-baseline">
                              <span className="text-lg font-medium text-gray-400">R$</span>
                              <span className="text-3xl font-semibold text-white ml-1">
                                {getPlanPrice(plan).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                              <span className="text-xs text-gray-500 ml-1">
                                /{getPlanPeriod(plan).replace('por ', '').replace('para ', '')}
                              </span>
                            </div>
                            {plan.porcentagemEconomia && (
                              <div className="mt-2">
                                <span className="bg-emerald-500/10 text-emerald-400 text-xs font-normal px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                                  Economize {plan.porcentagemEconomia}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                        <div className="text-xs text-gray-500 mt-1 font-normal">
                          {plan.isGratuito ? 'Para sempre' : ''}
                        </div>
                      </div>

                      {/* Separator */}
                      <div className="border-t border-white/5 mb-5" />

                      {/* Benefits */}
                      <ul className="space-y-3 flex-grow">
                        {renderPlanItems(plan)}
                      </ul>

                      {/* Button */}
                      <div className="mt-6">
                        {plan.urlHotmart ? (
                          <a
                            href={plan.urlHotmart}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block w-full"
                          >
                            <button
                              className={`w-full py-4 text-sm font-medium rounded-lg transition-all duration-300 ${plan.isGratuito
                                  ? 'bg-white/10 hover:bg-white/15 text-white border border-white/10'
                                  : 'bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-600 hover:via-yellow-600 hover:to-amber-700 text-black shadow-lg hover:shadow-amber-500/20'
                                }`}
                            >
                              {plan.isGratuito ? 'Começar Grátis' : 'Assinar Agora'}
                            </button>
                          </a>
                        ) : (
                          <button
                            onClick={() => handlePlanClick(plan)}
                            className={`w-full py-4 text-sm font-medium rounded-lg transition-all duration-300 ${plan.isGratuito
                                ? 'bg-white/10 hover:bg-white/15 text-white border border-white/10'
                                : 'bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-600 hover:via-yellow-600 hover:to-amber-700 text-black shadow-lg hover:shadow-amber-500/20'
                              }`}
                          >
                            {plan.isGratuito ? 'Começar Grátis' : 'Assinar Agora'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Seção de garantias e benefícios */}
      <div className="bg-[#0d0d0d] py-16 border-t border-white/5">
        <div className="container-global max-w-5xl">
          <div className="text-center mb-10">
            <h3 className="text-lg font-medium text-white mb-2">Por que escolher nossos planos?</h3>
            <p className="text-sm text-gray-400 font-normal">Benefícios exclusivos para todos os nossos clientes</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: <Crown className="h-6 w-6" />, title: "+300 Templates Premium", desc: "Acesso completo à nossa biblioteca com centenas de templates profissionais." },
              { icon: <RefreshCw className="h-6 w-6" />, title: "Qualidade Premium", desc: "Artes de altíssima qualidade criadas por designers profissionais experientes." },
              { icon: <Headphones className="h-6 w-6" />, title: "Suporte Exclusivo", desc: "Atendimento premium disponível 24 horas por dia, 7 dias por semana." },
              { icon: <BadgeCheck className="h-6 w-6" />, title: "Garantia de 7 dias", desc: "Não ficou satisfeito? Devolvemos 100% do seu dinheiro em até 7 dias." },
              { icon: <Infinity className="h-6 w-6" />, title: "Download Ilimitado", desc: "Baixe quantos templates quiser, sem limites de download." },
              { icon: <Zap className="h-6 w-6" />, title: "Sempre Atualizado", desc: "Plataforma constantemente atualizada com novos recursos e melhorias." },
            ].map((item, i) => (
              <div key={i} className="text-center p-5 bg-[#1a1a1a] rounded-xl border border-white/5">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-white/5 text-amber-400 rounded-full mb-3">
                  {item.icon}
                </div>
                <h4 className="text-sm font-medium text-white mb-1.5">{item.title}</h4>
                <p className="text-xs text-gray-400 font-normal leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}