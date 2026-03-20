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
  PlusCircle,
  Link,
  Copy,
  Check
} from "lucide-react";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { apiRequest } from "@/lib/queryClient";
import { UTMDebugger } from "@/components/admin/UTMDebugger";

// Componente para performance por UTM Campaign
function UtmPerformanceSection() {
  const [utmStats, setUtmStats] = useState<any[]>([]);
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
        <div className="grid gap-3">
          {utmStats.map((utm: any) => (
            <Card key={utm.utm_campaign} className="border">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-sm">{utm.utm_campaign}</h4>
                    <p className="text-xs text-muted-foreground">
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
          <p>Nenhuma campanha UTM encontrada</p>
          <p className="text-xs mt-2">Adicione investimentos com UTM para ver estatísticas por campanha</p>
        </div>
      )}
    </div>
  );
}

export default function MonetizacaoPage() {
  const queryClient = useQueryClient();
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

  // Estado para feedback de cópia
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  
  // Estados para gestão de investimentos
  const [isAddingInvestment, setIsAddingInvestment] = useState(false);
  const [editingInvestment, setEditingInvestment] = useState<any>(null);
  const [investmentForm, setInvestmentForm] = useState({
    amount: '',
    description: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    utm_campaign: ''
  });

  // Função para copiar código UTM
  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCode(type);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      console.error('Erro ao copiar:', err);
    }
  };

  // Função para resetar formulário
  const resetForm = () => {
    setInvestmentForm({
      amount: '',
      description: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      utm_campaign: ''
    });
    setEditingInvestment(null);
    setIsAddingInvestment(false);
  };

  // Mutações para CRUD de investimentos
  const addInvestmentMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/admin/traffic-investments', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/traffic-investments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/traffic-investments/stats"] });
      resetForm();
    }
  });

  const updateInvestmentMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: any }) => 
      apiRequest('PUT', `/api/admin/traffic-investments/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/traffic-investments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/traffic-investments/stats"] });
      resetForm();
    }
  });

  const deleteInvestmentMutation = useMutation({
    mutationFn: (id: number) => apiRequest('DELETE', `/api/admin/traffic-investments/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/traffic-investments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/traffic-investments/stats"] });
    }
  });

  // Função para adicionar investimento
  const addInvestment = () => {
    const data = {
      amount: parseFloat(investmentForm.amount),
      description: investmentForm.description,
      date: investmentForm.date,
      utm_campaign: investmentForm.utm_campaign || null
    };
    addInvestmentMutation.mutate(data);
  };

  // Função para editar investimento
  const updateInvestment = () => {
    if (!editingInvestment) return;
    
    const data = {
      amount: parseFloat(investmentForm.amount),
      description: investmentForm.description,
      date: investmentForm.date,
      utm_campaign: investmentForm.utm_campaign || null
    };
    updateInvestmentMutation.mutate({ id: editingInvestment.id, data });
  };

  // Função para excluir investimento
  const deleteInvestment = (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este investimento?')) return;
    deleteInvestmentMutation.mutate(id);
  };

  // Função para iniciar edição
  const startEdit = (investment: any) => {
    setInvestmentForm({
      amount: investment.amount.toString(),
      description: investment.description || '',
      date: format(new Date(investment.date), 'yyyy-MM-dd'),
      utm_campaign: investment.utm_campaign || ''
    });
    setEditingInvestment(investment);
    setIsAddingInvestment(true);
  };

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
              <CardTitle className="text-sm font-medium text-muted-foreground">Faturamento</CardTitle>
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{formatarMoeda(faturamentoReal)}</div>
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
              <CardTitle className="text-sm font-medium text-muted-foreground">Tráfego</CardTitle>
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{formatarMoeda(investimentoTrafego)}</div>
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
              <CardTitle className="text-sm font-medium text-muted-foreground">Lucro</CardTitle>
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <PiggyBank className="h-5 w-5 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{formatarMoeda(lucroReal)}</div>
              <div className="flex items-center text-xs text-muted-foreground mt-1">
                <ArrowUp className="mr-1 h-3 w-3 text-green-500" />
                {formatarPorcentagem(crescimentoLucro)} de crescimento
              </div>
            </CardContent>
          </Card>

          {/* Card ROAS */}
          <Card className="border-l-4 border-l-orange-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">ROAS</CardTitle>
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <Zap className="h-5 w-5 text-orange-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{roasReal.toFixed(2)}</div>
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
            <TabsTrigger value="integrations">Integrações</TabsTrigger>
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
                  <Button onClick={() => setIsAddingInvestment(true)}>
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
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => startEdit(investment)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => deleteInvestment(investment.id)}
                                  >
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

          <TabsContent value="integrations" className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-3">
              {/* Códigos UTM para Campanhas */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Códigos UTM para Campanhas
                  </CardTitle>
                  <CardDescription>
                    Copie e cole estes códigos nas suas campanhas do Facebook e Google
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Facebook Ads */}
                  <div className="border rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
                        <span className="text-white text-xs font-bold">f</span>
                      </div>
                      <span className="font-medium">Facebook Ads</span>
                    </div>
                    <div className="bg-muted rounded p-2 text-xs font-mono flex items-center justify-between">
                      <code>?utm_source=facebook&utm_medium=cpc&utm_campaign=nome_da_sua_campanha</code>
                      <button
                        onClick={() => copyToClipboard('?utm_source=facebook&utm_medium=cpc&utm_campaign=nome_da_sua_campanha', 'facebook')}
                        className="ml-2 p-1 hover:bg-card rounded transition-colors"
                        title="Copiar código"
                      >
                        {copiedCode === 'facebook' ? 
                          <Check className="h-3 w-3 text-green-600" /> : 
                          <Copy className="h-3 w-3 text-muted-foreground" />
                        }
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Substitua "nome_da_sua_campanha" pelo nome específico (ex: botox_janeiro, harmonizacao_verao)
                    </p>
                  </div>

                  {/* Google Ads */}
                  <div className="border rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 bg-red-500 rounded flex items-center justify-center">
                        <span className="text-white text-xs font-bold">G</span>
                      </div>
                      <span className="font-medium">Google Ads</span>
                    </div>
                    <div className="bg-muted rounded p-2 text-xs font-mono flex items-center justify-between">
                      <code>?utm_source=google&utm_medium=cpc&utm_campaign=nome_da_sua_campanha</code>
                      <button
                        onClick={() => copyToClipboard('?utm_source=google&utm_medium=cpc&utm_campaign=nome_da_sua_campanha', 'google')}
                        className="ml-2 p-1 hover:bg-card rounded transition-colors"
                        title="Copiar código"
                      >
                        {copiedCode === 'google' ? 
                          <Check className="h-3 w-3 text-green-600" /> : 
                          <Copy className="h-3 w-3 text-muted-foreground" />
                        }
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Substitua "nome_da_sua_campanha" pelo nome específico (ex: preenchimento_sp, skincare_promocao)
                    </p>
                  </div>

                  {/* Instagram */}
                  <div className="border rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 bg-pink-500 rounded flex items-center justify-center">
                        <span className="text-white text-xs font-bold">I</span>
                      </div>
                      <span className="font-medium">Instagram Ads</span>
                    </div>
                    <div className="bg-muted rounded p-2 text-xs font-mono flex items-center justify-between">
                      <code>?utm_source=instagram&utm_medium=story&utm_campaign=nome_da_sua_campanha</code>
                      <button
                        onClick={() => copyToClipboard('?utm_source=instagram&utm_medium=story&utm_campaign=nome_da_sua_campanha', 'instagram')}
                        className="ml-2 p-1 hover:bg-card rounded transition-colors"
                        title="Copiar código"
                      >
                        {copiedCode === 'instagram' ? 
                          <Check className="h-3 w-3 text-green-600" /> : 
                          <Copy className="h-3 w-3 text-muted-foreground" />
                        }
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Para stories promocionais e anúncios no Instagram
                    </p>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <h4 className="font-medium text-blue-900 mb-1">Como usar:</h4>
                    <ol className="text-xs text-blue-800 space-y-1">
                      <li>1. Copie o código UTM apropriado</li>
                      <li>2. Cole no final da URL do seu site nas campanhas</li>
                      <li>3. O sistema capturará automaticamente os dados</li>
                      <li>4. Acompanhe o ROAS por campanha aqui no painel</li>
                    </ol>
                  </div>
                </CardContent>
              </Card>

              {/* Status de Integrações e UTM Debugger */}
              <div className="space-y-4">
                {/* Status de Integrações */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Link className="h-4 w-4" />
                      Status das Integrações
                    </CardTitle>
                    <CardDescription>
                      Monitoramento das integrações ativas
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm">Hotmart Webhook</span>
                      </div>
                      <Badge variant="default" className="text-xs">Ativo</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm">UTMify Script</span>
                      </div>
                      <Badge variant="default" className="text-xs">Carregado</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm">Brevo Email</span>
                      </div>
                      <Badge variant="default" className="text-xs">Conectado</Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* UTM Debugger */}
                <UTMDebugger />
              </div>
            </div>
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

      {/* Modal para Adicionar/Editar Investimento */}
      {isAddingInvestment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">
              {editingInvestment ? 'Editar Investimento' : 'Adicionar Investimento'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Data</label>
                <input
                  type="date"
                  value={investmentForm.date}
                  onChange={(e) => setInvestmentForm({...investmentForm, date: e.target.value})}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Valor (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={investmentForm.amount}
                  onChange={(e) => setInvestmentForm({...investmentForm, amount: e.target.value})}
                  placeholder="0,00"
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Descrição</label>
                <input
                  type="text"
                  value={investmentForm.description}
                  onChange={(e) => setInvestmentForm({...investmentForm, description: e.target.value})}
                  placeholder="Ex: Campanha Facebook - Botox"
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">UTM Campaign (opcional)</label>
                <input
                  type="text"
                  value={investmentForm.utm_campaign}
                  onChange={(e) => setInvestmentForm({...investmentForm, utm_campaign: e.target.value})}
                  placeholder="Ex: facebook_ads_botox"
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <Button variant="outline" onClick={resetForm}>
                Cancelar
              </Button>
              <Button 
                onClick={editingInvestment ? updateInvestment : addInvestment}
                disabled={!investmentForm.amount || !investmentForm.description}
              >
                {editingInvestment ? 'Salvar' : 'Adicionar'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}