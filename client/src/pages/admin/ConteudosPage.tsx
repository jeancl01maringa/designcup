import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { 
  FolderOpen, 
  FileType, 
  LayoutTemplate, 
  Tag, 
  Plus,
  Eye,
  EyeOff,
  Edit
} from "lucide-react";

export default function ConteudosPage() {
  // Buscar dados das categorias
  const { data: categorias = [] } = useQuery({
    queryKey: ["/api/admin/categorias"],
  });

  // Buscar dados dos formatos de arquivo
  const { data: formatosArquivo = [] } = useQuery({
    queryKey: ["/api/admin/file-formats"],
  });

  // Buscar dados dos formatos de post
  const { data: formatosPost = [] } = useQuery({
    queryKey: ["/api/admin/post-formats"],
  });

  // Buscar dados das tags
  const { data: tags = [] } = useQuery({
    queryKey: ["/api/admin/tags"],
  });

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gerenciamento de Conteúdos</h1>
          <p className="text-muted-foreground">
            Gerencie categorias, formatos e tags da plataforma
          </p>
        </div>
      </div>

      {/* Grid de Cards Principais */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Categorias */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <Link href="/admin/categorias">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Categorias</CardTitle>
              <FolderOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{categorias.length}</div>
              <p className="text-xs text-muted-foreground">
                Categorias criadas
              </p>
              <div className="mt-4">
                <Button size="sm" className="w-full">
                  <Edit className="mr-2 h-4 w-4" />
                  Gerenciar
                </Button>
              </div>
            </CardContent>
          </Link>
        </Card>

        {/* Formatos de Arquivo */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <Link href="/admin/gerenciamento/formatos">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Formatos de Arquivo</CardTitle>
              <FileType className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatosArquivo.length}</div>
              <p className="text-xs text-muted-foreground">
                Formatos disponíveis
              </p>
              <div className="mt-4">
                <Button size="sm" className="w-full">
                  <Edit className="mr-2 h-4 w-4" />
                  Gerenciar
                </Button>
              </div>
            </CardContent>
          </Link>
        </Card>

        {/* Formatos de Post */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <Link href="/admin/gerenciamento/formatos-post">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Formatos de Post</CardTitle>
              <LayoutTemplate className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatosPost.length}</div>
              <p className="text-xs text-muted-foreground">
                Formatos de publicação
              </p>
              <div className="mt-4">
                <Button size="sm" className="w-full">
                  <Edit className="mr-2 h-4 w-4" />
                  Gerenciar
                </Button>
              </div>
            </CardContent>
          </Link>
        </Card>

        {/* Tags */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <Link href="/admin/gerenciamento/tags">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tags</CardTitle>
              <Tag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tags.length}</div>
              <p className="text-xs text-muted-foreground">
                Tags disponíveis
              </p>
              <div className="mt-4">
                <Button size="sm" className="w-full">
                  <Edit className="mr-2 h-4 w-4" />
                  Gerenciar
                </Button>
              </div>
            </CardContent>
          </Link>
        </Card>
      </div>

      {/* Resumo de Status */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Status das Categorias */}
        <Card>
          <CardHeader>
            <CardTitle>Status das Categorias</CardTitle>
            <CardDescription>
              Visão geral do status de ativação
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {categorias.slice(0, 5).map((categoria: any) => (
                <div key={categoria.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <FolderOpen className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{categoria.name}</span>
                  </div>
                  <Badge variant={categoria.isActive ? "default" : "secondary"}>
                    {categoria.isActive ? (
                      <>
                        <Eye className="mr-1 h-3 w-3" />
                        Ativa
                      </>
                    ) : (
                      <>
                        <EyeOff className="mr-1 h-3 w-3" />
                        Inativa
                      </>
                    )}
                  </Badge>
                </div>
              ))}
              
              {categorias.length === 0 && (
                <div className="text-center py-4 text-muted-foreground">
                  Nenhuma categoria encontrada
                </div>
              )}
              
              {categorias.length > 5 && (
                <div className="text-center pt-2">
                  <Link href="/admin/categorias">
                    <Button variant="outline" size="sm">
                      Ver todas ({categorias.length})
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tags Mais Usadas */}
        <Card>
          <CardHeader>
            <CardTitle>Tags Disponíveis</CardTitle>
            <CardDescription>
              Lista das tags criadas no sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {tags.slice(0, 5).map((tag: any) => (
                <div key={tag.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Tag className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{tag.name}</span>
                  </div>
                  <Badge variant={tag.is_active ? "default" : "secondary"}>
                    {tag.is_active ? "Ativa" : "Inativa"}
                  </Badge>
                </div>
              ))}
              
              {tags.length === 0 && (
                <div className="text-center py-4 text-muted-foreground">
                  Nenhuma tag encontrada
                </div>
              )}
              
              {tags.length > 5 && (
                <div className="text-center pt-2">
                  <Link href="/admin/gerenciamento/tags">
                    <Button variant="outline" size="sm">
                      Ver todas ({tags.length})
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ações Rápidas */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
          <CardDescription>
            Links diretos para as principais tarefas de gerenciamento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Link href="/admin/categorias">
              <Button variant="outline" className="w-full h-16 flex flex-col items-center justify-center space-y-2">
                <FolderOpen className="h-6 w-6" />
                <span>Nova Categoria</span>
              </Button>
            </Link>
            
            <Link href="/admin/gerenciamento/formatos">
              <Button variant="outline" className="w-full h-16 flex flex-col items-center justify-center space-y-2">
                <FileType className="h-6 w-6" />
                <span>Formato de Arquivo</span>
              </Button>
            </Link>
            
            <Link href="/admin/gerenciamento/formatos-post">
              <Button variant="outline" className="w-full h-16 flex flex-col items-center justify-center space-y-2">
                <LayoutTemplate className="h-6 w-6" />
                <span>Formato de Post</span>
              </Button>
            </Link>
            
            <Link href="/admin/gerenciamento/tags">
              <Button variant="outline" className="w-full h-16 flex flex-col items-center justify-center space-y-2">
                <Tag className="h-6 w-6" />
                <span>Nova Tag</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}