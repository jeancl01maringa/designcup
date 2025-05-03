import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle, DialogClose } from "@/components/ui/dialog";
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
import { PlusCircle, XCircle, Image, Upload, Check, Crown, X } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { uploadToSupabase } from "@/lib/admin/uploadToSupabase";
import { Post, Category } from "@shared/schema";
import { nanoid } from "@/lib/utils";
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
    formats: ["feed", "cartaz", "stories"],
    formatFiles: {
      feed: { ...defaultFormatFile },
      cartaz: { ...defaultFormatFile },
      stories: { ...defaultFormatFile }
    },
    uniqueCode: uniquePostId
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
        formats: initialData.formats || ["feed", "cartaz", "stories"],
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

  const nextStep = () => {
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
  };

  const prevStep = () => {
    setStep(1);
  };

  const submitForm = async () => {
    try {
      // Preparar imagens e links
      const imageUrls: Record<string, string> = {};
      let mainImageUrl = "";
      
      // Usar a primeira imagem disponível como capa principal
      for (const format of formData.formats) {
        const preview = formData.formatFiles[format].imagePreview;
        if (preview && !preview.startsWith("blob:")) {
          if (!mainImageUrl) mainImageUrl = preview;
          imageUrls[format] = preview;
        }
      }
      
      if (!mainImageUrl) {
        toast({
          title: "Imagem obrigatória",
          description: "Por favor, adicione pelo menos uma imagem.",
          variant: "destructive",
        });
        return;
      }
      
      // Compilar dados dos formatos
      const formatData = formData.formats.map(format => ({
        type: format,
        imageUrl: imageUrls[format] || "",
        links: formData.formatFiles[format].links
      }));
      
      // Construir objeto da postagem
      const postData = {
        title: formData.title,
        categoryId: formData.categoryId,
        status: formData.status,
        description: formData.description,
        imageUrl: mainImageUrl,
        uniqueCode: formData.uniqueCode,
        licenseType: formData.licenseType,
        tags: formData.tags,
        formats: formData.formats,
        formatData: JSON.stringify(formatData)
      };
      
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
      <DialogContent className="max-w-3xl h-[80vh] overflow-y-auto">
        <DialogTitle className="text-xl font-bold">
          {step === 1 ? "Nova Postagem" : "Adicionar Arquivos"}
        </DialogTitle>
        
        {step === 1 ? (
          <div className="space-y-6">
            {/* Nome da Postagem */}
            <div className="space-y-2">
              <Label htmlFor="title">Nome da Postagem</Label>
              <Input
                id="title"
                name="title"
                placeholder="Ex: Cartaz de Promoção Primavera"
                value={formData.title}
                onChange={handleInputChange}
              />
            </div>
            
            {/* Categoria */}
            <div className="flex items-center gap-2">
              <div className="flex-1 space-y-2">
                <Label htmlFor="category">Categoria</Label>
                <Select
                  value={formData.categoryId?.toString() || ""}
                  onValueChange={(value) => handleSelectChange("categoryId", value)}
                >
                  <SelectTrigger>
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
                <Label htmlFor="license">Licença de Uso</Label>
                <Select
                  value={formData.licenseType}
                  onValueChange={(value) => handleSelectChange("licenseType", value)}
                >
                  <SelectTrigger>
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
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleSelectChange("status", value as 'aprovado' | 'rascunho' | 'rejeitado')}
                >
                  <SelectTrigger>
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
                <Label htmlFor="tags">Tags</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => document.getElementById("newTag")?.focus()}
                >
                  <PlusCircle className="h-3 w-3 mr-1" />
                  <span>Nova Tag</span>
                </Button>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <Input 
                    id="newTag"
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
            
            {/* Formatos da Postagem */}
            <div className="space-y-2">
              <Label>Formatos da Postagem</Label>
              <div className="flex flex-wrap gap-4">
                {[
                  { id: "feed", label: "FEED", essential: true },
                  { id: "cartaz", label: "CARTAZ", essential: true },
                  { id: "stories", label: "STORIES", essential: true }
                ].map((format) => (
                  <div key={format.id} className="flex flex-col items-center">
                    <Button
                      type="button"
                      variant={formData.formats.includes(format.id as PostFormat) ? "default" : "outline"}
                      className="w-24 relative"
                      onClick={() => handleFormatToggle(format.id as PostFormat)}
                    >
                      {format.label}
                    </Button>
                    {format.essential && (
                      <span className="text-xs text-primary mt-1">Essencial</span>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">Selecione os formatos para esta postagem.</p>
            </div>
            
            {/* Botões de Navegação */}
            <div className="flex justify-between mt-8">
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancelar
                </Button>
              </DialogClose>
              <Button type="button" onClick={nextStep}>
                Próximo
              </Button>
            </div>
          </div>
        ) : (
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
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h3 className="font-medium">Informações da Postagem</h3>
                      <p><strong>Título:</strong> {formData.title}</p>
                      <p>
                        <strong>Categoria:</strong> {
                          categories.find(c => c.id === formData.categoryId)?.name || "Não definida"
                        }
                      </p>
                      <p><strong>Status:</strong> {formData.status}</p>
                      <p><strong>Licença:</strong> {formData.licenseType}</p>
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="font-medium">Formatos</h3>
                      <div className="flex flex-wrap gap-2">
                        {formData.formats.map((format) => (
                          <Badge key={format} className="capitalize">
                            {format}
                          </Badge>
                        ))}
                      </div>
                      
                      <h3 className="font-medium mt-4">Tags</h3>
                      <div className="flex flex-wrap gap-2">
                        {formData.tags.map((tag) => (
                          <Badge key={tag} variant="outline">#{tag}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-4">
                    <p className="text-sm text-muted-foreground">
                      ID único da postagem: <strong>{formData.uniqueCode}</strong>
                    </p>
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
                        className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center h-64 text-center ${
                          formData.formatFiles[format].imagePreview ? "border-primary" : "border-border"
                        }`}
                      >
                        {formData.formatFiles[format].imagePreview ? (
                          <div className="relative w-full h-full">
                            <img 
                              src={formData.formatFiles[format].imagePreview}
                              alt="Preview"
                              className="rounded object-contain w-full h-full"
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
                                  <p className="text-xs max-w-[200px] truncate">{link.url}</p>
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
              <Button type="button" variant="outline" onClick={prevStep}>
                Voltar
              </Button>
              <Button type="button" onClick={submitForm}>
                Publicar Postagem
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}