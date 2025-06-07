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
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
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
  Zap,
  Edit,
  Trash2,
  Check
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

  // Query para buscar popups existentes
  const { data: popups = [], isLoading: isLoadingPopups } = useQuery({
    queryKey: ['/api/popups'],
    queryFn: async () => {
      const response = await fetch('/api/popups');
      if (!response.ok) throw new Error('Erro ao carregar popups');
      return response.json();
    }
  });

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
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="title" className="text-sm">Título do Popup *</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            placeholder="Digite o título do popup"
            className="mt-1 h-8"
          />
        </div>
        <div>
          <Label htmlFor="buttonText" className="text-sm">Texto do Botão</Label>
          <Input
            id="buttonText"
            value={formData.buttonText}
            onChange={(e) => handleInputChange('buttonText', e.target.value)}
            placeholder="Ex: Saiba mais"
            className="mt-1 h-8"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="content" className="text-sm">Conteúdo *</Label>
        <Textarea
          id="content"
          value={formData.content}
          onChange={(e) => handleInputChange('content', e.target.value)}
          placeholder="Digite o conteúdo do popup"
          className="mt-1 min-h-[80px] resize-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="buttonUrl" className="text-sm">URL do Botão</Label>
          <Input
            id="buttonUrl"
            value={formData.buttonUrl}
            onChange={(e) => handleInputChange('buttonUrl', e.target.value)}
            placeholder="https://exemplo.com"
            className="mt-1 h-8"
          />
        </div>
        <div>
          <Label className="text-sm">Imagem (opcional)</Label>
          <div className="mt-1 border-2 border-dashed border-gray-300 rounded-lg p-3 text-center">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              id="image-upload"
            />
            <label htmlFor="image-upload" className="cursor-pointer">
              <Upload className="mx-auto h-6 w-6 text-gray-400" />
              <p className="mt-1 text-xs text-gray-600">Clique para upload</p>
            </label>
          </div>
        </div>
      </div>

      {formData.imageUrl && (
        <div className="flex justify-center">
          <img src={formData.imageUrl} alt="Preview" className="h-16 w-16 object-cover rounded" />
        </div>
      )}
    </div>
  );

  const renderAppearanceStep = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-6">
        <div>
          <Label className="text-sm">Cor de Fundo</Label>
          <div className="mt-1 flex items-center gap-2">
            <Input
              type="color"
              value={formData.backgroundColor}
              onChange={(e) => handleInputChange('backgroundColor', e.target.value)}
              className="h-8 w-12 p-0 border rounded"
            />
            <span className="text-xs text-gray-500">{formData.backgroundColor}</span>
          </div>
        </div>
        <div>
          <Label className="text-sm">Cor do Texto</Label>
          <div className="mt-1 flex items-center gap-2">
            <Input
              type="color"
              value={formData.textColor}
              onChange={(e) => handleInputChange('textColor', e.target.value)}
              className="h-8 w-12 p-0 border rounded"
            />
            <span className="text-xs text-gray-500">{formData.textColor}</span>
          </div>
        </div>
        <div>
          <Label className="text-sm">Cor do Botão</Label>
          <div className="mt-1 flex items-center gap-2">
            <Input
              type="color"
              value={formData.buttonColor}
              onChange={(e) => handleInputChange('buttonColor', e.target.value)}
              className="h-8 w-12 p-0 border rounded"
            />
            <span className="text-xs text-gray-500">{formData.buttonColor}</span>
          </div>
        </div>
        <div>
          <Label className="text-sm">Cor Texto Botão</Label>
          <div className="mt-1 flex items-center gap-2">
            <Input
              type="color"
              value={formData.buttonTextColor}
              onChange={(e) => handleInputChange('buttonTextColor', e.target.value)}
              className="h-8 w-12 p-0 border rounded"
            />
            <span className="text-xs text-gray-500">{formData.buttonTextColor}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label className="text-sm">Largura do Botão</Label>
          <Select value={formData.buttonWidth} onValueChange={(value) => handleInputChange('buttonWidth', value)}>
            <SelectTrigger className="mt-1 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="auto">Automática</SelectItem>
              <SelectItem value="full">Largura total</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-sm">Animação</Label>
          <Select value={formData.animation} onValueChange={(value) => handleInputChange('animation', value)}>
            <SelectTrigger className="mt-1 h-8">
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
          <Label className="text-sm">Posição</Label>
          <Select value={formData.position} onValueChange={(value) => handleInputChange('position', value)}>
            <SelectTrigger className="mt-1 h-8">
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
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-sm">Tamanho</Label>
          <Select value={formData.size} onValueChange={(value) => handleInputChange('size', value)}>
            <SelectTrigger className="mt-1 h-8">
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
          <Label className="text-sm">Raio da Borda: {formData.borderRadius}px</Label>
          <Slider
            value={[formData.borderRadius]}
            onValueChange={(value) => handleInputChange('borderRadius', value[0])}
            max={50}
            step={1}
            className="mt-1"
          />
        </div>
      </div>

      <div>
        <Label className="text-sm">Delay de Exibição: {formData.delaySeconds}s</Label>
        <Slider
          value={[formData.delaySeconds]}
          onValueChange={(value) => handleInputChange('delaySeconds', value[0])}
          max={30}
          step={1}
          className="mt-1"
        />
      </div>
    </div>
  );

  const renderTargetingStep = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-6">
        <div>
          <Label className="text-sm font-medium">Páginas de Destino</Label>
          <div className="mt-2 space-y-1">
            {['Todas as páginas', 'Página inicial', 'Feed principal', 'Páginas de categoria', 'Detalhes da arte', 'Perfil do usuário', 'Admin/Dashboard'].map((page) => (
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
                <Label htmlFor={page} className="text-sm">{page}</Label>
              </div>
            ))}
          </div>
        </div>

        <div>
          <Label className="text-sm font-medium">Tipos de Usuário</Label>
          <div className="mt-2 space-y-1">
            {['Todos os usuários', 'Usuários logados', 'Visitantes', 'Usuários premium', 'Usuários free', 'Administradores'].map((type) => (
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
                <Label htmlFor={type} className="text-sm">{type}</Label>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="startDate" className="text-sm">Data de Início</Label>
          <Input
            id="startDate"
            type="date"
            value={formData.startDate}
            onChange={(e) => handleInputChange('startDate', e.target.value)}
            className="mt-1 h-8"
          />
        </div>
        <div>
          <Label htmlFor="endDate" className="text-sm">Data de Fim</Label>
          <Input
            id="endDate"
            type="date"
            value={formData.endDate}
            onChange={(e) => handleInputChange('endDate', e.target.value)}
            className="mt-1 h-8"
          />
        </div>
        <div>
          <Label className="text-sm">Frequência de Exibição</Label>
          <Select value={formData.frequency} onValueChange={(value) => handleInputChange('frequency', value)}>
            <SelectTrigger className="mt-1 h-8">
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

      <div className="flex items-center space-x-2 pt-2">
        <Switch
          id="isActive"
          checked={formData.isActive}
          onCheckedChange={(checked) => handleInputChange('isActive', checked)}
        />
        <Label htmlFor="isActive" className="text-sm">Ativar popup imediatamente</Label>
      </div>
    </div>
  );

  const renderPreviewStep = () => (
    <div className="space-y-4 h-full overflow-y-auto">
      <div className="text-center">
        <h3 className="text-lg font-medium mb-4">Preview Final do Popup</h3>
        <div className="bg-gray-100 rounded-lg p-4 min-h-[250px] flex items-center justify-center">
          <div 
            className="popup-preview max-w-sm w-full"
            style={{
              backgroundColor: formData.backgroundColor,
              color: formData.textColor,
              borderRadius: `${formData.borderRadius}px`,
              padding: '20px',
              textAlign: 'center',
              boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
              minHeight: '180px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}
          >
            {formData.imageUrl && (
              <img src={formData.imageUrl} alt="Popup" className="w-full h-auto max-h-24 object-contain rounded mb-3" />
            )}
            <h4 className="font-bold text-lg mb-2">{formData.title || 'Título do Popup'}</h4>
            <p className="text-sm mb-3">{formData.content || 'Conteúdo do popup aparecerá aqui.'}</p>
            {formData.buttonText && (
              <button
                className={`px-3 py-2 rounded font-medium text-sm ${formData.buttonWidth === 'full' ? 'w-full' : ''}`}
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

      <div className="bg-gray-50 p-3 rounded-lg">
        <h4 className="font-medium mb-2 text-sm">Configurações do Popup:</h4>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div><strong>Posição:</strong> {formData.position === 'center' ? 'Centro' : formData.position}</div>
          <div><strong>Tamanho:</strong> {formData.size === 'small' ? 'Pequeno' : formData.size === 'medium' ? 'Médio' : 'Grande'}</div>
          <div><strong>Animação:</strong> {formData.animation}</div>
          <div><strong>Delay:</strong> {formData.delaySeconds}s</div>
          <div><strong>Frequência:</strong> {formData.frequency === 'always' ? 'Sempre' : formData.frequency.replace('_', ' ')}</div>
          <div><strong>Status:</strong> {formData.isActive ? 'Ativo' : 'Inativo'}</div>
        </div>
      </div>

      {/* Segmentação resumida */}
      <div className="space-y-2">
        {formData.targetPages.length > 0 && (
          <div className="bg-blue-50 p-2 rounded text-xs">
            <strong>Páginas:</strong> {formData.targetPages.slice(0, 3).join(', ')}{formData.targetPages.length > 3 ? '...' : ''}
          </div>
        )}
        {formData.targetUserTypes.length > 0 && (
          <div className="bg-green-50 p-2 rounded text-xs">
            <strong>Usuários:</strong> {formData.targetUserTypes.slice(0, 3).join(', ')}{formData.targetUserTypes.length > 3 ? '...' : ''}
          </div>
        )}
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
          {isLoadingPopups ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Carregando popups...</p>
            </div>
          ) : popups.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum popup criado ainda</p>
              <p className="text-sm mt-1">Clique em "Novo Popup" para começar</p>
            </div>
          ) : (
            <div className="space-y-4">
              {popups.map((popup: any) => (
                <div key={popup.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium text-lg">{popup.title}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          popup.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {popup.isActive ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm mb-2">{popup.content}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>Posição: {popup.position === 'center' ? 'Centro' : popup.position}</span>
                        <span>Tamanho: {popup.size === 'small' ? 'Pequeno' : popup.size === 'medium' ? 'Médio' : 'Grande'}</span>
                        <span>Animação: {popup.animation}</span>
                        <span>Delay: {popup.delaySeconds}s</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de criação/edição */}
      {isCreating && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-7xl max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
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
                <div className="flex-1 flex flex-col p-4">
                  {/* Step Progress Indicator */}
                  <div className="mb-4">
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

                </div>

                {/* Navigation Buttons */}
                <div className="flex justify-between items-center p-4 border-t bg-gray-50 flex-shrink-0">
                  <Button
                    variant="outline"
                    onClick={prevStep}
                    disabled={currentStep === 1}
                    className="h-8"
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
                      className="h-8"
                    >
                      Avançar
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  ) : (
                    <Button
                      onClick={handleSavePopup}
                      disabled={createPopupMutation.isPending || !formData.title || !formData.content}
                      className="bg-blue-600 hover:bg-blue-700 h-8"
                    >
                      {createPopupMutation.isPending ? 'Salvando...' : 'Criar Popup'}
                      <Save className="h-4 w-4 ml-2" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Preview ao vivo à direita */}
              {currentStep < 4 && (
                <div className="w-80 border-l bg-gray-50 p-4 overflow-y-auto">
                  <h3 className="text-sm font-medium text-gray-700 mb-4">Preview em Tempo Real</h3>
                  <div className="bg-white rounded-lg p-4 shadow-sm min-h-[300px] flex items-center justify-center">
                    <div 
                      className="popup-preview max-w-sm w-full"
                      style={{
                        backgroundColor: formData.backgroundColor,
                        color: formData.textColor,
                        borderRadius: `${formData.borderRadius}px`,
                        padding: '20px',
                        textAlign: 'center',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                        minHeight: '200px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center'
                      }}
                    >
                      {formData.imageUrl && (
                        <img 
                          src={formData.imageUrl} 
                          alt="Preview" 
                          className="w-full h-auto max-h-32 object-contain rounded mb-3"
                        />
                      )}
                      <h3 className="text-lg font-bold mb-2">
                        {formData.title || 'Título do Popup'}
                      </h3>
                      <p className="text-sm mb-4">
                        {formData.content || 'Conteúdo do popup aparecerá aqui...'}
                      </p>
                      {formData.buttonText && (
                        <button
                          style={{
                            backgroundColor: formData.buttonColor,
                            color: formData.buttonTextColor,
                            borderRadius: `${formData.borderRadius}px`,
                            padding: '8px 16px',
                            border: 'none',
                            width: formData.buttonWidth === 'full' ? '100%' : 'auto',
                            cursor: 'pointer'
                          }}
                        >
                          {formData.buttonText}
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* Configurações resumidas */}
                  <div className="mt-4 text-xs text-gray-600 space-y-1">
                    <p><strong>Posição:</strong> {formData.position === 'center' ? 'Centro' : formData.position}</p>
                    <p><strong>Tamanho:</strong> {formData.size === 'small' ? 'Pequeno' : formData.size === 'medium' ? 'Médio' : 'Grande'}</p>
                    <p><strong>Animação:</strong> {formData.animation}</p>
                    <p><strong>Delay:</strong> {formData.delaySeconds}s</p>
                    <p><strong>Frequência:</strong> {formData.frequency === 'always' ? 'Sempre' : formData.frequency.replace('_', ' ')}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

