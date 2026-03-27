import React from "react";
import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/layout/AdminLayout";
import { PageHeader } from "@/components/admin/layout/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowUpRight, Users, ImageIcon, FileText, CheckCircle2,
  Clock, CalendarIcon, Eye, Download, Heart, Bookmark
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow
} from "@/components/ui/table";

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

// Tipo para as estatísticas de desempenho de conteúdo
interface ContentStats {
  cards: {
    totalArtworks: number;
    totalViews: number;
    totalDownloads: number;
    totalLikes: number;
    totalSaves: number;
    uniqueUsers: number;
  };
  topArts: {
    id: number;
    title: string;
    image_url: string;
    views: number;
    downloads: number;
    likes: number;
    saves: number;
  }[];
  categories: {
    name: string;
    artworks_count: number;
    total_views: number;
    total_downloads: number;
  }[];
}

export default function Dashboard() {
  // Buscar estatísticas gerais
  const { data: stats, isLoading: isLoadingStats } = useQuery<DashboardStats>({
    queryKey: ['/api/admin/stats'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/stats');
      return await response.json();
    }
  });

  // Buscar estatísticas de desempenho
  const { data: contentStats, isLoading: isLoadingContent } = useQuery<ContentStats>({
    queryKey: ['/api/admin/content-stats'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/content-stats');
      return await response.json();
    }
  });

  // Cards de estatísticas gerais
  const statCards = [
    {
      title: "Usuários",
      value: stats?.usersCount || 0,
      icon: <Users className="h-4 w-4" />,
      description: "Total de usuários registrados",
      color: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
    },
    {
      title: "Assinantes",
      value: stats?.subscribersCount || 0,
      icon: <CheckCircle2 className="h-4 w-4" />,
      description: "Usuários com plano premium",
      color: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
    },
    {
      title: "Artes",
      value: stats?.artworksCount || 0,
      icon: <ImageIcon className="h-4 w-4" />,
      description: "Artes disponíveis",
      color: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400"
    },
    {
      title: "Categorias",
      value: stats?.categoriesCount || 0,
      icon: <CalendarIcon className="h-4 w-4" />,
      description: "Categorias cadastradas",
      color: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
    },
  ];

  return (
    <AdminLayout>
      <PageHeader
        title="Dashboard"
      />

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-card border p-1">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="performance">Desempenho Conteúdos</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Grid de estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map((card, index) => (
              <Card key={index} className="overflow-hidden border-none shadow-premium bg-card/60 backdrop-blur-sm">
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-none shadow-premium bg-card/60 backdrop-blur-sm">
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

            <Card className="border-none shadow-premium bg-card/60 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Últimas atualizações</CardTitle>
                <CardDescription>Postagens recentes</CardDescription>
              </CardHeader>
              <CardContent>
                {stats?.recentPosts?.length ? (
                  <div className="space-y-2">
                    {stats.recentPosts.map((post, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="text-sm truncate max-w-[150px]">{post.title}</div>
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

            <Card className="border-none shadow-premium bg-card/60 backdrop-blur-sm">
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
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          {/* Métricas de Engajamento */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-none shadow-premium bg-card/60 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Total Visualizações</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                  <Eye className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{contentStats?.cards.totalViews || 0}</div>
                  <p className="text-xs text-muted-foreground">Cliques nas artes</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-premium bg-card/60 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Total Downloads</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                  <Download className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{contentStats?.cards.totalDownloads || 0}</div>
                  <p className="text-xs text-muted-foreground">Artes baixadas</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-premium bg-card/60 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Likes e Salvos</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400">
                  <Heart className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{(contentStats?.cards.totalLikes || 0) + (contentStats?.cards.totalSaves || 0)}</div>
                  <p className="text-xs text-muted-foreground">Interações diretas</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-premium bg-card/60 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Usuários Engajados</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{contentStats?.cards.uniqueUsers || 0}</div>
                  <p className="text-xs text-muted-foreground">Baixaram artes único</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top 10 Artes */}
            <Card className="border-none shadow-premium bg-card/60 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Top 10 Artes mais Visualizadas</CardTitle>
                <CardDescription>Conteúdos com maior alcance orgânico</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Arte</TableHead>
                      <TableHead className="text-right">Visualizações</TableHead>
                      <TableHead className="text-right">Downloads</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contentStats?.topArts.map((art) => (
                      <TableRow key={art.id}>
                        <TableCell className="font-medium flex items-center gap-3">
                          <img
                            src={art.image_url}
                            alt={art.title}
                            className="w-10 h-10 rounded object-cover border"
                          />
                          <span className="truncate max-w-[150px]">{art.title}</span>
                        </TableCell>
                        <TableCell className="text-right">{art.views}</TableCell>
                        <TableCell className="text-right">{art.downloads}</TableCell>
                      </TableRow>
                    ))}
                    {!contentStats?.topArts.length && (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-4 text-muted-foreground">
                          Nenhum dado encontrado
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Desempenho por Categoria */}
            <Card className="border-none shadow-premium bg-card/60 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Engajamento por Categoria</CardTitle>
                <CardDescription>Categorias com maior interesse dos usuários</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Categoria</TableHead>
                      <TableHead className="text-right">Artes</TableHead>
                      <TableHead className="text-right">Visu.</TableHead>
                      <TableHead className="text-right">Down.</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contentStats?.categories.map((cat) => (
                      <TableRow key={cat.name}>
                        <TableCell className="font-medium">{cat.name}</TableCell>
                        <TableCell className="text-right">{cat.artworks_count}</TableCell>
                        <TableCell className="text-right">{cat.total_views}</TableCell>
                        <TableCell className="text-right text-green-500 font-bold">{cat.total_downloads}</TableCell>
                      </TableRow>
                    ))}
                    {!contentStats?.categories.length && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                          Nenhum dado encontrado
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Informações do sistema */}
      <Card className="mt-8 border-none shadow-premium bg-card/60 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Informações do sistema</CardTitle>
          <CardDescription>Estado atual da plataforma</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground uppercase">Banco de Dados</span>
              <span className="text-sm font-semibold text-green-500 flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                Conectado
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground uppercase">Supabase Storage</span>
              <span className="text-sm font-semibold text-green-500 flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                Disponível
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground uppercase">Ambiente</span>
              <span className="text-sm font-semibold">{import.meta.env.MODE || "development"}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground uppercase">Versão</span>
              <span className="text-sm font-semibold">1.1.0 (Analytics)</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}