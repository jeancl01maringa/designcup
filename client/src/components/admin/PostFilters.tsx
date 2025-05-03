import React, { useState } from "react";
import { FilterOptions } from "@/lib/admin/types";
import { Category } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Search, XCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PostFiltersProps {
  filters: FilterOptions;
  onFilterChange: (filters: Partial<FilterOptions>) => void;
  onClearFilters: () => void;
  categories: Category[];
}

export function PostFilters({ filters, onFilterChange, onClearFilters, categories }: PostFiltersProps) {
  const [dateTab, setDateTab] = useState<string>("all");
  const [localMonth, setLocalMonth] = useState<number>(new Date().getMonth() + 1);
  const [localYear, setLocalYear] = useState<number>(new Date().getFullYear());
  const [localDateRange, setLocalDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined,
  });
  
  // Anos disponíveis para seleção (últimos 5 anos)
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);
  
  // Meses para seleção
  const months = [
    { value: 1, label: "Janeiro" },
    { value: 2, label: "Fevereiro" },
    { value: 3, label: "Março" },
    { value: 4, label: "Abril" },
    { value: 5, label: "Maio" },
    { value: 6, label: "Junho" },
    { value: 7, label: "Julho" },
    { value: 8, label: "Agosto" },
    { value: 9, label: "Setembro" },
    { value: 10, label: "Outubro" },
    { value: 11, label: "Novembro" },
    { value: 12, label: "Dezembro" },
  ];
  
  // Submeter pesquisa ao pressionar Enter
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onFilterChange({ searchTerm: e.currentTarget.value });
    }
  };
  
  // Aplicar filtro de datas
  const applyDateFilter = () => {
    if (dateTab === "month") {
      onFilterChange({
        month: localMonth,
        year: localYear,
        dateRange: undefined,
      });
    } else if (dateTab === "range" && localDateRange.from && localDateRange.to) {
      onFilterChange({
        month: undefined,
        year: undefined,
        dateRange: {
          from: localDateRange.from,
          to: localDateRange.to,
        },
      });
    } else if (dateTab === "all") {
      onFilterChange({
        month: undefined,
        year: undefined,
        dateRange: undefined,
      });
    }
  };
  
  // Verificar se há algum filtro ativo
  const hasActiveFilters = 
    filters.searchTerm || 
    filters.status || 
    filters.categoryId || 
    filters.month || 
    filters.dateRange;
  
  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="grid gap-4 grid-cols-1 md:grid-cols-5">
          {/* Pesquisa */}
          <div className="relative col-span-1 md:col-span-2">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar por título, descrição, código..."
              className="pl-8"
              defaultValue={filters.searchTerm || ''}
              onKeyDown={handleSearchKeyDown}
              onBlur={(e) => onFilterChange({ searchTerm: e.target.value })}
            />
          </div>
          
          {/* Status */}
          <div>
            <Select
              value={filters.status || ""}
              onValueChange={(value) => onFilterChange({ status: value ? value as any : undefined })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os status</SelectItem>
                <SelectItem value="aprovado">Aprovado</SelectItem>
                <SelectItem value="rascunho">Rascunho</SelectItem>
                <SelectItem value="rejeitado">Rejeitado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Categoria */}
          <div>
            <Select
              value={filters.categoryId?.toString() || ""}
              onValueChange={(value) => onFilterChange({ categoryId: value ? parseInt(value) : undefined })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Categoria" />
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
          
          {/* Data */}
          <div>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal text-muted-foreground"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.month && filters.year
                    ? `${months.find(m => m.value === filters.month)?.label} ${filters.year}`
                    : filters.dateRange?.from && filters.dateRange?.to
                    ? `${format(filters.dateRange.from, 'dd/MM/yy')} - ${format(filters.dateRange.to, 'dd/MM/yy')}`
                    : "Todas as datas"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Tabs
                  defaultValue={dateTab}
                  value={dateTab}
                  onValueChange={setDateTab}
                  className="w-full"
                >
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="all">Todas</TabsTrigger>
                    <TabsTrigger value="month">Mês</TabsTrigger>
                    <TabsTrigger value="range">Período</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="all" className="p-4">
                    <p className="text-sm text-muted-foreground">
                      Mostrar posts de todos os períodos
                    </p>
                    <Button 
                      className="w-full mt-2" 
                      onClick={() => {
                        applyDateFilter();
                      }}
                    >
                      Aplicar
                    </Button>
                  </TabsContent>
                  
                  <TabsContent value="month" className="p-4 space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label htmlFor="month-select">Mês</Label>
                        <Select
                          value={localMonth.toString()}
                          onValueChange={(value) => setLocalMonth(parseInt(value))}
                        >
                          <SelectTrigger id="month-select">
                            <SelectValue placeholder="Mês" />
                          </SelectTrigger>
                          <SelectContent>
                            {months.map((month) => (
                              <SelectItem key={month.value} value={month.value.toString()}>
                                {month.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="year-select">Ano</Label>
                        <Select
                          value={localYear.toString()}
                          onValueChange={(value) => setLocalYear(parseInt(value))}
                        >
                          <SelectTrigger id="year-select">
                            <SelectValue placeholder="Ano" />
                          </SelectTrigger>
                          <SelectContent>
                            {years.map((year) => (
                              <SelectItem key={year} value={year.toString()}>
                                {year}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Button 
                      className="w-full" 
                      onClick={() => {
                        applyDateFilter();
                      }}
                    >
                      Aplicar
                    </Button>
                  </TabsContent>
                  
                  <TabsContent value="range" className="p-4">
                    <div className="space-y-4">
                      <Calendar
                        mode="range"
                        selected={localDateRange as any}
                        onSelect={(range) => setLocalDateRange(range as any)}
                        locale={ptBR}
                        className="rounded-md border"
                      />
                      <Button 
                        className="w-full" 
                        onClick={() => {
                          applyDateFilter();
                        }}
                        disabled={!localDateRange.from || !localDateRange.to}
                      >
                        Aplicar
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </PopoverContent>
            </Popover>
          </div>
          
          {/* Botão Limpar Filtros (visível apenas quando há filtros ativos) */}
          {hasActiveFilters && (
            <div className="col-span-1 md:col-span-5 flex justify-end">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onClearFilters}
                className="text-muted-foreground text-sm"
              >
                <XCircle className="mr-1 h-4 w-4" />
                Limpar filtros
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}