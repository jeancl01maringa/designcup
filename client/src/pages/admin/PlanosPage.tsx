import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/layout/AdminLayout";
import { PageHeader } from "@/components/admin/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, Star, BadgeCheck, CreditCard, Link as LinkIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

// Tipo para planos
interface Plan {
  id: number;
  name: string;
  periodo: string;
  valor: string;
  isActive: boolean;
  isPrincipal: boolean;
  isGratuito: boolean;
  codigoHotmart: string | null;
  urlHotmart: string | null;
  beneficios: string | null;
  itensRestritos?: string | null;
  createdAt: string;
}

// Tipo para criar/editar plano
interface PlanInput {
  name: string;
  periodo: string;
  valor: string;
  isActive: boolean;
  isPrincipal: boolean;
  isGratuito: boolean;
  codigoHotmart: string | null;
  urlHotmart: string | null;
  beneficios: string | null;
  itensRestritos?: string | null;
}

export default function PlanosPage() {
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<Plan | null>(null);
  const [formData, setFormData] = useState<PlanInput>({
    name: '',
    periodo: 'Mensal',
    valor: '',
    isActive: true,
    isPrincipal: false,
    isGratuito: false,
    codigoHotmart: '',
    urlHotmart: '',
    beneficios: '',
    itensRestritos: '',
  });

  // Buscar planos
  const { data: plans, isLoading } = useQuery<Plan[]>({
    queryKey: ['/api/admin/plans'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/plans?showInactive=true');
      return response.json();
    }
  });

  // Mutation para criar plano
  const createMutation = useMutation({
    mutationFn: async (data: PlanInput) => {
      const response = await apiRequest('POST', '/api/admin/plans', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/plans'] });
      setIsCreateOpen(false);
      resetForm();
      toast({
        title: 'Plano criado',
        description: 'O plano foi criado com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao criar plano',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // Mutation para atualizar plano
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: PlanInput }) => {
      const response = await apiRequest('PUT', `/api/admin/plans/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/plans'] });
      setIsEditOpen(false);
      resetForm();
      toast({
        title: 'Plano atualizado',
        description: 'O plano foi atualizado com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao atualizar plano',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // Mutation para excluir plano
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/admin/plans/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/plans'] });
      setIsDeleteOpen(false);
      setCurrentPlan(null);
      toast({
        title: 'Plano excluído',
        description: 'O plano foi excluído com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao excluir plano',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // Mutation para atualizar status
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number, isActive: boolean }) => {
      const response = await apiRequest('PATCH', `/api/admin/plans/${id}/toggle`, { isActive });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/plans'] });
      toast({
        title: 'Status atualizado',
        description: 'O status do plano foi atualizado com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao atualizar status',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Garantir que plano gratuito tenha valor zero
    let submittedData = { ...formData };
    if (submittedData.isGratuito) {
      submittedData.valor = "0,00";
    }
    
    if (isEditOpen && currentPlan) {
      updateMutation.mutate({ id: currentPlan.id, data: submittedData });
    } else {
      createMutation.mutate(submittedData);
    }
  };

  const handleToggleStatus = (plan: Plan) => {
    toggleStatusMutation.mutate({
      id: plan.id,
      isActive: !plan.isActive
    });
  };

  const handleEditClick = (plan: Plan) => {
    setCurrentPlan(plan);
    setFormData({
      name: plan.name,
      periodo: plan.periodo,
      valor: plan.valor,
      isActive: plan.isActive,
      isPrincipal: plan.isPrincipal,
      isGratuito: plan.isGratuito,
      codigoHotmart: plan.codigoHotmart,
      urlHotmart: plan.urlHotmart,
      beneficios: plan.beneficios,
      itensRestritos: plan.itensRestritos || '',
    });
    setIsEditOpen(true);
  };

  const handleDeleteClick = (plan: Plan) => {
    setCurrentPlan(plan);
    setIsDeleteOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      periodo: 'Mensal',
      valor: '',
      isActive: true,
      isPrincipal: false,
      isGratuito: false,
      codigoHotmart: '',
      urlHotmart: '',
      beneficios: '',
      itensRestritos: '',
    });
    setCurrentPlan(null);
  };

  const renderPlanBadges = (plan: Plan) => {
    return (
      <div className="flex flex-wrap gap-1">
        {plan.isPrincipal && (
          <Badge className="bg-amber-500">
            <Star className="h-3 w-3 mr-1" /> Principal
          </Badge>
        )}
        {plan.isGratuito && (
          <Badge className="bg-green-500">
            <BadgeCheck className="h-3 w-3 mr-1" /> Gratuito
          </Badge>
        )}
      </div>
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <PageHeader 
            title="Planos" 
            description="Gerencie os planos disponíveis para seus clientes" 
          />
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" /> Novo Plano
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Adicionar Plano</DialogTitle>
                <DialogDescription>
                  Preencha os campos abaixo para adicionar um novo plano.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                {/* Dados básicos do plano */}
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Plano</Label>
                  <Input 
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Básico, Premium, Pro"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="periodo">Período</Label>
                  <Select 
                    value={formData.periodo} 
                    onValueChange={(value) => setFormData({ ...formData, periodo: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o período" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Mensal">Mensal</SelectItem>
                      <SelectItem value="Trimestral">Trimestral</SelectItem>
                      <SelectItem value="Semestral">Semestral</SelectItem>
                      <SelectItem value="Anual">Anual</SelectItem>
                      <SelectItem value="Vitalício">Vitalício</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="valor">Valor</Label>
                  <Input 
                    id="valor"
                    value={formData.valor}
                    onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                    placeholder="Ex: 49,90"
                    required
                    disabled={formData.isGratuito}
                  />
                </div>

                {/* Configurações */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="isActive"
                      checked={formData.isActive}
                      onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                    />
                    <Label htmlFor="isActive">Ativo</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="isPrincipal"
                      checked={formData.isPrincipal}
                      onCheckedChange={(checked) => setFormData({ ...formData, isPrincipal: checked })}
                    />
                    <Label htmlFor="isPrincipal">Plano Principal</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="isGratuito"
                      checked={formData.isGratuito}
                      onCheckedChange={(checked) => {
                        const newFormData = { ...formData, isGratuito: checked };
                        if (checked) {
                          newFormData.valor = "0,00";
                        }
                        setFormData(newFormData);
                      }}
                    />
                    <Label htmlFor="isGratuito">Plano Gratuito</Label>
                  </div>
                </div>

                {/* Dados da Hotmart */}
                <div className="space-y-2">
                  <Label htmlFor="codigoHotmart">Código Hotmart (opcional)</Label>
                  <Input 
                    id="codigoHotmart"
                    value={formData.codigoHotmart || ''}
                    onChange={(e) => setFormData({ ...formData, codigoHotmart: e.target.value })}
                    placeholder="Código do produto na Hotmart"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="urlHotmart">URL de Checkout (opcional)</Label>
                  <Input 
                    id="urlHotmart"
                    value={formData.urlHotmart || ''}
                    onChange={(e) => setFormData({ ...formData, urlHotmart: e.target.value })}
                    placeholder="URL de checkout da Hotmart"
                  />
                </div>

                {/* Benefícios do plano */}
                <div className="space-y-2">
                  <Label htmlFor="beneficios">Benefícios (um por linha)</Label>
                  <Textarea 
                    id="beneficios"
                    value={formData.beneficios || ''}
                    onChange={(e) => setFormData({ ...formData, beneficios: e.target.value })}
                    placeholder="Ex:&#10;Acesso a todos os templates&#10;Suporte prioritário&#10;Atualizações ilimitadas"
                    rows={4}
                  />
                </div>

                {/* Itens restritos (para mostrar limitações) */}
                <div className="space-y-2">
                  <Label htmlFor="itensRestritos">Itens Restritos (um por linha)</Label>
                  <Textarea 
                    id="itensRestritos"
                    value={formData.itensRestritos || ''}
                    onChange={(e) => setFormData({ ...formData, itensRestritos: e.target.value })}
                    placeholder="Ex:&#10;Downloads Ilimitados&#10;Modelos Premium&#10;Suporte individual"
                    rows={3}
                  />
                  <p className="text-xs text-gray-500">
                    Itens que o usuário NÃO terá acesso (aparecerão riscados na página de planos)
                  </p>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                    Salvar
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Tabela de planos */}
        <div className="bg-white rounded-md shadow">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Período</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6">
                    Carregando planos...
                  </TableCell>
                </TableRow>
              ) : plans && plans.length > 0 ? (
                plans.map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell className="font-medium">{plan.name}</TableCell>
                    <TableCell>{plan.periodo}</TableCell>
                    <TableCell>{plan.isGratuito ? "Gratuito" : plan.valor}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${plan.isActive ? 'bg-green-500' : 'bg-gray-300'}`} />
                        <span>{plan.isActive ? 'Ativo' : 'Desativado'}</span>
                        <Switch 
                          checked={plan.isActive}
                          onCheckedChange={() => handleToggleStatus(plan)}
                          className="ml-2"
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      {renderPlanBadges(plan)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditClick(plan)}
                        className="mr-1"
                      >
                        <Pencil size={16} className="text-blue-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClick(plan)}
                      >
                        <Trash2 size={16} className="text-red-600" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6">
                    Nenhum plano encontrado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Modal de edição */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Plano</DialogTitle>
            <DialogDescription>
              Atualize as informações do plano.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            {/* Dados básicos do plano */}
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nome do Plano</Label>
              <Input 
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Básico, Premium, Pro"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-periodo">Período</Label>
              <Select 
                value={formData.periodo} 
                onValueChange={(value) => setFormData({ ...formData, periodo: value })}
              >
                <SelectTrigger id="edit-periodo">
                  <SelectValue placeholder="Selecione o período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Mensal">Mensal</SelectItem>
                  <SelectItem value="Trimestral">Trimestral</SelectItem>
                  <SelectItem value="Semestral">Semestral</SelectItem>
                  <SelectItem value="Anual">Anual</SelectItem>
                  <SelectItem value="Vitalício">Vitalício</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-valor">Valor</Label>
              <Input 
                id="edit-valor"
                value={formData.valor}
                onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                placeholder="Ex: 49,90"
                required
                disabled={formData.isGratuito}
              />
            </div>

            {/* Configurações */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center space-x-2">
                <Switch 
                  id="edit-isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
                <Label htmlFor="edit-isActive">Ativo</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch 
                  id="edit-isPrincipal"
                  checked={formData.isPrincipal}
                  onCheckedChange={(checked) => setFormData({ ...formData, isPrincipal: checked })}
                />
                <Label htmlFor="edit-isPrincipal">Plano Principal</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch 
                  id="edit-isGratuito"
                  checked={formData.isGratuito}
                  onCheckedChange={(checked) => {
                    const newFormData = { ...formData, isGratuito: checked };
                    if (checked) {
                      newFormData.valor = "0,00";
                    }
                    setFormData(newFormData);
                  }}
                />
                <Label htmlFor="edit-isGratuito">Plano Gratuito</Label>
              </div>
            </div>

            {/* Dados da Hotmart */}
            <div className="space-y-2">
              <Label htmlFor="edit-codigoHotmart">Código Hotmart (opcional)</Label>
              <Input 
                id="edit-codigoHotmart"
                value={formData.codigoHotmart || ''}
                onChange={(e) => setFormData({ ...formData, codigoHotmart: e.target.value })}
                placeholder="Código do produto na Hotmart"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-urlHotmart">URL de Checkout (opcional)</Label>
              <Input 
                id="edit-urlHotmart"
                value={formData.urlHotmart || ''}
                onChange={(e) => setFormData({ ...formData, urlHotmart: e.target.value })}
                placeholder="URL de checkout da Hotmart"
              />
            </div>

            {/* Benefícios do plano */}
            <div className="space-y-2">
              <Label htmlFor="edit-beneficios">Benefícios (um por linha)</Label>
              <Textarea 
                id="edit-beneficios"
                value={formData.beneficios || ''}
                onChange={(e) => setFormData({ ...formData, beneficios: e.target.value })}
                placeholder="Ex:&#10;Acesso a todos os templates&#10;Suporte prioritário&#10;Atualizações ilimitadas"
                rows={4}
              />
            </div>

            {/* Itens restritos (para mostrar limitações) */}
            <div className="space-y-2">
              <Label htmlFor="edit-itensRestritos">Itens Restritos (um por linha)</Label>
              <Textarea 
                id="edit-itensRestritos"
                value={formData.itensRestritos || ''}
                onChange={(e) => setFormData({ ...formData, itensRestritos: e.target.value })}
                placeholder="Ex:&#10;Downloads Ilimitados&#10;Modelos Premium&#10;Suporte individual"
                rows={3}
              />
              <p className="text-xs text-gray-500">
                Itens que o usuário NÃO terá acesso (aparecerão riscados na página de planos)
              </p>
            </div>

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setIsEditOpen(false);
                  resetForm();
                }}
              >
                Cancelar
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                Salvar Alterações
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Diálogo de confirmação de exclusão */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o plano "{currentPlan?.name}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCurrentPlan(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => currentPlan && deleteMutation.mutate(currentPlan.id)} 
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}