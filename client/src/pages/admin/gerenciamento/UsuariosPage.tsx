import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { AdminLayout } from "@/components/admin/layout/AdminLayout";
import { PageHeader } from "@/components/admin/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Edit2, Search, Trash2, User, UserPlus, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

// Interface para o tipo de usuário com os novos campos
interface Usuario {
  id: number;
  username: string;
  email: string;
  isAdmin: boolean;
  createdAt: string;
  tipo: 'free' | 'premium';
  plano_id: string | null;
  data_vencimento: string | null;
  active: boolean;
}

// Interface para o plano
interface Plano {
  id: number;
  name: string;
  periodo: string;
  valor: string;
  codigoHotmart: string;
}

export default function UsuariosPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Usuario | null>(null);
  const [editFormData, setEditFormData] = useState({
    username: "",
    email: "",
    isAdmin: false,
    tipo: "free" as "free" | "premium",
    plano_id: "",
    data_vencimento: "",
    active: false
  });

  // Buscar todos os usuários
  const { data: usuarios = [], isLoading: isLoadingUsers } = useQuery<Usuario[]>({
    queryKey: ['/api/admin/usuarios'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/usuarios');
      return response.json();
    }
  });

  // Buscar todos os planos disponíveis
  const { data: planos = [], isLoading: isLoadingPlanos } = useQuery<Plano[]>({
    queryKey: ['/api/admin/planos'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/planos');
      return response.json();
    }
  });

  // Mutation para atualizar usuário
  const updateUserMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: Partial<typeof editFormData> }) => {
      const response = await apiRequest('PATCH', `/api/admin/usuarios/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/usuarios'] });
      setIsEditDialogOpen(false);
      toast({
        title: "Usuário atualizado",
        description: "Os dados do usuário foram atualizados com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar usuário",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Mutation para excluir usuário
  const deleteUserMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/admin/usuarios/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/usuarios'] });
      setIsDeleteDialogOpen(false);
      setSelectedUser(null);
      toast({
        title: "Usuário excluído",
        description: "O usuário foi excluído com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao excluir usuário",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Função para alternar o status de ativo/inativo
  const toggleActiveStatusMutation = useMutation({
    mutationFn: async ({ id, active }: { id: number, active: boolean }) => {
      const response = await apiRequest('PATCH', `/api/admin/usuarios/${id}/toggle-active`, { active });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/usuarios'] });
      toast({
        title: "Status atualizado",
        description: "O status do usuário foi atualizado com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar status",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Função para lidar com a abertura do modal de edição
  const handleEditClick = (usuario: Usuario) => {
    setSelectedUser(usuario);
    setEditFormData({
      username: usuario.username,
      email: usuario.email,
      isAdmin: usuario.isAdmin,
      tipo: usuario.tipo,
      plano_id: usuario.plano_id || "",
      data_vencimento: usuario.data_vencimento ? new Date(usuario.data_vencimento).toISOString().substring(0, 10) : "",
      active: usuario.active
    });
    setIsEditDialogOpen(true);
  };

  // Função para lidar com a abertura do modal de exclusão
  const handleDeleteClick = (usuario: Usuario) => {
    setSelectedUser(usuario);
    setIsDeleteDialogOpen(true);
  };

  // Função para salvar as alterações no usuário
  const handleSaveUser = () => {
    if (!selectedUser) return;
    
    updateUserMutation.mutate({
      id: selectedUser.id,
      data: editFormData
    });
  };

  // Função para excluir o usuário
  const handleDeleteUser = () => {
    if (!selectedUser) return;
    
    deleteUserMutation.mutate(selectedUser.id);
  };

  // Função para alternar o status de ativo/inativo
  const handleToggleActive = (usuario: Usuario) => {
    toggleActiveStatusMutation.mutate({
      id: usuario.id,
      active: !usuario.active
    });
  };

  // Filtrar usuários com base no termo de pesquisa
  const filteredUsuarios = usuarios.filter(usuario => 
    usuario.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    usuario.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Função para renderizar o tipo de plano de um usuário
  const renderPlanoInfo = (usuario: Usuario) => {
    if (usuario.tipo === 'free') {
      return <Badge variant="outline">Gratuito</Badge>;
    }

    const plano = planos.find(p => p.codigoHotmart === usuario.plano_id);
    return plano ? (
      <Badge variant="secondary">
        {plano.name} - {plano.periodo}
      </Badge>
    ) : <Badge variant="outline">Sem plano</Badge>;
  };

  // Função para formatar a data
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    try {
      return format(new Date(dateString), "dd/MM/yyyy", { locale: pt });
    } catch (error) {
      return "Data inválida";
    }
  };

  return (
    <AdminLayout>
      <Helmet>
        <title>Gerenciar Usuários - Painel Administrativo</title>
      </Helmet>
      
      <div className="space-y-4">
        <PageHeader 
          title="Gerenciar Usuários" 
          description="Visualize e gerencie todos os usuários da plataforma" 
        />

        {/* Barra de pesquisa */}
        <div className="relative w-full md:w-96 mb-4">
          <Input
            placeholder="Buscar usuários..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
        </div>
      
        {/* Tabela de usuários */}
        <div className="bg-white rounded-md shadow">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingUsers ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6">
                    Carregando usuários...
                  </TableCell>
                </TableRow>
              ) : filteredUsuarios.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6">
                    {searchTerm ? "Nenhum usuário encontrado com este termo de pesquisa." : "Nenhum usuário cadastrado."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsuarios.map((usuario) => (
                  <TableRow key={usuario.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex justify-center items-center w-8 h-8 rounded-full bg-gray-100">
                          <User size={16} />
                        </div>
                        <div>
                          <span className="font-medium">{usuario.username}</span>
                          {usuario.isAdmin && (
                            <Badge className="ml-2 bg-blue-500">Admin</Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{usuario.email}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={usuario.tipo === 'premium' ? 'default' : 'outline'}
                        className={usuario.tipo === 'premium' ? 'bg-blue-500' : ''}
                      >
                        {usuario.tipo === 'premium' ? 'Premium' : 'Free'}
                      </Badge>
                    </TableCell>
                    <TableCell>{renderPlanoInfo(usuario)}</TableCell>
                    <TableCell>{formatDate(usuario.data_vencimento)}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${usuario.active ? 'bg-green-500' : 'bg-gray-300'}`} />
                        <span>{usuario.active ? 'Ativo' : 'Inativo'}</span>
                        <Switch 
                          checked={usuario.active}
                          onCheckedChange={() => handleToggleActive(usuario)}
                          className="ml-2"
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditClick(usuario)}
                        className="mr-1"
                      >
                        <Edit2 size={16} className="text-blue-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClick(usuario)}
                      >
                        <Trash2 size={16} className="text-red-600" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Modal de edição */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
            <DialogDescription>
              Atualize as informações do usuário {selectedUser?.username}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="username">Nome de Usuário</Label>
              <Input 
                id="username"
                value={editFormData.username}
                onChange={(e) => setEditFormData({ ...editFormData, username: e.target.value })}
                placeholder="Nome de usuário"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input 
                id="email"
                type="email"
                value={editFormData.email}
                onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                placeholder="E-mail"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo de Usuário</Label>
              <select
                id="tipo"
                value={editFormData.tipo}
                onChange={(e) => setEditFormData({ ...editFormData, tipo: e.target.value as 'free' | 'premium' })}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="free">Free</option>
                <option value="premium">Premium</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="plano_id">Plano</Label>
              <select
                id="plano_id"
                value={editFormData.plano_id}
                onChange={(e) => setEditFormData({ ...editFormData, plano_id: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md"
                disabled={editFormData.tipo !== 'premium'}
              >
                <option value="">Selecione um plano</option>
                {planos.map(plano => (
                  <option key={plano.id} value={plano.codigoHotmart}>
                    {plano.name} - {plano.periodo} ({plano.valor})
                  </option>
                ))}
              </select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="data_vencimento">Data de Vencimento</Label>
              <Input 
                id="data_vencimento"
                type="date"
                value={editFormData.data_vencimento}
                onChange={(e) => setEditFormData({ ...editFormData, data_vencimento: e.target.value })}
                disabled={editFormData.tipo !== 'premium'}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch 
                id="active"
                checked={editFormData.active}
                onCheckedChange={(checked) => setEditFormData({ ...editFormData, active: checked })}
              />
              <Label htmlFor="active">Assinatura Ativa</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch 
                id="isAdmin"
                checked={editFormData.isAdmin}
                onCheckedChange={(checked) => setEditFormData({ ...editFormData, isAdmin: checked })}
              />
              <Label htmlFor="isAdmin">Administrador</Label>
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button 
              type="button" 
              onClick={handleSaveUser}
              disabled={updateUserMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {updateUserMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Alert dialog para confirmar exclusão */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o usuário "{selectedUser?.username}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteUser}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteUserMutation.isPending ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}