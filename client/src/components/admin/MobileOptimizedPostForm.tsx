import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle, DialogClose, DialogDescription, DialogHeader, DialogTrigger } from "@/components/ui/dialog";
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
  PlusCircle, XCircle, Image as ImageIcon, Upload, Check, Crown, X, ImagePlus,
  Link as LinkIcon, FileCheck, ArrowLeft, ArrowRight, ExternalLink, FileImage, Plus,
  CheckCircle, Circle, Trash, HelpCircle
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { uploadToSupabase } from "@/lib/admin/uploadToSupabase";
import { Post, Category } from "@shared/schema";
import { nanoid, cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
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
  groupId?: string; // ID para agrupar artes relacionadas (até 3)
}

export function MobileOptimizedPostForm({ open, onOpenChange, initialData, isEdit = false }: PostFormProps) {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [activeTab, setActiveTab] = useState<string>("postagem");
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
    groupId: nanoid() // ID para agrupar artes relacionadas
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
    setFormData(prev => ({ ...prev, [name]: value }));
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, format: PostFormat) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(format, file);
    }
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

  // Função para verificar se um formato tem pelo menos uma imagem ou link
  const hasImageOrLinks = (format: PostFormat): boolean => {
    const formatFile = formData.formatFiles[format];
    return (
      (formatFile.imagePreview !== null && !formatFile.imagePreview?.startsWith("blob:")) || 
      formatFile.links.length > 0
    );
  };

  // Função para verificar se pelo menos um formato selecionado tem conteúdo
  const hasAnyContent = (): boolean => {
    return formData.formats.some(format => hasImageOrLinks(format));
  };

  // Obter os formatos com conteúdo válido
  const getFormatsWithContent = (): PostFormat[] => {
    return formData.formats.filter(format => hasImageOrLinks(format));
  };

  // Verifica se pelo menos um formato tem uma imagem real (não blob)
  const hasRealImage = (): boolean => {
    return formData.formats.some(format => {
      const preview = formData.formatFiles[format].imagePreview;
      return preview && !preview.startsWith("blob:");
    });
  };

  // Preparar dados para envio no formato final
  const preparePostData = () => {
    const imageUrls: Record<string, string> = {};
    let mainImageUrl = "";
    
    // Usar a primeira imagem disponível como capa principal (incluindo blobs para preview)
    for (const format of formData.formats) {
      const preview = formData.formatFiles[format].imagePreview;
      if (preview) {
        // Mesmo uma imagem blob é usada para visualização temporária
        if (!mainImageUrl) mainImageUrl = preview;
        imageUrls[format] = preview;
      }
    }
    
    // Compilar dados dos formatos
    const formatData = formData.formats.map(format => ({
      type: format,
      imageUrl: imageUrls[format] || "",
      links: formData.formatFiles[format].links
    }));
    
    // Construir objeto da postagem
    return {
      title: formData.title,
      categoryId: formData.categoryId,
      status: formData.status,
      description: formData.description,
      imageUrl: mainImageUrl || "",  // Usa qualquer imagem, mesmo blob temporário
      uniqueCode: formData.uniqueCode,
      licenseType: formData.licenseType,
      tags: formData.tags,
      formats: formData.formats,
      formatData: JSON.stringify(formatData),
      groupId: formData.groupId
    };
  };

  const nextStep = () => {
    // Estamos na primeira etapa, validar antes de avançar para uploads
    if (step === 1) {
      // Validação básica antes de avançar
      if (!formData.title.trim()) {
        toast({
          title: "Campo obrigatório",
          description: "Por favor, insira um nome para a postagem.",
          variant: "destructive",
        });
        return;
      }
      
      if (!formData.categoryId) {
        toast({
          title: "Campo obrigatório",
          description: "Por favor, selecione uma categoria.",
          variant: "destructive",
        });
        return;
      }
      
      if (formData.formats.length === 0) {
        toast({
          title: "Selecione pelo menos um formato",
          description: "A postagem precisa ter ao menos um formato selecionado.",
          variant: "destructive",
        });
        return;
      }
      
      setStep(2);
      setActiveTab(formData.formats[0] || "postagem");
    } 
    // Estamos na segunda etapa, validar conteúdo antes de avançar para revisão
    else if (step === 2) {
      if (!hasAnyContent()) {
        toast({
          title: "Conteúdo obrigatório",
          description: "Adicione pelo menos uma imagem ou link para cada formato selecionado.",
          variant: "destructive",
        });
        return;
      }
      
      setStep(3);
    }
  };

  const prevStep = () => {
    if (step === 2) {
      setStep(1);
    } else if (step === 3) {
      setStep(2);
      setActiveTab(formData.formats[0] || "postagem");
    }
  };

  const submitForm = async () => {
    try {
      if (!hasAnyContent()) {
        toast({
          title: "Conteúdo obrigatório",
          description: "Adicione pelo menos uma imagem ou link para cada formato selecionado.",
          variant: "destructive",
        });
        return;
      }
      
      const postData = preparePostData();
      
      // Verifica se há pelo menos uma imagem (mesmo que seja blob temporário) ou link
      const hasAnyImageOrLink = formData.formats.some(format => 
        formData.formatFiles[format].imagePreview || formData.formatFiles[format].links.length > 0
      );
      
      if (!hasAnyImageOrLink) {
        toast({
          title: "Conteúdo necessário",
          description: "Adicione pelo menos uma imagem ou link para continuar.",
          variant: "destructive",
        });
        return;
      }
      
      // Enviar requisição
      if (isEdit && initialData?.id) {
        await updatePostMutation.mutateAsync(postData);
      } else {
        await createPostMutation.mutateAsync(postData);
      }
      
    } catch (error) {
      console.error("Erro ao salvar postagem:", error);
      toast({
        title: "Erro ao salvar",
        description: "Ocorreu um problema ao salvar a postagem. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 md:p-6 md:pb-8">
        <div className="sticky top-0 bg-white z-20 px-4 py-3 border-b flex flex-col">
          <div className="flex items-center justify-between">
            <button 
              className="p-2 -ml-2" 
              onClick={step > 1 ? prevStep : () => onOpenChange(false)}
              type="button"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h2 className="text-lg font-medium text-center">
              {step === 1 ? "Nova postagem" : step === 2 ? "Adicionar arquivos" : "Revisar"}
            </h2>
            <div className="w-8"></div> {/* Espaçador para manter o título centralizado */}
          </div>
          
          {/* Indicador de progresso minimalista */}
          <div className="flex items-center justify-center w-full gap-2 mt-2">
            {[1, 2, 3].map((s) => (
              <div 
                key={s}
                className={`h-1 rounded-full transition-all ${
                  s === step ? "w-8 bg-[#1f4ed8]" : 
                  s < step ? "w-6 bg-[#1f4ed8]/60" : "w-6 bg-gray-200"
                }`}
              />
            ))}
          </div>
        </div>
        
        {/* Step 1: Informações básicas */}
        {step === 1 && (
          <div className="relative h-full">
            <div className="md:hidden">
              <Tabs className="w-full" defaultValue="info">
                <TabsList className="w-full grid grid-cols-3 sticky top-[84px] bg-white z-10 border-b rounded-none h-14">
                  <TabsTrigger value="info" className="rounded-none text-sm font-medium data-[state=active]:border-b-2 data-[state=active]:border-[#1f4ed8] data-[state=active]:text-[#1f4ed8] data-[state=active]:shadow-none">
                    Básico
                  </TabsTrigger>
                  <TabsTrigger value="details" className="rounded-none text-sm font-medium data-[state=active]:border-b-2 data-[state=active]:border-[#1f4ed8] data-[state=active]:text-[#1f4ed8] data-[state=active]:shadow-none">
                    Detalhes
                  </TabsTrigger>
                  <TabsTrigger value="formats" className="rounded-none text-sm font-medium data-[state=active]:border-b-2 data-[state=active]:border-[#1f4ed8] data-[state=active]:text-[#1f4ed8] data-[state=active]:shadow-none">
                    Formatos
                  </TabsTrigger>
                </TabsList>
                
                <div className="max-h-[calc(100vh-330px)] overflow-y-auto pb-20 px-6">
                  {/* Tab 1: Dados básicos */}
                  <TabsContent value="info" className="pt-4">
                    <div className="space-y-4">
                      {/* Nome da Postagem */}
                      <div className="space-y-2">
                        <Label htmlFor="title-mobile" className="text-base font-medium">
                          Nome da Postagem
                        </Label>
                        <Input
                          id="title-mobile"
                          name="title"
                          placeholder="Ex: Cartaz de Promoção Primavera"
                          value={formData.title}
                          onChange={handleInputChange}
                          className="h-12 text-base"
                        />
                      </div>
                      
                      {/* Categoria */}
                      <div className="space-y-2">
                        <Label htmlFor="category-mobile" className="text-base font-medium">
                          Categoria
                        </Label>
                        <Select
                          value={formData.categoryId?.toString() || ""}
                          onValueChange={(value) => handleSelectChange("categoryId", value)}
                        >
                          <SelectTrigger id="category-mobile" className="h-12 text-base">
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
                      
                      {/* ID único */}
                      <div className="bg-slate-50 p-3 rounded-md border mt-4">
                        <div className="flex items-center">
                          <div className="mr-3 bg-[#1f4ed8]/10 rounded-md p-2">
                            <FileCheck className="h-5 w-5 text-[#1f4ed8]" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">ID único da postagem</p>
                            <p className="text-xs text-muted-foreground">{formData.uniqueCode}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  
                  {/* Tab 2: Detalhes adicionais */}
                  <TabsContent value="details" className="pt-4">
                    <div className="space-y-4">
                      {/* Status */}
                      <div className="space-y-2">
                        <Label htmlFor="status-mobile" className="text-base font-medium">Status</Label>
                        <Select
                          value={formData.status}
                          onValueChange={(value) => handleSelectChange("status", value as 'aprovado' | 'rascunho' | 'rejeitado')}
                        >
                          <SelectTrigger id="status-mobile" className="h-12 text-base">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="aprovado">Aprovado</SelectItem>
                            <SelectItem value="rascunho">Rascunho</SelectItem>
                            <SelectItem value="rejeitado">Rejeitado</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {/* Licença */}
                      <div className="space-y-2">
                        <Label htmlFor="license-mobile" className="text-base font-medium">Licença</Label>
                        <Select
                          value={formData.licenseType}
                          onValueChange={(value) => handleSelectChange("licenseType", value)}
                        >
                          <SelectTrigger id="license-mobile" className="h-12 text-base">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="premium">Premium</SelectItem>
                            <SelectItem value="free">Gratuito</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {/* Tags */}
                      <div className="space-y-2 pt-2">
                        <Label>Tags</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            id="newTag"
                            value={newTag}
                            onChange={(e) => setNewTag(e.target.value)}
                            placeholder="Adicionar tag"
                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                          />
                          <Button 
                            type="button" 
                            onClick={handleAddTag} 
                            size="sm" 
                            className="bg-[#1f4ed8] hover:bg-[#1f4ed8]/90 shrink-0"
                          >
                            <PlusCircle className="h-4 w-4 mr-1" />
                            Adicionar
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {formData.tags.length > 0 ? (
                            formData.tags.map((tag) => (
                              <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                                #{tag}
                                <X
                                  className="h-3 w-3 cursor-pointer text-muted-foreground hover:text-foreground"
                                  onClick={() => handleRemoveTag(tag)}
                                />
                              </Badge>
                            ))
                          ) : (
                            <p className="text-xs text-muted-foreground">Nenhuma tag adicionada</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  
                  {/* Tab 3: Formatos */}
                  <TabsContent value="formats" className="pt-4">
                    <div className="space-y-3">
                      <Label className="mb-2 block">Formatos disponíveis</Label>
                      <div className="flex flex-col gap-2">
                        {(['feed', 'cartaz', 'stories'] as PostFormat[]).map((format) => (
                          <Button
                            key={format}
                            type="button"
                            variant={formData.formats.includes(format) ? "default" : "outline"}
                            className={cn(
                              "w-full flex justify-between items-center h-12 px-4 capitalize",
                              formData.formats.includes(format) && "bg-[#1f4ed8] hover:bg-[#1f4ed8]/90"
                            )}
                            onClick={() => handleFormatToggle(format)}
                          >
                            <div className="flex items-center">
                              {format === 'feed' ? (
                                <div className="w-6 h-6 bg-gray-100 rounded mr-3 flex-shrink-0 flex items-center justify-center">
                                  <div className="w-4 h-4 bg-gray-300 rounded" />
                                </div>
                              ) : format === 'cartaz' ? (
                                <div className="w-6 h-6 bg-gray-100 rounded mr-3 flex-shrink-0 flex items-center justify-center">
                                  <div className="w-3 h-4 bg-gray-300 rounded" />
                                </div>
                              ) : (
                                <div className="w-6 h-6 bg-gray-100 rounded mr-3 flex-shrink-0 flex items-center justify-center">
                                  <div className="w-2.5 h-4 bg-gray-300 rounded" />
                                </div>
                              )}
                              <span className="font-medium">{format}</span>
                            </div>
                            
                            {formData.formats.includes(format) ? (
                              <CheckCircle className="h-5 w-5 text-white" />
                            ) : (
                              <Circle className="h-5 w-5 text-muted-foreground" />
                            )}
                          </Button>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">Selecione ao menos um formato para esta postagem.</p>
                    </div>
                  </TabsContent>
                </div>
              </Tabs>
            </div>
            
            {/* Versão Desktop - Todos os campos juntos */}
            <div className="hidden md:block space-y-6 px-6 py-4 overflow-y-auto">
              {/* Primeira linha: Nome e Categoria */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Nome da Postagem */}
                <div className="space-y-2">
                  <Label htmlFor="title-desktop">Nome da Postagem</Label>
                  <Input
                    id="title-desktop"
                    name="title"
                    placeholder="Ex: Cartaz de Promoção Primavera"
                    value={formData.title}
                    onChange={handleInputChange}
                  />
                </div>
                
                {/* Categoria */}
                <div className="space-y-2">
                  <Label htmlFor="category-desktop">Categoria</Label>
                  <div className="flex items-center gap-2">
                    <Select
                      value={formData.categoryId?.toString() || ""}
                      onValueChange={(value) => handleSelectChange("categoryId", value)}
                    >
                      <SelectTrigger id="category-desktop">
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
                    <Button variant="outline" size="icon" type="button" className="shrink-0">
                      <PlusCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* Segunda linha: Status e Licença */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Licença */}
                <div className="space-y-2">
                  <Label htmlFor="license-desktop">Licença de Uso</Label>
                  <Select
                    value={formData.licenseType}
                    onValueChange={(value) => handleSelectChange("licenseType", value)}
                  >
                    <SelectTrigger id="license-desktop">
                      {formData.licenseType === 'premium' ? (
                        <div className="flex items-center">
                          <Crown className="h-4 w-4 text-amber-500 mr-2" />
                          <span>Premium</span>
                        </div>
                      ) : (
                        <SelectValue />
                      )}
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="premium">Premium</SelectItem>
                      <SelectItem value="free">Gratuito</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">Determine como sua arte pode ser usada.</p>
                </div>
                
                {/* Status */}
                <div className="space-y-2">
                  <Label htmlFor="status-desktop">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => handleSelectChange("status", value as 'aprovado' | 'rascunho' | 'rejeitado')}
                  >
                    <SelectTrigger id="status-desktop">
                      {formData.status === 'aprovado' ? (
                        <div className="flex items-center">
                          <Check className="h-4 w-4 text-green-500 mr-2" />
                          <span>Aprovado</span>
                        </div>
                      ) : (
                        <SelectValue />
                      )}
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="aprovado">
                        <div className="flex items-center">
                          <Check className="h-4 w-4 text-green-500 mr-2" />
                          <span>Aprovado</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="rascunho">
                        <div className="flex items-center">
                          <Circle className="h-4 w-4 text-orange-500 mr-2" />
                          <span>Rascunho</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="rejeitado">
                        <div className="flex items-center">
                          <X className="h-4 w-4 text-red-500 mr-2" />
                          <span>Reprovado</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Terceira linha: Tags */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label>Tags</Label>
                  <Button variant="ghost" size="sm" className="text-xs text-blue-600 font-normal h-6 px-2">
                    <PlusCircle className="h-3 w-3 mr-1" />
                    Nova Tag
                  </Button>
                </div>
                <div className="hidden">
                  <Input
                    id="newTag-desktop"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Adicionar tag"
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  />
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {formData.tags.length > 0 ? (
                    formData.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                        #{tag}
                        <X
                          className="h-3 w-3 cursor-pointer text-muted-foreground hover:text-foreground"
                          onClick={() => handleRemoveTag(tag)}
                        />
                      </Badge>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground">Nenhuma tag adicionada</p>
                  )}
                </div>
              </div>
              
              {/* Quarta linha: Formatos */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label className="mb-2 block">Formatos da Postagem</Label>
                </div>
                
                <div className="flex flex-wrap gap-4">
                  {(['feed', 'cartaz', 'stories'] as PostFormat[]).map((format) => (
                    <div key={format} className="w-auto">
                      <Button
                        type="button"
                        variant={formData.formats.includes(format) ? "default" : "outline"}
                        className={cn(
                          "h-10 capitalize flex items-center gap-2 px-3",
                          formData.formats.includes(format) && "bg-blue-50 text-blue-800 hover:bg-blue-100 border-blue-300 hover:border-blue-400"
                        )}
                        onClick={() => handleFormatToggle(format)}
                      >
                        {formData.formats.includes(format) && (
                          <Check className="h-4 w-4 text-blue-600" />
                        )}
                        <span className="font-medium capitalize">{format}</span>
                        <Badge variant="secondary" className="ml-1">Essencial</Badge>
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Botões inferiores na versão desktop - No final da página após os formatos */}
              <div className="hidden md:flex justify-between mt-8 pt-4">
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
            </div>
            
            {/* Botão de ação principal estilo Instagram - Mobile */}
            <div className="md:hidden bg-white px-4 py-3 border-t fixed bottom-0 left-0 right-0 z-30">
              <Button 
                type="button" 
                onClick={nextStep}
                className="bg-[#1f4ed8] hover:bg-[#1f4ed8]/90 text-white w-full h-12 text-base font-medium"
              >
                Avançar
              </Button>
            </div>
          </div>
        )}
        
        {/* Step 2: Upload de arquivos */}
        {step === 2 && (
          <div className="relative h-full">
            {/* Tabs de Navegação entre Formatos */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="w-full overflow-x-auto flex-nowrap sticky top-[84px] bg-white z-10 border-b rounded-none h-14">
                <TabsTrigger value="postagem" className="rounded-none text-sm font-medium data-[state=active]:border-b-2 data-[state=active]:border-[#1f4ed8] data-[state=active]:text-[#1f4ed8] data-[state=active]:shadow-none flex-shrink-0">
                  Postagem
                </TabsTrigger>
                {formData.formats.map((format) => (
                  <TabsTrigger 
                    key={format} 
                    value={format} 
                    className="capitalize rounded-none text-sm font-medium data-[state=active]:border-b-2 data-[state=active]:border-[#1f4ed8] data-[state=active]:text-[#1f4ed8] data-[state=active]:shadow-none flex-shrink-0"
                  >
                    {format}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              <div className="max-h-[calc(100vh-330px)] overflow-y-auto pb-20">
                <div className="hidden md:flex gap-2 items-center px-6 pt-4 pb-6">
                <h2 className="text-xl font-semibold">Adicionar Arquivos</h2>
              </div>
              
              <div className="md:hidden px-6 pt-4 mb-6">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-medium">Adicionar Arquivos</h3>
                </div>
              </div>
              
              {/* Removida a duplicação dos formatos aqui */}
              
              <TabsContent value="postagem" className="pt-4 px-6">
                <div className="md:hidden space-y-5">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Editar Informações da Postagem</CardTitle>
                      <CardDescription>Modifique os detalhes básicos se necessário</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Título */}
                      <div className="space-y-2">
                        <Label htmlFor="step2-title">Título</Label>
                        <Input
                          id="step2-title"
                          name="title"
                          value={formData.title}
                          onChange={handleInputChange}
                        />
                      </div>
                      
                      {/* Categoria */}
                      <div className="space-y-2">
                        <Label htmlFor="step2-category">Categoria</Label>
                        <Select
                          value={formData.categoryId?.toString() || ""}
                          onValueChange={(value) => handleSelectChange("categoryId", value)}
                        >
                          <SelectTrigger id="step2-category">
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
                      
                      {/* Status & Licença */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="step2-status">Status</Label>
                          <Select
                            value={formData.status}
                            onValueChange={(value) => handleSelectChange("status", value as 'aprovado' | 'rascunho' | 'rejeitado')}
                          >
                            <SelectTrigger id="step2-status">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="aprovado">Aprovado</SelectItem>
                              <SelectItem value="rascunho">Rascunho</SelectItem>
                              <SelectItem value="rejeitado">Rejeitado</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="step2-license">Licença</Label>
                          <Select
                            value={formData.licenseType}
                            onValueChange={(value) => handleSelectChange("licenseType", value)}
                          >
                            <SelectTrigger id="step2-license">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="premium">Premium</SelectItem>
                              <SelectItem value="free">Gratuito</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      {/* Tags */}
                      <div className="space-y-2">
                        <Label>Tags</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            id="newTagStep2"
                            value={newTag}
                            onChange={(e) => setNewTag(e.target.value)}
                            placeholder="Adicionar tag"
                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                          />
                          <Button 
                            type="button" 
                            onClick={handleAddTag} 
                            size="sm" 
                            className="bg-[#1f4ed8] hover:bg-[#1f4ed8]/90 shrink-0"
                          >
                            <PlusCircle className="h-4 w-4 mr-1" />
                            Adicionar
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {formData.tags.length > 0 ? (
                            formData.tags.map((tag) => (
                              <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                                #{tag}
                                <X
                                  className="h-3 w-3 cursor-pointer text-muted-foreground hover:text-foreground"
                                  onClick={() => handleRemoveTag(tag)}
                                />
                              </Badge>
                            ))
                          ) : (
                            <p className="text-xs text-muted-foreground">Nenhuma tag adicionada</p>
                          )}
                        </div>
                      </div>
                      
                      {/* Formatos */}
                      <div className="space-y-2">
                        <Label>Formatos Selecionados</Label>
                        <div className="flex flex-wrap gap-2">
                          {formData.formats.map((format) => (
                            <Badge key={format} className="capitalize bg-[#1f4ed8]">
                              {format}
                            </Badge>
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          <strong>Nota:</strong> Para adicionar ou remover formatos, retorne à etapa anterior.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
                
                {/* Conteúdo para cada formato */}
                {formData.formats.map((format) => (
                  <TabsContent key={format} value={format} className="pt-4 px-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Upload da Capa da Arte */}
                      <div className="space-y-4">
                        <h3 className="font-medium">Upload da Arte ({format})</h3>
                        <div 
                          className={`border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center text-center mb-4 ${
                            formData.formatFiles[format].imagePreview ? "border-primary" : "border-border"
                          }`}
                          style={{
                            height: format === 'feed' ? "350px" : format === 'cartaz' ? "400px" : "450px",
                            margin: "0 auto",
                            width: format === 'feed' ? "350px" : format === 'cartaz' ? "320px" : "250px",
                            maxWidth: "100%"
                          }}
                        >
                          {formData.formatFiles[format].imagePreview ? (
                            <div className="relative w-full h-full">
                              <img 
                                src={formData.formatFiles[format].imagePreview}
                                alt="Preview"
                                className={`rounded w-full h-full ${
                                  format === 'feed' ? 'object-cover aspect-square' : 
                                  format === 'cartaz' ? 'object-cover aspect-[4/5]' : 
                                  'object-cover aspect-[9/16]'
                                }`}
                              />
                              <Button
                                variant="destructive"
                                size="icon"
                                className="absolute top-2 right-2 h-6 w-6"
                                onClick={() => handleRemoveImage(format)}
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <>
                              <ImagePlus className="h-10 w-10 text-muted-foreground mb-2" />
                              <p className="text-sm mb-1">
                                {format === 'feed' ? 'Formato Quadrado (1:1)' : 
                                 format === 'cartaz' ? 'Formato Retângular (4:5)' : 
                                 'Formato Vertical (9:16)'}
                              </p>
                              <p className="text-xs text-muted-foreground mb-4">
                                Selecione ou arraste uma imagem
                              </p>
                              <input 
                                type="file"
                                id={`file-${format}`}
                                className="hidden"
                                accept="image/*"
                                onChange={(e) => handleFileChange(e, format)}
                              />
                              <Button 
                                variant="outline" 
                                className="relative"
                                onClick={() => document.getElementById(`file-${format}`)?.click()}
                              >
                                <Upload className="h-4 w-4 mr-2" />
                                Selecionar Arquivo
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                      
                      {/* Links */}
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <h3 className="font-medium">Links Externos</h3>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="h-8 text-xs"
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                Adicionar Link
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md">
                              <DialogTitle>Adicionar Link Externo</DialogTitle>
                              <form 
                                id={`linkForm-${format}`}
                                className="space-y-4 pt-2"
                                onSubmit={(e) => {
                                  e.preventDefault();
                                  handleAddLink(format);
                                  const closeButton = document.querySelector('[data-dialog-close="true"]');
                                  if (closeButton && 'click' in closeButton) {
                                    (closeButton as HTMLElement).click();
                                  }
                                }}
                              >
                                <div className="space-y-2">
                                  <Label htmlFor={`provider-${format}`}>Tipo do Arquivo</Label>
                                  <Select defaultValue="canva">
                                    <SelectTrigger id={`provider-${format}`}>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="canva">Canva</SelectItem>
                                      <SelectItem value="photoshop">Photoshop</SelectItem>
                                      <SelectItem value="illustrator">Illustrator</SelectItem>
                                      <SelectItem value="figma">Figma</SelectItem>
                                      <SelectItem value="outro">Outro</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                
                                <div className="space-y-2">
                                  <Label htmlFor={`url-${format}`}>URL do arquivo</Label>
                                  <Input 
                                    id={`url-${format}`}
                                    placeholder="https://www.canva.com/design/D..."
                                  />
                                </div>
                                
                                <div className="flex justify-end gap-2 pt-2">
                                  <Button 
                                    type="button" 
                                    variant="outline"
                                    data-dialog-close="true"
                                  >
                                    Cancelar
                                  </Button>
                                  <Button 
                                    type="submit" 
                                    className="bg-[#1f4ed8] hover:bg-[#1f4ed8]/90"
                                  >
                                    Adicionar Link
                                  </Button>
                                </div>
                              </form>
                            </DialogContent>
                          </Dialog>
                        </div>
                        
                        {formData.formatFiles[format].links.length === 0 ? (
                          <div className="text-center py-8 border border-dashed rounded">
                            <LinkIcon className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                            <p className="text-sm">Nenhum link adicionado</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Adicione links para arquivos editáveis
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-2 border rounded-md p-3">
                            {formData.formatFiles[format].links.map((link) => (
                              <div key={link.id} className="flex items-start justify-between p-2 bg-muted/50 rounded text-sm">
                                <div className="flex items-start gap-2">
                                  <div className="bg-primary/10 h-8 w-8 rounded-md flex items-center justify-center flex-shrink-0 mt-1">
                                    <LinkIcon className="h-4 w-4 text-primary" />
                                  </div>
                                  <div>
                                    <p className="font-medium capitalize">{link.provider}</p>
                                    <a 
                                      href={link.url} 
                                      target="_blank" 
                                      rel="noopener noreferrer" 
                                      className="text-xs text-blue-600 hover:underline block truncate max-w-[170px]"
                                    >
                                      {link.url}
                                    </a>
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => handleRemoveLink(format, link.id)}
                                >
                                  <XCircle className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="link" className="px-0 h-auto text-xs" type="button">
                              <HelpCircle className="h-3 w-3 mr-1" />
                              <span>Por que adicionar links?</span>
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-lg">
                            <DialogTitle>Benefícios de adicionar links</DialogTitle>
                            <div className="space-y-4 pt-2">
                              <p className="text-sm">Adicionar links às suas artes permite:</p>
                              <ul className="list-disc pl-5 space-y-1 text-sm">
                                <li>Facilitar o acesso às artes originais para seus clientes</li>
                                <li>Manter versões editáveis em serviços como Canva, Photoshop, etc.</li>
                                <li>Vincular a tutoriais ou vídeos explicativos</li>
                                <li>Direcionar o público para suas redes sociais ou site</li>
                              </ul>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </TabsContent>
                ))}
              </div>
            </Tabs>
            
            {/* Botões de Navegação estilo Instagram - Mobile */}
            <div className="md:hidden bg-white px-4 py-3 border-t fixed bottom-0 left-0 right-0 z-30">
              <Button 
                type="button" 
                onClick={nextStep}
                className="bg-[#1f4ed8] hover:bg-[#1f4ed8]/90 text-white w-full h-12 text-base font-medium"
              >
                Revisar
              </Button>
            </div>
            
            {/* Versão Desktop - Botões no final da página */}
            <div className="hidden md:flex justify-between bg-white px-6 py-4 border-t sticky bottom-0 left-0 right-0 shadow-[0_-2px_4px_rgba(0,0,0,0.05)] z-30">
              <Button 
                type="button" 
                onClick={prevStep}
                variant="outline"
              >
                Cancelar
              </Button>
              
              {activeTab === "postagem" ? (
                <Button 
                  type="button" 
                  onClick={() => {
                    if (formData.formats.length > 0) {
                      setActiveTab(formData.formats[0]);
                    } else {
                      setStep(3);
                    }
                  }}
                  className="bg-[#1f4ed8] hover:bg-[#1f4ed8]/90"
                >
                  Próximo
                </Button>
              ) : (
                <Button 
                  type="button" 
                  onClick={() => {
                    if (activeTab === formData.formats[formData.formats.length - 1]) {
                      setStep(3);
                    } else {
                      const currentIndex = formData.formats.indexOf(activeTab as PostFormat);
                      setActiveTab(formData.formats[currentIndex + 1]);
                    }
                  }}
                  className="bg-[#1f4ed8] hover:bg-[#1f4ed8]/90"
                >
                  {activeTab === formData.formats[formData.formats.length - 1] ? "Publicar Postagem" : "Próximo"}
                </Button>
              )}
            </div>
          </div>
        )}
        
        {/* Step 3: Revisão */}
        {step === 3 && (
          <div className="relative h-full overflow-y-auto pb-20">
            <div className="px-6 py-4 space-y-6">
              <div className="text-center mb-4">
                <h2 className="text-lg font-semibold">Revise os detalhes da sua postagem</h2>
                <p className="text-sm text-muted-foreground">
                  Confirme que todas as informações estão corretas antes de publicar
                </p>
              </div>
              
              {/* Resumo das informações */}
              <Card className="mb-6">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Dados da Postagem</CardTitle>
                  <CardDescription>Informações básicas da postagem</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-0">
                  <div>
                    <p className="text-sm mb-2"><strong>Título:</strong> {formData.title}</p>
                    <p className="text-sm mb-2">
                      <strong>Categoria:</strong> {
                        categories.find(cat => cat.id === formData.categoryId)?.name || "Não definida"
                      }
                    </p>
                    <p className="text-sm mb-2">
                      <strong>Status:</strong> <span className={`py-1 px-2 rounded-full text-xs ${
                        formData.status === 'aprovado' 
                          ? 'bg-green-100 text-green-800' 
                          : formData.status === 'rascunho' 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : 'bg-red-100 text-red-800'
                      }`}>{formData.status}</span>
                    </p>
                    <p className="text-sm mb-2">
                      <strong>Licença:</strong> {
                        formData.licenseType === 'premium' 
                          ? <span className="inline-flex items-center gap-1">
                              <Crown className="h-3 w-3 text-amber-500" />
                              Premium
                            </span>
                          : 'Gratuito'
                      }
                    </p>
                  </div>
                  <div>
                    <p className="text-sm mb-2"><strong>ID único:</strong> {formData.uniqueCode}</p>
                    <p className="text-sm mb-2"><strong>Grupo de artes:</strong> {formData.groupId}</p>
                    <p className="text-sm mb-2"><strong>Tags:</strong></p>
                    <div className="flex flex-wrap gap-1">
                      {formData.tags.length > 0 ? (
                        formData.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="py-0 px-2 text-xs">
                            #{tag}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground">Nenhuma tag</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Resumo dos formatos com conteúdo */}
              <div className="space-y-4">
                <h3 className="text-base font-medium mb-2">Formatos da Arte</h3>
                {formData.formats.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {formData.formats.map((format) => (
                      <Card key={format} className="overflow-hidden">
                        <div className={`relative ${
                          format === 'feed' ? 'aspect-square' : 
                          format === 'cartaz' ? 'aspect-[4/5]' : 
                          'aspect-[9/16]'
                        }`}>
                          {formData.formatFiles[format].imagePreview ? (
                            <img 
                              src={formData.formatFiles[format].imagePreview}
                              alt={`Preview de ${format}`}
                              className="object-cover w-full h-full"
                            />
                          ) : (
                            <div className="flex items-center justify-center w-full h-full bg-muted">
                              <FileImage className="h-12 w-12 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <CardContent className="p-3">
                          <div className="flex justify-between items-center mb-1">
                            <h4 className="font-medium capitalize">{format}</h4>
                            <Badge variant="secondary" className="capitalize font-normal px-2 py-0 text-xs">
                              {format === 'feed' ? '1:1' : format === 'cartaz' ? '4:5' : '9:16'}
                            </Badge>
                          </div>
                          
                          {formData.formatFiles[format].links.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs text-muted-foreground mb-1">{formData.formatFiles[format].links.length} link(s) adicionado(s)</p>
                              <div className="space-y-1">
                                {formData.formatFiles[format].links.map((link) => (
                                  <div key={link.id} className="flex items-center text-xs">
                                    <LinkIcon className="h-3 w-3 mr-1 text-blue-500" />
                                    <span className="capitalize mr-1">{link.provider}:</span>
                                    <a 
                                      href={link.url} 
                                      target="_blank" 
                                      rel="noopener noreferrer" 
                                      className="text-blue-600 hover:underline truncate max-w-[120px]"
                                    >
                                      {link.url.replace(/^https?:\/\//, '')}
                                    </a>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-8 border border-dashed rounded">
                    <p className="text-muted-foreground">Nenhum formato selecionado</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Botão de publicação estilo Instagram - Mobile */}
            <div className="md:hidden bg-white px-4 py-3 border-t fixed bottom-0 left-0 right-0 z-30">
              <Button 
                type="button" 
                onClick={submitForm}
                className="bg-[#1f4ed8] hover:bg-[#1f4ed8]/90 text-white w-full h-12 text-base font-medium"
                disabled={createPostMutation.isPending || updatePostMutation.isPending}
              >
                {createPostMutation.isPending || updatePostMutation.isPending ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Salvando...
                  </div>
                ) : (
                  isEdit ? "Atualizar postagem" : "Publicar postagem"
                )}
              </Button>
            </div>
            
            {/* Botões de Navegação - Desktop */}
            <div className="hidden md:flex justify-between bg-white px-6 py-4 border-t sticky bottom-0 left-0 right-0 shadow-[0_-2px_4px_rgba(0,0,0,0.05)] z-30">
              <Button 
                type="button" 
                onClick={prevStep}
                variant="outline"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <Button 
                type="button" 
                onClick={submitForm}
                className="bg-[#1f4ed8] hover:bg-[#1f4ed8]/90"
                disabled={createPostMutation.isPending || updatePostMutation.isPending}
              >
                {createPostMutation.isPending || updatePostMutation.isPending ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Salvando...
                  </>
                ) : (
                  <>
                    {isEdit ? "Atualizar" : "Publicar"}
                    <Check className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}