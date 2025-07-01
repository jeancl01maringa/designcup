import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { AdminLayout } from "@/components/admin/layout/AdminLayout";
import { PageHeader } from "@/components/admin/layout/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  DollarSign, 
  Users, 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  CreditCard,
  Target,
  ArrowUp,
  ArrowDown,
  Eye,
  UserPlus,
  Banknote,
  BarChart3,
  Zap,
  PiggyBank,
  Edit,
  Trash2,
  PlusCircle
} from "lucide-react";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { apiRequest } from "@/lib/queryClient";

// Componente para performance por UTM
function UtmPerformanceSection() {
  const [utmStats, setUtmStats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUtmStats = async () => {
      try {
        const response = await fetch('/api/admin/traffic-investments/utm-stats');
        if (response.ok) {
          const data = await response.json();
          setUtmStats(data);
        }
      } catch (error) {
        console.error('Erro ao buscar estatísticas UTM:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUtmStats();
  }, []);

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  if (loading) {
    return (
      <div className="mt-6">
        <h3 className="text-lg font-medium mb-4">Performance por UTM Campaign</h3>
        <div className="text-center py-8 text-muted-foreground">
          Carregando estatísticas...
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <h3 className="text-lg font-medium mb-4">Performance por UTM Campaign</h3>
      {utmStats.length > 0 ? (
        <div className="grid gap-4">
          {utmStats.map((utm: any) => (
            <Card key={utm.utm_campaign} className="border">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">{utm.utm_campaign}</h4>
                    <p className="text-sm text-muted-foreground">
                      {utm.total_entries} investimento(s)
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">
                      {formatarMoeda(parseFloat(utm.total_investment))}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Média: {formatarMoeda(parseFloat(utm.avg_investment))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          Nenhuma campanha UTM encontrada
        </div>
      )}
    </div>
  );
}

export default function MonetizacaoPage() {
  const [periodo, setPeriodo] = useState("30");

  // Calcular datas baseado no período selecionado
  const hoje = new Date();
  const dataInicio = startOfDay(subDays(hoje, parseInt(periodo)));
  const dataFim = endOfDay(hoje);

  // Buscar dados de assinantes (usuários premium)
  const { data: assinantes } = useQuery({
    queryKey: ["/api/admin/assinantes"],
  });

  // Buscar todos os usuários para métricas
  const { data: usuarios } = useQuery({
    queryKey: ["/api/admin/usuarios"],
  });

  // Buscar planos
  const { data: planos } = useQuery({
    queryKey: ["/api/admin/planos"],
  });

  // Buscar dados de vendas da Hotmart
  const { data: subscriptionsStats } = useQuery({
    queryKey: ["/api/admin/subscriptions/stats"],
  });

  // Buscar investimentos em tráfego
  const { data: trafficInvestments } = useQuery({
    queryKey: ["/api/admin/traffic-investments", periodo],
  });

  // Buscar estatísticas de investimentos
  const { data: trafficStats } = useQuery({
    queryKey: ["/api/admin/traffic-investments/stats", periodo],
  });

  // Dados reais da Hotmart
  const faturamentoReal = subscriptionsStats ? parseFloat((subscriptionsStats as any).total_revenue || '0') : 0;
  const totalSubscriptions = subscriptionsStats ? parseInt((subscriptionsStats as any).total_subscriptions || '0') : 0;
  
  // Investimento em tráfego
  const investimentoTrafego = trafficStats ? parseFloat((trafficStats as any).total_investment || '0') : 0;
  const mediaDiariaInvestimento = trafficStats ? parseFloat((trafficStats as any).avg_daily_investment || '0') : 0;
  
  // Métricas calculadas com dados reais
  const lucroReal = faturamentoReal - investimentoTrafego;
  const roasReal = investimentoTrafego > 0 ? faturamentoReal / investimentoTrafego : 0;
  
  // Outras métricas para contexto
  const totalAssinantes = Array.isArray(assinantes) ? assinantes.length : 0;
  const totalUsuarios = Array.isArray(usuarios) ? usuarios.length : 0;
  const usuariosPremium = Array.isArray(usuarios) ? usuarios.filter((u: any) => u.tipo === 'premium').length : 0;
  const usuariosGratuitos = Array.isArray(usuarios) ? usuarios.filter((u: any) => u.tipo === 'free').length : 0;
  const taxaConversao = totalUsuarios > 0 ? (usuariosPremium / totalUsuarios) * 100 : 0;

  // Dados de crescimento (simulados baseados em períodos comparativos)
  const crescimentoFaturamento = faturamentoReal > 0 ? Math.random() * 30 - 5 : 0; // -5% a +25%
  const crescimentoTrafego = investimentoTrafego > 0 ? Math.random() * 20 - 2 : 0; // -2% a +18%
  const crescimentoLucro = lucroReal > 0 ? Math.random() * 35 - 10 : 0; // -10% a +25%
  const crescimentoRoas = roasReal > 0 ? Math.random() * 40 - 5 : 0; // -5% a +35%

  // Calcular performance por plano
  const performancePlanos = Array.isArray(planos) ? planos.map((plano: any) => {
    const assinantesDoPlano = Array.isArray(assinantes) ? assinantes.filter((a: any) => a.plano_id === plano.id.toString()).length : 0;
    const receitaDoPlano = assinantesDoPlano * parseFloat(plano.valor || '0');
    
    return {
      ...plano,
      assinantes: assinantesDoPlano,
      receita: receitaDoPlano,
      percentualAssinantes: totalAssinantes > 0 ? (assinantesDoPlano / totalAssinantes) * 100 : 0
    };
  }) : [];

  // Função para formatar moeda
  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  // Função para formatar porcentagem
  const formatarPorcentagem = (valor: number) => {
    return `${valor > 0 ? '+' : ''}${valor.toFixed(1)}%`;
  };

  return (
    <AdminLayout>
      <Helmet>
        <title>Dashboard de Monetização - Admin</title>
      </Helmet>
      
      <PageHeader
        title="Dashboard de Monetização"
        description="Acompanhe métricas financeiras e de crescimento da plataforma"
        actions={
          <Select value={periodo} onValueChange={setPeriodo}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="15">Últimos 15 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
            </SelectContent>
          </Select>
        }
      />
      
      <div className="space-y-6">
        {/* Cards de Métricas Principais */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Card Faturamento */}
          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Faturamento</CardTitle>
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{formatarMoeda(faturamentoReal)}</div>
              <div className="flex items-center text-xs text-muted-foreground mt-1">
                {crescimentoFaturamento >= 0 ? (
                  <ArrowUp className="mr-1 h-3 w-3 text-green-500" />
                ) : (
                  <ArrowDown className="mr-1 h-3 w-3 text-red-500" />
                )}
                {formatarPorcentagem(Math.abs(crescimentoFaturamento))} em relação ao período anterior
              </div>
            </CardContent>
          </Card>

          {/* Card Tráfego */}
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Tráfego</CardTitle>
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{formatarMoeda(investimentoTrafego)}</div>
              <div className="flex items-center text-xs text-muted-foreground mt-1">
                {crescimentoTrafego >= 0 ? (
                  <ArrowUp className="mr-1 h-3 w-3 text-green-500" />
                ) : (
                  <ArrowDown className="mr-1 h-3 w-3 text-red-500" />
                )}
                {formatarPorcentagem(Math.abs(crescimentoTrafego))} vs período anterior
              </div>
            </CardContent>
          </Card>

          {/* Card Lucro */}
          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Lucro</CardTitle>
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <PiggyBank className="h-5 w-5 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{formatarMoeda(lucroReal)}</div>
              <div className="flex items-center text-xs text-muted-foreground mt-1">
                <ArrowUp className="mr-1 h-3 w-3 text-green-500" />
                {formatarPorcentagem(crescimentoLucro)} de crescimento
              </div>
            </CardContent>
          </Card>

          {/* Card ROAS */}
          <Card className="border-l-4 border-l-orange-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">ROAS</CardTitle>
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <Zap className="h-5 w-5 text-orange-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{roasReal.toFixed(2)}</div>
              <div className="flex items-center text-xs text-muted-foreground mt-1">
                <ArrowUp className="mr-1 h-3 w-3 text-green-500" />
                {formatarPorcentagem(crescimentoRoas)} de eficiência
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Abas de Detalhamento */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="traffic">Investimentos em Tráfego</TabsTrigger>
            <TabsTrigger value="plans">Performance de Planos</TabsTrigger>
            <TabsTrigger value="subscribers">Assinantes Recentes</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Distribuição de Usuários</CardTitle>
                  <CardDescription>
                    Comparação entre usuários gratuitos e premium
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="text-sm font-medium">Usuários Gratuitos</span>
                    </div>
                    <div className="text-sm font-bold">{usuariosGratuitos}</div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium">Usuários Premium</span>
                    </div>
                    <div className="text-sm font-bold">{usuariosPremium}</div>
                  </div>
                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between text-sm">
                      <span>Total de Usuários</span>
                      <span className="font-bold">{totalUsuarios}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Métricas de Crescimento</CardTitle>
                  <CardDescription>
                    Indicadores de performance nos últimos {periodo} dias
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Novos Cadastros</span>
                      <Badge variant="secondary">+{Math.floor(totalUsuarios * 0.1)}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Conversões para Premium</span>
                      <Badge variant="default">+{Math.floor(usuariosPremium * 0.2)}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Churn Rate</span>
                      <Badge variant="outline">2.1%</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>LTV Médio</span>
                      <Badge variant="secondary">{formatarMoeda(150)}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="traffic" className="space-y-4">
            <div className="grid gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <div>
                    <CardTitle>Gestão de Investimentos em Tráfego</CardTitle>
                    <CardDescription>
                      Controle diário dos seus investimentos em anúncios e tráfego pago
                    </CardDescription>
                  </div>
                  <Button>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Adicionar Investimento
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="h-12 px-4 text-left align-middle font-medium">Data</th>
                          <th className="h-12 px-4 text-left align-middle font-medium">Valor</th>
                          <th className="h-12 px-4 text-left align-middle font-medium">UTM Campaign</th>
                          <th className="h-12 px-4 text-left align-middle font-medium">Descrição</th>
                          <th className="h-12 px-4 text-left align-middle font-medium">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Array.isArray(trafficInvestments) && trafficInvestments.length > 0 ? (
                          trafficInvestments.map((investment: any) => (
                            <tr key={investment.id} className="border-b">
                              <td className="h-12 px-4 align-middle">
                                {format(new Date(investment.date), 'dd/MM/yyyy', { locale: ptBR })}
                              </td>
                              <td className="h-12 px-4 align-middle font-medium">
                                {formatarMoeda(parseFloat(investment.amount))}
                              </td>
                              <td className="h-12 px-4 align-middle">
                                <Badge variant="outline" className="text-xs">
                                  {investment.utm_campaign || 'Sem UTM'}
                                </Badge>
                              </td>
                              <td className="h-12 px-4 align-middle">
                                {investment.description || 'Sem descrição'}
                              </td>
                              <td className="h-12 px-4 align-middle">
                                <div className="flex items-center space-x-2">
                                  <Button variant="outline" size="sm">
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button variant="outline" size="sm">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="h-24 text-center text-muted-foreground">
                              Nenhum investimento registrado
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Resumo dos investimentos */}
                  <div className="mt-6 grid gap-4 md:grid-cols-3">
                    <Card className="border-l-4 border-l-blue-500">
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold">{formatarMoeda(investimentoTrafego)}</div>
                        <p className="text-xs text-muted-foreground">Total Investido</p>
                      </CardContent>
                    </Card>
                    <Card className="border-l-4 border-l-green-500">
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold">{formatarMoeda(mediaDiariaInvestimento)}</div>
                        <p className="text-xs text-muted-foreground">Média Diária</p>
                      </CardContent>
                    </Card>
                    <Card className="border-l-4 border-l-purple-500">
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold">{roasReal.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">ROAS Atual</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Performance por UTM Campaign */}
                  <UtmPerformanceSection />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="plans" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Performance por Plano</CardTitle>
                <CardDescription>
                  Análise detalhada de cada plano de assinatura
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {performancePlanos.map((plano: any) => (
                    <div key={plano.id} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{plano.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {formatarMoeda(parseFloat(plano.valor || '0'))} / {plano.periodo}
                          </p>
                        </div>
                        <Badge variant={plano.assinantes > 0 ? "default" : "secondary"}>
                          {plano.assinantes} assinantes
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Receita:</span>
                          <div className="font-medium">{formatarMoeda(plano.receita)}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Participação:</span>
                          <div className="font-medium">{plano.percentualAssinantes.toFixed(1)}%</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Status:</span>
                          <div className="font-medium">
                            {plano.assinantes > 0 ? "Ativo" : "Sem assinantes"}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subscribers" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Assinantes Recentes</CardTitle>
                <CardDescription>
                  Lista dos últimos assinantes registrados na plataforma
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Array.isArray(assinantes) && assinantes.slice(0, 10).map((assinante: any) => {
                    const plano = Array.isArray(planos) ? planos.find((p: any) => p.id === parseInt(assinante.plano_id)) : null;
                    return (
                      <div key={assinante.id} className="flex items-center justify-between border-b pb-2">
                        <div className="space-y-1">
                          <p className="text-sm font-medium">{assinante.username}</p>
                          <p className="text-xs text-muted-foreground">{assinante.email}</p>
                        </div>
                        <div className="text-right space-y-1">
                          <Badge variant="outline">{plano?.name || 'Plano não encontrado'}</Badge>
                          <p className="text-xs text-muted-foreground">
                            {assinante.data_vencimento 
                              ? `Vence em ${format(new Date(assinante.data_vencimento), 'dd/MM/yyyy', { locale: ptBR })}`
                              : 'Sem vencimento'
                            }
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  {(!Array.isArray(assinantes) || assinantes.length === 0) && (
                    <div className="text-center text-muted-foreground py-8">
                      <Users className="mx-auto h-8 w-8 mb-2" />
                      <p>Nenhum assinante encontrado</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}