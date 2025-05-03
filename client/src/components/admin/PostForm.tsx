import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle, DialogClose, DialogDescription } from "@/components/ui/dialog";
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
  PlusCircle, XCircle, Image, Upload, Check, Crown, X, 
  Link as LinkIcon, FileCheck, ArrowLeft, ExternalLink, FileImage, 
  CheckCircle, Circle
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

export function PostForm({ open, onOpenChange, initialData, isEdit = false }: PostFormProps) {
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
    const linkForm = document.getElementById(`linkForm-${format}`) as HTMLFormElement;
    const provider = (document.getElementById(`provider-${format}`) as HTMLSelectElement).value;
    const url = (document.getElementById(`url-${format}`) as HTMLInputElement).value;
    
    if (url.trim()) {
      setFormData(prev => ({
        ...prev,
        formatFiles: {
          ...prev.formatFiles,
          [format]: {
            ...prev.formatFiles[format],
            links: [
              ...prev.formatFiles[format].links,
              { provider, url, id: nanoid() }
            ]
          }
        }
      }));
      
      // Limpar campo de URL
      if (linkForm) {
        linkForm.reset();
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
        <div className="sticky top-0 bg-white z-20 pt-6 px-6 pb-3 border-b">
          <DialogTitle className="text-xl font-bold">
            {step === 1 ? "Nova Postagem" : step === 2 ? "Adicionar Arquivos" : "Revisar Postagem"}
          </DialogTitle>
          <DialogDescription>
            {step === 1 ? "Preencha os dados básicos da postagem" : 
             step === 2 ? "Adicione imagens e links para cada formato" : 
             "Revise todos os dados antes de publicar"}
          </DialogDescription>
          
          {/* Indicador de progresso */}
          <div className="flex items-center justify-center mb-4 pt-2">
            <div className="flex items-center w-full max-w-md">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                step >= 1 ? "bg-[#1f4ed8]/10 text-[#1f4ed8] border border-[#1f4ed8]/30" : "bg-gray-100 text-gray-400 border border-gray-300"
              }`}>
                1
              </div>
              <div className={`flex-1 h-1 mx-2 ${
                step > 1 ? "bg-[#1f4ed8]" : "bg-gray-200"
              }`}></div>
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                step >= 2 ? "bg-[#1f4ed8]/10 text-[#1f4ed8] border border-[#1f4ed8]/30" : "bg-gray-100 text-gray-400 border border-gray-300"
              }`}>
                2
              </div>
              <div className={`flex-1 h-1 mx-2 ${
                step > 2 ? "bg-[#1f4ed8]" : "bg-gray-200"
              }`}></div>
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                step >= 3 ? "bg-[#1f4ed8]/10 text-[#1f4ed8] border border-[#1f4ed8]/30" : "bg-gray-100 text-gray-400 border border-gray-300"
              }`}>
                3
              </div>
            </div>
          </div>
          
          <div className="flex justify-center">
            <p className="text-sm text-muted-foreground">
              Etapa {step} de 3: {
                step === 1 ? "Informações da postagem" : 
                step === 2 ? "Upload de arquivos" : 
                "Revisão e confirmação"
              }
            </p>
          </div>
        </div>
        
        {step === 1 && (
          <div className="relative h-full">
            {/* Mobile - Três etapas simples */}
            <div className="md:hidden">
              <Tabs className="w-full" defaultValue="info">
                <TabsList className="w-full grid grid-cols-3 sticky top-[129px] bg-white z-10 border-b rounded-none shadow-sm">
                  <TabsTrigger value="info" className="rounded-none">Básico</TabsTrigger>
                  <TabsTrigger value="meta" className="rounded-none">Detalhes</TabsTrigger>
                  <TabsTrigger value="formats" className="rounded-none">Formatos</TabsTrigger>
                </TabsList>
                
                <div className="max-h-[calc(100vh-330px)] overflow-y-auto pb-16 px-6">
                  {/* Dados básicos */}
                  <TabsContent value="info">
                    {/* Nome da Postagem */}
                    <div className="space-y-2 pt-4">
                      <Label htmlFor="title-mobile">Nome da Postagem</Label>
                      <Input
                        id="title-mobile"
                        name="title"
                        placeholder="Ex: Cartaz de Promoção Primavera"
                        value={formData.title}
                        onChange={handleInputChange}
                      />
                    </div>
                    
                    {/* Categoria */}
                    <div className="flex items-center gap-2 mt-4">
                      <div className="flex-1 space-y-2">
                        <Label htmlFor="category-mobile">Categoria</Label>
                        <Select
                          value={formData.categoryId?.toString() || ""}
                          onValueChange={(value) => handleSelectChange("categoryId", value)}
                        >
                          <SelectTrigger id="category-mobile">
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
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="self-end h-10 w-10"
                        title="Nova Categoria"
                      >
                        <PlusCircle className="h-4 w-4" />
                      </Button>
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
                  </TabsContent>
                  
                  {/* Status e licença */}
                  <TabsContent value="meta">
                    {/* Licença & Status */}
                    <div className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <Label htmlFor="license-mobile">Licença de Uso</Label>
                        <Select
                          value={formData.licenseType}
                          onValueChange={(value) => handleSelectChange("licenseType", value)}
                        >
                          <SelectTrigger id="license-mobile">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="premium">
                              <div className="flex items-center gap-2">
                                <Crown className="h-4 w-4 text-amber-500" />
                                <span>Premium</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="free">Gratuito</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">Determine como sua arte pode ser usada.</p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="status-mobile">Status</Label>
                        <Select
                          value={formData.status}
                          onValueChange={(value) => handleSelectChange("status", value as 'aprovado' | 'rascunho' | 'rejeitado')}
                        >
                          <SelectTrigger id="status-mobile">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="aprovado">
                              <div className="flex items-center gap-2">
                                <Check className="h-4 w-4 text-green-500" />
                                <span>Aprovado</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="rascunho">Rascunho</SelectItem>
                            <SelectItem value="rejeitado">Rejeitado</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {/* Tags */}
                      <div className="space-y-2 mt-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="tags-mobile">Tags</Label>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 text-xs"
                            onClick={() => document.getElementById("newTag-mobile")?.focus()}
                          >
                            <PlusCircle className="h-3 w-3 mr-1" />
                            <span>Nova Tag</span>
                          </Button>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <Input 
                              id="newTag-mobile"
                              placeholder="Digite uma tag e pressione Enter"
                              value={newTag}
                              onChange={(e) => setNewTag(e.target.value)}
                              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag())}
                            />
                          </div>
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={handleAddTag}
                            className="h-10"
                          >
                            Adicionar
                          </Button>
                        </div>
                        
                        {formData.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {formData.tags.map((tag) => (
                              <Badge 
                                key={tag} 
                                variant="secondary"
                                className="flex items-center gap-1 py-1 px-2"
                              >
                                <span>#{tag}</span>
                                <X
                                  className="h-3 w-3 cursor-pointer hover:text-destructive"
                                  onClick={() => handleRemoveTag(tag)}
                                />
                              </Badge>
                            ))}
                          </div>
                        )}
                        
                        {/* Tags Comuns */}
                        {formData.tags.length === 0 && (
                          <div className="mt-2">
                            <p className="text-xs text-muted-foreground mb-2">Tags comuns:</p>
                            <div className="flex flex-wrap gap-2">
                              <Badge 
                                variant="outline" 
                                className="cursor-pointer"
                                onClick={() => {
                                  setFormData(prev => ({
                                    ...prev,
                                    tags: [...prev.tags, "preenchimento_labial"]
                                  }))
                                }}
                              >
                                #preenchimento_labial
                              </Badge>
                              <Badge 
                                variant="outline" 
                                className="cursor-pointer"
                                onClick={() => {
                                  setFormData(prev => ({
                                    ...prev,
                                    tags: [...prev.tags, "botox"]
                                  }))
                                }}
                              >
                                #botox
                              </Badge>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </TabsContent>
                  
                  {/* Formatos */}
                  <TabsContent value="formats">
                    {/* Formatos da Postagem (Mobile) */}
                    <div className="space-y-2 pt-4">
                      <Label>Formatos da Postagem</Label>
                      <div className="grid grid-cols-1 gap-2 mt-4">
                        {[
                          { id: "feed", label: "FEED", description: "Quadrado 1080x1080" },
                          { id: "cartaz", label: "CARTAZ", description: "Retângulo 1080x1350" },
                          { id: "stories", label: "STORIES", description: "Vertical 1080x1920" }
                        ].map((format) => (
                          <div key={format.id}>
                            <Button
                              type="button"
                              variant="outline"
                              className={`w-full h-12 flex items-center justify-start px-4 rounded-lg transition-colors ${
                                formData.formats.includes(format.id as PostFormat) 
                                  ? "bg-[#1f4ed8]/5 text-[#1f4ed8] border-[#1f4ed8]/30 shadow-sm hover:bg-[#1f4ed8]/10" 
                                  : "border-gray-200 hover:bg-gray-50"
                              }`}
                              onClick={() => handleFormatToggle(format.id as PostFormat)}
                            >
                              <div className="flex items-center">
                                {formData.formats.includes(format.id as PostFormat) ? (
                                  <CheckCircle className="h-5 w-5 text-[#1f4ed8] mr-3 flex-shrink-0" />
                                ) : (
                                  <Circle className="h-5 w-5 text-gray-300 mr-3 flex-shrink-0" />
                                )}
                                <div className="flex flex-col items-start">
                                  <span className="font-medium text-sm">{format.label}</span>
                                  <span className="text-xs text-muted-foreground">{format.description}</span>
                                </div>
                              </div>
                            </Button>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">Selecione ao menos um formato para esta postagem.</p>
                    </div>
                  </TabsContent>
                </div>
              </Tabs>
            </div>
            
            {/* Versão Desktop - Todos os campos juntos */}
            <div className="hidden md:block space-y-6 px-6 py-4 overflow-y-auto max-h-[70vh]">
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
              <div className="flex items-center gap-2">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="category-desktop">Categoria</Label>
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
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="self-end h-10 w-10"
                  title="Nova Categoria"
                >
                  <PlusCircle className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Licença & Status lado a lado */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="license-desktop">Licença de Uso</Label>
                  <Select
                    value={formData.licenseType}
                    onValueChange={(value) => handleSelectChange("licenseType", value)}
                  >
                    <SelectTrigger id="license-desktop">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="premium">
                        <div className="flex items-center gap-2">
                          <Crown className="h-4 w-4 text-amber-500" />
                          <span>Premium</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="free">Gratuito</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Determine como sua arte pode ser usada.</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="status-desktop">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => handleSelectChange("status", value as 'aprovado' | 'rascunho' | 'rejeitado')}
                  >
                    <SelectTrigger id="status-desktop">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="aprovado">
                        <div className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-500" />
                          <span>Aprovado</span>
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
                <div className="flex items-center justify-between">
                  <Label htmlFor="tags-desktop">Tags</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => document.getElementById("newTag-desktop")?.focus()}
                  >
                    <PlusCircle className="h-3 w-3 mr-1" />
                    <span>Nova Tag</span>
                  </Button>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <Input 
                      id="newTag-desktop"
                      placeholder="Digite uma tag e pressione Enter"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag())}
                    />
                  </div>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleAddTag}
                    className="h-10"
                  >
                    Adicionar
                  </Button>
                </div>
                
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.tags.map((tag) => (
                      <Badge 
                        key={tag} 
                        variant="secondary"
                        className="flex items-center gap-1 py-1 px-2"
                      >
                        <span>#{tag}</span>
                        <X
                          className="h-3 w-3 cursor-pointer hover:text-destructive"
                          onClick={() => handleRemoveTag(tag)}
                        />
                      </Badge>
                    ))}
                  </div>
                )}
                
                {/* Tags Comuns */}
                {formData.tags.length === 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-muted-foreground mb-2">Tags comuns:</p>
                    <div className="flex flex-wrap gap-2">
                      <Badge 
                        variant="outline" 
                        className="cursor-pointer"
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            tags: [...prev.tags, "preenchimento_labial"]
                          }))
                        }}
                      >
                        #preenchimento_labial
                      </Badge>
                      <Badge 
                        variant="outline" 
                        className="cursor-pointer"
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            tags: [...prev.tags, "botox"]
                          }))
                        }}
                      >
                        #botox
                      </Badge>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Formatos da Postagem (Desktop) */}
              <div className="space-y-2">
                <Label>Formatos da Postagem</Label>
                <div className="grid grid-cols-3 gap-2 mt-4">
                  {[
                    { id: "feed", label: "FEED", description: "Quadrado 1080x1080" },
                    { id: "cartaz", label: "CARTAZ", description: "Retângulo 1080x1350" },
                    { id: "stories", label: "STORIES", description: "Vertical 1080x1920" }
                  ].map((format) => (
                    <div key={format.id}>
                      <Button
                        type="button"
                        variant="outline"
                        className={`w-full h-12 flex items-center justify-start px-4 rounded-lg transition-colors ${
                          formData.formats.includes(format.id as PostFormat) 
                            ? "bg-[#1f4ed8]/5 text-[#1f4ed8] border-[#1f4ed8]/30 shadow-sm hover:bg-[#1f4ed8]/10" 
                            : "border-gray-200 hover:bg-gray-50"
                        }`}
                        onClick={() => handleFormatToggle(format.id as PostFormat)}
                      >
                        <div className="flex items-center">
                          {formData.formats.includes(format.id as PostFormat) ? (
                            <CheckCircle className="h-5 w-5 text-[#1f4ed8] mr-3 flex-shrink-0" />
                          ) : (
                            <Circle className="h-5 w-5 text-gray-300 mr-3 flex-shrink-0" />
                          )}
                          <div className="flex flex-col items-start">
                            <span className="font-medium text-sm">{format.label}</span>
                            <span className="text-xs text-muted-foreground">{format.description}</span>
                          </div>
                        </div>
                      </Button>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">Selecione ao menos um formato para esta postagem.</p>
              </div>
            </div>
            
            {/* Botões de Navegação - Sempre visíveis no bottom */}
            <div className="flex justify-between border-t bg-white px-6 py-4 sticky bottom-0 left-0 right-0 shadow-[0_-2px_4px_rgba(0,0,0,0.05)] z-30">
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancelar
                </Button>
              </DialogClose>
              <Button 
                type="button" 
                onClick={nextStep}
                className="bg-[#1f4ed8] hover:bg-[#1f4ed8]/90"
              >
                Próximo
              </Button>
            </div>
          </div>
        )}
        
        {step === 2 && (
          <div className="space-y-6">
            {/* Tabs de Navegação entre Formatos */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="w-full justify-start">
                <TabsTrigger value="postagem">Postagem</TabsTrigger>
                {formData.formats.map((format) => (
                  <TabsTrigger key={format} value={format} className="capitalize">
                    {format}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              <TabsContent value="postagem" className="pt-4">
                <div className="space-y-5">
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
                  
                  <div className="bg-slate-50 p-3 rounded-md border">
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
              
              {/* Conteúdo para cada formato */}
              {formData.formats.map((format) => (
                <TabsContent key={format} value={format} className="space-y-6 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Upload da Capa da Arte */}
                    <div className="space-y-4">
                      <h3 className="font-medium">Upload da Capa da Arte</h3>
                      <div 
                        className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center ${
                          formData.formatFiles[format].imagePreview ? "border-primary" : "border-border"
                        }`}
                        style={{
                          height: "320px",
                          margin: "0 auto",
                          width: format === 'feed' ? "320px" : format === 'cartaz' ? "260px" : "180px",
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
                              onClick={() => {
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
                                }))
                              }}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <>
                            <Image className="h-10 w-10 text-muted-foreground mb-2" />
                            <p className="text-sm text-muted-foreground mb-4">
                              Clique para enviar <br />
                              <span className="text-xs">Recomendado: JPG, PNG</span>
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
                              className="mb-2"
                              onClick={() => document.getElementById(`file-${format}`)?.click()}
                            >
                              <Upload className="h-4 w-4 mr-2" />
                              Selecionar Arquivo
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                    
                    {/* Links da Arte */}
                    <div className="space-y-4">
                      <h3 className="font-medium">Links da Arte</h3>
                      <form 
                        id={`linkForm-${format}`}
                        className="space-y-4"
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleAddLink(format);
                        }}
                      >
                        <div className="space-y-2">
                          <Label htmlFor={`provider-${format}`}>Extensão do Arquivo</Label>
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
                        
                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <Label htmlFor={`url-${format}`}>URL do arquivo</Label>
                            <Input 
                              id={`url-${format}`}
                              placeholder="https://www.canva.com/design/D..."
                            />
                          </div>
                          <Button 
                            type="submit" 
                            className="self-end"
                          >
                            Adicionar
                          </Button>
                        </div>
                      </form>
                      
                      <div className="pt-2">
                        <p className="text-sm font-medium mb-2">Links adicionados:</p>
                        
                        {formData.formatFiles[format].links.length === 0 ? (
                          <p className="text-sm text-muted-foreground italic">Nenhum link adicionado</p>
                        ) : (
                          <ul className="space-y-2">
                            {formData.formatFiles[format].links.map((link) => (
                              <li 
                                key={link.id} 
                                className="flex items-center justify-between p-2 bg-muted rounded text-sm"
                              >
                                <div>
                                  <Badge variant="outline" className="capitalize mb-1">
                                    {link.provider}
                                  </Badge>
                                  <a 
                                    href={link.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="text-xs max-w-[200px] truncate text-blue-600 hover:underline block"
                                  >
                                    {link.url}
                                  </a>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => handleRemoveLink(format, link.id)}
                                >
                                  <XCircle className="h-4 w-4 text-destructive" />
                                </Button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
            
            {/* Botões de Navegação */}
            <div className="flex justify-between mt-8">
              <Button 
                type="button" 
                variant="outline" 
                onClick={prevStep}
                className="flex items-center gap-1"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
              <Button 
                type="button" 
                onClick={nextStep}
                className="bg-[#1f4ed8] hover:bg-[#1f4ed8]/90"
              >
                Avançar para Revisão
              </Button>
            </div>
          </div>
        )}
        
        {step === 3 && (
          // ETAPA 3: Revisão final e confirmação
          <div className="space-y-6">
            <div className="bg-slate-50 p-4 rounded-md border">
              <div className="flex items-center gap-2 mb-4 text-[#1f4ed8]">
                <FileCheck className="h-5 w-5" />
                <h3 className="font-medium text-lg">Revise os dados antes de publicar</h3>
              </div>
              
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
                <h3 className="font-medium text-md">Formatos e Conteúdos</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {formData.formats.map(format => (
                    <Card key={format} className={cn(
                      "overflow-hidden transition-all",
                      hasImageOrLinks(format) 
                        ? "border-[#1f4ed8]/30" 
                        : "border-gray-200 opacity-60"
                    )}>
                      <CardHeader className="pb-2 pt-4 px-4">
                        <CardTitle className="text-md capitalize">{format}</CardTitle>
                        <CardDescription>{
                          hasImageOrLinks(format) 
                            ? "Conteúdo adicionado" 
                            : "Nenhum conteúdo"
                        }</CardDescription>
                      </CardHeader>
                      <CardContent className="p-0">
                        {formData.formatFiles[format].imagePreview ? (
                          <div className="relative border-t border-b py-3 flex items-center justify-center">
                            <div 
                              className="overflow-hidden flex items-center justify-center bg-slate-50"
                              style={{
                                width: format === 'feed' ? "150px" : format === 'cartaz' ? "120px" : "85px",
                                height: format === 'feed' ? "150px" : format === 'cartaz' ? "150px" : "150px"
                              }}
                            >
                              <img 
                                src={formData.formatFiles[format].imagePreview} 
                                alt={`Preview da ${format}`} 
                                className="w-full h-full object-contain"
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center h-16 border-t border-b bg-slate-50">
                            <FileImage className="h-6 w-6 text-slate-300" />
                          </div>
                        )}
                        <div className="p-4 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium">Links:</span>
                            <span className="text-xs">
                              {formData.formatFiles[format].links.length}
                            </span>
                          </div>
                          {formData.formatFiles[format].links.length > 0 && (
                            <div className="pt-1">
                              {formData.formatFiles[format].links.map(link => (
                                <div key={link.id} className="flex items-center text-xs gap-1 mb-1">
                                  <ExternalLink className="h-3 w-3 flex-shrink-0 text-blue-600" />
                                  <a 
                                    href={link.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="truncate text-blue-600 hover:underline"
                                  >
                                    {link.provider}: {link.url}
                                  </a>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Botões de Navegação */}
            <div className="flex justify-between mt-8">
              <Button 
                type="button" 
                variant="outline" 
                onClick={prevStep}
                className="flex items-center gap-1"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar para Editar
              </Button>
              <Button 
                type="button" 
                onClick={submitForm}
                className="bg-[#1f4ed8] hover:bg-[#1f4ed8]/90"
              >
                Publicar Postagem
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}