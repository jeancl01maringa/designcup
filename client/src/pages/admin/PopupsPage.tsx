import React, { useState } from "react";
import { AdminLayout } from "@/components/admin/layout/AdminLayout";
import { PageHeader } from "@/components/admin/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  Plus, 
  Upload, 
  Eye, 
  Save, 
  Trash2, 
  Edit, 
  Calendar,
  Settings,
  Users,
  Palette,
  FileText,
  X
} from "lucide-react";

interface PopupFormData {
  // Content
  title: string;
  content: string;
  imageUrl: string;
  buttonText: string;
  buttonUrl: string;
  
  // Appearance
  backgroundColor: string;
  textColor: string;
  buttonColor: string;
  buttonTextColor: string;
  borderRadius: number;
  buttonWidth: 'auto' | 'full';
  animation: 'fade' | 'slide' | 'zoom' | 'bounce';
  position: 'center' | 'top' | 'bottom' | 'left' | 'right';
  size: 'small' | 'medium' | 'large';
  delaySeconds: number;
  
  // Targeting
  targetPages: string[];
  targetUserTypes: string[];
  startDate: string;
  endDate: string;
  frequency: 'always' | 'once_per_session' | 'once_per_day' | 'once_per_week';
  
  // Status
  isActive: boolean;
}

const initialFormData: PopupFormData = {
  title: '',
  content: '',
  imageUrl: '',
  buttonText: '',
  buttonUrl: '',
  backgroundColor: '#ffffff',
  textColor: '#000000',
  buttonColor: '#1f4ed8',
  buttonTextColor: '#ffffff',
  borderRadius: 8,
  buttonWidth: 'auto',
  animation: 'fade',
  position: 'center',
  size: 'medium',
  delaySeconds: 3,
  targetPages: ['all'],
  targetUserTypes: ['all'],
  startDate: '',
  endDate: '',
  frequency: 'once_per_session',
  isActive: false
};

