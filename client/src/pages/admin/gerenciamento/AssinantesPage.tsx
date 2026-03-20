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
import { CreditCard, Edit2, Key, MessageSquare, Search, Shield, Trash2, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

// Interface para o tipo de usuário com os novos campos
interface Assinante {
  id: number;
  username: string;
  email: string;
  isAdmin: boolean;
  createdAt: string;
  tipo: 'premium';
  plano_id: string;
  data_vencimento: string;
  active: boolean;
  telefone?: string;
}

// Interface para o plano
interface Plano {
  id: number;
  name: string;
  periodo: string;
  valor: string;
  codigoHotmart: string;
}

export default function AssinantesPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedAssinante, setSelectedAssinante] = useState<Assinante | null>(null);
  const [editFormData, setEditFormData] = useState({
    username: "",
    email: "",
    tipo: "premium" as 'free' | 'premium',
    plano_id: "",
    data_vencimento: "",
    active: true,
    telefone: ""
  });
  
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false);

  // Buscar todos os assinantes (usuários premium ativos)
  const { data: assinantes = [], isLoading: isLoadingAssinantes } = useQuery<Assinante[]>({
    queryKey: ['/api/admin/assinantes'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/assinantes');
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

  // Mutation para atualizar assinante
  const updateAssinanteMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: Partial<typeof editFormData> }) => {
      const response = await apiRequest('PATCH', `/api/admin/assinantes/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      // Invalidar cache de assinantes e usuários para manter consistência entre as telas
      queryClient.invalidateQueries({ queryKey: ['/api/admin/assinantes'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/usuarios'] });
      setIsEditDialogOpen(false);
      toast({
        title: "Assinante atualizado",
        description: "Os dados do assinante foram atualizados com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar assinante",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Mutation para remover assinatura (rebaixar para free)
  const cancelarAssinaturaMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('PATCH', `/api/admin/assinantes/${id}/cancel`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/assinantes'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/usuarios'] });
      setIsDeleteDialogOpen(false);
      setSelectedAssinante(null);
      toast({
        title: "Assinatura cancelada",
        description: "A assinatura foi cancelada com sucesso. O usuário agora é free.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao cancelar assinatura",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Função para alternar o status de ativo/inativo
  const toggleActiveStatusMutation = useMutation({
    mutationFn: async ({ id, active }: { id: number, active: boolean }) => {
      const response = await apiRequest('PATCH', `/api/admin/assinantes/${id}/toggle-active`, { active });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/assinantes'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/usuarios'] });
      toast({
        title: "Status atualizado",
        description: "O status da assinatura foi atualizado com sucesso.",
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

  // Mutation para redefinir a senha do assinante
  const resetPasswordMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('PATCH', `/api/admin/assinantes/${id}/reset-password`, {
        newPassword: "estetica@123"
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/assinantes'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/usuarios'] });
      setIsResetPasswordDialogOpen(false);
      toast({
        title: "Senha redefinida",
        description: "A senha do assinante foi redefinida para 'estetica@123'.",
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
  const handleEditClick = (assinante: Assinante) => {
    setSelectedAssinante(assinante);
    setEditFormData({
      username: assinante.username,
      email: assinante.email,
      tipo: assinante.tipo || "premium",
      plano_id: assinante.plano_id || "",
      data_vencimento: assinante.data_vencimento ? new Date(assinante.data_vencimento).toISOString().substring(0, 10) : "",
      active: assinante.active,
      telefone: assinante.telefone || ""
    });
    setIsEditDialogOpen(true);
  };
  
  // Função para lidar com a abertura do modal de redefinição de senha
  const handleResetPasswordClick = (assinante: Assinante) => {
    setSelectedAssinante(assinante);
    setIsResetPasswordDialogOpen(true);
  };

  // Função para lidar com a abertura do modal de cancelamento
  const handleCancelClick = (assinante: Assinante) => {
    setSelectedAssinante(assinante);
    setIsDeleteDialogOpen(true);
  };

  // Função para salvar as alterações no assinante
  const handleSaveAssinante = () => {
    if (!selectedAssinante) return;
    
    updateAssinanteMutation.mutate({
      id: selectedAssinante.id,
      data: editFormData
    });
  };

  // Função para cancelar a assinatura
  const handleCancelAssinatura = () => {
    if (!selectedAssinante) return;
    
    cancelarAssinaturaMutation.mutate(selectedAssinante.id);
  };

  // Função para alternar o status de ativo/inativo
  const handleToggleActive = (assinante: Assinante) => {
    toggleActiveStatusMutation.mutate({
      id: assinante.id,
      active: !assinante.active
    });
  };

  // Função para abrir WhatsApp
  const handleWhatsAppClick = (telefone: string) => {
    if (!telefone) {
      toast({
        title: "Telefone não cadastrado",
        description: "Este assinante não possui um número de telefone cadastrado.",
        variant: "destructive"
      });
      return;
    }
    
    // Remover caracteres não-numéricos
    const numeroLimpo = telefone.replace(/\D/g, '');
    
    // Abrir o WhatsApp com o número
    window.open(`https://wa.me/55${numeroLimpo}`, '_blank');
  };

  // Filtrar assinantes com base no termo de pesquisa
  const filteredAssinantes = assinantes.filter(assinante => 
    assinante.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    assinante.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Função para obter informações do plano
  const getPlanoInfo = (planoId: string) => {
    if (!planoId) return "Plano não definido";
    const plano = planos.find(p => p.id.toString() === planoId);
    return plano ? `${plano.name} (${plano.periodo} - ${plano.valor})` : "Plano desconhecido";
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

  // Função para calcular dias até o vencimento
  const getDaysToExpire = (dateString: string | null) => {
    if (!dateString) return null;
    
    try {
      const expiryDate = new Date(dateString);
      const today = new Date();
      const diffTime = expiryDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      return diffDays;
    } catch (error) {
      return null;
    }
  };

  // Função para renderizar o status de vencimento
  const renderVencimentoStatus = (assinante: Assinante) => {
    if (!assinante.data_vencimento) return <Badge variant="outline">Sem data</Badge>;
    
    const daysToExpire = getDaysToExpire(assinante.data_vencimento);
    
    if (daysToExpire === null) return <Badge variant="outline">Data inválida</Badge>;
    
    if (daysToExpire < 0) {
      return <Badge variant="destructive">Vencido há {Math.abs(daysToExpire)} dias</Badge>;
    } else if (daysToExpire === 0) {
      return <Badge variant="destructive">Vence hoje</Badge>;
    } else if (daysToExpire <= 7) {
      return <Badge variant="outline" className="bg-yellow-500 border-yellow-600 text-yellow-900">Vence em {daysToExpire} dias</Badge>;
    } else {
      return <Badge variant="default" className="bg-green-600">Vence em {daysToExpire} dias</Badge>;
    }
  };

  return (
    <AdminLayout>
      <Helmet>
        <title>Gerenciar Assinantes - Painel Administrativo</title>
      </Helmet>
      
      <div className="space-y-4">
        <PageHeader 
          title="Gerenciar Assinantes" 
          description="Visualize e gerencie todos os assinantes premium da plataforma" 
        />

        {/* Barra de pesquisa */}
        <div className="relative w-full md:w-96 mb-4">
          <Input
            placeholder="Buscar assinantes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
        </div>
      
        {/* Tabela de assinantes */}
        <div className="bg-card rounded-md shadow">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingAssinantes ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6">
                    Carregando assinantes...
                  </TableCell>
                </TableRow>
              ) : filteredAssinantes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6">
                    {searchTerm ? "Nenhum assinante encontrado com este termo de pesquisa." : "Nenhum assinante cadastrado."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredAssinantes.map((assinante) => (
                  <TableRow key={assinante.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex justify-center items-center w-8 h-8 rounded-full bg-blue-100">
                          <CreditCard size={16} className="text-blue-600" />
                        </div>
                        <div>
                          <span className="font-medium">{assinante.username}</span>
                          {assinante.isAdmin && (
                            <Badge className="ml-2 bg-blue-500">Admin</Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{assinante.email}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-300">
                        {getPlanoInfo(assinante.plano_id)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm">{formatDate(assinante.data_vencimento)}</span>
                        <span className="mt-1">{renderVencimentoStatus(assinante)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${assinante.active ? 'bg-green-500' : 'bg-gray-300'}`} />
                        <span>{assinante.active ? 'Ativo' : 'Inativo'}</span>
                        <Switch 
                          checked={assinante.active}
                          onCheckedChange={() => handleToggleActive(assinante)}
                          className="ml-2"
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditClick(assinante)}
                        className="mr-1"
                        title="Editar assinante"
                      >
                        <Edit2 size={16} className="text-blue-600" />
                      </Button>
                      
                      {assinante.telefone && (
                        <a 
                          href={`https://wa.me/${assinante.telefone.replace(/\D/g, '')}`} 
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
                        onClick={() => handleResetPasswordClick(assinante)}
                        className="mr-1"
                        title="Redefinir senha"
                      >
                        <Key size={16} className="text-yellow-600" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCancelClick(assinante)}
                        title="Cancelar assinatura"
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
            <DialogTitle>Editar Assinante</DialogTitle>
            <DialogDescription>
              Atualize as informações da assinatura de {selectedAssinante?.username}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="username">Nome do Usuário</Label>
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
              <Label htmlFor="tipo">Tipo de usuário</Label>
              <div className="flex flex-col space-y-2">
                <select
                  id="tipo"
                  value={editFormData.tipo}
                  onChange={(e) => setEditFormData({ ...editFormData, tipo: e.target.value as 'free' | 'premium' })}
                  className="w-full p-2 border border-border rounded-md"
                >
                  <option value="free">Free</option>
                  <option value="premium">Premium</option>
                </select>
                {editFormData.tipo === 'free' && (
                  <div className="text-sm text-yellow-600 bg-yellow-50 p-2 rounded border border-yellow-200">
                    <strong>Atenção:</strong> Alterar para "Free" removerá o acesso premium e a assinatura.
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="plano_id" className={editFormData.tipo === 'free' ? 'text-gray-400' : ''}>
                Plano {editFormData.tipo === 'free' && <span className="text-xs italic">(indisponível para usuários Free)</span>}
              </Label>
              <select
                id="plano_id"
                value={editFormData.tipo === 'free' ? '' : editFormData.plano_id}
                onChange={(e) => setEditFormData({ ...editFormData, plano_id: e.target.value })}
                className={`w-full p-2 border ${editFormData.tipo === 'free' ? 'bg-muted text-gray-400 border-border' : 'border-border'} rounded-md`}
                disabled={editFormData.tipo === 'free'}
              >
                <option value="">Selecione um plano</option>
                {planos.map(plano => (
                  <option key={plano.id} value={plano.id}>
                    {plano.name} - {plano.periodo} ({plano.valor})
                  </option>
                ))}
              </select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="data_vencimento" className={editFormData.tipo === 'free' ? 'text-gray-400' : ''}>
                Data de Vencimento {editFormData.tipo === 'free' && <span className="text-xs italic">(indisponível para usuários Free)</span>}
              </Label>
              <Input 
                id="data_vencimento"
                type="date"
                value={editFormData.tipo === 'free' ? '' : editFormData.data_vencimento}
                onChange={(e) => setEditFormData({ ...editFormData, data_vencimento: e.target.value })}
                className={editFormData.tipo === 'free' ? 'bg-muted text-gray-400 border-border' : ''}
                disabled={editFormData.tipo === 'free'}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone (com DDD)</Label>
              <Input 
                id="telefone"
                type="tel"
                value={editFormData.telefone}
                onChange={(e) => setEditFormData({ ...editFormData, telefone: e.target.value })}
                placeholder="(00) 00000-0000"
              />
            </div>
            
            {editFormData.tipo === 'premium' && (
              <div className="flex items-center space-x-2">
                <Switch 
                  id="active"
                  checked={editFormData.active}
                  onCheckedChange={(checked) => setEditFormData({ ...editFormData, active: checked })}
                />
                <Label htmlFor="active">Assinatura Ativa</Label>
              </div>
            )}
            {editFormData.tipo === 'free' && (
              <div className="p-2 bg-muted rounded border border-border text-muted-foreground text-sm">
                Status de assinatura não aplicável para usuários Free
              </div>
            )}
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
              onClick={handleSaveAssinante}
              disabled={updateAssinanteMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {updateAssinanteMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Alert dialog para confirmar cancelamento de assinatura */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar cancelamento de assinatura</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja cancelar a assinatura premium de "{selectedAssinante?.username}"? 
              O usuário será rebaixado para o tipo "free" e perderá acesso aos conteúdos premium.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleCancelAssinatura}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {cancelarAssinaturaMutation.isPending ? "Cancelando..." : "Cancelar Assinatura"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Alert dialog para confirmar redefinição de senha */}
      <AlertDialog open={isResetPasswordDialogOpen} onOpenChange={setIsResetPasswordDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Redefinir senha do assinante</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja redefinir a senha do assinante "{selectedAssinante?.username}"?
              A nova senha será "estetica@123".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => selectedAssinante && resetPasswordMutation.mutate(selectedAssinante.id)}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              {resetPasswordMutation.isPending ? "Redefinindo..." : "Redefinir Senha"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}