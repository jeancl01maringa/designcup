import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
  ArrowUpIcon,
  ArrowDownIcon,
  Eye,
  UserPlus,
  Banknote
} from "lucide-react";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function MonetizacaoPage() {
  const [periodo, setPeriodo] = useState("30");

  // Calcular datas baseado no período selecionado
  const hoje = new Date();
  const dataInicio = startOfDay(subDays(hoje, parseInt(periodo)));
  const dataFim = endOfDay(hoje);

  // Buscar dados de assinantes
  const { data: assinantes } = useQuery({
    queryKey: ["/api/admin/usuarios/subscribers"],
  });

  // Buscar todos os usuários para métricas
  const { data: usuarios } = useQuery({
    queryKey: ["/api/admin/usuarios"],
  });

  // Buscar planos
  const { data: planos } = useQuery({
    queryKey: ["/api/admin/planos"],
  });

  // Calcular métricas
  const totalAssinantes = assinantes?.length || 0;
  const totalUsuarios = usuarios?.length || 0;
  const usuariosGratuitos = usuarios?.filter((u: any) => u.tipo === 'free').length || 0;
  const usuariosPremium = usuarios?.filter((u: any) => u.tipo === 'premium').length || 0;

  // Calcular receita (assumindo valores dos planos)
  const receitaTotal = assinantes?.reduce((total: number, assinante: any) => {
    const plano = planos?.find((p: any) => p.id === parseInt(assinante.plano_id));
    return total + (parseFloat(plano?.valor || '0'));
  }, 0) || 0;

  // Calcular taxa de conversão
  const taxaConversao = totalUsuarios > 0 ? (usuariosPremium / totalUsuarios) * 100 : 0;

  // Dados simulados para demonstração de crescimento
  const crescimentoAssinantes = 12.5;
  const crescimentoReceita = 18.2;
  const crescimentoConversao = 3.1;

  // Calcular performance por plano
  const performancePlanos = planos?.map((plano: any) => {
    const assinantesDoPlano = assinantes?.filter((a: any) => a.plano_id === plano.id.toString()).length || 0;
    const receitaDoPlano = assinantesDoPlano * parseFloat(plano.valor || '0');
    
    return {
      ...plano,
      assinantes: assinantesDoPlano,
      receita: receitaDoPlano,
      percentualAssinantes: totalAssinantes > 0 ? (assinantesDoPlano / totalAssinantes) * 100 : 0
    };
  }) || [];

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
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Faturamento Total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatarMoeda(receitaTotal)}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                <ArrowUpIcon className="mr-1 h-3 w-3 text-green-500" />
                {formatarPorcentagem(crescimentoReceita)} em relação ao período anterior
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Assinantes Ativos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalAssinantes.toLocaleString()}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                <ArrowUpIcon className="mr-1 h-3 w-3 text-green-500" />
                {formatarPorcentagem(crescimentoAssinantes)} novos assinantes
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{taxaConversao.toFixed(1)}%</div>
              <div className="flex items-center text-xs text-muted-foreground">
                <ArrowUpIcon className="mr-1 h-3 w-3 text-green-500" />
                {formatarPorcentagem(crescimentoConversao)} de melhoria
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
              <Banknote className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatarMoeda(totalAssinantes > 0 ? receitaTotal / totalAssinantes : 0)}
              </div>
              <div className="flex items-center text-xs text-muted-foreground">
                <ArrowUpIcon className="mr-1 h-3 w-3 text-green-500" />
                +5.2% valor por assinante
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Abas de Detalhamento */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
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
                  {assinantes?.slice(0, 10).map((assinante: any) => {
                    const plano = planos?.find((p: any) => p.id === parseInt(assinante.plano_id));
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
                  {(!assinantes || assinantes.length === 0) && (
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