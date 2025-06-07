import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit, Trash2, Users, Camera, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Author {
  id: number;
  username: string;
  email: string;
  profileImage?: string;
  postsCount: number;
  createdAt: string;
  bio: string;
  isAdmin: boolean;
  active: boolean;
}

const authorSchema = z.object({
  username: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres").optional(),
  bio: z.string().max(500, "Bio deve ter no máximo 500 caracteres").optional(),
  active: z.boolean().default(true)
});

type AuthorFormData = z.infer<typeof authorSchema>;

export default function AutoresPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAuthor, setEditingAuthor] = useState<Author | null>(null);

  const form = useForm<AuthorFormData>({
    resolver: zodResolver(authorSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      bio: "",
      active: true
    }
  });

  // Buscar todos os autores/designers
  const { data: authors = [], isLoading } = useQuery<Author[]>({
    queryKey: ['/api/admin/usuarios'],
    select: (users) => users.filter(user => user.isAdmin),
    staleTime: 30000,
  });

  // Mutation para criar novo autor
  const createAuthorMutation = useMutation({
    mutationFn: async (data: AuthorFormData) => {
      const response = await apiRequest('POST', '/api/admin/usuarios', {
        ...data,
        isAdmin: true,
        tipo: 'free'
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/usuarios'] });
      queryClient.invalidateQueries({ queryKey: ['/api/authors'] });
      setDialogOpen(false);
      form.reset();
      toast({
        title: "Autor criado com sucesso",
        description: "O novo designer foi adicionado à equipe"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar autor",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Mutation para atualizar autor
  const updateAuthorMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: Partial<AuthorFormData> }) => {
      const response = await apiRequest('PATCH', `/api/admin/usuarios/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/usuarios'] });
      queryClient.invalidateQueries({ queryKey: ['/api/authors'] });
      setDialogOpen(false);
      setEditingAuthor(null);
      form.reset();
      toast({
        title: "Autor atualizado",
        description: "As informações do designer foram atualizadas"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar autor",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Mutation para desativar autor
  const toggleAuthorMutation = useMutation({
    mutationFn: async ({ id, active }: { id: number, active: boolean }) => {
      const response = await apiRequest('PATCH', `/api/admin/usuarios/${id}`, { active });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/usuarios'] });
      queryClient.invalidateQueries({ queryKey: ['/api/authors'] });
      toast({
        title: "Status atualizado",
        description: "O status do autor foi alterado"
      });
    }
  });

  const handleSubmit = (data: AuthorFormData) => {
    if (editingAuthor) {
      updateAuthorMutation.mutate({ id: editingAuthor.id, data });
    } else {
      createAuthorMutation.mutate(data);
    }
  };

  const openCreateDialog = () => {
    setEditingAuthor(null);
    form.reset({
      username: "",
      email: "",
      password: "",
      bio: "",
      active: true
    });
    setDialogOpen(true);
  };

  const openEditDialog = (author: Author) => {
    setEditingAuthor(author);
    form.reset({
      username: author.username,
      email: author.email,
      password: "", // Não preencher senha ao editar
      bio: author.bio || "",
      active: author.active
    });
    setDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-500" />
            </div>
            Autores e Designers
          </h1>
          <p className="text-muted-foreground mt-2">
            Gerencie a equipe de designers que criam conteúdo na plataforma
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog} className="bg-blue-500 hover:bg-blue-600">
              <Plus className="w-4 h-4 mr-2" />
              Novo Autor
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {editingAuthor ? 'Editar Autor' : 'Novo Autor/Designer'}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome do designer" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="email@exemplo.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {editingAuthor ? 'Nova Senha (opcional)' : 'Senha'}
                      </FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          placeholder={editingAuthor ? "Deixe vazio para manter atual" : "Senha de acesso"} 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bio (opcional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Descrição sobre o designer e seus trabalhos"
                          className="min-h-[80px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="active"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Ativo</FormLabel>
                        <div className="text-sm text-muted-foreground">
                          Designer pode acessar o painel e criar conteúdo
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createAuthorMutation.isPending || updateAuthorMutation.isPending}
                    className="bg-blue-500 hover:bg-blue-600"
                  >
                    {editingAuthor ? 'Salvar' : 'Criar Autor'}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Estatísticas */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Autores</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{authors.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Autores Ativos</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {authors.filter(a => a.active).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Posts</CardTitle>
            <Camera className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {authors.reduce((total, author) => total + author.postsCount, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Autores */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {authors.map((author) => (
          <Card key={author.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  {author.profileImage ? (
                    <AvatarImage src={author.profileImage} alt={author.username} />
                  ) : (
                    <AvatarFallback className="bg-blue-100 text-blue-600">
                      {author.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{author.username}</h3>
                  <p className="text-sm text-muted-foreground truncate">
                    {author.email}
                  </p>
                </div>
                <Badge variant={author.active ? "default" : "secondary"}>
                  {author.active ? "Ativo" : "Inativo"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                {author.bio && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {author.bio}
                  </p>
                )}
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Posts criados:</span>
                  <span className="font-medium">{author.postsCount}</span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Criado em:</span>
                  <span className="font-medium">
                    {new Date(author.createdAt).toLocaleDateString('pt-BR')}
                  </span>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEditDialog(author)}
                    className="flex-1"
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    variant={author.active ? "destructive" : "default"}
                    onClick={() => toggleAuthorMutation.mutate({ 
                      id: author.id, 
                      active: !author.active 
                    })}
                    disabled={toggleAuthorMutation.isPending}
                  >
                    {author.active ? "Desativar" : "Ativar"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {authors.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum autor encontrado</h3>
            <p className="text-muted-foreground mb-4">
              Crie o primeiro autor/designer da sua equipe
            </p>
            <Button onClick={openCreateDialog} className="bg-blue-500 hover:bg-blue-600">
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeiro Autor
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}