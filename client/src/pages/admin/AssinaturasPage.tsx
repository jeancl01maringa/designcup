import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { AdminLayout } from "@/components/admin/layout/AdminLayout";
import { PageHeader } from "@/components/admin/layout/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Users, CreditCard, TrendingUp, AlertTriangle, Settings, Webhook, Copy, MoreHorizontal } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

interface Subscription {
  id: number;
  user_id: number;
  username: string;
  email: string;
  plan_type: string;
  hotmart_plan_id?: string;
  hotmart_plan_name?: string;
  hotmart_plan_price?: string;
  hotmart_currency?: string;
  plan_display_name: string;
  plan_price_display: string;
  plan_source: string;
  status: string;
  start_date: string;
  end_date: string;
  transaction_id: string;
  origin: string;
  last_event: string;
  created_at: string;
}

interface SubscriptionStats {
  total_subscriptions: number;
  active_subscriptions: number;
  canceled_subscriptions: number;
  hotmart_subscriptions: number;
  revenue_estimate: number;
}

export default function AssinaturasPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");

  // Buscar estatísticas das assinaturas
  const { data: stats, isLoading: loadingStats } = useQuery<SubscriptionStats>({
    queryKey: ["/api/admin/subscriptions/stats"],
  });

  // Buscar lista de assinaturas
  const { data: subscriptions = [], isLoading: loadingSubscriptions } = useQuery<Subscription[]>({
    queryKey: ["/api/admin/subscriptions"],
  });

  // Filtrar assinaturas por termo de busca
  const filteredSubscriptions = subscriptions.filter(sub =>
    sub.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sub.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sub.transaction_id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'canceled':
        return 'bg-red-100 text-red-800';
      case 'expired':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getOriginColor = (origin: string) => {
    switch (origin) {
      case 'hotmart':
        return 'bg-blue-100 text-blue-800';
      case 'manual':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const copyWebhookUrl = () => {
    const webhookUrl = "https://92d39422-2239-4944-8f4e-4a5218744647-00-1vox6zp4kwkke.picard.replit.dev/webhook/hotmart";
    navigator.clipboard.writeText(webhookUrl);
    toast({
      title: "URL copiada!",
      description: "A URL do webhook foi copiada para a área de transferência.",
    });
  };

  return (
    <AdminLayout>
      <Helmet>
        <title>Assinaturas Hotmart - Admin</title>
      </Helmet>

      <PageHeader 
        title="Assinaturas Hotmart" 
        subtitle="Gerenciamento de assinaturas e integração Hotmart" 
      />

      <Tabs defaultValue="assinaturas" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="assinaturas" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Assinaturas
          </TabsTrigger>
          <TabsTrigger value="configuracao" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Configuração
          </TabsTrigger>
        </TabsList>

        <TabsContent value="assinaturas" className="space-y-6">
          {loadingStats || loadingSubscriptions ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <Card key={i}>
                    <CardHeader className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* Estatísticas */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Assinaturas</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.total_subscriptions || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      Todas as assinaturas registradas
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Ativas</CardTitle>
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{stats?.active_subscriptions || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      Assinaturas em vigor
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Canceladas</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">{stats?.canceled_subscriptions || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      Assinaturas canceladas
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Via Hotmart</CardTitle>
                    <CreditCard className="h-4 w-4 text-amber-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-amber-600">{stats?.hotmart_subscriptions || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      Integração Hotmart
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Busca */}
              <div className="flex items-center space-x-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por usuário, email ou transação..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
              </div>

              {/* Tabela de Assinaturas */}
              <Card>
                <CardHeader>
                  <CardTitle>Lista de Assinaturas</CardTitle>
                  <CardDescription>
                    Visualize e gerencie todas as assinaturas da plataforma
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Usuário</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Plano</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Origem</TableHead>
                        <TableHead>Criado em</TableHead>
                        <TableHead>Expira em</TableHead>
                        <TableHead>Transação</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSubscriptions.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center text-muted-foreground">
                            Nenhuma assinatura encontrada
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredSubscriptions.map((subscription) => (
                          <TableRow key={subscription.id}>
                            <TableCell className="font-medium">{subscription.username}</TableCell>
                            <TableCell>{subscription.email}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={subscription.plan_source === 'Hotmart' ? 'bg-purple-50 border-purple-200 text-purple-800' : ''}>
                                {subscription.plan_display_name}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(subscription.status)}>
                                {subscription.status === 'active' ? 'Ativa' : 
                                 subscription.status === 'canceled' ? 'Cancelada' : 
                                 subscription.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className={subscription.origin === 'hotmart' ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'bg-gray-100 text-gray-700'}>
                                {subscription.origin === 'hotmart' ? 'Hotmart' : 'Manual'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {format(new Date(subscription.start_date), 'dd/MM/yyyy', { locale: ptBR })}
                            </TableCell>
                            <TableCell>
                              {format(new Date(subscription.end_date), 'dd/MM/yyyy', { locale: ptBR })}
                            </TableCell>
                            <TableCell className="font-mono text-xs">
                              {subscription.transaction_id || '-'}
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 p-0">
                                    <span className="sr-only">Abrir menu</span>
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem>Ver detalhes</DropdownMenuItem>
                                  <DropdownMenuItem>Editar assinatura</DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="text-red-600">
                                    Cancelar assinatura
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="configuracao" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Webhook className="h-5 w-5" />
                Configuração do Webhook Hotmart
              </CardTitle>
              <CardDescription>
                Configure a integração com a Hotmart usando as informações abaixo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium">URL do Webhook</Label>
                <div className="mt-1 flex items-center gap-2">
                  <div className="flex-1 p-3 bg-gray-50 rounded-md border">
                    <code className="text-sm font-mono break-all">
                      https://92d39422-2239-4944-8f4e-4a5218744647-00-1vox6zp4kwkke.picard.replit.dev/webhook/hotmart
                    </code>
                  </div>
                  <Button variant="outline" size="sm" onClick={copyWebhookUrl}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Use esta URL no painel da Hotmart para configurar o webhook
                </p>
              </div>

              <div>
                <Label className="text-sm font-medium">Eventos para Configurar</Label>
                <div className="mt-2 space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">PURCHASE_APPROVED</Badge>
                    <span className="text-sm text-muted-foreground">Compras aprovadas</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">SUBSCRIPTION_CANCELLATION</Badge>
                    <span className="text-sm text-muted-foreground">Cancelamentos de assinatura</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">PURCHASE_PROTEST</Badge>
                    <span className="text-sm text-muted-foreground">Contestações</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">PURCHASE_REFUNDED</Badge>
                    <span className="text-sm text-muted-foreground">Reembolsos</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">CHARGEBACK</Badge>
                    <span className="text-sm text-muted-foreground">Chargebacks</span>
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Método HTTP</Label>
                <div className="mt-1">
                  <Badge>POST</Badge>
                </div>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900">Status da Integração</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      O webhook está funcionando e testado. Configure a URL acima no painel da Hotmart 
                      para ativar a sincronização automática de assinaturas.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
}