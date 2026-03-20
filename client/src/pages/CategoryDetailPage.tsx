import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import ArtworkGrid from "@/components/home/ArtworkGrid";

interface Category {
  id: number;
  name: string;
  description: string;
  slug: string;
}

export default function CategoryDetailPage() {
  const { slug } = useParams<{ slug: string }>();

  // Buscar dados da categoria
  const { data: category, isLoading: categoryLoading } = useQuery<Category>({
    queryKey: [`/api/categories/${slug}`],
    queryFn: async () => {
      const response = await fetch(`/api/categories/${slug}`);
      if (!response.ok) throw new Error('Categoria não encontrada');
      return response.json();
    }
  });

  if (categoryLoading) {
    return (
      <div className="min-h-screen bg-muted">
        <div className="pt-24 pb-8">
          <div className="container-global">
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
      <div className="min-h-screen bg-muted">
        <div className="pt-24 pb-8">
          <div className="container-global">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-foreground mb-4">Categoria não encontrada</h1>
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
    <div className="min-h-screen bg-muted">
      <div className="pt-24 pb-8">
        <div className="container-global">
          {/* Breadcrumb */}
          <div className="mb-6">
            <Link href="/categorias">
              <Button variant="ghost" className="text-muted-foreground hover:text-foreground p-0 h-auto">
                <ChevronLeft className="h-4 w-4 mr-1" />
                Categorias
              </Button>
            </Link>
            <span className="text-gray-400 mx-2">/</span>
            <span className="text-foreground font-medium">{category.name}</span>
          </div>

          {/* Header da Categoria */}
          <div className="mb-6 md:mb-8">
            <h1 className="text-xl md:text-3xl lg:text-4xl font-bold text-foreground mb-1 md:mb-2">{category.name}</h1>
            <p className="text-sm md:text-lg text-muted-foreground mb-2 md:mb-4">{category.description}</p>
          </div>

          {/* Grid de Artes - Usando o mesmo componente da home */}
          <ArtworkGrid 
            category={category.slug}
          />
        </div>
      </div>
    </div>
  );
}