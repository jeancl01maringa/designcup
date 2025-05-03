import { useState } from "react";
import { Category } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronDown, ChevronUp, Filter, X } from "lucide-react";

export interface FilterOptions {
  searchTerm: string;
  status?: string;
  categoryId?: number;
  month?: number;
  year?: number;
  page: number;
  pageSize: number;
}

interface PostFiltersProps {
  filters: FilterOptions;
  onFilterChange: (filters: Partial<FilterOptions>) => void;
  onClearFilters: () => void;
  categories: Category[];
}

export function PostFilters({ filters, onFilterChange, onClearFilters, categories }: PostFiltersProps) {
  const [expanded, setExpanded] = useState(false);
  
  // Verificar se algum filtro está ativo
  const hasActiveFilters = 
    filters.searchTerm || 
    filters.status || 
    filters.categoryId || 
    filters.month || 
    filters.year;
  
  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-2">
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2"
          onClick={() => setExpanded(!expanded)}
        >
          <Filter className="h-4 w-4" />
          Filtros
          {expanded ? 
            <ChevronUp className="h-4 w-4" /> : 
            <ChevronDown className="h-4 w-4" />
          }
        </Button>
        
        {hasActiveFilters && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClearFilters}
            className="gap-1 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3 w-3" />
            Limpar filtros
          </Button>
        )}
      </div>
      
      {expanded && (
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Filtro de busca por texto */}
              <div className="space-y-2">
                <Label htmlFor="search-filter">Buscar</Label>
                <Input
                  id="search-filter"
                  placeholder="Título, descrição, código..."
                  value={filters.searchTerm}
                  onChange={(e) => onFilterChange({ searchTerm: e.target.value })}
                />
              </div>
              
              {/* Filtro de status */}
              <div className="space-y-2">
                <Label htmlFor="status-filter">Status</Label>
                <Select
                  value={filters.status || ""}
                  onValueChange={(value) => 
                    onFilterChange({ status: value || undefined })
                  }
                >
                  <SelectTrigger id="status-filter">
                    <SelectValue placeholder="Todos os status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos os status</SelectItem>
                    <SelectItem value="aprovado">Aprovado</SelectItem>
                    <SelectItem value="rascunho">Rascunho</SelectItem>
                    <SelectItem value="rejeitado">Rejeitado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Filtro de categoria */}
              <div className="space-y-2">
                <Label htmlFor="category-filter">Categoria</Label>
                <Select
                  value={filters.categoryId?.toString() || ""}
                  onValueChange={(value) => 
                    onFilterChange({ categoryId: value ? parseInt(value) : undefined })
                  }
                >
                  <SelectTrigger id="category-filter">
                    <SelectValue placeholder="Todas as categorias" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas as categorias</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Filtro de mês */}
              <div className="space-y-2">
                <Label htmlFor="month-filter">Mês</Label>
                <Select
                  value={filters.month?.toString() || ""}
                  onValueChange={(value) => 
                    onFilterChange({ month: value ? parseInt(value) : undefined })
                  }
                >
                  <SelectTrigger id="month-filter">
                    <SelectValue placeholder="Todos os meses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos os meses</SelectItem>
                    <SelectItem value="1">Janeiro</SelectItem>
                    <SelectItem value="2">Fevereiro</SelectItem>
                    <SelectItem value="3">Março</SelectItem>
                    <SelectItem value="4">Abril</SelectItem>
                    <SelectItem value="5">Maio</SelectItem>
                    <SelectItem value="6">Junho</SelectItem>
                    <SelectItem value="7">Julho</SelectItem>
                    <SelectItem value="8">Agosto</SelectItem>
                    <SelectItem value="9">Setembro</SelectItem>
                    <SelectItem value="10">Outubro</SelectItem>
                    <SelectItem value="11">Novembro</SelectItem>
                    <SelectItem value="12">Dezembro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Filtro de ano */}
              <div className="space-y-2">
                <Label htmlFor="year-filter">Ano</Label>
                <Select
                  value={filters.year?.toString() || ""}
                  onValueChange={(value) => 
                    onFilterChange({ year: value ? parseInt(value) : undefined })
                  }
                >
                  <SelectTrigger id="year-filter">
                    <SelectValue placeholder="Todos os anos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos os anos</SelectItem>
                    <SelectItem value="2024">2024</SelectItem>
                    <SelectItem value="2025">2025</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Itens por página */}
              <div className="space-y-2">
                <Label htmlFor="pageSize-filter">Itens por página</Label>
                <Select
                  value={filters.pageSize.toString()}
                  onValueChange={(value) => 
                    onFilterChange({ pageSize: parseInt(value), page: 1 })
                  }
                >
                  <SelectTrigger id="pageSize-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 itens</SelectItem>
                    <SelectItem value="10">10 itens</SelectItem>
                    <SelectItem value="20">20 itens</SelectItem>
                    <SelectItem value="50">50 itens</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}