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
import { Edit2, KeyRound, Phone, Plus, Search, Shield, Trash2, User } from "lucide-react";
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
  telefone?: string | null;
  isAdmin: boolean;
  createdAt: string;
  tipo: 'free' | 'premium';
  plano_id: string | null;
  data_vencimento: string | null;
  active: boolean;
}

// Interface para o plano do Hotmart
interface HotmartPlano {
  id: string;
  name: string;
  periodo: string;
  valor: string;
  description: string;
}

// Interface para o plano administrativo (para compatibilidade)
interface Plano {
  id: number;
  name: string;
  periodo: string;
  valor: string;
  codigoHotmart: string;
  codigo_hotmart?: string;
}

export default function UsuariosPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false);
  const [selectedUsuario, setSelectedUsuario] = useState<Usuario | null>(null);
  const [editFormData, setEditFormData] = useState({
    username: "",
    email: "",
    telefone: "",
    isAdmin: false,
    tipo: "free" as 'free' | 'premium',
    plano_id: "",
    data_vencimento: "",
    active: true
  });

  const [createFormData, setCreateFormData] = useState({
    username: "",
    email: "",
    password: "",
    telefone: "",
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

  // Buscar planos específicos do Hotmart para criação de usuários
  const { data: hotmartPlanos = [], isLoading: isLoadingPlanos } = useQuery<HotmartPlano[]>({
    queryKey: ['/api/admin/hotmart-plans'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/hotmart-plans');
      const data = await response.json();
      console.log('Planos do Hotmart recebidos:', data);
      return data;
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

  // Mutation para criar usuário
  const createUsuarioMutation = useMutation({
    mutationFn: async (data: typeof createFormData) => {
      // Validar se usuário premium tem plano selecionado
      if (data.tipo === 'premium' && !data.plano_id) {
        throw new Error('Usuários premium devem ter um plano do Hotmart selecionado');
      }
      
      const response = await apiRequest('POST', '/api/admin/usuarios', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/usuarios'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/assinantes'] });
      setIsCreateDialogOpen(false);
      setCreateFormData({
        username: "",
        email: "",
        password: "",
        telefone: "",
        isAdmin: false,
        tipo: "free",
        plano_id: "",
        data_vencimento: "",
        active: true
      });
      toast({
        title: "Usuário criado",
        description: "O novo usuário foi criado com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar usuário",
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
      telefone: usuario.telefone || "",
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
    
    // Buscar o plano nos dados reais do Hotmart
    const plano = hotmartPlanos.find(p => p.id === usuario.plano_id);
    
    if (!plano) {
      // Fallback para planos conhecidos do webhook
      const planName = usuario.plano_id === 'mensal' ? 'Plano Mensal Premium' : 
                      usuario.plano_id === 'anual' ? 'Plano Anual Premium' : 
                      `Plano ${usuario.plano_id}`;
      
      return (
        <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-300">
          {planName}
        </Badge>
      );
    }
    
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

        {/* Barra de pesquisa e botão criar */}
        <div className="flex justify-between items-center mb-4">
          <div className="relative w-full md:w-96">
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
          <Button 
            onClick={() => setIsCreateDialogOpen(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Criar Novo Usuário
          </Button>
        </div>
      
        {/* Tabela de usuários */}
        <div className="bg-white rounded-md shadow">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingUsuarios ? (
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
                      {usuario.telefone ? (
                        <div className="flex items-center gap-1">
                          <Phone size={14} className="text-gray-500" />
                          <span>{usuario.telefone}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">Não informado</span>
                      )}
                    </TableCell>
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
                      {usuario.telefone && (
                        <a 
                          href={`https://wa.me/${usuario.telefone.replace(/\D/g, '')}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-block"
                        >
                          <Button
                            variant="ghost"
                            size="sm"
                            className="mr-1"
                            title="Contatar via WhatsApp"
                          >
                            <svg 
                              viewBox="0 0 24 24" 
                              className="w-4 h-4 text-green-600" 
                              fill="currentColor"
                            >
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                            </svg>
                          </Button>
                        </a>
                      )}
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
            
            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone (WhatsApp)</Label>
              <Input 
                id="telefone"
                type="tel"
                placeholder="(99) 99999-9999"
                value={editFormData.telefone}
                onChange={(e) => setEditFormData({ ...editFormData, telefone: e.target.value })}
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
                    {hotmartPlanos.map(plano => (
                      <option key={plano.id} value={plano.id}>
                        {plano.name} - {plano.periodo} - R$ {plano.valor}
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

      {/* Dialog para criar usuário */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Criar Novo Usuário</DialogTitle>
            <DialogDescription>
              Preencha os dados para criar um novo usuário na plataforma.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create-username">Nome de usuário</Label>
                <Input
                  id="create-username"
                  value={createFormData.username}
                  onChange={(e) => setCreateFormData(prev => ({ ...prev, username: e.target.value }))}
                  placeholder="Digite o nome do usuário"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-email">E-mail</Label>
                <Input
                  id="create-email"
                  type="email"
                  value={createFormData.email}
                  onChange={(e) => setCreateFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Digite o e-mail"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create-password">Senha</Label>
                <Input
                  id="create-password"
                  type="password"
                  value={createFormData.password}
                  onChange={(e) => setCreateFormData(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Digite a senha"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-telefone">Telefone</Label>
                <Input
                  id="create-telefone"
                  value={createFormData.telefone}
                  onChange={(e) => setCreateFormData(prev => ({ ...prev, telefone: e.target.value }))}
                  placeholder="Digite o telefone"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create-tipo">Tipo de usuário</Label>
                <select 
                  id="create-tipo"
                  value={createFormData.tipo}
                  onChange={(e) => setCreateFormData(prev => ({ ...prev, tipo: e.target.value as 'free' | 'premium' }))}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="free">Gratuito</option>
                  <option value="premium">Premium</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-plano">Plano</Label>
                <select 
                  id="create-plano"
                  value={createFormData.plano_id}
                  onChange={(e) => setCreateFormData(prev => ({ ...prev, plano_id: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  disabled={createFormData.tipo !== 'premium'}
                >
                  <option value="">Selecione um plano</option>
                  {hotmartPlanos.map(plano => (
                    <option key={plano.id} value={plano.id}>
                      {plano.name} - {plano.periodo} - R$ {plano.valor}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="create-admin"
                checked={createFormData.isAdmin}
                onCheckedChange={(checked) => setCreateFormData(prev => ({ ...prev, isAdmin: checked }))}
              />
              <Label htmlFor="create-admin">Usuário administrador</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="create-active"
                checked={createFormData.active}
                onCheckedChange={(checked) => setCreateFormData(prev => ({ ...prev, active: checked }))}
              />
              <Label htmlFor="create-active">Usuário ativo</Label>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsCreateDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button 
              onClick={() => createUsuarioMutation.mutate(createFormData)}
              disabled={
                createUsuarioMutation.isPending || 
                !createFormData.username || 
                !createFormData.email || 
                !createFormData.password ||
                (createFormData.tipo === 'premium' && !createFormData.plano_id)
              }
            >
              {createUsuarioMutation.isPending ? "Criando..." : "Criar Usuário"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}