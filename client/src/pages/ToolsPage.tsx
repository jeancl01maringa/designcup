import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ExternalLink, Search, Wrench, Crown } from "lucide-react";

interface Tool {
  id: number;
  name: string;
  description: string;
  url: string;
  category_id: number;
  category_name: string;
  category_description: string;
  image_url: string;
  is_new: boolean;
  is_active: boolean;
  created_at: string;
}

interface ToolCategory {
  id: number;
  name: string;
  description: string;
  tools_count: number;
  is_active: boolean;
}

export default function ToolsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Fetch tools
  const { data: tools = [], isLoading: toolsLoading } = useQuery<Tool[]>({
    queryKey: ['/api/tools', selectedCategory !== "all" ? selectedCategory : undefined],
    queryFn: () => {
      const params = new URLSearchParams();
      if (selectedCategory !== "all") {
        params.append('category', selectedCategory);
      }
      return fetch(`/api/tools?${params}`).then(res => res.json());
    },
  });

  // Fetch categories
  const { data: categories = [], isLoading: categoriesLoading } = useQuery<ToolCategory[]>({
    queryKey: ['/api/tool-categories'],
  });

  // Filter tools based on search term
  const filteredTools = tools.filter(tool =>
    tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tool.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (toolsLoading || categoriesLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando ferramentas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>Ferramentas Úteis - Design para Estética</title>
        <meta name="description" content="Descubra ferramentas úteis para design, produtividade e marketing. Recursos selecionados para profissionais da estética." />
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full">
              <Wrench className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">
              Ferramentas Úteis
            </h1>
          </div>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Descubra ferramentas úteis selecionadas para profissionais de estética.
          </p>
        </div>

        {/* Search and Filter Controls */}
        <div className="bg-white rounded-lg border shadow-sm p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar ferramentas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Category Filter */}
            <div className="lg:w-64">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as categorias" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.name}>
                      {category.name} ({category.tools_count})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Active Filters */}
          {(searchTerm || selectedCategory !== "all") && (
            <div className="flex items-center gap-2 mt-4 pt-4 border-t">
              <span className="text-sm text-gray-500">Filtros ativos:</span>
              {searchTerm && (
                <Badge variant="secondary" className="gap-1">
                  Busca: "{searchTerm}"
                  <button
                    onClick={() => setSearchTerm("")}
                    className="ml-1 hover:bg-gray-300 rounded-full w-4 h-4 flex items-center justify-center text-xs"
                  >
                    ×
                  </button>
                </Badge>
              )}
              {selectedCategory !== "all" && (
                <Badge variant="secondary" className="gap-1">
                  Categoria: {selectedCategory}
                  <button
                    onClick={() => setSelectedCategory("all")}
                    className="ml-1 hover:bg-gray-300 rounded-full w-4 h-4 flex items-center justify-center text-xs"
                  >
                    ×
                  </button>
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Tools Grid */}
        {filteredTools.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTools.map((tool) => (
              <Card key={tool.id} className="group hover:shadow-lg transition-all duration-200 bg-white border border-gray-200">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {tool.image_url ? (
                        <img
                          src={tool.image_url}
                          alt={tool.name}
                          className="w-12 h-12 rounded-xl object-cover border"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center">
                          <ExternalLink className="h-6 w-6 text-gray-500" />
                        </div>
                      )}
                      <div>
                        <CardTitle className="text-lg text-gray-900 group-hover:text-orange-600 transition-colors">
                          {tool.name}
                        </CardTitle>
                        {tool.category_name && (
                          <Badge variant="outline" className="text-xs">
                            {tool.category_name}
                          </Badge>
                        )}
                      </div>
                    </div>
                    {tool.is_new && (
                      <Badge className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                        <Crown className="h-3 w-3 mr-1" />
                        Nova
                      </Badge>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  {tool.description && (
                    <CardDescription className="text-gray-600 mb-4 line-clamp-2">
                      {tool.description}
                    </CardDescription>
                  )}

                  <Button
                    onClick={() => window.open(tool.url, '_blank')}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 h-auto flex items-center justify-center gap-2 rounded-md"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span className="font-medium text-sm">ACESSAR FERRAMENTA</span>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Nenhuma ferramenta encontrada
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || selectedCategory !== "all"
                ? "Tente ajustar seus filtros de busca."
                : "Nenhuma ferramenta está disponível no momento."}
            </p>
            {(searchTerm || selectedCategory !== "all") && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setSelectedCategory("all");
                }}
              >
                Limpar Filtros
              </Button>
            )}
          </div>
        )}

        {/* Categories Overview */}
        {selectedCategory === "all" && categories.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Categorias</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {categories.map((category) => (
                <Card
                  key={category.id}
                  className="cursor-pointer hover:shadow-md transition-shadow bg-white border border-gray-200"
                  onClick={() => setSelectedCategory(category.name)}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg text-gray-900">{category.name}</CardTitle>
                    <CardDescription className="text-sm">
                      {category.tools_count} {category.tools_count === 1 ? 'ferramenta' : 'ferramentas'}
                    </CardDescription>
                  </CardHeader>
                  {category.description && (
                    <CardContent className="pt-0">
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {category.description}
                      </p>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}