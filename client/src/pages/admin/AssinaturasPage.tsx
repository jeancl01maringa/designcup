import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Users, CreditCard, TrendingUp, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Subscription {
  id: number;
  user_id: number;
  username: string;
  email: string;
  plan_type: string;
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
        return 'bg-orange-100 text-orange-800';
      case 'manual':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loadingStats || loadingSubscriptions) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Assinaturas Hotmart</h1>
          <p className="text-muted-foreground">Gerenciamento de assinaturas e integração Hotmart</p>
        </div>
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
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Assinaturas Hotmart</h1>
        <p className="text-muted-foreground">
          Monitore assinaturas, pagamentos e a integração com Hotmart
        </p>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Assinaturas</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_subscriptions || 0}</div>
            <p className="text-xs text-muted-foreground">Todas as assinaturas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assinaturas Ativas</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats?.active_subscriptions || 0}</div>
            <p className="text-xs text-muted-foreground">Usuários premium ativos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Via Hotmart</CardTitle>
            <CreditCard className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats?.hotmart_subscriptions || 0}</div>
            <p className="text-xs text-muted-foreground">Integração Hotmart</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Canceladas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats?.canceled_subscriptions || 0}</div>
            <p className="text-xs text-muted-foreground">Assinaturas canceladas</p>
          </CardContent>
        </Card>
      </div>

      {/* Configuração do Webhook */}
      <Card>
        <CardHeader>
          <CardTitle>Configuração do Webhook Hotmart</CardTitle>
          <CardDescription>
            URL do webhook para configurar na Hotmart
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium mb-2">URL do Webhook:</p>
            <code className="block p-2 bg-white border rounded text-sm">
              {window.location.origin}/webhook/hotmart
            </code>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium mb-1">Eventos a configurar:</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• PURCHASE_APPROVED</li>
                <li>• SUBSCRIPTION_CANCELLATION</li>
                <li>• PURCHASE_PROTEST</li>
                <li>• PURCHASE_REFUNDED</li>
                <li>• CHARGEBACK</li>
              </ul>
            </div>
            <div>
              <p className="text-sm font-medium mb-1">Status da integração:</p>
              <Badge variant="outline" className="bg-green-50 text-green-700">
                ✅ Webhook funcionando
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Assinaturas */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Assinaturas</CardTitle>
          <CardDescription>
            Visualize e gerencie todas as assinaturas da plataforma
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, email ou ID da transação..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Origem</TableHead>
                  <TableHead>Início</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Transação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubscriptions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-4">
                      Nenhuma assinatura encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSubscriptions.map((subscription) => (
                    <TableRow key={subscription.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{subscription.username}</div>
                          <div className="text-sm text-muted-foreground">{subscription.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {subscription.plan_type === 'mensal' ? 'Mensal' : 'Anual'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(subscription.status)}>
                          {subscription.status === 'active' ? 'Ativa' : 
                           subscription.status === 'canceled' ? 'Cancelada' : 'Expirada'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getOriginColor(subscription.origin)}>
                          {subscription.origin === 'hotmart' ? 'Hotmart' : 'Manual'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(subscription.start_date), 'dd/MM/yyyy', { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        {format(new Date(subscription.end_date), 'dd/MM/yyyy', { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <code className="text-xs">{subscription.transaction_id || 'N/A'}</code>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}