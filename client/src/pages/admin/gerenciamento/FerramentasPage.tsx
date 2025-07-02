import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, MoreVertical, Edit, Trash2, ExternalLink, Wrench, Folder, Eye, EyeOff, Crown, Upload } from "lucide-react";
import { AdminLayout } from "@/components/admin/layout/AdminLayout";
import { PageHeader } from "@/components/admin/layout/PageHeader";

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
  updated_at: string;
}

interface ToolCategory {
  id: number;
  name: string;
  description: string;
  tools_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface ToolFormData {
  name: string;
  description: string;
  url: string;
  categoryId: string;
  isNew: boolean;
  isActive: boolean;
  image?: File;
}

interface CategoryFormData {
  name: string;
  description: string;
  isActive: boolean;
}

export default function FerramentasPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isToolDialogOpen, setIsToolDialogOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [editingTool, setEditingTool] = useState<Tool | null>(null);
  const [editingCategory, setEditingCategory] = useState<ToolCategory | null>(null);
  const [toolFormData, setToolFormData] = useState<ToolFormData>({
    name: "",
    description: "",
    url: "",
    categoryId: "",
    isNew: false,
    isActive: true,
  });
  const [categoryFormData, setCategoryFormData] = useState<CategoryFormData>({
    name: "",
    description: "",
    isActive: true,
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch tools
  const { data: tools = [], isLoading: toolsLoading } = useQuery<Tool[]>({
    queryKey: ['/api/admin/tools'],
  });

  // Fetch categories
  const { data: categories = [], isLoading: categoriesLoading } = useQuery<ToolCategory[]>({
    queryKey: ['/api/admin/tool-categories'],
  });

  // Create tool mutation
  const createToolMutation = useMutation({
    mutationFn: async (data: ToolFormData) => {
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('description', data.description);
      formData.append('url', data.url);
      formData.append('categoryId', data.categoryId);
      formData.append('isNew', data.isNew.toString());
      formData.append('isActive', data.isActive.toString());
      if (data.image) {
        formData.append('image', data.image);
      }

      const response = await fetch('/api/admin/tools', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) throw new Error('Erro ao criar ferramenta');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/tools'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/tool-categories'] });
      setIsToolDialogOpen(false);
      resetToolForm();
      toast({ title: "Ferramenta criada com sucesso!" });
    },
    onError: () => {
      toast({ 
        title: "Erro ao criar ferramenta", 
        description: "Tente novamente em alguns instantes.",
        variant: "destructive" 
      });
    },
  });

  // Update tool mutation
  const updateToolMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: ToolFormData }) => {
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('description', data.description);
      formData.append('url', data.url);
      formData.append('categoryId', data.categoryId);
      formData.append('isNew', data.isNew.toString());
      formData.append('isActive', data.isActive.toString());
      if (data.image) {
        formData.append('image', data.image);
      }

      const response = await fetch(`/api/admin/tools/${id}`, {
        method: 'PUT',
        body: formData,
      });
      if (!response.ok) throw new Error('Erro ao atualizar ferramenta');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/tools'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/tool-categories'] });
      setIsToolDialogOpen(false);
      setEditingTool(null);
      resetToolForm();
      toast({ title: "Ferramenta atualizada com sucesso!" });
    },
    onError: () => {
      toast({ 
        title: "Erro ao atualizar ferramenta", 
        description: "Tente novamente em alguns instantes.",
        variant: "destructive" 
      });
    },
  });

  // Delete tool mutation
  const deleteToolMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/admin/tools/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Erro ao excluir ferramenta');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/tools'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/tool-categories'] });
      toast({ title: "Ferramenta excluída com sucesso!" });
    },
    onError: () => {
      toast({ 
        title: "Erro ao excluir ferramenta", 
        description: "Tente novamente em alguns instantes.",
        variant: "destructive" 
      });
    },
  });

  // Create category mutation
  const createCategoryMutation = useMutation({
    mutationFn: async (data: CategoryFormData) => {
      const response = await fetch('/api/admin/tool-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Erro ao criar categoria');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/tool-categories'] });
      setIsCategoryDialogOpen(false);
      resetCategoryForm();
      toast({ title: "Categoria criada com sucesso!" });
    },
    onError: () => {
      toast({ 
        title: "Erro ao criar categoria", 
        description: "Tente novamente em alguns instantes.",
        variant: "destructive" 
      });
    },
  });

  // Update category mutation
  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: CategoryFormData }) => {
      const response = await fetch(`/api/admin/tool-categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Erro ao atualizar categoria');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/tool-categories'] });
      setIsCategoryDialogOpen(false);
      setEditingCategory(null);
      resetCategoryForm();
      toast({ title: "Categoria atualizada com sucesso!" });
    },
    onError: () => {
      toast({ 
        title: "Erro ao atualizar categoria", 
        description: "Tente novamente em alguns instantes.",
        variant: "destructive" 
      });
    },
  });

  // Delete category mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/admin/tool-categories/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Erro ao excluir categoria');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/tool-categories'] });
      toast({ title: "Categoria excluída com sucesso!" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Erro ao excluir categoria", 
        description: error.message || "Tente novamente em alguns instantes.",
        variant: "destructive" 
      });
    },
  });

  // Filter tools based on search
  const filteredTools = tools.filter(tool =>
    tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tool.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tool.category_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter categories based on search
  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const resetToolForm = () => {
    setToolFormData({
      name: "",
      description: "",
      url: "",
      categoryId: "",
      isNew: false,
      isActive: true,
    });
  };

  const resetCategoryForm = () => {
    setCategoryFormData({
      name: "",
      description: "",
      isActive: true,
    });
  };

  const handleEditTool = (tool: Tool) => {
    setEditingTool(tool);
    setToolFormData({
      name: tool.name,
      description: tool.description || "",
      url: tool.url,
      categoryId: tool.category_id?.toString() || "",
      isNew: tool.is_new,
      isActive: tool.is_active,
    });
    setIsToolDialogOpen(true);
  };

  const handleEditCategory = (category: ToolCategory) => {
    setEditingCategory(category);
    setCategoryFormData({
      name: category.name,
      description: category.description || "",
      isActive: category.is_active,
    });
    setIsCategoryDialogOpen(true);
  };

  const handleSubmitTool = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTool) {
      updateToolMutation.mutate({ id: editingTool.id, data: toolFormData });
    } else {
      createToolMutation.mutate(toolFormData);
    }
  };

  const handleSubmitCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCategory) {
      updateCategoryMutation.mutate({ id: editingCategory.id, data: categoryFormData });
    } else {
      createCategoryMutation.mutate(categoryFormData);
    }
  };

  if (toolsLoading || categoriesLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <PageHeader 
        title="Ferramentas" 
        description="Gerencie as ferramentas e categorias disponíveis no site"
      />
      
      <Tabs defaultValue="tools" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="tools" className="flex items-center gap-2">
            <Wrench className="h-4 w-4" />
            Ferramentas
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <Folder className="h-4 w-4" />
            Categorias
          </TabsTrigger>
        </TabsList>

        {/* Tools Tab */}
        <TabsContent value="tools" className="space-y-6">
          {/* Tools Controls */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar ferramentas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
            </div>

            <Dialog open={isToolDialogOpen} onOpenChange={setIsToolDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  onClick={() => {
                    setEditingTool(null);
                    resetToolForm();
                  }}
                  className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Ferramenta
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingTool ? 'Editar Ferramenta' : 'Nova Ferramenta'}
                  </DialogTitle>
                  <DialogDescription>
                    Preencha os campos abaixo para {editingTool ? 'atualizar' : 'adicionar'} uma nova ferramenta.
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmitTool} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome *</Label>
                      <Input
                        id="name"
                        placeholder="Digite o nome da ferramenta"
                        value={toolFormData.name}
                        onChange={(e) => setToolFormData(prev => ({ ...prev, name: e.target.value }))}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="url">URL *</Label>
                      <Input
                        id="url"
                        type="url"
                        placeholder="https://exemplo.com"
                        value={toolFormData.url}
                        onChange={(e) => setToolFormData(prev => ({ ...prev, url: e.target.value }))}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea
                      id="description"
                      placeholder="Descreva brevemente a ferramenta"
                      value={toolFormData.description}
                      onChange={(e) => setToolFormData(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="category">Categoria</Label>
                      <Select
                        value={toolFormData.categoryId}
                        onValueChange={(value) => setToolFormData(prev => ({ ...prev, categoryId: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id.toString()}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="image">Imagem</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="image"
                          type="file"
                          accept="image/*"
                          onChange={(e) => setToolFormData(prev => ({ 
                            ...prev, 
                            image: e.target.files?.[0] 
                          }))}
                          className="flex-1"
                        />
                        <Upload className="h-4 w-4 text-gray-400" />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-6">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="isNew"
                        checked={toolFormData.isNew}
                        onCheckedChange={(checked) => 
                          setToolFormData(prev => ({ ...prev, isNew: checked as boolean }))
                        }
                      />
                      <Label htmlFor="isNew">Marcar como nova</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="isActive"
                        checked={toolFormData.isActive}
                        onCheckedChange={(checked) => 
                          setToolFormData(prev => ({ ...prev, isActive: checked as boolean }))
                        }
                      />
                      <Label htmlFor="isActive">Ativo</Label>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsToolDialogOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button 
                      type="submit"
                      disabled={createToolMutation.isPending || updateToolMutation.isPending}
                      className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
                    >
                      {editingTool ? 'Atualizar' : 'Criar'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Tools Table */}
          <Card>
            <CardHeader>
              <CardTitle>Gerenciar Ferramentas</CardTitle>
              <CardDescription>
                Adicione, edite ou remova ferramentas do site.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredTools.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ferramenta</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>URL</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTools.map((tool) => (
                      <TableRow key={tool.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {tool.image_url ? (
                              <img
                                src={tool.image_url}
                                alt={tool.name}
                                className="w-8 h-8 rounded-lg object-cover border"
                              />
                            ) : (
                              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                                <ExternalLink className="h-4 w-4 text-gray-500" />
                              </div>
                            )}
                            <div>
                              <div className="font-medium text-gray-900 flex items-center gap-2">
                                {tool.name}
                                {tool.is_new && (
                                  <Badge className="bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs">
                                    <Crown className="h-3 w-3 mr-1" />
                                    Nova
                                  </Badge>
                                )}
                              </div>
                              {tool.description && (
                                <div className="text-sm text-gray-500 line-clamp-1">
                                  {tool.description}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {tool.category_name ? (
                            <Badge variant="outline">{tool.category_name}</Badge>
                          ) : (
                            <span className="text-gray-400">Sem categoria</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {tool.is_active ? (
                              <Eye className="h-4 w-4 text-green-600" />
                            ) : (
                              <EyeOff className="h-4 w-4 text-gray-400" />
                            )}
                            <span className={tool.is_active ? "text-green-600" : "text-gray-400"}>
                              {tool.is_active ? "Ativo" : "Inativo"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(tool.url, '_blank')}
                            className="p-1 h-auto text-blue-600 hover:text-blue-800"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditTool(tool)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <DropdownMenuItem 
                                    onSelect={(e) => e.preventDefault()}
                                    className="text-red-600 focus:text-red-600"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Excluir
                                  </DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Tem certeza que deseja excluir a ferramenta "{tool.name}"? 
                                      Esta ação não pode ser desfeita.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => deleteToolMutation.mutate(tool.id)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Excluir
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <Wrench className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">
                    {searchTerm ? "Nenhuma ferramenta encontrada" : "Nenhuma ferramenta encontrada"}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {searchTerm ? "Tente ajustar o termo de busca" : "Adicione uma nova ferramenta para começar"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-6">
          {/* Categories Controls */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar categorias..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
            </div>

            <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  onClick={() => {
                    setEditingCategory(null);
                    resetCategoryForm();
                  }}
                  className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Categoria
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
                  </DialogTitle>
                  <DialogDescription>
                    Preencha os campos abaixo para {editingCategory ? 'atualizar' : 'adicionar'} uma categoria.
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmitCategory} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="categoryName">Nome *</Label>
                    <Input
                      id="categoryName"
                      placeholder="Digite o nome da categoria"
                      value={categoryFormData.name}
                      onChange={(e) => setCategoryFormData(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="categoryDescription">Descrição</Label>
                    <Textarea
                      id="categoryDescription"
                      placeholder="Descreva brevemente a categoria"
                      value={categoryFormData.description}
                      onChange={(e) => setCategoryFormData(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="categoryActive"
                      checked={categoryFormData.isActive}
                      onCheckedChange={(checked) => 
                        setCategoryFormData(prev => ({ ...prev, isActive: checked as boolean }))
                      }
                    />
                    <Label htmlFor="categoryActive">Ativo</Label>
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsCategoryDialogOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button 
                      type="submit"
                      disabled={createCategoryMutation.isPending || updateCategoryMutation.isPending}
                      className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
                    >
                      {editingCategory ? 'Atualizar' : 'Criar'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Categories Table */}
          <Card>
            <CardHeader>
              <CardTitle>Gerenciar Categorias</CardTitle>
              <CardDescription>
                Organize as ferramentas em categorias.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredCategories.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Ferramentas</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCategories.map((category) => (
                      <TableRow key={category.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium text-gray-900">{category.name}</div>
                            {category.description && (
                              <div className="text-sm text-gray-500 line-clamp-1">
                                {category.description}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {category.tools_count} {category.tools_count === 1 ? 'ferramenta' : 'ferramentas'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {category.is_active ? (
                              <Eye className="h-4 w-4 text-green-600" />
                            ) : (
                              <EyeOff className="h-4 w-4 text-gray-400" />
                            )}
                            <span className={category.is_active ? "text-green-600" : "text-gray-400"}>
                              {category.is_active ? "Ativo" : "Inativo"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditCategory(category)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              {category.tools_count === 0 && (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <DropdownMenuItem 
                                      onSelect={(e) => e.preventDefault()}
                                      className="text-red-600 focus:text-red-600"
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Excluir
                                    </DropdownMenuItem>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Tem certeza que deseja excluir a categoria "{category.name}"? 
                                        Esta ação não pode ser desfeita.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => deleteCategoryMutation.mutate(category.id)}
                                        className="bg-red-600 hover:bg-red-700"
                                      >
                                        Excluir
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <Folder className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">
                    {searchTerm ? "Nenhuma categoria encontrada" : "Nenhuma categoria encontrada"}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {searchTerm ? "Tente ajustar o termo de busca" : "Adicione uma nova categoria para começar"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
}