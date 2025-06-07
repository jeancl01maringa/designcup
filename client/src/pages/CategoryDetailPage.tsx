import { useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import ArtworkGrid from "@/components/home/ArtworkGrid";

interface Category {
  id: number;
  name: string;
  description: string;
  slug: string;
}

export default function CategoryDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [filter, setFilter] = useState("todos");
  const [sortBy, setSortBy] = useState("recentes");

  // Buscar dados da categoria
  const { data: category, isLoading: categoryLoading } = useQuery<Category>({
    queryKey: [`/api/categories/${slug}`],
    queryFn: async () => {
      const response = await fetch(`/api/categories/${slug}`);
      if (!response.ok) throw new Error('Categoria não encontrada');
      return response.json();
    }
  });

  // Construir parâmetros para filtrar posts por categoria
  const buildFilterParams = () => {
    const params = new URLSearchParams();
    if (category?.id) {
      params.append('category', category.id.toString());
    }
    if (filter === "premium") {
      params.append('premium', 'true');
    } else if (filter === "gratis") {
      params.append('premium', 'false');
    }
    return params.toString();
  };

  if (categoryLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="pt-24 pb-8">
          <div className="container mx-auto px-4">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-64 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-96 mb-8"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="pt-24 pb-8">
          <div className="container mx-auto px-4">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Categoria não encontrada</h1>
              <Link href="/categorias">
                <Button variant="outline">
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Voltar para Categorias
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="pt-24 pb-8">
        <div className="container mx-auto px-4">
          {/* Breadcrumb */}
          <div className="mb-6">
            <Link href="/categorias">
              <Button variant="ghost" className="text-gray-600 hover:text-gray-900 p-0 h-auto">
                <ChevronLeft className="h-4 w-4 mr-1" />
                Categorias
              </Button>
            </Link>
            <span className="text-gray-400 mx-2">/</span>
            <span className="text-gray-900 font-medium">{category.name}</span>
          </div>

          {/* Header da Categoria */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">{category.name}</h1>
            <p className="text-lg text-gray-600 mb-4">{category.description}</p>
          </div>

          {/* Filtros */}
          <div className="mb-8 bg-white rounded-lg p-6 shadow-sm">
            <div className="flex flex-wrap gap-4 items-center">
              {/* Filtro Principal */}
              <div className="flex space-x-2">
                <Button
                  variant={filter === "todos" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter("todos")}
                >
                  Todos
                </Button>
                <Button
                  variant={filter === "premium" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter("premium")}
                >
                  Premium
                </Button>
                <Button
                  variant={filter === "gratis" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter("gratis")}
                >
                  Grátis
                </Button>
              </div>

              {/* Ordenação */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recentes">Recentes</SelectItem>
                  <SelectItem value="populares">Populares</SelectItem>
                  <SelectItem value="curtidas">Mais Curtidas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Grid de Artes - Usando o mesmo componente da home */}
          <ArtworkGrid 
            category={category.id.toString()}
          />
        </div>
      </div>
    </div>
  );
}