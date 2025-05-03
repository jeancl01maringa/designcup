import React, { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
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
  ChevronLeft, Crown
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { uploadToSupabase } from "@/lib/admin/uploadToSupabase";
import { Post, Category } from "@shared/schema";
import { nanoid, cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

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

export function MobileOptimizedPostForm({ open, onOpenChange, initialData, isEdit = false }: PostFormProps) {
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
      const formatData = formData.formats.map(format => ({
        type: format,
        imageUrl: formData.formatFiles[format].imagePreview || "",
        links: formData.formatFiles[format].links
      }));
      
      const post = {
        title: formData.title,
        categoryId: formData.categoryId,
        status: formData.status,
        description: formData.description,
        licenseType: formData.licenseType,
        tags: formData.tags,
        formats: formData.formats,
        formatData: formatData,
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0">
        {step === 1 && (
          <>
            <div className="flex items-center justify-between border-b p-4">
              <h2 className="text-xl font-semibold">Nova Postagem</h2>
              <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="p-4 space-y-6">
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
                    className="h-auto py-0 px-0 text-primary text-sm"
                  >
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
                      <SelectItem value="premium">Premium</SelectItem>
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
                      <SelectItem value="aprovado">Aprovado</SelectItem>
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
                    className="h-auto py-0 px-0 text-primary text-sm"
                    onClick={handleAddTag}
                  >
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
        
        {step === 2 && (
          <>
            <div className="flex items-center justify-between border-b p-4">
              <h2 className="text-xl font-semibold">Adicionar arquivos</h2>
              <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <Tabs defaultValue="feed" value={activeTab} onValueChange={setActiveTab}>
              <div className="border-b">
                <TabsList className="p-0 h-auto bg-transparent border-b-0">
                  <TabsTrigger 
                    value="postagem" 
                    className="py-2 px-4 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-[#1f4ed8] data-[state=active]:text-[#1f4ed8] data-[state=active]:shadow-none"
                    onClick={() => setStep(1)}
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
                            className="text-primary"
                            onClick={() => handleAddLink(format)}
                          >
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
                            <Input
                              id={`url-${format}`}
                              placeholder="https://canva.com/design/1234"
                            />
                          </div>
                          
                          <div className="p-8 flex flex-col items-center justify-center text-center border rounded-lg">
                            <LinkIcon className="h-10 w-10 mb-2 text-gray-300" />
                            <p className="text-sm text-muted-foreground">Nenhum link adicionado</p>
                          </div>
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
        
        {step === 3 && (
          <>
            <div className="flex items-center justify-between border-b p-4">
              <h2 className="text-xl font-semibold">Revisar publicação</h2>
              <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-2">Detalhes da Postagem</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Nome</p>
                    <p className="font-medium">{formData.title}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Categoria</p>
                    <p className="font-medium">{
                      categories.find(cat => cat.id === formData.categoryId)?.name || "Não definida"
                    }</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <p className="font-medium flex items-center gap-1">
                      {formData.status === 'aprovado' && <Check className="h-4 w-4 text-green-500" />}
                      {formData.status}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Tags</p>
                    <div className="flex flex-wrap gap-1">
                      {formData.tags.map((tag) => (
                        <Badge key={tag} variant="secondary">#{tag}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">Formatos</h3>
                <div className="grid grid-cols-3 gap-4">
                  {formData.formats.map((format) => (
                    <div key={format} className="border rounded-lg overflow-hidden">
                      <div 
                        className="bg-gray-100 flex items-center justify-center"
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
                          <p className="text-sm text-muted-foreground">Sem imagem</p>
                        )}
                      </div>
                      <div className="p-3">
                        <p className="font-medium capitalize">{format}</p>
                        <p className="text-xs text-muted-foreground">
                          {formData.formatFiles[format].links.length} links
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
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
                  isEdit ? "Atualizar postagem" : "Publicar postagem"
                )}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}