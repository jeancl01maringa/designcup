import React, { useState } from "react";
import { AdminLayout } from "@/components/admin/layout/AdminLayout";
import { PageHeader } from "@/components/admin/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { 
  Plus, 
  Upload, 
  Eye, 
  Save, 
  ChevronLeft,
  ChevronRight,
  Calendar,
  Target,
  Settings,
  Palette
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

export default function PopupsPageImproved() {
  const [formData, setFormData] = useState<PopupFormData>(initialFormData);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
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
      setCurrentStep(1);
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

  const nextStep = () => {
    if (currentStep < 4) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const canProceedToNext = () => {
    switch (currentStep) {
      case 1: // Conteúdo
        return formData.title && formData.content;
      case 2: // Aparência
        return true;
      case 3: // Segmentação
        return true;
      case 4: // Preview
        return true;
      default:
        return false;
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderContentStep();
      case 2:
        return renderAppearanceStep();
      case 3:
        return renderTargetingStep();
      case 4:
        return renderPreviewStep();
      default:
        return null;
    }
  };

  const renderContentStep = () => (
    <div className="space-y-6">
      <div>
        <Label htmlFor="title">Título *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => handleInputChange('title', e.target.value)}
          placeholder="Digite o título do popup"
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="content">Conteúdo *</Label>
        <Textarea
          id="content"
          value={formData.content}
          onChange={(e) => handleInputChange('content', e.target.value)}
          placeholder="Digite o conteúdo do popup"
          className="mt-1 min-h-[100px]"
        />
      </div>

      <div>
        <Label htmlFor="image">Imagem (opcional)</Label>
        <div className="mt-1 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <input
            id="image"
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
          <label htmlFor="image" className="cursor-pointer">
            <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm text-gray-600">Clique para fazer upload de uma imagem</p>
            <p className="text-xs text-gray-500 mt-1">PNG, JPG até 10MB</p>
          </label>
        </div>
        {formData.imageUrl && (
          <div className="mt-2">
            <img src={formData.imageUrl} alt="Preview" className="h-20 w-20 object-cover rounded" />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="buttonText">Texto do Botão</Label>
          <Input
            id="buttonText"
            value={formData.buttonText}
            onChange={(e) => handleInputChange('buttonText', e.target.value)}
            placeholder="Ex: Saiba Mais"
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="buttonUrl">URL do Botão</Label>
          <Input
            id="buttonUrl"
            value={formData.buttonUrl}
            onChange={(e) => handleInputChange('buttonUrl', e.target.value)}
            placeholder="https://exemplo.com"
            className="mt-1"
          />
        </div>
      </div>
    </div>
  );

  const renderAppearanceStep = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label>Cores</Label>
          <div className="space-y-3 mt-2">
            <div>
              <Label htmlFor="backgroundColor" className="text-sm">Cor de Fundo</Label>
              <div className="flex items-center gap-2 mt-1">
                <input
                  id="backgroundColor"
                  type="color"
                  value={formData.backgroundColor}
                  onChange={(e) => handleInputChange('backgroundColor', e.target.value)}
                  className="w-12 h-8 rounded border"
                />
                <Input
                  value={formData.backgroundColor}
                  onChange={(e) => handleInputChange('backgroundColor', e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="textColor" className="text-sm">Cor do Texto</Label>
              <div className="flex items-center gap-2 mt-1">
                <input
                  id="textColor"
                  type="color"
                  value={formData.textColor}
                  onChange={(e) => handleInputChange('textColor', e.target.value)}
                  className="w-12 h-8 rounded border"
                />
                <Input
                  value={formData.textColor}
                  onChange={(e) => handleInputChange('textColor', e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="buttonColor" className="text-sm">Cor do Botão</Label>
              <div className="flex items-center gap-2 mt-1">
                <input
                  id="buttonColor"
                  type="color"
                  value={formData.buttonColor}
                  onChange={(e) => handleInputChange('buttonColor', e.target.value)}
                  className="w-12 h-8 rounded border"
                />
                <Input
                  value={formData.buttonColor}
                  onChange={(e) => handleInputChange('buttonColor', e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="buttonTextColor" className="text-sm">Cor do Texto do Botão</Label>
              <div className="flex items-center gap-2 mt-1">
                <input
                  id="buttonTextColor"
                  type="color"
                  value={formData.buttonTextColor}
                  onChange={(e) => handleInputChange('buttonTextColor', e.target.value)}
                  className="w-12 h-8 rounded border"
                />
                <Input
                  value={formData.buttonTextColor}
                  onChange={(e) => handleInputChange('buttonTextColor', e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
          </div>
        </div>

        <div>
          <Label>Configurações</Label>
          <div className="space-y-4 mt-2">
            <div>
              <Label htmlFor="borderRadius" className="text-sm">Bordas Arredondadas: {formData.borderRadius}px</Label>
              <Slider
                value={[formData.borderRadius]}
                onValueChange={(value) => handleInputChange('borderRadius', value[0])}
                min={0}
                max={20}
                step={1}
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="delaySeconds" className="text-sm">Delay de Exibição: {formData.delaySeconds}s</Label>
              <Slider
                value={[formData.delaySeconds]}
                onValueChange={(value) => handleInputChange('delaySeconds', value[0])}
                min={0}
                max={30}
                step={1}
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="buttonWidth" className="text-sm">Largura do Botão</Label>
              <Select value={formData.buttonWidth} onValueChange={(value) => handleInputChange('buttonWidth', value)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Automática</SelectItem>
                  <SelectItem value="full">Largura Total</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="animation" className="text-sm">Animação</Label>
              <Select value={formData.animation} onValueChange={(value) => handleInputChange('animation', value)}>
                <SelectTrigger className="mt-1">
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

            <div>
              <Label htmlFor="position" className="text-sm">Posição</Label>
              <Select value={formData.position} onValueChange={(value) => handleInputChange('position', value)}>
                <SelectTrigger className="mt-1">
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
              <Label htmlFor="size" className="text-sm">Tamanho</Label>
              <Select value={formData.size} onValueChange={(value) => handleInputChange('size', value)}>
                <SelectTrigger className="mt-1">
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
        </div>
      </div>
    </div>
  );

  const renderTargetingStep = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5" />
              Páginas Específicas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="all-pages"
                checked={formData.targetPages.includes('all')}
                onCheckedChange={(checked) => handleTargetChange('targetPages', 'all', checked as boolean)}
              />
              <div>
                <Label htmlFor="all-pages" className="font-medium">Todas as páginas</Label>
                <p className="text-sm text-gray-500">Exibir em qualquer página da plataforma</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="home-page"
                checked={formData.targetPages.includes('/')}
                onCheckedChange={(checked) => handleTargetChange('targetPages', '/', checked as boolean)}
              />
              <div>
                <Label htmlFor="home-page" className="font-medium">Feed Principal</Label>
                <p className="text-sm text-gray-500">Página inicial com posts</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="auth-page"
                checked={formData.targetPages.includes('/auth')}
                onCheckedChange={(checked) => handleTargetChange('targetPages', '/auth', checked as boolean)}
              />
              <div>
                <Label htmlFor="auth-page" className="font-medium">Login/Registro</Label>
                <p className="text-sm text-gray-500">Página de autenticação</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="plans-page"
                checked={formData.targetPages.includes('/plans')}
                onCheckedChange={(checked) => handleTargetChange('targetPages', '/plans', checked as boolean)}
              />
              <div>
                <Label htmlFor="plans-page" className="font-medium">Planos e Assinaturas</Label>
                <p className="text-sm text-gray-500">Página de planos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5" />
              Tipo de Usuário
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="all-users"
                checked={formData.targetUserTypes.includes('all')}
                onCheckedChange={(checked) => handleTargetChange('targetUserTypes', 'all', checked as boolean)}
              />
              <div>
                <Label htmlFor="all-users" className="font-medium">Todos os usuários</Label>
                <p className="text-sm text-gray-500">Visitantes e usuários logados</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="visitors"
                checked={formData.targetUserTypes.includes('visitors')}
                onCheckedChange={(checked) => handleTargetChange('targetUserTypes', 'visitors', checked as boolean)}
              />
              <div>
                <Label htmlFor="visitors" className="font-medium">Visitantes</Label>
                <p className="text-sm text-gray-500">Usuários não autenticados</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="free-users"
                checked={formData.targetUserTypes.includes('free')}
                onCheckedChange={(checked) => handleTargetChange('targetUserTypes', 'free', checked as boolean)}
              />
              <div>
                <Label htmlFor="free-users" className="font-medium">Usuários Free</Label>
                <p className="text-sm text-gray-500">Plano gratuito ativo</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="premium-users"
                checked={formData.targetUserTypes.includes('premium')}
                onCheckedChange={(checked) => handleTargetChange('targetUserTypes', 'premium', checked as boolean)}
              />
              <div>
                <Label htmlFor="premium-users" className="font-medium">Usuários Premium</Label>
                <p className="text-sm text-gray-500">Assinatura premium ativa</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Programação e Frequência
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="startDate">Data de Início</Label>
              <Input
                id="startDate"
                type="datetime-local"
                value={formData.startDate}
                onChange={(e) => handleInputChange('startDate', e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="endDate">Data de Fim</Label>
              <Input
                id="endDate"
                type="datetime-local"
                value={formData.endDate}
                onChange={(e) => handleInputChange('endDate', e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="frequency">Frequência</Label>
              <Select value={formData.frequency} onValueChange={(value) => handleInputChange('frequency', value)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="always">Sempre</SelectItem>
                  <SelectItem value="once_per_session">Uma vez por sessão</SelectItem>
                  <SelectItem value="once_per_day">Uma vez por dia</SelectItem>
                  <SelectItem value="once_per_week">Uma vez por semana</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderPreviewStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-4">Preview do Popup</h3>
        <p className="text-gray-600 mb-6">Veja como seu popup aparecerá para os usuários</p>
      </div>

      <div className="bg-gray-100 p-8 rounded-lg min-h-[400px] relative">
        {formData.title || formData.content ? (
          <div className="flex items-center justify-center h-full">
            <div
              className="bg-white shadow-lg p-6 max-w-md w-full"
              style={{
                backgroundColor: formData.backgroundColor,
                color: formData.textColor,
                borderRadius: `${formData.borderRadius}px`
              }}
            >
              {formData.imageUrl && (
                <div className="mb-4">
                  <img 
                    src={formData.imageUrl} 
                    alt="Popup" 
                    className="w-full h-auto rounded-lg object-cover"
                    style={{ 
                      maxHeight: '200px',
                      borderRadius: `${Math.min(formData.borderRadius, 8)}px`
                    }}
                  />
                </div>
              )}

              {formData.title && (
                <h3 className="text-xl font-bold mb-3 text-center">
                  {formData.title}
                </h3>
              )}

              {formData.content && (
                <p className="text-sm mb-6 text-center leading-relaxed">
                  {formData.content}
                </p>
              )}

              {formData.buttonText && (
                <div className="text-center">
                  <button
                    className={`px-6 py-3 font-medium transition-all hover:scale-105 ${
                      formData.buttonWidth === 'full' ? 'w-full' : 'inline-block'
                    }`}
                    style={{
                      backgroundColor: formData.buttonColor,
                      color: formData.buttonTextColor,
                      borderRadius: `${formData.borderRadius * 0.8}px`
                    }}
                  >
                    {formData.buttonText}
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-400 h-full flex items-center justify-center">
            <div>
              <Eye className="h-12 w-12 mx-auto mb-4" />
              <p>Configure o conteúdo para ver o preview</p>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white p-4 rounded border">
        <h4 className="font-medium mb-3">Configurações do Popup</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Posição:</span>
            <span className="ml-2 font-medium">
              {formData.position === 'center' ? 'Centro' :
               formData.position === 'top' ? 'Topo' :
               formData.position === 'bottom' ? 'Rodapé' :
               formData.position === 'left' ? 'Esquerda' : 'Direita'}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Tamanho:</span>
            <span className="ml-2 font-medium">
              {formData.size === 'small' ? 'Pequeno' :
               formData.size === 'medium' ? 'Médio' : 'Grande'}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Animação:</span>
            <span className="ml-2 font-medium">
              {formData.animation === 'fade' ? 'Fade' :
               formData.animation === 'slide' ? 'Slide' :
               formData.animation === 'zoom' ? 'Zoom' : 'Bounce'}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Delay:</span>
            <span className="ml-2 font-medium">{formData.delaySeconds}s</span>
          </div>
          <div>
            <span className="text-gray-600">Páginas:</span>
            <span className="ml-2 font-medium">
              {formData.targetPages.includes('all') ? 'Todas' : formData.targetPages.length + ' selecionadas'}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Usuários:</span>
            <span className="ml-2 font-medium">
              {formData.targetUserTypes.includes('all') ? 'Todos' : formData.targetUserTypes.length + ' selecionados'}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="isActive"
          checked={formData.isActive}
          onCheckedChange={(checked) => handleInputChange('isActive', checked)}
        />
        <Label htmlFor="isActive">Ativar popup imediatamente após salvar</Label>
      </div>
    </div>
  );

  const steps = [
    { number: 1, title: 'Conteúdo', icon: Settings },
    { number: 2, title: 'Aparência', icon: Palette },
    { number: 3, title: 'Segmentação', icon: Target },
    { number: 4, title: 'Preview', icon: Eye }
  ];

  return (
    <AdminLayout>
      <PageHeader
        title="Popups de Marketing"
        description="Crie popups atrativos para engajar visitantes e converter leads"
      />

      <div className="space-y-6">
        {/* Lista de popups existentes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Popups Criados</CardTitle>
            <Button onClick={() => setIsCreating(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Popup
            </Button>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500 text-center py-8">
              Nenhum popup criado ainda. Clique em "Criar Popup" para começar.
            </p>
          </CardContent>
        </Card>

        {/* Modal de criação melhorado */}
        {isCreating && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden">
              {/* Header */}
              <div className="border-b p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold">Criar Novo Popup</h2>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsCreating(false)}
                  >
                    ×
                  </Button>
                </div>

                {/* Progress Steps */}
                <div className="flex items-center space-x-4">
                  {steps.map((step, index) => {
                    const Icon = step.icon;
                    const isActive = currentStep === step.number;
                    const isCompleted = currentStep > step.number;
                    
                    return (
                      <div key={step.number} className="flex items-center">
                        <div className={`
                          flex items-center justify-center w-8 h-8 rounded-full border-2 
                          ${isActive ? 'border-blue-600 bg-blue-600 text-white' : 
                            isCompleted ? 'border-green-600 bg-green-600 text-white' : 
                            'border-gray-300 text-gray-400'}
                        `}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <span className={`ml-2 text-sm font-medium ${
                          isActive ? 'text-blue-600' : 
                          isCompleted ? 'text-green-600' : 
                          'text-gray-400'
                        }`}>
                          {step.title}
                        </span>
                        {index < steps.length - 1 && (
                          <div className={`w-8 h-0.5 mx-4 ${
                            isCompleted ? 'bg-green-600' : 'bg-gray-300'
                          }`} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                {renderStepContent()}
              </div>

              {/* Footer */}
              <div className="border-t p-6 flex justify-between">
                <div>
                  {currentStep > 1 && (
                    <Button variant="outline" onClick={prevStep}>
                      <ChevronLeft className="h-4 w-4 mr-2" />
                      Anterior
                    </Button>
                  )}
                </div>
                
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setIsCreating(false)}
                  >
                    Cancelar
                  </Button>
                  
                  {currentStep < 4 ? (
                    <Button 
                      onClick={nextStep}
                      disabled={!canProceedToNext()}
                    >
                      Próximo
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  ) : (
                    <Button 
                      onClick={handleSavePopup}
                      disabled={createPopupMutation.isPending}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {createPopupMutation.isPending ? 'Salvando...' : 'Salvar Popup'}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}