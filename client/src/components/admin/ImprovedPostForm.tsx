import React, { useState, useEffect, useRef } from "react";
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
  ExternalLink, FileImage,
  Clock, XCircle, Tag
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { uploadToSupabase } from "@/lib/admin/uploadToSupabase";
import { Post, Category, Tag as TagType } from "@shared/schema";
import { nanoid, cn } from "@/lib/utils";
import { ImageWithFallback } from "@/components/ui/image-with-fallback";
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

// Tipo para formato de postagem que vem do banco de dados
interface DbPostFormat {
  id: number;
  name: string;
  size: string;
  orientation: string;
  is_active: boolean;
  created_at?: string;
}

// Tipo para formato de arquivo que vem do banco de dados
interface DbFileFormat {
  id: number;
  name: string;
  type: string;
  icon: string | null;
  is_active: boolean;
  created_at?: string;
}

type PostFormat = string;

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
  formats: PostFormat[];
  formatFiles: Record<PostFormat, FormatFile>;
  uniqueCode: string;
  groupId?: string;
  isVisible: boolean; // Controla a visibilidade da postagem no feed
}

export function ImprovedPostForm({ open, onOpenChange, initialData, isEdit = false }: PostFormProps) {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [activeTab, setActiveTab] = useState<string>("feed");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Definir o formato padrão para arquivos
  const defaultFormatFile: FormatFile = {
    imageFile: null,
    imagePreview: null,
    links: []
  };
  
  // Estado inicial do formulário com valores vazios
  const [formData, setFormData] = useState<PostFormData>({
    title: "",
    categoryId: null,
    status: "aprovado",
    description: null,
    licenseType: "premium",
    formats: [], // Não selecionar nenhum formato inicialmente
    formatFiles: {
      feed: { ...defaultFormatFile },
      cartaz: { ...defaultFormatFile },
      stories: { ...defaultFormatFile }
    },
    uniqueCode: "",
    groupId: "",
    isVisible: true // Por padrão a postagem é visível
  });

  // Referência para controlar quando o diálogo foi aberto pela última vez
  const openRef = useRef(open);
  const initialRender = useRef(true);
  
  // Buscar formatos de post
  const { data: postFormats = [] } = useQuery<DbPostFormat[]>({
    queryKey: ["/api/admin/post-formats"],
    queryFn: async () => {
      const res = await fetch("/api/admin/post-formats");
      if (!res.ok) throw new Error("Falha ao buscar formatos de post");
      return res.json();
    }
  });
  
  // Buscar formatos de arquivo
  const { data: fileFormats = [] } = useQuery<DbFileFormat[]>({
    queryKey: ["/api/admin/file-formats"],
    queryFn: async () => {
      const res = await fetch("/api/admin/file-formats");
      if (!res.ok) throw new Error("Falha ao buscar formatos de arquivo");
      return res.json();
    }
  });

  // Buscar categorias
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/admin/categories"],
    queryFn: async () => {
      const res = await fetch("/api/admin/categories");
      if (!res.ok) throw new Error("Falha ao buscar categorias");
      return res.json();
    }
  });

  // Buscar posts do mesmo grupo quando estiver editando
  const { data: groupPosts = [] } = useQuery<Post[]>({
    queryKey: ["/api/admin/posts/related", initialData?.groupId],
    queryFn: async () => {
      if (!initialData?.groupId) return [];
      const res = await fetch(`/api/admin/posts/related/${initialData.groupId}`);
      if (!res.ok) throw new Error("Falha ao buscar posts do grupo");
      return res.json();
    },
    enabled: isEdit && !!initialData?.groupId
  });
  
  // Criar objeto formatFiles inicial com todos os formatos disponíveis
  const createDefaultFormatFiles = () => {
    const defaultFiles: Record<string, FormatFile> = {};
    
    // Adicionando formatos dinâmicos do banco
    if (postFormats.length > 0) {
      postFormats.forEach(format => {
        if (format.is_active) {
          defaultFiles[format.name] = { ...defaultFormatFile };
        }
      });
    } else {
      // Fallback para formatos básicos enquanto os dados são carregados
      defaultFiles['feed'] = { ...defaultFormatFile };
      defaultFiles['stories'] = { ...defaultFormatFile };
      defaultFiles['cartaz'] = { ...defaultFormatFile };
    }
    
    return defaultFiles;
  };

  // Função para carregar dados de formatData quando disponível
  const loadFormatDataFromPosts = (posts: Post[]) => {
    const formatFiles = createDefaultFormatFiles();
    const allFormats: PostFormat[] = [];

    // Processar cada post do grupo para extrair format data
    posts.forEach(post => {
      console.log("EDIT MODE: Processando post", post.id, "formato:", post.formato, "canvaUrl:", post.canvaUrl ? "SIM" : "NÃO");
      
      if (post.formatData) {
        try {
          const formats = JSON.parse(post.formatData);
          console.log("EDIT MODE: formatData parsed para post", post.id, formats);
          if (Array.isArray(formats)) {
            formats.forEach((formatInfo: any) => {
              const formatName = formatInfo.type;
              if (formatName && !allFormats.includes(formatName)) {
                allFormats.push(formatName);
              }
              
              // Se existe imagem URL, adicionar ao preview
              if (formatInfo.imageUrl && formatFiles[formatName]) {
                formatFiles[formatName].imagePreview = formatInfo.imageUrl;
                formatFiles[formatName].links = formatInfo.links || [];
                console.log("EDIT MODE: Links carregados do formatData para", formatName, formatInfo.links?.length || 0, formatInfo.links);
              }
            });
          }
        } catch (error) {
          console.error("Erro ao parsear formatData:", error);
        }
      }
      
      // SEMPRE verificar canvaUrl direto no post para cada formato
      if (post.formato && formatFiles[post.formato]) {
        if (!allFormats.includes(post.formato)) {
          allFormats.push(post.formato);
        }
        
        if (post.imageUrl) {
          formatFiles[post.formato].imagePreview = post.imageUrl;
        }
        
        // Se há canvaUrl no post, adicionar como link
        if (post.canvaUrl) {
          formatFiles[post.formato].links = [{
            id: nanoid(),
            provider: "canva",
            url: post.canvaUrl
          }];
          console.log("EDIT MODE: Link do Canva adicionado para", post.formato, post.canvaUrl);
        }
      }
    });

    return { formatFiles, allFormats };
  };

  // Effect para carregar dados quando o diálogo abre
  useEffect(() => {
    if (!open) return;
    
    if (isEdit && initialData) {
      console.log("EDIT MODE: Carregando dados da postagem", initialData.id);
      console.log("Group posts disponíveis:", groupPosts.length);
      console.log("Post formats disponíveis:", postFormats.length);
      
      // Se temos posts do grupo, usar para carregar format data completo
      let formatFiles = createDefaultFormatFiles();
      let allFormats: PostFormat[] = [];
      
      if (groupPosts.length > 0) {
        const loadedData = loadFormatDataFromPosts(groupPosts);
        formatFiles = loadedData.formatFiles;
        allFormats = loadedData.allFormats;
        console.log("EDIT MODE: Dados carregados do grupo", { 
          formatFiles: Object.keys(formatFiles), 
          allFormats,
          groupPostsCount: groupPosts.length 
        });
      } else {
        // Fallback: usar apenas os dados do post atual
        console.log("EDIT MODE: Usando dados do post atual como fallback");
        allFormats = (initialData.formats as PostFormat[]) || [];
        
        // Se não há formatos no post, tentar extrair do campo formato
        if (allFormats.length === 0 && initialData.formato) {
          allFormats = [initialData.formato as PostFormat];
          console.log("EDIT MODE: Formato extraído do campo formato:", initialData.formato);
        }
        
        // Se ainda não há formatos, usar "feed" como padrão
        if (allFormats.length === 0) {
          allFormats = ["feed"];
          console.log("EDIT MODE: Usando formato padrão 'feed'");
        }
        
        // Se há imagem URL, adicionar ao primeiro formato
        if (initialData.imageUrl && allFormats.length > 0) {
          const firstFormat = allFormats[0];
          if (formatFiles[firstFormat]) {
            formatFiles[firstFormat].imagePreview = initialData.imageUrl;
            console.log("EDIT MODE: Imagem adicionada ao formato:", firstFormat, initialData.imageUrl);
          }
        }
      }

      const newFormData = {
        title: initialData.title || "",
        categoryId: initialData.categoryId || null,
        status: (initialData.status as 'aprovado' | 'rascunho' | 'rejeitado') || "aprovado",
        description: initialData.description || null,
        licenseType: (initialData.licenseType as 'premium' | 'free') || "premium",
        formats: allFormats,
        formatFiles: formatFiles,
        uniqueCode: initialData.uniqueCode || nanoid(),
        groupId: initialData.groupId || nanoid(),
        isVisible: initialData.isVisible !== undefined ? initialData.isVisible : true
      };
      
      console.log("EDIT MODE: Definindo form data:", newFormData);
      setFormData(newFormData);
      
      // Definir aba ativa para o primeiro formato se houver
      if (allFormats.length > 0) {
        setActiveTab(allFormats[0]);
        console.log("EDIT MODE: Aba ativa definida para:", allFormats[0]);
      }
    } else if (!isEdit) {
      console.log("NEW POST MODE: Resetando formulário");
      // Gerar um novo ID único para cada nova postagem
      const newUniquePostId = nanoid();
      
      setFormData({
        title: "",
        categoryId: null,
        status: "aprovado",
        description: null,
        licenseType: "premium",
        formats: [],
        formatFiles: createDefaultFormatFiles(),
        uniqueCode: newUniquePostId,
        groupId: nanoid(),
        isVisible: true
      });
      
      // Resetar também o passo e a aba ativa
      setStep(1);
      setActiveTab("feed");
      setHasUnsavedChanges(false);
    }
  }, [open, isEdit, initialData, groupPosts, postFormats]);
  
  // Rastrear mudanças no formulário quando esses valores específicos mudarem
  useEffect(() => {
    // Verifica se o formulário tem algum conteúdo preenchido
    const hasContent = formData.title.trim() !== "" || formData.categoryId !== null;
    // Só atualiza o estado se for diferente do valor atual
    if (hasContent !== hasUnsavedChanges) {
      setHasUnsavedChanges(hasContent);
    }
  }, [formData.title, formData.categoryId, hasUnsavedChanges]);

  // Tags removidas - SEO baseado apenas no título

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
      // Invalidar todos os caches relacionados a posts para atualização imediata
      queryClient.invalidateQueries({ queryKey: ["/api/admin/posts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/posts/feed"] });
      queryClient.invalidateQueries({ queryKey: ["/api/posts/recent"] });
      queryClient.invalidateQueries({ queryKey: ["/api/artworks"] });
      // Forçar refetch dos dados mais importantes
      queryClient.refetchQueries({ queryKey: ["/api/admin/posts"] });
      queryClient.refetchQueries({ queryKey: ["/api/posts"] });
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
    mutationFn: async (postData: any) => {
      if (!initialData?.id) throw new Error("ID da postagem é necessário para atualização");
      
      console.log("UPDATE MUTATION: Sending data to API:", {
        id: initialData.id,
        url: `/api/admin/posts/${initialData.id}`,
        dataKeys: Object.keys(postData),
        hasFormatos: !!postData.formatos,
        formatosLength: postData.formatos?.length || 0
      });
      
      try {
        const res = await apiRequest("PATCH", `/api/admin/posts/${initialData.id}`, postData);
        
        if (!res.ok) {
          const errorText = await res.text();
          console.error("UPDATE MUTATION: API Error Response:", {
            status: res.status,
            statusText: res.statusText,
            errorText
          });
          throw new Error(`Erro na API: ${res.status} - ${errorText}`);
        }
        
        const result = await res.json();
        console.log("UPDATE MUTATION: Success response:", result);
        return result;
      } catch (apiError) {
        console.error("UPDATE MUTATION: Request failed:", apiError);
        throw apiError;
      }
    },
    onSuccess: (result) => {
      console.log("UPDATE MUTATION: onSuccess called with:", result);
      toast({
        title: "Sucesso!",
        description: "Postagem atualizada com sucesso.",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/posts"] });
      onOpenChange(false);
    },
    onError: (error: any) => {
      console.error("UPDATE MUTATION: onError called with:", error);
      toast({
        title: "Erro ao atualizar postagem",
        description: error.message || "Erro desconhecido",
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
      const categoryId = parseInt(value, 10);
      console.log("CATEGORY SELECTION DEBUG:", {
        selectedValue: value,
        convertedId: categoryId,
        availableCategories: categories.map(c => ({ id: c.id, name: c.name }))
      });
      setFormData(prev => ({ ...prev, [name]: categoryId }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleFormatToggle = (format: PostFormat) => {
    setFormData(prev => {
      // Verificar se o formato já está selecionado
      const isSelected = prev.formats.includes(format);
      
      // Se o formato está sendo adicionado, garantir que ele tenha uma entrada em formatFiles
      if (!isSelected) {
        // Adicionar o formato aos selecionados
        const formats = [...prev.formats, format];
        
        // Garantir que o formato tenha uma entrada em formatFiles
        return { 
          ...prev, 
          formats,
          formatFiles: {
            ...prev.formatFiles,
            [format]: prev.formatFiles[format] || { ...defaultFormatFile }
          }
        };
      } else {
        // Remover o formato dos selecionados
        const formats = prev.formats.filter(f => f !== format);
        return { ...prev, formats };
      }
    });
  };

  // Tag-related functions removed - SEO baseado apenas no título

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
  
  // Verificar o formulário para salvar como rascunho
  const validateAndSaveAsDraft = async () => {
    // Verificar se o título e categoria estão preenchidos
    if (formData.title.trim() === "" || formData.categoryId === null) {
      return false;
    }

    try {
      // Preparar imagem principal (pode ser vazia nesse caso)
      let mainImageUrl = "";
      for (const format of formData.formats) {
        if (formData.formatFiles[format].imagePreview) {
          mainImageUrl = formData.formatFiles[format].imagePreview;
          break;
        }
      }
      
      // Se não tem formatos, adicionar "feed" como padrão
      const formats = formData.formats.length > 0 ? formData.formats : ["feed"];
      
      // Preparar dados para envio como rascunho
      const formatDataJson = JSON.stringify(formats.map(format => {
        // Verificar se o formato é válido antes de acessar formatFiles
        const typedFormat = format as PostFormat;
        return {
          type: format,
          imageUrl: formData.formatFiles[typedFormat].imagePreview || "",
          links: formData.formatFiles[typedFormat].links
        };
      }));
      
      const post = {
        title: formData.title,
        categoryId: formData.categoryId,
        status: "rascunho" as "aprovado" | "rascunho" | "rejeitado", // Forçar como rascunho com type assertion
        description: formData.description,
        licenseType: formData.licenseType,
        formats: formats,
        formatData: formatDataJson,
        uniqueCode: formData.uniqueCode,
        groupId: formData.groupId,
        imageUrl: mainImageUrl || "/assets/placeholder.png", // Fallback para placeholder
        isVisible: formData.isVisible // Controle de visibilidade no feed
      };
      
      // Salvar no servidor como rascunho
      if (isEdit && initialData?.id) {
        await updatePostMutation.mutateAsync(post);
      } else {
        await createPostMutation.mutateAsync(post);
      }
      
      toast({
        title: "Rascunho salvo",
        description: "Sua postagem foi salva como rascunho automaticamente.",
        variant: "default",
      });
      
      return true;
    } catch (error) {
      console.error("Erro ao salvar rascunho:", error);
      return false;
    }
  };

  // Manipulador para fechar o modal
  const handleDialogChange = async (open: boolean) => {
    // Se estiver fechando o modal e tiver mudanças não salvas
    if (!open && hasUnsavedChanges && formData.title.trim() !== "" && formData.categoryId !== null) {
      // Verificar se atende aos requisitos mínimos e salvar como rascunho
      await validateAndSaveAsDraft();
    }
    
    // Chamar o manipulador original
    onOpenChange(open);
  };

  const submitForm = async () => {
    try {
      // Pegue a primeira imagem disponível para usar como imageUrl principal
      let mainImageUrl = "";
      for (const format of formData.formats) {
        if (formData.formatFiles[format].imagePreview) {
          mainImageUrl = formData.formatFiles[format].imagePreview;
          break;
        }
      }
      
      // Caso não encontre nenhuma imagem, use uma imagem padrão ou mostre erro
      if (!mainImageUrl) {
        toast({
          title: "Erro",
          description: "É necessário fazer upload de pelo menos uma imagem",
          variant: "destructive",
        });
        return;
      }
      
      // Preparar dados dos formatos para criação de múltiplas entradas
      const formatos = formData.formats.map(format => {
        const typedFormat = format as PostFormat;
        const formatFile = formData.formatFiles[typedFormat];
        
        // Extrair o primeiro link do Canva se existir
        const canvaLink = formatFile.links.find(link => link.provider === 'canva');
        
        // Cada formato deve usar sua própria imagem específica
        const formatImageUrl = formatFile.imagePreview;
        
        if (!formatImageUrl) {
          throw new Error(`Imagem não encontrada para o formato ${format}. Faça upload da imagem para este formato.`);
        }
        
        return {
          formato: format,
          imageUrl: formatImageUrl, // Usar a imagem específica deste formato
          canvaUrl: canvaLink?.url || "",
          links: formatFile.links
        };
      });
      
      const post = {
        title: formData.title,
        categoryId: formData.categoryId,
        status: formData.status,
        description: formData.description,
        licenseType: formData.licenseType,
        imageUrl: mainImageUrl, // Adicionar imageUrl que é obrigatório
        isVisible: formData.isVisible, // Controle de visibilidade no feed
        groupId: formData.groupId, // Incluir groupId para edit mode
        formatos: formatos // Enviar formatos para criação de múltiplas entradas
        // uniqueCode removido para evitar conflitos na atualização em grupo
      };
      
      // Adicionar uniqueCode apenas para novos posts (não edição)
      if (!isEdit) {
        post.uniqueCode = formData.uniqueCode;
      }
      
      // Enviar para o servidor
      if (isEdit && initialData?.id) {
        // No modo de edição, enviar dados completos para o endpoint PATCH
        console.log("EDIT MODE: Enviando dados completos para atualização:", post);
        
        // Preparar dados específicos para o modo de edição com formatData completo
        const editData = {
          ...post,
          formatData: JSON.stringify(formatos) // Serializar os dados dos formatos
        };
        
        console.log("EDIT MODE: Dados serializados para API:", editData);
        await updatePostMutation.mutateAsync(editData);
      } else {
        await createPostMutation.mutateAsync(post);
      }
      
      // Fechar modal em caso de sucesso
      onOpenChange(false);
      
      // Feedback de sucesso
      toast({
        title: "Sucesso!",
        description: isEdit ? "Postagem atualizada com sucesso" : "Postagem criada com sucesso",
      });
      
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
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent className="max-w-3xl p-0">
        <DialogTitle className="sr-only">
          {step === 1 ? "Nova Postagem" : step === 2 ? "Adicionar Arquivos" : "Revisar Publicação"}
        </DialogTitle>
        <DialogDescription className="sr-only">
          Formulário para {isEdit ? "editar" : "criar"} uma nova postagem
        </DialogDescription>
        
        {/* Header com nome da etapa */}
        <div className="flex items-center justify-between border-b p-4">
          <div className="flex items-center">
            <ChevronLeft 
              className="h-5 w-5 cursor-pointer mr-2" 
              onClick={step === 1 ? () => handleDialogChange(false) : prevStep}
            />
            <h2 className="text-xl font-semibold">
              {step === 1 ? "Nova Postagem" : 
               step === 2 ? "Adicionar Arquivos" : 
               "Revisar Publicação"}
            </h2>
          </div>
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
                  placeholder="Digite o nome da postagem"
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
                        {formData.licenseType === 'premium' ? (
                          <div className="flex items-center">
                            <Crown className="h-4 w-4 mr-2 text-amber-500 fill-amber-500" />
                            <span>Premium</span>
                          </div>
                        ) : (
                          <div className="flex items-center">
                            <Crown className="h-4 w-4 mr-2 text-gray-400" />
                            <span>Gratuito</span>
                          </div>
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="premium">
                        <div className="flex items-center">
                          <Crown className="h-4 w-4 mr-2 text-amber-500 fill-amber-500" />
                          Premium
                        </div>
                      </SelectItem>
                      <SelectItem value="free">
                        <div className="flex items-center">
                          <Crown className="h-4 w-4 mr-2 text-gray-400" />
                          Gratuito
                        </div>
                      </SelectItem>
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
                        {formData.status === 'rascunho' && (
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-2 text-amber-500" />
                            <span>Rascunho</span>
                          </div>
                        )}
                        {formData.status === 'rejeitado' && (
                          <div className="flex items-center">
                            <XCircle className="h-4 w-4 mr-2 text-red-500" />
                            <span>Rejeitado</span>
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
                      <SelectItem value="rascunho">
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-2 text-amber-500" />
                          Rascunho
                        </div>
                      </SelectItem>
                      <SelectItem value="rejeitado">
                        <div className="flex items-center">
                          <XCircle className="h-4 w-4 mr-2 text-red-500" />
                          Rejeitado
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Visibilidade no Feed */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="isVisible">Visibilidade no Feed</Label>
                  <div className="flex items-center space-x-2">
                    <div 
                      className={`w-10 h-5 rounded-full transition-colors relative ${formData.isVisible ? 'bg-blue-600' : 'bg-gray-300'}`}
                      onClick={() => setFormData(prev => ({ ...prev, isVisible: !prev.isVisible }))}
                      style={{ cursor: 'pointer' }}
                    >
                      <div 
                        className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${formData.isVisible ? 'translate-x-5' : 'translate-x-0.5'}`}
                      ></div>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {formData.isVisible 
                    ? "A postagem será exibida no feed principal do site."
                    : "A postagem não será exibida no feed, mas ainda estará acessível por link direto."}
                </p>
              </div>
              
              {/* Tags removidas - SEO baseado apenas no título */}
              
              {/* Formatos */}
              <div className="space-y-2">
                <Label>Formatos da Postagem</Label>
                {postFormats.length === 0 ? (
                  <div className="text-sm text-muted-foreground mb-2">
                    Carregando formatos...
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {postFormats.filter(format => format.is_active).map((format) => (
                      <Button
                        key={format.id}
                        type="button"
                        variant={formData.formats.includes(format.name) ? "default" : "outline"}
                        className={cn(
                          "h-10 capitalize flex items-center gap-2",
                          formData.formats.includes(format.name) && "bg-blue-50 text-blue-800 hover:bg-blue-100"
                        )}
                        onClick={() => handleFormatToggle(format.name)}
                      >
                        {formData.formats.includes(format.name) && (
                          <Check className="h-4 w-4 text-blue-600" />
                        )}
                        <span className="capitalize">{format.name}</span>
                        <Badge 
                          variant="secondary" 
                          className="ml-1 text-xs"
                          title={`${format.size} - ${format.orientation}`}
                        >
                          {format.size}
                        </Badge>
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <div className="border-t p-4 flex justify-between items-center">
              <Button 
                type="button" 
                onClick={handleDialogChange.bind(null, false)}
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
                              <ImageWithFallback 
                                src={formData.formatFiles[format].imagePreview}
                                alt="Preview"
                                className="object-contain max-h-full max-w-full"
                                fallbackClassName="h-12 w-12 text-gray-300"
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
                                <SelectValue placeholder="Selecione um formato" />
                              </SelectTrigger>
                              <SelectContent>
                                {fileFormats.length === 0 ? (
                                  <SelectItem value="canva">Carregando...</SelectItem>
                                ) : (
                                  fileFormats.filter(format => format.is_active).map(fileFormat => (
                                    <SelectItem key={fileFormat.id} value={fileFormat.name.toLowerCase()}>
                                      {fileFormat.name}
                                    </SelectItem>
                                  ))
                                )}
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
                  {/* Tags removidas - SEO baseado apenas no título */}
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
                          <ImageWithFallback 
                            src={formData.formatFiles[format].imagePreview}
                            alt={`Preview de ${format}`}
                            className="object-contain max-h-full max-w-full"
                            fallbackClassName="h-12 w-12 text-gray-300"
                          />
                        ) : (
                          <FileImage className="h-12 w-12 text-gray-300" />
                        )}
                      </div>
                      <CardContent className="p-3">
                        <div className="flex justify-between items-center mb-1">
                          <p className="font-medium capitalize">{format}</p>
                          <Badge variant="secondary" className="capitalize py-0 px-2 text-xs">
                            {postFormats.find(fmt => fmt.name === format)?.size || 'Personalizado'}
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