import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Loader2, PlusCircle, ImagePlus, Tag, FileText } from "lucide-react";
import { getQueryFn } from "@/lib/queryClient";

export default function AdminDashboard() {
  const { toast } = useToast();
  
  // Buscar contagens de posts/categorias do backend
  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['/api/admin/stats'],
    queryFn: getQueryFn({ on401: "throw" }),
    onError: (error) => {
      toast({
        title: "Erro ao carregar estatísticas",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  return (
    <div className="container py-10">
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">Painel Administrativo</h1>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
              <PlusCircle className="h-4 w-4" />
              Nova Categoria
            </Button>
            <Button className="gap-2">
              <PlusCircle className="h-4 w-4" />
              Novo Post
            </Button>
          </div>
        </div>
        
        <Separator />
        
        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatsCard 
            title="Total de Posts" 
            value={stats?.postsCount || 0}
            icon={<FileText className="h-5 w-5 text-primary/80" />}
            loading={isLoadingStats}
          />
          <StatsCard 
            title="Posts Aprovados" 
            value={stats?.approvedPostsCount || 0} 
            icon={<FileText className="h-5 w-5 text-green-500" />}
            loading={isLoadingStats}
          />
          <StatsCard 
            title="Categorias" 
            value={stats?.categoriesCount || 0} 
            icon={<Tag className="h-5 w-5 text-blue-500" />}
            loading={isLoadingStats}
          />
        </div>
        
        {/* Tabs de navegação principal */}
        <Tabs defaultValue="posts" className="mt-6">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="posts" className="gap-2">
              <FileText className="h-4 w-4" />
              Posts
            </TabsTrigger>
            <TabsTrigger value="categories" className="gap-2">
              <Tag className="h-4 w-4" />
              Categorias
            </TabsTrigger>
            <TabsTrigger value="media" className="gap-2">
              <ImagePlus className="h-4 w-4" />
              Mídia
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="posts" className="space-y-4">
            {/* Conteúdo será adicionado posteriormente */}
            <Card>
              <CardHeader>
                <CardTitle>Gerenciamento de Posts</CardTitle>
                <CardDescription>
                  Adicione, edite e gerencie todos os posts da plataforma.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Em desenvolvimento - A lista de posts será exibida aqui.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="categories" className="space-y-4">
            {/* Conteúdo será adicionado posteriormente */}
            <Card>
              <CardHeader>
                <CardTitle>Gerenciamento de Categorias</CardTitle>
                <CardDescription>
                  Gerencie as categorias disponíveis para classificar o conteúdo.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Em desenvolvimento - A lista de categorias será exibida aqui.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="media" className="space-y-4">
            {/* Conteúdo será adicionado posteriormente */}
            <Card>
              <CardHeader>
                <CardTitle>Gerenciamento de Mídia</CardTitle>
                <CardDescription>
                  Visualize e gerencie todas as imagens e arquivos da plataforma.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Em desenvolvimento - A biblioteca de mídia será exibida aqui.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

interface StatsCardProps {
  title: string;
  value: number;
  icon?: React.ReactNode;
  loading?: boolean;
}

function StatsCard({ title, value, icon, loading = false }: StatsCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        {loading ? (
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        ) : (
          <div className="text-2xl font-bold">{value}</div>
        )}
      </CardContent>
    </Card>
  );
}