export default function PopupsPage() {
  const [formData, setFormData] = useState<PopupFormData>(initialFormData);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [activeTab, setActiveTab] = useState('content');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createPopupMutation = useMutation({
    mutationFn: async (popupData: any) => {
      const response = await apiRequest('POST', '/api/popups', popupData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Popup criado com sucesso!",
        description: "O popup foi salvo e está pronto para ser ativado.",
      });
      setFormData(initialFormData);
      setImageFile(null);
      setIsCreating(false);
      queryClient.invalidateQueries({ queryKey: ['/api/popups'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar popup",
        description: error.message || "Ocorreu um erro ao salvar o popup.",
        variant: "destructive",
      });
    },
  });

  const handleInputChange = (field: keyof PopupFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.size <= 10 * 1024 * 1024) { // 10MB limit
      setImageFile(file);
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      handleInputChange('imageUrl', previewUrl);
    }
  };

  const handleTargetChange = (field: 'targetPages' | 'targetUserTypes', value: string, checked: boolean) => {
    const currentValues = formData[field];
    if (checked) {
      if (value === 'all') {
        handleInputChange(field, ['all']);
      } else {
        const filtered = currentValues.filter(v => v !== 'all');
        handleInputChange(field, [...filtered, value]);
      }
    } else {
      if (value === 'all') {
        handleInputChange(field, []);
      } else {
        handleInputChange(field, currentValues.filter(v => v !== value));
      }
    }
  };

  const handleSavePopup = async () => {
    if (!formData.title || !formData.content) {
      toast({
        title: "Campos obrigatórios",
        description: "Título e conteúdo são obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    const popupData = {
      title: formData.title,
      content: formData.content,
      imageUrl: formData.imageUrl,
      buttonText: formData.buttonText,
      buttonUrl: formData.buttonUrl,
      backgroundColor: formData.backgroundColor,
      textColor: formData.textColor,
      buttonColor: formData.buttonColor,
      buttonTextColor: formData.buttonTextColor,
      borderRadius: formData.borderRadius,
      buttonWidth: formData.buttonWidth,
      animation: formData.animation,
      position: formData.position,
      size: formData.size,
      delaySeconds: formData.delaySeconds,
      targetPages: formData.targetPages,
      targetUserTypes: formData.targetUserTypes,
      startDate: formData.startDate ? new Date(formData.startDate).toISOString() : null,
      endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null,
      frequency: formData.frequency,
      isActive: formData.isActive
    };

    createPopupMutation.mutate(popupData);
  };

  const [showPreview, setShowPreview] = useState(false);

  const getAnimationClass = () => {
    switch (formData.animation) {
      case 'slide':
        return 'animate-in slide-in-from-bottom-4';
      case 'zoom':
        return 'animate-in zoom-in-95';
      case 'bounce':
        return 'animate-in bounce-in';
      default:
        return 'animate-in fade-in';
    }
  };

  const renderPopupPreview = () => {
    if (!showPreview) return null;

    const sizeClasses = {
      small: 'max-w-sm',
      medium: 'max-w-md',
      large: 'max-w-2xl'
    };

    const positionClasses = {
      center: 'items-center justify-center',
      top: 'items-start justify-center pt-8',
      bottom: 'items-end justify-center pb-8',
      left: 'items-center justify-start pl-8',
      right: 'items-center justify-end pr-8'
    };

    return (
      <div className={`fixed inset-0 bg-black/50 backdrop-blur-sm flex ${positionClasses[formData.position]} z-[60] p-4`}>
        <div 
          className={`${sizeClasses[formData.size]} w-full relative bg-white shadow-2xl ${getAnimationClass()}`}
          style={{
            backgroundColor: formData.backgroundColor,
            color: formData.textColor,
            borderRadius: `${formData.borderRadius}px`,
            animationDuration: '500ms'
          }}
        >
          {/* Close button */}
          <button 
            onClick={() => setShowPreview(false)}
            className="absolute top-4 right-4 p-1 rounded-full bg-black/10 hover:bg-black/20 transition-colors z-10"
            style={{ color: formData.textColor }}
          >
            <X className="h-4 w-4" />
          </button>

          <div className="p-6">
            {/* Image */}
            {formData.imageUrl && (
              <div className="mb-4">
                <img 
                  src={formData.imageUrl} 
                  alt="Popup" 
                  className="w-full h-auto rounded-lg object-cover"
                  style={{ 
                    maxHeight: '300px',
                    borderRadius: `${Math.min(formData.borderRadius, 12)}px`
                  }}
                />
              </div>
            )}

            {/* Title */}
            {formData.title && (
              <h3 className="text-xl font-bold mb-3 text-center">
                {formData.title}
              </h3>
            )}

            {/* Content */}
            {formData.content && (
              <p className="text-sm mb-6 text-center leading-relaxed">
                {formData.content}
              </p>
            )}

            {/* Button */}
            {formData.buttonText && (
              <div className="text-center">
                <button
                  className={`px-6 py-3 font-medium transition-all hover:scale-105 ${
                    formData.buttonWidth === 'full' ? 'w-full' : 'inline-block'
                  }`}
                  style={{
                    backgroundColor: formData.buttonColor,
                    color: formData.buttonTextColor,
                    borderRadius: `${formData.borderRadius}px`
                  }}
                >
                  {formData.buttonText}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <AdminLayout>
      <PageHeader 
        title="Gerenciar Popups" 
        description="Crie e configure popups promocionais para aumentar conversões"
        actions={
          <Button onClick={() => setIsCreating(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Popup
          </Button>
        }
      />

      {/* Lista de popups existentes */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Popups Ativos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum popup criado ainda</p>
            <p className="text-sm mt-1">Clique em "Novo Popup" para começar</p>
          </div>
        </CardContent>
      </Card>

      {/* Modal de criação/edição */}
      {isCreating && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b flex-shrink-0">
              <h2 className="text-xl font-bold">Criar Novo Popup</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsCreating(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Content Area */}
            <div className="flex flex-1 min-h-0">
              {/* Form Section */}
              <div className="flex-1 flex flex-col min-h-0">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                  <TabsList className="grid w-full grid-cols-4 m-4 flex-shrink-0">
                    <TabsTrigger value="content" className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Conteúdo
                    </TabsTrigger>
                    <TabsTrigger value="appearance" className="flex items-center gap-2">
                      <Palette className="h-4 w-4" />
                      Aparência
                    </TabsTrigger>
                    <TabsTrigger value="targeting" className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Segmentação
                    </TabsTrigger>
                    <TabsTrigger value="preview" className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      Pré-visualização
                    </TabsTrigger>
                  </TabsList>

                  {/* Scrollable content area */}
                  <div className="flex-1 overflow-y-auto">
                    <div className="p-6">
                      {/* Aba Conteúdo */}
                      <TabsContent value="content" className="space-y-6 mt-0">
                        <div>
                          <Label htmlFor="title">Título do Popup (opcional)</Label>
                          <Input
                            id="title"
                            value={formData.title}
                            onChange={(e) => handleInputChange('title', e.target.value)}
                            placeholder="Ex: Oferta Especial!"
                          />
                        </div>

                        <div>
                          <Label htmlFor="content">Conteúdo do Popup (opcional)</Label>
                          <Textarea
                            id="content"
                            value={formData.content}
                            onChange={(e) => handleInputChange('content', e.target.value)}
                            placeholder="Descreva sua oferta ou mensagem..."
                            rows={4}
                          />
                        </div>

                        <div>
                          <Label htmlFor="image">Imagem (PNG, JPG, WebP - máx. 10MB)</Label>
                          <div className="mt-2">
                            <input
                              type="file"
                              id="image"
                              accept="image/png,image/jpeg,image/webp"
                              onChange={handleImageUpload}
                              className="hidden"
                            />
                            <Button
                              variant="outline"
                              onClick={() => document.getElementById('image')?.click()}
                              className="w-full"
                            >
                              <Upload className="h-4 w-4 mr-2" />
                              {imageFile ? imageFile.name : 'Selecionar Imagem'}
                            </Button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="buttonText">Texto do Botão</Label>
                            <Input
                              id="buttonText"
                              value={formData.buttonText}
                              onChange={(e) => handleInputChange('buttonText', e.target.value)}
                              placeholder="Ex: Assinar Agora"
                            />
                          </div>
                          <div>
                            <Label htmlFor="buttonUrl">URL do Botão</Label>
                            <Input
                              id="buttonUrl"
                              value={formData.buttonUrl}
                              onChange={(e) => handleInputChange('buttonUrl', e.target.value)}
                              placeholder="https://..."
                            />
                          </div>
                        </div>
                      </TabsContent>

                    {/* Aba Aparência */}
                    <TabsContent value="appearance" className="space-y-6 mt-0">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="backgroundColor">Cor de Fundo</Label>
                          <div className="flex gap-2 mt-2">
                            <input
                              type="color"
                              id="backgroundColor"
                              value={formData.backgroundColor}
                              onChange={(e) => handleInputChange('backgroundColor', e.target.value)}
                              className="w-12 h-10 rounded border"
                            />
                            <Input
                              value={formData.backgroundColor}
                              onChange={(e) => handleInputChange('backgroundColor', e.target.value)}
                              placeholder="#ffffff"
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="textColor">Cor do Texto</Label>
                          <div className="flex gap-2 mt-2">
                            <input
                              type="color"
                              id="textColor"
                              value={formData.textColor}
                              onChange={(e) => handleInputChange('textColor', e.target.value)}
                              className="w-12 h-10 rounded border"
                            />
                            <Input
                              value={formData.textColor}
                              onChange={(e) => handleInputChange('textColor', e.target.value)}
                              placeholder="#000000"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="buttonColor">Cor do Botão</Label>
                          <div className="flex gap-2 mt-2">
                            <input
                              type="color"
                              id="buttonColor"
                              value={formData.buttonColor}
                              onChange={(e) => handleInputChange('buttonColor', e.target.value)}
                              className="w-12 h-10 rounded border"
                            />
                            <Input
                              value={formData.buttonColor}
                              onChange={(e) => handleInputChange('buttonColor', e.target.value)}
                              placeholder="#1f4ed8"
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="buttonTextColor">Cor do Texto do Botão</Label>
                          <div className="flex gap-2 mt-2">
                            <input
                              type="color"
                              id="buttonTextColor"
                              value={formData.buttonTextColor}
                              onChange={(e) => handleInputChange('buttonTextColor', e.target.value)}
                              className="w-12 h-10 rounded border"
                            />
                            <Input
                              value={formData.buttonTextColor}
                              onChange={(e) => handleInputChange('buttonTextColor', e.target.value)}
                              placeholder="#ffffff"
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <Label>Arredondamento ({formData.borderRadius}px)</Label>
                        <Slider
                          value={[formData.borderRadius]}
                          onValueChange={(value) => handleInputChange('borderRadius', value[0])}
                          max={20}
                          step={1}
                          className="mt-2"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="buttonWidth">Largura do Botão</Label>
                          <Select
                            value={formData.buttonWidth}
                            onValueChange={(value) => handleInputChange('buttonWidth', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="auto">Automática</SelectItem>
                              <SelectItem value="full">Largura Total</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="animation">Animação</Label>
                          <Select
                            value={formData.animation}
                            onValueChange={(value) => handleInputChange('animation', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="fade">Fade</SelectItem>
                              <SelectItem value="slide">Slide</SelectItem>
                              <SelectItem value="zoom">Zoom</SelectItem>
                              <SelectItem value="bounce">Bounce</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="position">Posição</Label>
                          <Select
                            value={formData.position}
                            onValueChange={(value) => handleInputChange('position', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="center">Centro</SelectItem>
                              <SelectItem value="top">Topo</SelectItem>
                              <SelectItem value="bottom">Rodapé</SelectItem>
                              <SelectItem value="left">Esquerda</SelectItem>
                              <SelectItem value="right">Direita</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="size">Tamanho</Label>
                          <Select
                            value={formData.size}
                            onValueChange={(value) => handleInputChange('size', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="small">Pequeno</SelectItem>
                              <SelectItem value="medium">Médio</SelectItem>
                              <SelectItem value="large">Grande</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <Label>Atraso para Exibição ({formData.delaySeconds}s)</Label>
                        <Slider
                          value={[formData.delaySeconds]}
                          onValueChange={(value) => handleInputChange('delaySeconds', value[0])}
                          max={30}
                          step={1}
                          className="mt-2"
                        />
                      </div>
                    </TabsContent>

                    {/* Aba Segmentação */}
                    <TabsContent value="targeting" className="space-y-6 mt-0">
                      <div>
                        <Label className="text-base font-medium">Páginas Específicas</Label>
                        <div className="mt-3 max-h-64 overflow-y-auto border rounded-lg p-3 space-y-2">
                          {[
                            { value: 'all', label: 'Todas as páginas', description: 'Exibir em qualquer página da plataforma' },
                            { value: '/', label: 'Feed Principal', description: 'Página inicial com posts' },
                            { value: '/auth', label: 'Login/Registro', description: 'Página de autenticação' },
                            { value: '/plans', label: 'Planos e Assinaturas', description: 'Página de escolha de planos' },
                            { value: '/profile/edit', label: 'Editar Perfil', description: 'Configurações do usuário' },
                            { value: '/categories/botox', label: 'Categoria: Botox', description: 'Posts de procedimentos botox' },
                            { value: '/categories/corporal', label: 'Categoria: Corporal', description: 'Posts de estética corporal' },
                            { value: '/categories/depilacao', label: 'Categoria: Depilação', description: 'Posts sobre depilação' },
                            { value: '/categories/facial', label: 'Categoria: Facial', description: 'Posts de tratamentos faciais' },
                            { value: '/categories/massagem', label: 'Categoria: Massagem', description: 'Posts sobre massagem' },
                            { value: '/categories/pele', label: 'Categoria: Pele', description: 'Posts de cuidados com a pele' },
                            { value: '/categories/sala-de-beleza', label: 'Categoria: Sala de Beleza', description: 'Posts para salões' },
                            { value: '/art/*', label: 'Páginas de Arte', description: 'Visualização individual de artes' },
                            { value: '/autor/*', label: 'Perfis de Autores', description: 'Páginas públicas de designers' }
                          ].map(page => (
                            <div key={page.value} className="flex items-start space-x-3 hover:bg-gray-50 p-2 rounded">
                              <Checkbox
                                id={`page-${page.value}`}
                                checked={formData.targetPages.includes(page.value)}
                                onCheckedChange={(checked) => 
                                  handleTargetChange('targetPages', page.value, checked as boolean)
                                }
                                className="mt-1"
                              />
                              <div className="flex-1">
                                <Label htmlFor={`page-${page.value}`} className="font-medium text-sm cursor-pointer">
                                  {page.label}
                                </Label>
                                <p className="text-xs text-gray-500 mt-1">{page.description}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <Label className="text-base font-medium">Tipo de Usuário</Label>
                        <div className="mt-3 max-h-64 overflow-y-auto border rounded-lg p-3 space-y-2">
                          {[
                            { value: 'all', label: 'Todos os usuários', description: 'Visitantes e usuários logados' },
                            { value: 'guest', label: 'Visitantes', description: 'Usuários não autenticados' },
                            { value: 'free', label: 'Usuários Free', description: 'Plano gratuito ativo' },
                            { value: 'premium', label: 'Usuários Premium', description: 'Assinatura premium ativa' },
                            { value: 'new_users', label: 'Novos Usuários', description: 'Cadastrados nos últimos 7 dias' },
                            { value: 'inactive_users', label: 'Usuários Inativos', description: 'Sem acesso há mais de 30 dias' },
                            { value: 'returning_users', label: 'Usuários Recorrentes', description: 'Mais de 5 acessos no mês' }
                          ].map(userType => (
                            <div key={userType.value} className="flex items-start space-x-3 hover:bg-gray-50 p-2 rounded">
                              <Checkbox
                                id={`user-${userType.value}`}
                                checked={formData.targetUserTypes.includes(userType.value)}
                                onCheckedChange={(checked) => 
                                  handleTargetChange('targetUserTypes', userType.value, checked as boolean)
                                }
                                className="mt-1"
                              />
                              <div className="flex-1">
                                <Label htmlFor={`user-${userType.value}`} className="font-medium text-sm cursor-pointer">
                                  {userType.label}
                                </Label>
                                <p className="text-xs text-gray-500 mt-1">{userType.description}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="startDate">Data de Início</Label>
                          <Input
                            id="startDate"
                            type="datetime-local"
                            value={formData.startDate}
                            onChange={(e) => handleInputChange('startDate', e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="endDate">Data de Término</Label>
                          <Input
                            id="endDate"
                            type="datetime-local"
                            value={formData.endDate}
                            onChange={(e) => handleInputChange('endDate', e.target.value)}
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="frequency">Frequência de Exibição</Label>
                        <Select
                          value={formData.frequency}
                          onValueChange={(value) => handleInputChange('frequency', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="always">Sempre</SelectItem>
                            <SelectItem value="once_per_session">1x por sessão</SelectItem>
                            <SelectItem value="once_per_day">1x por dia</SelectItem>
                            <SelectItem value="once_per_week">1x por semana</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          id="isActive"
                          checked={formData.isActive}
                          onCheckedChange={(checked) => handleInputChange('isActive', checked)}
                        />
                        <Label htmlFor="isActive">Popup ativo</Label>
                      </div>
                    </TabsContent>

                    {/* Aba Pré-visualização */}
                    <TabsContent value="preview" className="space-y-6 mt-0">
                      <div className="text-center">
                        <h3 className="text-lg font-medium mb-4">Pré-visualização do Popup</h3>
                        <p className="text-sm text-gray-500 mb-6">
                          Veja como seu popup aparecerá para os usuários
                        </p>
                        
                        {formData.title || formData.content || formData.imageUrl || formData.buttonText ? (
                          <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-8 bg-gray-50">
                            <div className="text-sm text-gray-500 mb-4">Simulação do popup:</div>
                            <div className="relative inline-block">
                              {renderPopupPreview()}
                            </div>
                          </div>
                        ) : (
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
                            <Eye className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                            <p className="text-gray-500">
                              Configure o conteúdo nas outras abas para ver a pré-visualização
                            </p>
                          </div>
                        )}
                      </div>
                      </TabsContent>
                    </div>
                  </div>
                </Tabs>
              </div>

              {/* Preview Sidebar */}
              <div className="w-80 border-l bg-gray-50 p-4">
                <div className="sticky top-4">
                  <h3 className="font-medium mb-4">Preview em Tempo Real</h3>
                  {formData.title || formData.content || formData.imageUrl || formData.buttonText ? (
                    <div className="relative">
                      <div 
                        className={`
                          bg-black/50 p-4 rounded-lg min-h-48 flex items-center justify-center
                          ${formData.position === 'top' ? 'items-start pt-8' : ''}
                          ${formData.position === 'bottom' ? 'items-end pb-8' : ''}
                          ${formData.position === 'left' ? 'justify-start pl-8' : ''}
                          ${formData.position === 'right' ? 'justify-end pr-8' : ''}
                        `}
                      >
                        <div 
                          className={`
                            rounded-lg shadow-xl text-center transition-all duration-300
                            ${formData.size === 'small' ? 'max-w-xs p-3' : ''}
                            ${formData.size === 'medium' ? 'max-w-sm p-4' : ''}
                            ${formData.size === 'large' ? 'max-w-md p-6' : ''}
                            ${formData.animation === 'fade' ? 'animate-in fade-in' : ''}
                            ${formData.animation === 'slide' ? 'animate-in slide-in-from-top' : ''}
                            ${formData.animation === 'zoom' ? 'animate-in zoom-in' : ''}
                            ${formData.animation === 'bounce' ? 'animate-bounce' : ''}
                          `}
                          style={{
                            backgroundColor: formData.backgroundColor,
                            color: formData.textColor,
                            borderRadius: `${formData.borderRadius}px`
                          }}
                        >
                          {formData.imageUrl && (
                            <img 
                              src={formData.imageUrl} 
                              alt="Preview" 
                              className="w-full h-16 object-cover rounded mb-3"
                              style={{ borderRadius: `${formData.borderRadius * 0.5}px` }}
                            />
                          )}
                          {formData.title && (
                            <h4 className="font-bold mb-2 text-xs">{formData.title}</h4>
                          )}
                          {formData.content && (
                            <p className="text-xs mb-3 opacity-80">{formData.content}</p>
                          )}
                          {formData.buttonText && (
                            <button 
                              className={`
                                px-3 py-1 text-xs font-medium transition-colors
                                ${formData.buttonWidth === 'full' ? 'w-full' : 'inline-block'}
                              `}
                              style={{
                                backgroundColor: formData.buttonColor,
                                color: formData.buttonTextColor,
                                borderRadius: `${formData.borderRadius * 0.5}px`
                              }}
                            >
                              {formData.buttonText}
                            </button>
                          )}
                        </div>
                      </div>
                      
                      {/* Preview Settings Summary */}
                      <div className="mt-4 p-3 bg-white rounded border text-xs">
                        <div className="grid grid-cols-2 gap-2 text-gray-600">
                          <div>Posição: <span className="font-medium">{
                            formData.position === 'center' ? 'Centro' :
                            formData.position === 'top' ? 'Topo' :
                            formData.position === 'bottom' ? 'Rodapé' :
                            formData.position === 'left' ? 'Esquerda' : 'Direita'
                          }</span></div>
                          <div>Tamanho: <span className="font-medium">{
                            formData.size === 'small' ? 'Pequeno' :
                            formData.size === 'medium' ? 'Médio' : 'Grande'
                          }</span></div>
                          <div>Animação: <span className="font-medium">{
                            formData.animation === 'fade' ? 'Fade' :
                            formData.animation === 'slide' ? 'Slide' :
                            formData.animation === 'zoom' ? 'Zoom' : 'Bounce'
                          }</span></div>
                          <div>Delay: <span className="font-medium">{formData.delaySeconds}s</span></div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-gray-400 text-sm">
                      <Eye className="h-8 w-8 mx-auto mb-2" />
                      <p>Configure o conteúdo para ver o preview</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer com botões */}
            <div className="border-t p-6 flex justify-between">
              <Button
                variant="outline"
                onClick={() => setIsCreating(false)}
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleSavePopup}
                disabled={createPopupMutation.isPending}
              >
                <Save className="h-4 w-4 mr-2" />
                {createPopupMutation.isPending ? 'Salvando...' : 'Salvar Popup'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

function Zap({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  );
}