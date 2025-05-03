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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Edit2, KeyRound, Plus, Search, Shield, Trash2, User } from "lucide-react";
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
  codigo_hotmart?: string; // Campo no banco de dados
}

export default function UsuariosPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false);
  const [selectedUsuario, setSelectedUsuario] = useState<Usuario | null>(null);
  const [editFormData, setEditFormData] = useState({
    username: "",
    email: "",
    isAdmin: false,
    tipo: "free" as 'free' | 'premium',
    plano_id: "",
    data_vencimento: "",
    active: true
  });

  // Buscar todos os usuários
  const { data: usuarios = [], isLoading: isLoadingUsuarios } = useQuery<Usuario[]>({
    queryKey: ['/api/admin/usuarios'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/usuarios');
      return response.json();
    },
  });

  // Buscar todos os planos disponíveis
  const { data: planos = [], isLoading: isLoadingPlanos } = useQuery<Plano[]>({
    queryKey: ['/api/admin/planos'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/planos');
      return response.json();
    },
  });

  // Mutation para atualizar usuário
  const updateUsuarioMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: Partial<typeof editFormData> }) => {
      const response = await apiRequest('PATCH', `/api/admin/usuarios/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/usuarios'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/assinantes'] });
      setIsEditDialogOpen(false);
      toast({
        title: "Usuário atualizado",
        description: "As informações do usuário foram atualizadas com sucesso.",
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

  // Mutation para deletar usuário
  const deleteUsuarioMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/admin/usuarios/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/usuarios'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/assinantes'] });
      setIsDeleteDialogOpen(false);
      setSelectedUsuario(null);
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
      queryClient.invalidateQueries({ queryKey: ['/api/admin/assinantes'] });
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
  
  // Mutation para redefinir a senha do usuário
  const resetPasswordMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('PATCH', `/api/admin/usuarios/${id}/reset-password`, {
        newPassword: "estetica@123"
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Senha redefinida",
        description: "A senha do usuário foi redefinida para 'estetica@123'.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao redefinir senha",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Função para lidar com a abertura do modal de edição
  const handleEditClick = (usuario: Usuario) => {
    setSelectedUsuario(usuario);
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
    setSelectedUsuario(usuario);
    setIsDeleteDialogOpen(true);
  };

  // Função para salvar as alterações no usuário
  const handleSaveUsuario = () => {
    if (!selectedUsuario) return;
    
    updateUsuarioMutation.mutate({
      id: selectedUsuario.id,
      data: editFormData
    });
  };

  // Função para excluir o usuário
  const handleConfirmDelete = () => {
    if (!selectedUsuario) return;
    
    deleteUsuarioMutation.mutate(selectedUsuario.id);
  };

  // Função para alternar o status de ativo/inativo
  const handleToggleActive = (usuario: Usuario) => {
    toggleActiveStatusMutation.mutate({
      id: usuario.id,
      active: !usuario.active
    });
  };
  
  // Função para mostrar diálogo de confirmação de redefinição de senha
  const handleResetPasswordClick = (usuario: Usuario) => {
    setSelectedUsuario(usuario);
    setIsResetPasswordDialogOpen(true);
  };
  
  // Função para confirmar e executar a redefinição de senha
  const handleConfirmResetPassword = () => {
    if (!selectedUsuario) return;
    resetPasswordMutation.mutate(selectedUsuario.id);
    setIsResetPasswordDialogOpen(false);
  };

  // Filtrar usuários com base no termo de pesquisa
  const filteredUsuarios = usuarios.filter(usuario => 
    usuario.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    usuario.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Função para renderizar informações do plano
  const renderPlanoInfo = (usuario: Usuario) => {
    if (usuario.tipo !== 'premium' || !usuario.plano_id) {
      return <Badge variant="secondary" className="bg-gray-100 text-gray-600 border-gray-300">Sem plano</Badge>;
    }
    
    // Tenta encontrar o plano primeiro pelo ID, depois pelo código Hotmart (para compatibilidade)
    const planoId = parseInt(usuario.plano_id);
    let plano = planos.find(p => p.id === planoId);
    
    // Se não encontrar pelo ID, tenta pelo código Hotmart para compatibilidade
    if (!plano) {
      plano = planos.find(p => 
        p.codigoHotmart === usuario.plano_id || 
        (p.codigo_hotmart && p.codigo_hotmart === usuario.plano_id)
      );
    }
    
    if (!plano) return <Badge variant="secondary" className="bg-gray-100 text-gray-600 border-gray-300">Plano desconhecido</Badge>;
    
    return (
      <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-300">
        {plano.name} ({plano.periodo})
      </Badge>
    );
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
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingUsuarios ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6">
                    Carregando usuários...
                  </TableCell>
                </TableRow>
              ) : filteredUsuarios.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6">
                    {searchTerm ? "Nenhum usuário encontrado com este termo de pesquisa." : "Nenhum usuário cadastrado."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsuarios.map((usuario) => (
                  <TableRow key={usuario.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex justify-center items-center w-8 h-8 rounded-full bg-blue-100">
                          {usuario.isAdmin ? (
                            <Shield size={16} className="text-blue-600" />
                          ) : (
                            <User size={16} className="text-blue-600" />
                          )}
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
                      <Badge variant={usuario.tipo === 'premium' ? 'default' : 'outline'} className={usuario.tipo === 'premium' ? 'bg-blue-600' : ''}>
                        {usuario.tipo === 'premium' ? 'Premium' : 'Free'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {renderPlanoInfo(usuario)}
                    </TableCell>
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
                        title="Editar usuário"
                      >
                        <Edit2 size={16} className="text-blue-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleResetPasswordClick(usuario)}
                        className="mr-1"
                        title="Redefinir senha para padrão"
                      >
                        <KeyRound size={16} className="text-yellow-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClick(usuario)}
                        title="Excluir usuário"
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
              Atualize as informações do usuário {selectedUsuario?.username}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="username">Nome de usuário</Label>
              <Input 
                id="username"
                type="text"
                value={editFormData.username}
                onChange={(e) => setEditFormData({ ...editFormData, username: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input 
                id="email"
                type="email"
                value={editFormData.email}
                onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch 
                id="isAdmin"
                checked={editFormData.isAdmin}
                onCheckedChange={(checked) => setEditFormData({ ...editFormData, isAdmin: checked })}
              />
              <Label htmlFor="isAdmin">Administrador</Label>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo de usuário</Label>
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
            
            {editFormData.tipo === 'premium' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="plano_id">Plano</Label>
                  <select
                    id="plano_id"
                    value={editFormData.plano_id}
                    onChange={(e) => setEditFormData({ ...editFormData, plano_id: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Selecione um plano</option>
                    {planos.map(plano => (
                      <option key={plano.id} value={plano.id.toString()}>
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
                  />
                </div>
              </>
            )}
            
            <div className="flex items-center space-x-2">
              <Switch 
                id="active"
                checked={editFormData.active}
                onCheckedChange={(checked) => setEditFormData({ ...editFormData, active: checked })}
              />
              <Label htmlFor="active">Usuário Ativo</Label>
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
              onClick={handleSaveUsuario}
              disabled={updateUsuarioMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {updateUsuarioMutation.isPending ? "Salvando..." : "Salvar"}
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
              Tem certeza que deseja excluir o usuário "{selectedUsuario?.username}"? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteUsuarioMutation.isPending ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Alert dialog para confirmar redefinição de senha */}
      <AlertDialog open={isResetPasswordDialogOpen} onOpenChange={setIsResetPasswordDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Redefinir senha</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja redefinir a senha do usuário "{selectedUsuario?.username}" para 'estetica@123'?
              O usuário precisará alterar essa senha no próximo login.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmResetPassword}
              className="bg-yellow-600 text-white hover:bg-yellow-700"
            >
              {resetPasswordMutation.isPending ? "Redefinindo..." : "Redefinir senha"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}