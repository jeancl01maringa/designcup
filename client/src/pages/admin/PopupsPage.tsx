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
  Palette,
  FileText,
  Users,
  X,
  Zap
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
  buttonText: 'Saiba mais',
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
  delaySeconds: 2,
  targetPages: [],
  targetUserTypes: [],
  startDate: '',
  endDate: '',
  frequency: 'once_per_session',
  isActive: false
};

export default function PopupsPage() {
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
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          handleInputChange('imageUrl', e.target.result as string);
        }
      };
      reader.readAsDataURL(file);
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

  const renderContentStep = () => (
    <div className="space-y-6">
      <div>
        <Label htmlFor="title">Título do Popup *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => handleInputChange('title', e.target.value)}
          placeholder="Digite o título do popup"
          className="mt-2"
        />
      </div>

      <div>
        <Label htmlFor="content">Conteúdo *</Label>
        <Textarea
          id="content"
          value={formData.content}
          onChange={(e) => handleInputChange('content', e.target.value)}
          placeholder="Digite o conteúdo do popup"
          className="mt-2 min-h-[100px]"
        />
      </div>

      <div>
        <Label>Imagem (opcional)</Label>
        <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
            id="image-upload"
          />
          <label htmlFor="image-upload" className="cursor-pointer">
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm text-gray-600">Clique para fazer upload de uma imagem</p>
          </label>
        </div>
        {formData.imageUrl && (
          <div className="mt-2">
            <img src={formData.imageUrl} alt="Preview" className="h-20 w-20 object-cover rounded" />
          </div>
        )}
      </div>

      <div>
        <Label htmlFor="buttonText">Texto do Botão</Label>
        <Input
          id="buttonText"
          value={formData.buttonText}
          onChange={(e) => handleInputChange('buttonText', e.target.value)}
          placeholder="Ex: Saiba mais"
          className="mt-2"
        />
      </div>

      <div>
        <Label htmlFor="buttonUrl">URL do Botão</Label>
        <Input
          id="buttonUrl"
          value={formData.buttonUrl}
          onChange={(e) => handleInputChange('buttonUrl', e.target.value)}
          placeholder="https://exemplo.com"
          className="mt-2"
        />
      </div>
    </div>
  );

  const renderAppearanceStep = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Cor de Fundo</Label>
          <Input
            type="color"
            value={formData.backgroundColor}
            onChange={(e) => handleInputChange('backgroundColor', e.target.value)}
            className="mt-2 h-12"
          />
        </div>
        <div>
          <Label>Cor do Texto</Label>
          <Input
            type="color"
            value={formData.textColor}
            onChange={(e) => handleInputChange('textColor', e.target.value)}
            className="mt-2 h-12"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Cor do Botão</Label>
          <Input
            type="color"
            value={formData.buttonColor}
            onChange={(e) => handleInputChange('buttonColor', e.target.value)}
            className="mt-2 h-12"
          />
        </div>
        <div>
          <Label>Cor do Texto do Botão</Label>
          <Input
            type="color"
            value={formData.buttonTextColor}
            onChange={(e) => handleInputChange('buttonTextColor', e.target.value)}
            className="mt-2 h-12"
          />
        </div>
      </div>

      <div>
        <Label>Raio da Borda: {formData.borderRadius}px</Label>
        <Slider
          value={[formData.borderRadius]}
          onValueChange={(value) => handleInputChange('borderRadius', value[0])}
          max={50}
          step={1}
          className="mt-2"
        />
      </div>

      <div>
        <Label>Largura do Botão</Label>
        <Select value={formData.buttonWidth} onValueChange={(value) => handleInputChange('buttonWidth', value)}>
          <SelectTrigger className="mt-2">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="auto">Automática</SelectItem>
            <SelectItem value="full">Largura total</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Animação</Label>
        <Select value={formData.animation} onValueChange={(value) => handleInputChange('animation', value)}>
          <SelectTrigger className="mt-2">
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
        <Label>Posição</Label>
        <Select value={formData.position} onValueChange={(value) => handleInputChange('position', value)}>
          <SelectTrigger className="mt-2">
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
        <Label>Tamanho</Label>
        <Select value={formData.size} onValueChange={(value) => handleInputChange('size', value)}>
          <SelectTrigger className="mt-2">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="small">Pequeno</SelectItem>
            <SelectItem value="medium">Médio</SelectItem>
            <SelectItem value="large">Grande</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Delay de Exibição: {formData.delaySeconds}s</Label>
        <Slider
          value={[formData.delaySeconds]}
          onValueChange={(value) => handleInputChange('delaySeconds', value[0])}
          max={30}
          step={1}
          className="mt-2"
        />
      </div>
    </div>
  );

  const renderTargetingStep = () => (
    <div className="space-y-6">
      <div>
        <Label>Páginas de Destino</Label>
        <div className="mt-2 space-y-2">
          {['Todas as páginas', 'Página inicial', 'Páginas de categoria', 'Páginas de produto'].map((page) => (
            <div key={page} className="flex items-center space-x-2">
              <Checkbox
                id={page}
                checked={formData.targetPages.includes(page)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    handleInputChange('targetPages', [...formData.targetPages, page]);
                  } else {
                    handleInputChange('targetPages', formData.targetPages.filter(p => p !== page));
                  }
                }}
              />
              <Label htmlFor={page}>{page}</Label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <Label>Tipos de Usuário</Label>
        <div className="mt-2 space-y-2">
          {['Todos os usuários', 'Usuários logados', 'Visitantes', 'Usuários premium'].map((type) => (
            <div key={type} className="flex items-center space-x-2">
              <Checkbox
                id={type}
                checked={formData.targetUserTypes.includes(type)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    handleInputChange('targetUserTypes', [...formData.targetUserTypes, type]);
                  } else {
                    handleInputChange('targetUserTypes', formData.targetUserTypes.filter(t => t !== type));
                  }
                }}
              />
              <Label htmlFor={type}>{type}</Label>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="startDate">Data de Início</Label>
          <Input
            id="startDate"
            type="date"
            value={formData.startDate}
            onChange={(e) => handleInputChange('startDate', e.target.value)}
            className="mt-2"
          />
        </div>
        <div>
          <Label htmlFor="endDate">Data de Fim</Label>
          <Input
            id="endDate"
            type="date"
            value={formData.endDate}
            onChange={(e) => handleInputChange('endDate', e.target.value)}
            className="mt-2"
          />
        </div>
      </div>

      <div>
        <Label>Frequência de Exibição</Label>
        <Select value={formData.frequency} onValueChange={(value) => handleInputChange('frequency', value)}>
          <SelectTrigger className="mt-2">
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

      <div className="flex items-center space-x-2">
        <Switch
          id="isActive"
          checked={formData.isActive}
          onCheckedChange={(checked) => handleInputChange('isActive', checked)}
        />
        <Label htmlFor="isActive">Ativar popup imediatamente</Label>
      </div>
    </div>
  );

  const renderPreviewStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-medium mb-4">Preview do Popup</h3>
        <div className="relative">
          <div 
            className="inline-block p-6 rounded-lg shadow-lg border max-w-md"
            style={{
              backgroundColor: formData.backgroundColor,
              color: formData.textColor,
              borderRadius: `${formData.borderRadius}px`
            }}
          >
            {formData.imageUrl && (
              <img src={formData.imageUrl} alt="Popup" className="w-full h-32 object-cover rounded mb-4" />
            )}
            <h4 className="font-bold text-lg mb-2">{formData.title || 'Título do Popup'}</h4>
            <p className="mb-4">{formData.content || 'Conteúdo do popup aparecerá aqui.'}</p>
            {formData.buttonText && (
              <button
                className={`px-4 py-2 rounded font-medium ${formData.buttonWidth === 'full' ? 'w-full' : ''}`}
                style={{
                  backgroundColor: formData.buttonColor,
                  color: formData.buttonTextColor,
                  borderRadius: `${formData.borderRadius}px`
                }}
              >
                {formData.buttonText}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-medium mb-2">Configurações do Popup:</h4>
        <div className="space-y-2 text-sm">
          <div><strong>Posição:</strong> {formData.position}</div>
          <div><strong>Tamanho:</strong> {formData.size}</div>
          <div><strong>Animação:</strong> {formData.animation}</div>
          <div><strong>Delay:</strong> {formData.delaySeconds}s</div>
          <div><strong>Frequência:</strong> {formData.frequency}</div>
          <div><strong>Status:</strong> {formData.isActive ? 'Ativo' : 'Inativo'}</div>
        </div>
      </div>
    </div>
  );

  return (
    <AdminLayout>
      <PageHeader 
        title="Popups" 
        description="Gerencie popups promocionais e informativos"
      />

      {/* Lista de popups existentes */}
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Popups Criados</CardTitle>
          <Button
            onClick={() => setIsCreating(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Popup
          </Button>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-gray-500">
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
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">Criar Novo Popup</h2>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  setIsCreating(false);
                  setCurrentStep(1);
                  setFormData(initialFormData);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Content Area */}
            <div className="flex flex-1 min-h-0">
              {/* Form Section */}
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex-1 flex flex-col p-6">
                  {/* Step Progress Indicator */}
                  <div className="mb-6">
                    <div className="flex items-center space-x-4">
                      {[
                        { number: 1, title: 'Conteúdo', icon: Settings },
                        { number: 2, title: 'Aparência', icon: Palette },
                        { number: 3, title: 'Segmentação', icon: Target },
                        { number: 4, title: 'Preview', icon: Eye }
                      ].map((step, index) => {
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
                            {index < 3 && (
                              <div className={`w-8 h-0.5 mx-4 ${
                                isCompleted ? 'bg-green-600' : 'bg-gray-300'
                              }`} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Step Content */}
                  <div className="flex-1 overflow-y-auto">
                    {currentStep === 1 && renderContentStep()}
                    {currentStep === 2 && renderAppearanceStep()}
                    {currentStep === 3 && renderTargetingStep()}
                    {currentStep === 4 && renderPreviewStep()}
                  </div>

                  {/* Navigation Buttons */}
                  <div className="flex justify-between items-center p-6 border-t bg-gray-50">
                    <Button
                      variant="outline"
                      onClick={prevStep}
                      disabled={currentStep === 1}
                    >
                      <ChevronLeft className="h-4 w-4 mr-2" />
                      Voltar
                    </Button>
                    
                    <div className="text-sm text-gray-500">
                      Passo {currentStep} de 4
                    </div>
                    
                    {currentStep < 4 ? (
                      <Button
                        onClick={nextStep}
                        disabled={!canProceedToNext()}
                      >
                        Avançar
                        <ChevronRight className="h-4 w-4 ml-2" />
                      </Button>
                    ) : (
                      <Button
                        onClick={handleSavePopup}
                        disabled={createPopupMutation.isPending || !formData.title || !formData.content}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {createPopupMutation.isPending ? 'Salvando...' : 'Criar Popup'}
                        <Save className="h-4 w-4 ml-2" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

