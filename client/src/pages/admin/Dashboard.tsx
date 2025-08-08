import React from "react";
import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/layout/AdminLayout";
import { PageHeader } from "@/components/admin/layout/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, Users, ImageIcon, FileText, CheckCircle2, Clock, CalendarIcon } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";

// Tipo para as estatísticas do painel
interface DashboardStats {
  postsCount: number;
  approvedPostsCount: number;
  categoriesCount: number;
  usersCount: number;
  subscribersCount: number;
  artworksCount: number;
  recentPosts: {
    id: number;
    title: string;
    status: string;
    createdAt: string;
  }[];
}

export default function Dashboard() {
  // Buscar estatísticas do dashboard
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['/api/admin/stats'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/stats');
      return await response.json();
    }
  });

  // Cards de estatísticas
  const statCards = [
    {
      title: "Usuários",
      value: stats?.usersCount || 0,
      icon: <Users className="h-4 w-4" />,
      description: "Total de usuários registrados",
      color: "bg-blue-100 text-blue-700"
    },
    {
      title: "Assinantes",
      value: stats?.subscribersCount || 0,
      icon: <CheckCircle2 className="h-4 w-4" />,
      description: "Usuários com plano premium",
      color: "bg-green-100 text-green-700"
    },
    {
      title: "Artes",
      value: stats?.artworksCount || 0,
      icon: <ImageIcon className="h-4 w-4" />,
      description: "Artes disponíveis",
      color: "bg-purple-100 text-purple-700"
    },
    {
      title: "Categorias",
      value: stats?.categoriesCount || 0,
      icon: <CalendarIcon className="h-4 w-4" />,
      description: "Categorias cadastradas",
      color: "bg-blue-100 text-blue-700"
    },
  ];

  return (
    <AdminLayout>
      <PageHeader 
        title="Dashboard" 
        description="Visão geral da plataforma Design para Estética"
      />

      {/* Grid de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((card, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <div className={`p-2 rounded-full ${card.color}`}>
                {card.icon}
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground">{card.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Status das postagens */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Postagens aprovadas</CardTitle>
            <CardDescription>Posts prontos para visualização</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-row items-center">
            <div className="text-2xl font-bold mr-2">{stats?.approvedPostsCount || 0}</div>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <div className="text-xs text-muted-foreground ml-auto">
              {stats && stats.postsCount > 0 
                ? `${Math.round((stats.approvedPostsCount / stats.postsCount) * 100)}% do total` 
                : "0% do total"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Últimas atualizações</CardTitle>
            <CardDescription>Postagens recentes</CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.recentPosts?.length ? (
              <div className="space-y-2">
                {stats.recentPosts.map((post, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="text-sm truncate max-w-[180px]">{post.title}</div>
                    <div className="flex items-center">
                      <Clock className="h-3 w-3 text-muted-foreground mr-1" />
                      <span className="text-xs text-muted-foreground">
                        {new Date(post.createdAt).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'short'
                        })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">Nenhuma postagem recente</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Acesso rápido</CardTitle>
            <CardDescription>Ações comuns</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-between" asChild>
                <Link href="/admin/postagens">
                  Gerenciar postagens
                  <ArrowUpRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
              
              <Button variant="outline" className="w-full justify-between" asChild>
                <Link href="/admin/categorias">
                  Categorias
                  <ArrowUpRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
              
              <Button variant="outline" className="w-full justify-between" asChild>
                <Link href="/admin/gerenciamento/usuarios">
                  Usuários
                  <ArrowUpRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Informações do sistema */}
      <Card>
        <CardHeader>
          <CardTitle>Informações do sistema</CardTitle>
          <CardDescription>Estado atual da plataforma</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm font-medium">Banco de dados</span>
              <span className="text-sm text-green-500">Conectado</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">Supabase Storage</span>
              <span className="text-sm text-green-500">Disponível</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">Ambiente</span>
              <span className="text-sm">{import.meta.env.MODE || "development"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">Versão</span>
              <span className="text-sm">1.0.0</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}