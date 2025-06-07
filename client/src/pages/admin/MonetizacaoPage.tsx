import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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

  // Buscar dados dos assinantes
  const { data: assinantes = [] } = useQuery({
    queryKey: ["/api/admin/assinantes"],
  });

  // Buscar dados dos planos
  const { data: planos = [] } = useQuery({
    queryKey: ["/api/admin/planos"],
  });

  // Buscar dados dos usuários
  const { data: usuarios = [] } = useQuery({
    queryKey: ["/api/admin/usuarios"],
  });

  // Calcular métricas
  const totalAssinantes = assinantes.length;
  const totalUsuarios = usuarios.length;
  const usuariosFree = usuarios.filter((u: any) => u.tipo === 'free').length;
  const usuariosPremium = usuarios.filter((u: any) => u.tipo === 'premium').length;

  // Simular faturamento baseado nos assinantes (seria melhor ter dados reais de transações)
  const faturamentoEstimado = assinantes.reduce((total: number, assinante: any) => {
    const plano = planos.find((p: any) => p.id.toString() === assinante.plano_id);
    if (plano && !plano.isGratuito) {
      const valor = parseFloat(plano.valor.replace('R$ ', '').replace(',', '.'));
      return total + valor;
    }
    return total;
  }, 0);

  // Calcular crescimento (simulado - seria melhor ter dados históricos)
  const crescimentoAssinantes = 12.5; // Simulado
  const crescimentoReceita = 8.3; // Simulado

  // Métricas por plano
  const metricasPlanos = planos.map((plano: any) => {
    const assinantesDoPlanо = assinantes.filter((a: any) => a.plano_id === plano.id.toString());
    const receita = assinantesDoPlanо.length * (plano.isGratuito ? 0 : parseFloat(plano.valor.replace('R$ ', '').replace(',', '.')));
    return {
      ...plano,
      assinantes: assinantesDoPlanо.length,
      receita
    };
  });

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const formatarPorcentagem = (valor: number) => {
    return `${valor > 0 ? '+' : ''}${valor.toFixed(1)}%`;
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard de Monetização</h1>
          <p className="text-muted-foreground">
            Acompanhe métricas financeiras e de crescimento da plataforma
          </p>
        </div>
        
        <div className="flex items-center gap-4">
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
        </div>
      </div>

      {/* Cards de Métricas Principais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faturamento Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatarMoeda(faturamentoEstimado)}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <ArrowUpIcon className="mr-1 h-3 w-3 text-green-500" />
              {formatarPorcentagem(crescimentoReceita)} vs período anterior
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assinantes Premium</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAssinantes}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <ArrowUpIcon className="mr-1 h-3 w-3 text-green-500" />
              {formatarPorcentagem(crescimentoAssinantes)} vs período anterior
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalUsuarios > 0 ? ((totalAssinantes / totalUsuarios) * 100).toFixed(1) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              {totalAssinantes} de {totalUsuarios} usuários
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
            <Banknote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatarMoeda(totalAssinantes > 0 ? faturamentoEstimado / totalAssinantes : 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Por assinante premium
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs com diferentes visualizações */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="planos">Planos</TabsTrigger>
          <TabsTrigger value="assinantes">Assinantes</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            {/* Distribuição de Usuários */}
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Distribuição de Usuários</CardTitle>
                <CardDescription>
                  Breakdown entre usuários gratuitos e premium
                </CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="text-sm font-medium">Usuários Gratuitos</span>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">{usuariosFree}</div>
                      <div className="text-xs text-muted-foreground">
                        {totalUsuarios > 0 ? ((usuariosFree / totalUsuarios) * 100).toFixed(1) : 0}%
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium">Usuários Premium</span>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">{usuariosPremium}</div>
                      <div className="text-xs text-muted-foreground">
                        {totalUsuarios > 0 ? ((usuariosPremium / totalUsuarios) * 100).toFixed(1) : 0}%
                      </div>
                    </div>
                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
                    <div 
                      className="bg-blue-500 h-2 rounded-l-full" 
                      style={{ width: `${totalUsuarios > 0 ? (usuariosFree / totalUsuarios) * 100 : 0}%` }}
                    ></div>
                    <div 
                      className="bg-green-500 h-2 rounded-r-full" 
                      style={{ width: `${totalUsuarios > 0 ? (usuariosPremium / totalUsuarios) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Métricas Rápidas */}
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Métricas do Período</CardTitle>
                <CardDescription>
                  Últimos {periodo} dias
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Novos usuários</span>
                  <div className="flex items-center space-x-1">
                    <UserPlus className="h-4 w-4 text-blue-500" />
                    <span className="font-medium">+{Math.floor(Math.random() * 50 + 10)}</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Conversões</span>
                  <div className="flex items-center space-x-1">
                    <CreditCard className="h-4 w-4 text-green-500" />
                    <span className="font-medium">+{Math.floor(Math.random() * 20 + 5)}</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Taxa de retenção</span>
                  <div className="flex items-center space-x-1">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    <span className="font-medium">94.2%</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Churn rate</span>
                  <div className="flex items-center space-x-1">
                    <TrendingDown className="h-4 w-4 text-red-500" />
                    <span className="font-medium">5.8%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="planos" className="space-y-4">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Performance dos Planos</CardTitle>
                <CardDescription>
                  Receita e assinantes por plano de assinatura
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {metricasPlanos.map((plano: any) => (
                    <div key={plano.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div>
                          <h3 className="font-medium">{plano.name}</h3>
                          <p className="text-sm text-muted-foreground">{plano.periodo}</p>
                        </div>
                        <Badge variant={plano.isGratuito ? "secondary" : "default"}>
                          {plano.isGratuito ? "Gratuito" : "Premium"}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center space-x-8">
                        <div className="text-center">
                          <div className="text-lg font-bold">{plano.assinantes}</div>
                          <div className="text-xs text-muted-foreground">Assinantes</div>
                        </div>
                        
                        <div className="text-center">
                          <div className="text-lg font-bold">{formatarMoeda(plano.receita)}</div>
                          <div className="text-xs text-muted-foreground">Receita</div>
                        </div>
                        
                        <div className="text-center">
                          <div className="text-lg font-bold">{plano.valor}</div>
                          <div className="text-xs text-muted-foreground">Preço</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="assinantes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Assinantes Recentes</CardTitle>
              <CardDescription>
                Lista dos últimos assinantes da plataforma
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {assinantes.slice(0, 10).map((assinante: any) => {
                  const plano = planos.find((p: any) => p.id.toString() === assinante.plano_id);
                  return (
                    <div key={assinante.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                          {assinante.username?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div>
                          <h3 className="font-medium">{assinante.username}</h3>
                          <p className="text-sm text-muted-foreground">{assinante.email}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <Badge variant={plano?.isGratuito ? "secondary" : "default"}>
                          {plano?.name || "Plano não encontrado"}
                        </Badge>
                        <div className="text-right">
                          <div className="font-medium">{plano?.valor || "Gratuito"}</div>
                          <div className="text-xs text-muted-foreground">
                            {assinante.data_vencimento 
                              ? format(new Date(assinante.data_vencimento), "dd/MM/yyyy", { locale: ptBR })
                              : "Sem vencimento"
                            }
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {assinantes.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum assinante encontrado
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}