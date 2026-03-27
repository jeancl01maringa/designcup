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
        <li key={index} className={`flex items-start gap-3 ${item.startsWith('❌') ? 'text-muted-foreground' : 'text-foreground/90'}`}>
          <div className={`mt-0.5 flex-shrink-0 ${item.startsWith('❌') ? 'opacity-40' : 'text-primary'}`}>
            {item.startsWith('❌') ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
          </div>
          <span className="text-sm font-normal">{item.replace('❌ ', '')}</span>
        </li>
      ));
    }

    return allItems.map((item, index) => (
      <li key={index} className={`flex items-start gap-2.5 ${item.startsWith('❌') ? 'text-muted-foreground/50' : 'text-foreground/80'}`}>
        <div className={`mt-0.5 flex-shrink-0 ${item.startsWith('❌') ? 'opacity-30' : 'text-emerald-500'}`}>
          {item.startsWith('❌') ? <X className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" strokeWidth={3} />}
        </div>
        <span className="text-[13px] font-normal leading-tight">{item.replace('❌ ', '')}</span>
      </li>
    ));
  };

  const getPlanIcon = (plan: Plan) => {
    if (plan.isGratuito) return <Gift className="h-5 w-5 text-[#8C8261]" />;
    const periodo = plan.periodo?.toLowerCase();
    if (periodo === 'mensal') return <Calendar className="h-5 w-5 text-blue-400/80" />;
    if (periodo === 'trimestral') return <Clock className="h-5 w-5 text-purple-400/80" />;
    if (periodo === 'anual') return <Star className="h-5 w-5 text-amber-500/80" />;
    if (periodo === 'vitalicio') return <Crown className="h-5 w-5 text-[#8C8261]" />;
    return <Sparkles className="h-5 w-5 text-blue-400/80" />;
  };

  const handlePlanClick = (plan: Plan) => {
    if (plan.urlHotmart) {
      window.open(plan.urlHotmart, '_blank');
    } else if (plan.isGratuito) {
      navigate('/loguin/cadastro');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="pt-20 pb-10">
        <div className="container-global text-center">
          <div className="inline-flex items-center gap-2 bg-accent/50 rounded-full px-4 py-2 mb-4 border border-border">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-normal text-muted-foreground">Escolha o plano ideal para você</span>
          </div>

          <h1 className="text-xl md:text-2xl font-medium mb-2 text-foreground">
            Junte-se ao <span className="text-primary font-bold">premium</span>
          </h1>

          <p className="text-sm mb-12 text-muted-foreground max-w-2xl mx-auto font-normal">
            Templates profissionais para seu negócio. Comece grátis ou escolha um plano premium.
          </p>

          {/* Plans Grid */}
          <div className="flex justify-center w-full">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl w-full">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-card rounded-xl border border-border p-6">
                    <Skeleton className="h-6 w-6 rounded mb-3 bg-muted" />
                    <Skeleton className="h-5 w-32 mb-4 bg-muted" />
                    <Skeleton className="h-10 w-24 mb-6 bg-muted" />
                    <div className="space-y-3">
                      {[1, 2, 3, 4].map((j) => (
                        <div key={j} className="flex items-center gap-3">
                          <Skeleton className="h-4 w-4 bg-muted" />
                          <Skeleton className="h-4 flex-1 bg-muted" />
                        </div>
                      ))}
                    </div>
                    <Skeleton className="h-12 w-full mt-6 bg-muted" />
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                  <X className="h-6 w-6 text-destructive" />
                </div>
                <h3 className="mt-4 text-lg font-medium text-foreground">Erro ao carregar planos</h3>
                <p className="mt-2 text-muted-foreground text-sm">Tente novamente mais tarde.</p>
              </div>
            ) : sortedPlans.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-sm">Nenhum plano disponível no momento.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl w-full">
                {sortedPlans.map((plan) => (
                  <div
                    key={plan.id}
                    className={`relative flex flex-col rounded-2xl transition-all duration-300 hover:scale-[1.01] ${plan.isPrincipal
                      ? 'bg-card shadow-lg shadow-black/5'
                      : 'bg-card/40'
                      }`}
                  >
                    {/* Badge Superior */}
                    {plan.isPrincipal && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                        <span className="bg-gradient-to-r from-[#8C8261] to-white text-[#121212] px-3 py-1 text-[9px] font-bold tracking-tight rounded-full shadow-md inline-flex items-center gap-1">
                          <Crown className="h-2.5 w-2.5" /> MAIS POPULAR
                        </span>
                      </div>
                    )}

                    {/* Card Content */}
                    <div className="p-6 flex flex-col flex-grow items-center text-center">
                      {/* Name */}
                      <div className="flex flex-col items-center mb-6">
                        <h3 className="text-sm font-bold text-foreground/80 uppercase tracking-widest">{plan.name}</h3>
                      </div>

                      {/* Price Section */}
                      <div className="mb-6 flex flex-col items-center w-full">
                        {plan.isGratuito ? (
                          <div className="text-2xl font-bold text-foreground">Grátis</div>
                        ) : (
                          <div className="flex flex-col items-center">
                            {plan.valorOriginal && (
                              <div className="text-[11px] text-muted-foreground/40 line-through mb-0.5">
                                De R$ {parseFloat(plan.valorOriginal).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </div>
                            )}
                            <div className="flex items-baseline justify-center">
                              <span className="text-base font-medium text-muted-foreground mr-0.5">R$</span>
                              <span className="text-3xl font-bold text-foreground tracking-tight">
                                {getPlanPrice(plan).toLocaleString('pt-BR', { minimumFractionDigits: 0 }).replace(/,00$/, '')}
                              </span>
                              <span className="text-3xl font-bold text-foreground">,00</span>
                              <span className="text-[11px] text-muted-foreground ml-1 font-medium">
                                /{getPlanPeriod(plan).replace('por ', '').replace('para ', '')}
                              </span>
                            </div>
                            {plan.porcentagemEconomia && (
                              <div className="mt-2.5">
                                <span className="bg-emerald-500/10 text-emerald-500 text-[10px] font-bold uppercase tracking-wide px-3 py-1 rounded-full border border-emerald-500/20">
                                  Economize {plan.porcentagemEconomia}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Separator */}
                      <div className="w-full border-t border-border/40 mb-6" />

                      {/* Benefits List */}
                      <div className="w-full">
                        <ul className="space-y-3.5 flex-grow w-full text-left">
                          {renderPlanItems(plan)}
                        </ul>
                      </div>

                      {/* CTA Button */}
                      <div className="mt-8 w-full">
                        {plan.urlHotmart ? (
                          <a
                            href={plan.urlHotmart}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block w-full"
                          >
                            <button
                              className={`w-full py-4 text-[12px] font-bold uppercase tracking-wider rounded-xl transition-all duration-300 transform active:scale-95 ${plan.isGratuito
                                ? 'bg-muted/50 hover:bg-muted text-foreground border border-border/50'
                                : 'bg-gradient-to-r from-[#8C8261] to-white hover:opacity-90 text-[#121212] shadow-md border-0'
                                }`}
                            >
                              {plan.isGratuito ? 'Começar Grátis' : 'Assinar Agora'}
                            </button>
                          </a>
                        ) : (
                          <button
                            onClick={() => handlePlanClick(plan)}
                            className={`w-full py-4 text-[12px] font-bold uppercase tracking-wider rounded-xl transition-all duration-300 transform active:scale-95 ${plan.isGratuito
                              ? 'bg-muted/50 hover:bg-muted text-foreground border border-border/50'
                              : 'bg-gradient-to-r from-[#8C8261] to-white hover:opacity-90 text-[#121212] shadow-md border-0'
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

      {/* Trust Section */}
      <div className="bg-card/30 py-20 border-t border-border/50">
        <div className="container-global max-w-6xl">
          <div className="text-center mb-16">
            <h3 className="text-xl font-bold text-foreground mb-3">Por que escolher nossos planos?</h3>
            <p className="text-sm text-muted-foreground font-normal max-w-lg mx-auto">Benefícios exclusivos pensados para acelerar seu processo criativo e elevar o nível dos seus designs.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: <Crown className="h-6 w-6" />, title: "+300 Templates Premium", desc: "Acesso completo à nossa biblioteca com centenas de templates profissionais de alta conversão.", color: "text-amber-500" },
              { icon: <RefreshCw className="h-6 w-6" />, title: "Qualidade de Estúdio", desc: "Artes de altíssima fidelidade criadas por designers especialistas no nicho.", color: "text-blue-500" },
              { icon: <Headphones className="h-6 w-6" />, title: "Suporte VIP", desc: "Atendimento prioritário e consultoria rápida via WhatsApp para todos os assinantes premium.", color: "text-purple-500" },
              { icon: <BadgeCheck className="h-6 w-6" />, title: "Garantia Blindada", desc: "7 dias de satisfação total ou 100% do seu dinheiro de volta, sem perguntas.", color: "text-emerald-500" },
              { icon: <Infinity className="h-6 w-6" />, title: "Limite? Desconhecemos", desc: "Baixe e utilize quantos arquivos precisar, sem nenhuma barreira ou limite diário.", color: "text-pink-500" },
              { icon: <Zap className="h-6 w-6" />, title: "Always Fresh", desc: "Nossa biblioteca é atualizada semanalmente com as últimas tendências do mercado.", color: "text-yellow-500" },
            ].map((item, i) => (
              <div key={i} className="group p-8 bg-card rounded-2xl transition-all hover:bg-card/80 hover:shadow-lg hover:shadow-black/5">
                <div className={`inline-flex items-center justify-center w-12 h-12 mb-6 group-hover:scale-110 transition-all duration-300 ${item.color}`}>
                  {item.icon}
                </div>
                <h4 className="text-base font-bold text-foreground mb-2">{item.title}</h4>
                <p className="text-xs text-muted-foreground font-normal leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}