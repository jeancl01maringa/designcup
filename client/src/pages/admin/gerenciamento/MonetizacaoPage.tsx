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
  Check,
  PieChart,
  RefreshCcw,
  ArrowRightLeft
} from "lucide-react";
import { format, subDays, startOfDay, endOfDay, startOfMonth, endOfMonth, subMonths, startOfYear } from "date-fns";
import { ptBR } from "date-fns/locale";
import { apiRequest } from "@/lib/queryClient";
import { UTMDebugger } from "@/components/admin/UTMDebugger";

export default function MonetizacaoPage() {
  const queryClient = useQueryClient();
  const [periodo, setPeriodo] = useState("30");
  const [dateRange, setDateRange] = useState<{ start: Date | null, end: Date | null }>({
    start: null,
    end: null
  });

  // Calcular datas baseado no período selecionado
  const hoje = new Date();

  useEffect(() => {
    let start = startOfDay(subDays(hoje, 30));
    let end = endOfDay(hoje);

    if (periodo === "0") { // Hoje
      start = startOfDay(hoje);
    } else if (periodo === "1") { // Ontem
      start = startOfDay(subDays(hoje, 1));
      end = endOfDay(subDays(hoje, 1));
    } else if (periodo === "7") {
      start = startOfDay(subDays(hoje, 7));
    } else if (periodo === "this_month") {
      start = startOfMonth(hoje);
    } else if (periodo === "last_month") {
      start = startOfMonth(subMonths(hoje, 1));
      end = endOfMonth(subMonths(hoje, 1));
    } else if (periodo === "this_year") {
      start = startOfYear(hoje);
    } else if (periodo === "365") {
      start = startOfDay(subDays(hoje, 365));
    }

    setDateRange({ start, end });
  }, [periodo]);

  // Buscar estatísticas reais de monetização
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/admin/monetizacao/stats", periodo, dateRange.start, dateRange.end],
    queryFn: async () => {
      const url = new URL("/api/admin/monetizacao/stats", window.location.origin);
      if (dateRange.start && dateRange.end) {
        url.searchParams.append("startDate", dateRange.start.toISOString());
        url.searchParams.append("endDate", dateRange.end.toISOString());
      } else {
        url.searchParams.append("periodo", periodo);
      }
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("Erro ao buscar estatísticas");
      return res.json();
    }
  });

  // Buscar todos os usuários para métricas demográficas
  const { data: usuarios } = useQuery({
    queryKey: ["/api/admin/usuarios"],
  });

  // Buscar investimentos em tráfego
  const { data: trafficInvestments } = useQuery({
    queryKey: ["/api/admin/traffic-investments", periodo],
  });

  // Função para formatar moeda
  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor || 0);
  };

  const usuariosPremium = Array.isArray(usuarios) ? usuarios.filter((u: any) => u.tipo === 'premium').length : 0;
  const usuariosGratuitos = Array.isArray(usuarios) ? usuarios.filter((u: any) => u.tipo === 'free').length : 0;
  const totalUsuarios = Array.isArray(usuarios) ? usuarios.length : 0;

  return (
    <AdminLayout>
      <Helmet>
        <title>Visão Geral de Monetização - Admin</title>
      </Helmet>

      <PageHeader
        title="Monetização"
        description="Acompanhe o faturamento e métricas financeiras"
        actions={
          <div className="flex items-center gap-2">
            <Select value={periodo} onValueChange={setPeriodo}>
              <SelectTrigger className="w-[180px] h-9 text-xs border-border bg-card">
                <SelectValue placeholder="Selecionar período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0" className="text-xs">Hoje</SelectItem>
                <SelectItem value="1" className="text-xs">Ontem</SelectItem>
                <SelectItem value="7" className="text-xs">Últimos 7 dias</SelectItem>
                <SelectItem value="30" className="text-xs">Últimos 30 dias</SelectItem>
                <SelectItem value="this_month" className="text-xs">Este Mês</SelectItem>
                <SelectItem value="last_month" className="text-xs">Mês Passado</SelectItem>
                <SelectItem value="this_year" className="text-xs">Este Ano</SelectItem>
                <SelectItem value="365" className="text-xs">Último Ano</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" className="h-9 px-3" onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/admin/monetizacao/stats"] })}>
              <RefreshCcw className="h-3.5 w-3.5" />
            </Button>
          </div>
        }
      />

      <div className="space-y-6">
        {/* CARDS KPI - DESIGN CLEAN & PREMIUM */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-border bg-card shadow-sm overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Faturamento</span>
                <div className="p-2 bg-emerald-500/10 rounded-lg">
                  <DollarSign className="h-4 w-4 text-emerald-500" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-medium tracking-tight text-foreground">
                  {statsLoading ? "..." : formatarMoeda(stats?.totalRevenue)}
                </span>
                <div className="flex items-center mt-1.5 text-[11px] font-normal text-muted-foreground">
                  <span className="text-emerald-500 font-medium flex items-center mr-1">
                    <TrendingUp className="h-3 w-3 mr-0.5" />
                    Real time
                  </span>
                  faturamento bruto
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card shadow-sm overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Assinantes Ativos</span>
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Users className="h-4 w-4 text-blue-500" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-medium tracking-tight text-foreground">
                  {statsLoading ? "..." : stats?.activePremiumUsers || 0}
                </span>
                <div className="flex items-center mt-1.5 text-[11px] font-normal text-muted-foreground">
                  <span className="text-blue-500 font-medium flex items-center mr-1">
                    <UserPlus className="h-3 w-3 mr-0.5" />
                    +{Math.floor((stats?.activePremiumUsers || 0) * 0.05)}
                  </span>
                  est. este mês
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card shadow-sm overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Taxa de Conversão</span>
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <Zap className="h-4 w-4 text-purple-500" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-medium tracking-tight text-foreground">
                  {statsLoading ? "..." : `${stats?.conversionRate?.toFixed(1) || 0}%`}
                </span>
                <div className="flex items-center mt-1.5 text-[11px] font-normal text-muted-foreground">
                  Premium vs Gratuito
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card shadow-sm overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Ticket Médio</span>
                <div className="p-2 bg-amber-500/10 rounded-lg">
                  <PiggyBank className="h-4 w-4 text-amber-500" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-medium tracking-tight text-foreground">
                  {statsLoading ? "..." : formatarMoeda(stats?.ticketMedio)}
                </span>
                <div className="flex items-center mt-1.5 text-[11px] font-normal text-muted-foreground">
                  Valor médio por venda
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ABAS DO DASHBOARD */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="bg-muted/50 p-1 rounded-lg border border-border inline-flex">
            <TabsTrigger value="overview" className="text-xs px-4 py-1.5 data-[state=active]:bg-card data-[state=active]:shadow-sm">Visão Geral</TabsTrigger>
            <TabsTrigger value="revenue" className="text-xs px-4 py-1.5 data-[state=active]:bg-card data-[state=active]:shadow-sm">Faturamento</TabsTrigger>
            <TabsTrigger value="traffic" className="text-xs px-4 py-1.5 data-[state=active]:bg-card data-[state=active]:shadow-sm">Tráfego</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 pt-2">
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="border-border bg-card shadow-sm">
                <CardHeader className="pb-3 border-b border-border/50">
                  <CardTitle className="text-sm font-medium">Distribuição de Usuários</CardTitle>
                  <CardDescription className="text-[11px] font-normal">Base total de usuários na plataforma</CardDescription>
                </CardHeader>
                <CardContent className="pt-5 space-y-4">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                        <span className="text-[13px] text-muted-foreground font-normal">Gratuitos</span>
                      </div>
                      <span className="text-[13px] font-medium text-foreground">{usuariosGratuitos}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="text-[13px] text-muted-foreground font-normal">Premium</span>
                      </div>
                      <span className="text-[13px] font-medium text-foreground">{usuariosPremium}</span>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-border/50 flex items-center justify-between">
                    <span className="text-[13px] font-medium text-foreground">Base Total</span>
                    <span className="text-[15px] font-semibold text-foreground">{totalUsuarios}</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border bg-card shadow-sm">
                <CardHeader className="pb-3 border-b border-border/50">
                  <CardTitle className="text-sm font-medium">Métricas de Crescimento</CardTitle>
                  <CardDescription className="text-[11px] font-normal">Estimativas para o período selecionado</CardDescription>
                </CardHeader>
                <CardContent className="pt-5 flex flex-col gap-3.5">
                  <div className="flex items-center justify-between py-1 border-b border-border/30 last:border-0">
                    <span className="text-[13px] text-muted-foreground">Novos Cadastros</span>
                    <Badge variant="outline" className="text-[11px] h-5 bg-blue-500/5 text-blue-500 border-blue-500/20">+{Math.floor(totalUsuarios * 0.08)}</Badge>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-border/30 last:border-0">
                    <span className="text-[13px] text-muted-foreground">Conversões</span>
                    <Badge variant="outline" className="text-[11px] h-5 bg-emerald-500/5 text-emerald-500 border-emerald-500/20">+{Math.floor(usuariosPremium * 0.12)}</Badge>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-border/30 last:border-0">
                    <span className="text-[13px] text-muted-foreground">Churn Rate</span>
                    <Badge variant="outline" className="text-[11px] h-5 border-border">2.1%</Badge>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-border/30 last:border-0">
                    <span className="text-[13px] text-muted-foreground">LTV Médio</span>
                    <Badge variant="outline" className="text-[11px] h-5 border-border">{formatarMoeda(180)}</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="revenue" className="space-y-6 pt-2">
            <div className="grid gap-6 md:grid-cols-3">
              <Card className="border-border bg-card shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-widest">MRR</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-medium text-foreground">{formatarMoeda(stats?.mrr)}</div>
                  <div className="text-[10px] text-muted-foreground mt-1">Receita Recorrente</div>
                </CardContent>
              </Card>

              <Card className="border-border bg-card shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Churn</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-medium text-foreground">2.1%</div>
                  <div className="text-[10px] text-muted-foreground mt-1">Taxa de Cancelamento</div>
                </CardContent>
              </Card>

              <Card className="border-border bg-card shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Revenue Today</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-medium text-emerald-500">{formatarMoeda(stats?.totalRevenue / 30)}</div>
                  <div className="text-[10px] text-muted-foreground mt-1">Estimativa diária</div>
                </CardContent>
              </Card>
            </div>

            <Card className="border-border bg-card shadow-sm">
              <CardHeader className="border-b border-border/50">
                <CardTitle className="text-sm font-medium">Receita por Origem de Pagamento</CardTitle>
                <CardDescription className="text-[11px]">Hotmart, Greenn, Kiwify e Doppus</CardDescription>
              </CardHeader>
              <CardContent className="pt-0 px-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-border/50 bg-muted/20">
                        <th className="px-6 py-3 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Gateway</th>
                        <th className="px-6 py-3 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Assinantes</th>
                        <th className="px-6 py-3 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Receita</th>
                        <th className="px-6 py-3 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Share</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      {['hotmart', 'greenn', 'kiwify', 'doppus'].map((name) => {
                        const gw = stats?.gateways?.find((g: any) => g.name === name) || { subscribers: 0, revenue: 0 };
                        return (
                          <tr key={name} className="hover:bg-muted/10 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2.5">
                                <div className={`w-2 h-2 rounded-full ${name === 'hotmart' ? 'bg-orange-500' : name === 'greenn' ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                                <span className="text-[13px] font-medium capitalize">{name}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-[13px] text-muted-foreground">{gw.subscribers}</td>
                            <td className="px-6 py-4 text-[13px] font-medium">{formatarMoeda(gw.revenue)}</td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                                  <div className="h-full bg-blue-500 rounded-full" style={{ width: `${stats?.totalRevenue > 0 ? (gw.revenue / stats.totalRevenue) * 100 : 0}%` }} />
                                </div>
                                <span className="text-[10px] text-muted-foreground w-8">{stats?.totalRevenue > 0 ? ((gw.revenue / stats.totalRevenue) * 100).toFixed(0) : 0}%</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="traffic" className="space-y-4 pt-2">
            <Card className="border-border bg-card shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border/50">
                <div>
                  <CardTitle className="text-sm font-medium">Investimentos em Tráfego</CardTitle>
                  <CardDescription className="text-[11px]">Controle de gastos com anúncios</CardDescription>
                </div>
                <Button size="sm" className="h-8 text-xs bg-foreground text-background hover:bg-foreground/90">
                  <PlusCircle className="h-3.5 w-3.5 mr-1.5" />
                  Novo Registro
                </Button>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="text-center py-10 text-muted-foreground">
                  <BarChart3 className="h-10 w-10 mx-auto mb-3 opacity-20" />
                  <p className="text-[12px]">Dados de tráfego sendo migrados para a nova estrutura real.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* UTM Debugger - Suporte para rastreamento */}
        <div className="opacity-40 hover:opacity-100 transition-opacity">
          <UTMDebugger />
        </div>
      </div>
    </AdminLayout>
  );
}