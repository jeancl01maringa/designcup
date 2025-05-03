import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Check, X, Upload, 
  ArrowLeft, Link as LinkIcon, 
  ChevronLeft, Crown, Plus,
  ImageIcon, Trash, Circle, 
  ExternalLink, FileImage
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { uploadToSupabase } from "@/lib/admin/uploadToSupabase";
import { Post, Category } from "@shared/schema";
import { nanoid, cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { 
  Card, 
  CardContent
} from "@/components/ui/card";

interface PostFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Post;
  isEdit?: boolean;
}

type PostFormat = 'feed' | 'cartaz' | 'stories';

interface FormatFile {
  imageFile: File | null;
  imagePreview: string | null;
  links: Array<{ provider: string; url: string; id: string }>;
}

interface PostFormData {
  title: string;
  categoryId: number | null;
  status: 'aprovado' | 'rascunho' | 'rejeitado';
  description: string | null;
  licenseType: string;
  tags: string[];
  formats: PostFormat[];
  formatFiles: Record<PostFormat, FormatFile>;
  uniqueCode: string;
  groupId?: string;
}

export function ImprovedPostForm({ open, onOpenChange, initialData, isEdit = false }: PostFormProps) {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [activeTab, setActiveTab] = useState<string>("feed");
  const [newTag, setNewTag] = useState("");
  
  // Gerar um ID único para a postagem
  const uniquePostId = nanoid();
  
  const defaultFormatFile: FormatFile = {
    imageFile: null,
    imagePreview: null,
    links: []
  };
  
  const [formData, setFormData] = useState<PostFormData>({
    title: "",
    categoryId: null,
    status: "aprovado",
    description: null,
    licenseType: "premium",
    tags: [],
    formats: [], // Não selecionar nenhum formato inicialmente
    formatFiles: {
      feed: { ...defaultFormatFile },
      cartaz: { ...defaultFormatFile },
      stories: { ...defaultFormatFile }
    },
    uniqueCode: uniquePostId,
    groupId: nanoid()
  });

  // Preencher dados caso seja edição
  useEffect(() => {
    if (isEdit && initialData) {
      const formatFiles: Record<PostFormat, FormatFile> = {
        feed: { ...defaultFormatFile },
        cartaz: { ...defaultFormatFile },
        stories: { ...defaultFormatFile }
      };

      setFormData({
        title: initialData.title,
        categoryId: initialData.categoryId,
        status: initialData.status as 'aprovado' | 'rascunho' | 'rejeitado',
        description: initialData.description,
        licenseType: initialData.licenseType || "premium",
        tags: initialData.tags || [],
        formats: (initialData.formats as PostFormat[]) || [],
        formatFiles: formatFiles,
        uniqueCode: initialData.uniqueCode || uniquePostId
      });
    }
  }, [isEdit, initialData, uniquePostId]);

  // Buscar categorias
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/admin/categories"],
    queryFn: async () => {
      const res = await fetch("/api/admin/categories");
      if (!res.ok) throw new Error("Falha ao buscar categorias");
      return res.json();
    }
  });

  // Criar nova postagem
  const createPostMutation = useMutation({
    mutationFn: async (postData: Partial<Post>) => {
      const res = await apiRequest("POST", "/api/admin/posts", postData);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Sucesso!",
        description: "Postagem criada com sucesso.",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/posts"] });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar postagem",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Atualizar postagem existente
  const updatePostMutation = useMutation({
    mutationFn: async (postData: Partial<Post>) => {
      if (!initialData?.id) throw new Error("ID da postagem é necessário para atualização");
      const res = await apiRequest("PATCH", `/api/admin/posts/${initialData.id}`, postData);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Sucesso!",
        description: "Postagem atualizada com sucesso.",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/posts"] });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar postagem",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Manipuladores de formulário
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    if (name === "categoryId") {
      // Converter para número, já que o categoryId é um número no formData
      setFormData(prev => ({ ...prev, [name]: parseInt(value, 10) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleFormatToggle = (format: PostFormat) => {
    setFormData(prev => {
      const formats = prev.formats.includes(format)
        ? prev.formats.filter(f => f !== format)
        : [...prev.formats, format];
      return { ...prev, formats };
    });
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, format: PostFormat) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(format, file);
    }
  };

  const handleImageUpload = async (format: PostFormat, file: File) => {
    try {
      // Criar preview para exibição imediata
      const previewUrl = URL.createObjectURL(file);
      
      setFormData(prev => ({
        ...prev,
        formatFiles: {
          ...prev.formatFiles,
          [format]: {
            ...prev.formatFiles[format],
            imageFile: file,
            imagePreview: previewUrl
          }
        }
      }));
      
      // Toast de carregamento
      toast({
        title: "Enviando imagem...",
        description: "Aguarde enquanto otimizamos sua imagem.",
      });
      
      // Caminho no Supabase com ID único da postagem
      const filePath = `posts/${formData.uniqueCode}/${format}_${file.name}`;
      
      // Upload e otimização (para WebP) no Supabase
      const imageUrl = await uploadToSupabase(file, filePath, true);
      
      if (imageUrl) {
        setFormData(prev => ({
          ...prev,
          formatFiles: {
            ...prev.formatFiles,
            [format]: {
              ...prev.formatFiles[format],
              imagePreview: imageUrl
            }
          }
        }));
        
        toast({
          title: "Imagem carregada!",
          description: "Imagem otimizada e armazenada com sucesso.",
          variant: "default",
        });
      }
    } catch (error) {
      console.error("Erro ao fazer upload da imagem:", error);
      toast({
        title: "Falha no upload",
        description: "Não foi possível enviar a imagem. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleRemoveImage = (format: PostFormat) => {
    setFormData(prev => ({
      ...prev,
      formatFiles: {
        ...prev.formatFiles,
        [format]: {
          ...prev.formatFiles[format],
          imageFile: null,
          imagePreview: null
        }
      }
    }));
  };

  const handleAddLink = (format: PostFormat) => {
    const provider = (document.getElementById(`provider-${format}`) as HTMLSelectElement)?.value || "canva";
    const url = (document.getElementById(`url-${format}`) as HTMLInputElement)?.value;
    
    if (url && url.trim()) {
      setFormData(prev => ({
        ...prev,
        formatFiles: {
          ...prev.formatFiles,
          [format]: {
            ...prev.formatFiles[format],
            links: [
              ...prev.formatFiles[format].links,
              { provider, url: url.trim(), id: nanoid() }
            ]
          }
        }
      }));
      
      // Limpar campo de URL
      if (document.getElementById(`url-${format}`)) {
        (document.getElementById(`url-${format}`) as HTMLInputElement).value = '';
      }
    }
  };

  const handleRemoveLink = (format: PostFormat, linkId: string) => {
    setFormData(prev => ({
      ...prev,
      formatFiles: {
        ...prev.formatFiles,
        [format]: {
          ...prev.formatFiles[format],
          links: prev.formatFiles[format].links.filter(link => link.id !== linkId)
        }
      }
    }));
  };

  const getFormatsWithContent = (): PostFormat[] => {
    return formData.formats.filter(format => {
      const formatFile = formData.formatFiles[format];
      return (
        (formatFile.imagePreview !== null) || 
        formatFile.links.length > 0
      );
    });
  };

  // Navegar entre etapas
  const nextStep = () => {
    if (step === 1) {
      // Validação do passo 1
      if (!formData.title.trim()) {
        toast({
          title: "Campo obrigatório",
          description: "Informe o nome da postagem.",
          variant: "destructive",
        });
        return;
      }
      
      if (!formData.categoryId) {
        toast({
          title: "Campo obrigatório",
          description: "Selecione uma categoria.",
          variant: "destructive",
        });
        return;
      }
      
      if (formData.formats.length === 0) {
        toast({
          title: "Campo obrigatório",
          description: "Selecione pelo menos um formato de arte.",
          variant: "destructive",
        });
        return;
      }
      
      // Definir o primeiro formato selecionado como aba ativa
      if (formData.formats.length > 0) {
        setActiveTab(formData.formats[0]);
      }
      
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    }
  };
  
  const prevStep = () => {
    if (step === 2) {
      setStep(1);
    } else if (step === 3) {
      setStep(2);
    }
  };
  
  const submitForm = async () => {
    try {
      // Preparar dados para envio
      const formatDataJson = JSON.stringify(formData.formats.map(format => ({
        type: format,
        imageUrl: formData.formatFiles[format].imagePreview || "",
        links: formData.formatFiles[format].links
      })));
      
      const post = {
        title: formData.title,
        categoryId: formData.categoryId,
        status: formData.status,
        description: formData.description,
        licenseType: formData.licenseType,
        tags: formData.tags,
        formats: formData.formats,
        formatData: formatDataJson, // Enviar como string JSON
        uniqueCode: formData.uniqueCode,
        groupId: formData.groupId
      };
      
      // Enviar para o servidor
      if (isEdit && initialData?.id) {
        await updatePostMutation.mutateAsync(post);
      } else {
        await createPostMutation.mutateAsync(post);
      }
    } catch (error) {
      console.error("Erro ao enviar o formulário:", error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar a postagem. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  // Componente para indicador de etapas
  const StepIndicator = () => (
    <div className="flex items-center justify-center py-6 mx-auto max-w-md">
      <div className="flex flex-col items-center mx-4">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
          step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
        }`}>
          1
        </div>
        <div className="text-sm">Informações</div>
      </div>
      
      <div className={`flex-1 h-0.5 mt-[-15px] ${step >= 2 ? 'bg-blue-500' : 'bg-gray-200'}`}></div>
      
      <div className="flex flex-col items-center mx-4">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
          step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
        }`}>
          2
        </div>
        <div className="text-sm">Uploads</div>
      </div>
      
      <div className={`flex-1 h-0.5 mt-[-15px] ${step >= 3 ? 'bg-blue-500' : 'bg-gray-200'}`}></div>
      
      <div className="flex flex-col items-center mx-4">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
          step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
        }`}>
          3
        </div>
        <div className="text-sm">Revisão</div>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0">
        <div className="sr-only">
          <h2>{step === 1 ? "Nova Postagem" : step === 2 ? "Adicionar Arquivos" : "Revisar Publicação"}</h2>
          <p>Formulário para {isEdit ? "editar" : "criar"} uma nova postagem</p>
        </div>
        
        {/* Header com nome da etapa */}
        <div className="flex items-center justify-between border-b p-4">
          <div className="flex items-center">
            <ChevronLeft 
              className="h-5 w-5 cursor-pointer mr-2" 
              onClick={step === 1 ? () => onOpenChange(false) : prevStep}
            />
            <h2 className="text-xl font-semibold">
              {step === 1 ? "Nova Postagem" : 
               step === 2 ? "Adicionar Arquivos" : 
               "Revisar Publicação"}
            </h2>
          </div>
          <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Indicador de etapas */}
        <div className="border-b">
          <StepIndicator />
        </div>
        
        {/* Conteúdo da etapa 1: Informações básicas */}
        {step === 1 && (
          <>
            <div className="p-6 space-y-6">
              {/* Nome da Postagem */}
              <div className="space-y-2">
                <Label htmlFor="title">Nome da Postagem</Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="PELE 12"
                />
              </div>
              
              {/* Categoria */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="categoryId">Categoria</Label>
                  <Button 
                    variant="ghost" 
                    className="h-auto py-0 px-2 text-blue-600 text-sm"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Nova Categoria
                  </Button>
                </div>
                <Select
                  value={formData.categoryId?.toString() || ""}
                  onValueChange={(value) => handleSelectChange("categoryId", value)}
                >
                  <SelectTrigger id="categoryId">
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                {/* Licença de Uso */}
                <div className="space-y-2">
                  <Label htmlFor="licenseType">Licença de Uso</Label>
                  <Select
                    value={formData.licenseType}
                    onValueChange={(value) => handleSelectChange("licenseType", value)}
                  >
                    <SelectTrigger id="licenseType">
                      <SelectValue>
                        {formData.licenseType === 'premium' && (
                          <div className="flex items-center">
                            <Crown className="h-4 w-4 mr-2 text-amber-500" />
                            <span>Premium</span>
                          </div>
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="premium">
                        <div className="flex items-center">
                          <Crown className="h-4 w-4 mr-2 text-amber-500" />
                          Premium
                        </div>
                      </SelectItem>
                      <SelectItem value="free">Gratuito</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Determine como sua arte pode ser usada.</p>
                </div>
                
                {/* Status */}
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => handleSelectChange("status", value as 'aprovado' | 'rascunho' | 'rejeitado')}
                  >
                    <SelectTrigger id="status">
                      <SelectValue>
                        {formData.status === 'aprovado' && (
                          <div className="flex items-center">
                            <Check className="h-4 w-4 mr-2 text-green-500" />
                            <span>Aprovado</span>
                          </div>
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="aprovado">
                        <div className="flex items-center">
                          <Check className="h-4 w-4 mr-2 text-green-500" />
                          Aprovado
                        </div>
                      </SelectItem>
                      <SelectItem value="rascunho">Rascunho</SelectItem>
                      <SelectItem value="rejeitado">Rejeitado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Tags */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="tags">Tags</Label>
                  <Button 
                    variant="ghost" 
                    className="h-auto py-0 px-2 text-blue-600 text-sm"
                    onClick={handleAddTag}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Nova Tag
                  </Button>
                </div>
                
                <div className="flex gap-2">
                  <Input
                    id="newTag"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Adicionar tag"
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  />
                </div>
                
                <div className="flex flex-wrap gap-1 mt-2">
                  {formData.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                      #{tag}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => handleRemoveTag(tag)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>
              
              {/* Formatos */}
              <div className="space-y-2">
                <Label>Formatos da Postagem</Label>
                <div className="flex flex-wrap gap-2">
                  {(['feed', 'cartaz', 'stories'] as PostFormat[]).map((format) => (
                    <Button
                      key={format}
                      type="button"
                      variant={formData.formats.includes(format) ? "default" : "outline"}
                      className={cn(
                        "h-10 capitalize flex items-center gap-2",
                        formData.formats.includes(format) && "bg-blue-50 text-blue-800 hover:bg-blue-100"
                      )}
                      onClick={() => handleFormatToggle(format)}
                    >
                      {formData.formats.includes(format) && (
                        <Check className="h-4 w-4 text-blue-600" />
                      )}
                      <span className="capitalize">{format}</span>
                      <Badge variant="secondary" className="ml-1">Essencial</Badge>
                    </Button>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="border-t p-4 flex justify-between items-center">
              <Button 
                type="button" 
                onClick={onOpenChange.bind(null, false)}
                variant="outline"
              >
                Cancelar
              </Button>
              <Button 
                type="button" 
                onClick={nextStep}
                className="bg-[#1f4ed8] hover:bg-[#1f4ed8]/90"
              >
                Próximo
              </Button>
            </div>
          </>
        )}
        
        {/* Conteúdo da etapa 2: Upload de arquivos */}
        {step === 2 && (
          <>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <div className="border-b">
                <TabsList className="p-0 h-auto bg-transparent border-b-0">
                  <TabsTrigger 
                    value="postagem" 
                    className="py-2 px-4 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-[#1f4ed8] data-[state=active]:text-[#1f4ed8] data-[state=active]:shadow-none"
                    onClick={() => {
                      setStep(1);
                      setActiveTab("postagem");
                    }}
                  >
                    Postagem
                  </TabsTrigger>
                  {formData.formats.map((format) => (
                    <TabsTrigger 
                      key={format} 
                      value={format} 
                      className="py-2 px-4 rounded-none capitalize data-[state=active]:border-b-2 data-[state=active]:border-[#1f4ed8] data-[state=active]:text-[#1f4ed8] data-[state=active]:shadow-none"
                    >
                      {format}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>
              
              <div className="p-6">
                <TabsContent key="postagem" value="postagem" className="mt-0" />
                {formData.formats.map((format) => (
                  <TabsContent key={format} value={format} className="mt-0">
                    <div className="grid grid-cols-2 gap-8">
                      {/* Área de Upload */}
                      <div>
                        <h3 className="font-medium mb-2">Upload da Arte ({format})</h3>
                        <div 
                          className="border border-dashed rounded-lg flex flex-col items-center justify-center p-8 text-center"
                          style={{
                            height: "300px",
                            width: "100%"
                          }}
                        >
                          {formData.formatFiles[format].imagePreview ? (
                            <div className="relative w-full h-full">
                              <img 
                                src={formData.formatFiles[format].imagePreview}
                                alt="Preview"
                                className="object-contain max-h-full max-w-full"
                              />
                              <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="absolute top-2 right-2 h-8 w-8"
                                onClick={() => handleRemoveImage(format)}
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <>
                              <p className="text-sm mb-4">Clique para enviar</p>
                              <p className="text-xs text-muted-foreground mb-4">Recomendado: JPG, PNG</p>
                              <input 
                                type="file"
                                id={`file-${format}`}
                                className="hidden"
                                accept="image/*"
                                onChange={(e) => handleFileChange(e, format)}
                              />
                              <Button 
                                variant="outline"
                                onClick={() => document.getElementById(`file-${format}`)?.click()}
                                className="flex items-center gap-2"
                              >
                                <Upload className="h-4 w-4" />
                                Selecionar Arquivo
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                      
                      {/* Links */}
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="font-medium">Links da Arte</h3>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="text-primary flex items-center"
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Adicionar Link
                          </Button>
                        </div>
                        
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>Extensão do Arquivo</Label>
                            <Select defaultValue="canva">
                              <SelectTrigger id={`provider-${format}`}>
                                <SelectValue placeholder="Canva" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="canva">Canva</SelectItem>
                                <SelectItem value="photoshop">Adobe Photoshop</SelectItem>
                                <SelectItem value="figma">Figma</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="space-y-2">
                            <Label>URL do arquivo</Label>
                            <div className="flex gap-2">
                              <Input
                                id={`url-${format}`}
                                placeholder="https://canva.com/design/1234"
                              />
                              <Button
                                type="button"
                                onClick={() => handleAddLink(format)}
                                className="bg-[#1f4ed8] hover:bg-[#1f4ed8]/90 flex items-center"
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                Adicionar
                              </Button>
                            </div>
                          </div>
                          
                          {formData.formatFiles[format].links.length > 0 ? (
                            <div className="space-y-2 mt-4">
                              <h4 className="text-sm font-medium">Links adicionados:</h4>
                              {formData.formatFiles[format].links.map((link) => (
                                <div key={link.id} className="flex justify-between items-center bg-muted/50 p-2 rounded">
                                  <div className="flex items-center gap-2">
                                    <LinkIcon className="h-4 w-4 text-blue-600" />
                                    <div>
                                      <p className="text-sm font-medium capitalize">{link.provider}</p>
                                      <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                        {link.url}
                                      </p>
                                    </div>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => handleRemoveLink(format, link.id)}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="p-8 flex flex-col items-center justify-center text-center border rounded-lg">
                              <LinkIcon className="h-10 w-10 mb-2 text-gray-300" />
                              <p className="text-sm text-muted-foreground">Nenhum link adicionado</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                ))}
              </div>
            </Tabs>
            
            <div className="border-t p-4 flex justify-between items-center">
              <Button 
                type="button" 
                onClick={prevStep}
                variant="outline"
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
              <Button 
                type="button" 
                onClick={nextStep}
                className="bg-[#1f4ed8] hover:bg-[#1f4ed8]/90"
              >
                Próximo
              </Button>
            </div>
          </>
        )}
        
        {/* Conteúdo da etapa 3: Revisão final */}
        {step === 3 && (
          <>
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-2">Detalhes da Postagem</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Nome</p>
                    <p className="font-medium">{formData.title}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Categoria</p>
                    <p className="font-medium text-blue-600">
                      {categories.find(cat => cat.id === formData.categoryId)?.name || "Não definida"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <p className={`font-medium flex items-center gap-1 ${
                      formData.status === 'aprovado' ? 'text-green-600' : 
                      formData.status === 'rascunho' ? 'text-orange-500' : 
                      'text-red-500'
                    }`}>
                      {formData.status === 'aprovado' ? (
                        <>
                          <Check className="h-4 w-4" />
                          Aprovado
                        </>
                      ) : formData.status === 'rascunho' ? (
                        <>
                          <Circle className="h-4 w-4" />
                          Rascunho
                        </>
                      ) : (
                        <>
                          <X className="h-4 w-4" />
                          Rejeitado
                        </>
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Licença</p>
                    <p className="font-medium flex items-center gap-1 text-amber-600">
                      {formData.licenseType === 'premium' ? (
                        <>
                          <Crown className="h-4 w-4" />
                          Premium
                        </>
                      ) : (
                        'Gratuito'
                      )}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">Tags</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {formData.tags.map((tag) => (
                        <Badge key={tag} variant="secondary">#{tag}</Badge>
                      ))}
                      {formData.tags.length === 0 && (
                        <p className="text-sm text-muted-foreground">Nenhuma tag adicionada</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium mb-3">Formatos</h3>
                <div className="grid grid-cols-3 gap-4">
                  {formData.formats.map((format) => (
                    <Card key={format} className="overflow-hidden">
                      <div 
                        className="bg-gray-100 flex items-center justify-center p-2"
                        style={{
                          height: "150px"
                        }}
                      >
                        {formData.formatFiles[format].imagePreview ? (
                          <img 
                            src={formData.formatFiles[format].imagePreview}
                            alt={`Preview de ${format}`}
                            className="object-contain max-h-full max-w-full"
                          />
                        ) : (
                          <FileImage className="h-12 w-12 text-gray-300" />
                        )}
                      </div>
                      <CardContent className="p-3">
                        <div className="flex justify-between items-center mb-1">
                          <p className="font-medium capitalize">{format}</p>
                          <Badge variant="secondary" className="capitalize py-0 px-2 text-xs">
                            {format === 'feed' ? '1:1' : format === 'cartaz' ? '4:5' : '9:16'}
                          </Badge>
                        </div>
                        
                        {formData.formatFiles[format].links.length > 0 ? (
                          <div className="space-y-1 mt-2">
                            <p className="text-xs text-muted-foreground">
                              {formData.formatFiles[format].links.length} link(s) adicionado(s):
                            </p>
                            {formData.formatFiles[format].links.map((link) => (
                              <div key={link.id} className="flex items-center gap-1">
                                <ExternalLink className="h-3 w-3 text-blue-600" />
                                <a 
                                  href={link.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-xs text-blue-600 hover:underline truncate"
                                >
                                  {link.provider}: {link.url.replace(/^https?:\/\//, '')}
                                </a>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground mt-1">
                            Sem links adicionados
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
              
              <div className="text-center p-4 rounded-lg bg-blue-50 border border-blue-200">
                <p className="text-sm text-blue-800">
                  Ao publicar, esta postagem ficará disponível para todos os usuários com acesso à plataforma.
                </p>
              </div>
            </div>
            
            <div className="border-t p-4 flex justify-between items-center">
              <Button 
                type="button" 
                onClick={prevStep}
                variant="outline"
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
              <Button 
                type="button" 
                onClick={submitForm}
                className="bg-[#1f4ed8] hover:bg-[#1f4ed8]/90"
                disabled={createPostMutation.isPending || updatePostMutation.isPending}
              >
                {createPostMutation.isPending || updatePostMutation.isPending ? (
                  "Salvando..."
                ) : (
                  isEdit ? "Atualizar Postagem" : "Publicar Postagem"
                )}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}