import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Helmet } from "react-helmet";
import { AdminLayout } from "@/components/admin/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Eye, Upload, FileText, Image, Video, X, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, Palette } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import FontFamily from '@tiptap/extension-font-family';
import Highlight from '@tiptap/extension-highlight';
import UnderlineExtension from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Link from '@tiptap/extension-link';

interface Lesson {
  id: number;
  moduleId: number;
  title: string;
  description: string;
  content: string;
  type: 'video' | 'text';
  orderIndex: number;
}

export default function EditLessonPage() {
  const params = useParams();
  const lessonId = parseInt(params.lessonId || "0");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    content: "",
    type: "video" as "video" | "text",
    videoPlatform: "youtube" as "youtube" | "vimeo" | "panda" | "vturb",
    videoUrl: "",
    orderIndex: 0,
    isPublished: true,
    isPremium: false,
    coverImage: "",
    extraMaterials: [] as File[],
    coverImageFile: null as File | null,
  });

  // Rich text editor for text content
  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      Color,
      FontFamily,
      Highlight,
      UnderlineExtension,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Link.configure({
        openOnClick: false,
      }),
    ],
    content: formData.description,
    onUpdate: ({ editor }) => {
      setFormData(prev => ({
        ...prev,
        description: editor.getHTML()
      }));
    },
  });

  // Fetch lesson data
  const { data: lesson, isLoading } = useQuery<Lesson>({
    queryKey: [`/api/admin/lessons/${lessonId}`],
    enabled: !!lessonId,
  });

  // Update editor content when lesson data loads
  useEffect(() => {
    if (editor && lesson) {
      editor.commands.setContent(formData.description || '');
    }
  }, [editor, lesson, formData.description]);

  // Add CSS styles for rich text editor
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .ProseMirror {
        outline: none;
        padding: 16px;
        min-height: 200px;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        background: white;
      }
      .ProseMirror p {
        margin: 0.5em 0;
      }
      .ProseMirror strong {
        font-weight: bold;
      }
      .ProseMirror em {
        font-style: italic;
      }
      .ProseMirror u {
        text-decoration: underline;
      }
      .ProseMirror h1, .ProseMirror h2, .ProseMirror h3 {
        margin: 1em 0 0.5em 0;
        font-weight: bold;
      }
      .ProseMirror h1 { font-size: 1.5em; }
      .ProseMirror h2 { font-size: 1.3em; }
      .ProseMirror h3 { font-size: 1.1em; }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Update form when lesson data loads
  useEffect(() => {
    if (lesson) {
      // Parse video URL to extract platform and URL
      const videoUrl = lesson.content || "";
      let videoPlatform = "youtube";
      
      if (videoUrl.includes("vimeo.com")) {
        videoPlatform = "vimeo";
      } else if (videoUrl.includes("panda")) {
        videoPlatform = "panda";
      } else if (videoUrl.includes("vturb")) {
        videoPlatform = "vturb";
      }

      setFormData({
        title: lesson.title || "",
        description: lesson.description || "",
        content: lesson.content || "",
        type: lesson.type || "video",
        videoPlatform: videoPlatform as any,
        videoUrl: videoUrl,
        orderIndex: lesson.orderIndex || 0,
        isPublished: true,
        isPremium: false,
        coverImage: "",
        extraMaterials: [],
      });
    }
  }, [lesson]);

  const updateLessonMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const formDataToSend = new FormData();
      
      // Basic lesson data
      formDataToSend.append('title', data.title);
      formDataToSend.append('description', data.description);
      formDataToSend.append('content', data.videoUrl || '');
      formDataToSend.append('type', 'video');
      formDataToSend.append('orderIndex', data.orderIndex.toString());
      formDataToSend.append('videoPlatform', data.videoPlatform);
      formDataToSend.append('isPremium', data.isPremium.toString());
      
      // Cover image
      if (data.coverImageFile) {
        formDataToSend.append('coverImage', data.coverImageFile);
      }
      
      // Extra materials
      data.extraMaterials.forEach((file, index) => {
        formDataToSend.append(`extraMaterial_${index}`, file);
      });
      
      const response = await fetch(`/api/admin/lessons/${lessonId}`, {
        method: 'PUT',
        body: formDataToSend,
      });
      
      if (!response.ok) {
        throw new Error('Erro ao atualizar aula');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/lessons/${lessonId}`] });
      toast({
        title: "Aula atualizada!",
        description: "As alterações foram salvas com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar aula",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleMaterialUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      setFormData(prev => ({
        ...prev,
        extraMaterials: [...prev.extraMaterials, ...Array.from(files)]
      }));
    }
  };

  const removeMaterial = (index: number) => {
    setFormData(prev => ({
      ...prev,
      extraMaterials: prev.extraMaterials.filter((_, i) => i !== index)
    }));
  };

  const handleCoverUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setFormData({ ...formData, coverImage: url, coverImageFile: file });
    }
  };

  // Rich text editor toolbar
  const RichTextToolbar = () => {
    if (!editor) return null;

    return (
      <div className="border-b p-2 flex flex-wrap gap-1">
        <Button
          type="button"
          variant={editor.isActive('bold') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="h-4 w-4" />
        </Button>
        
        <Button
          type="button"
          variant={editor.isActive('italic') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="h-4 w-4" />
        </Button>
        
        <Button
          type="button"
          variant={editor.isActive('underline') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <Underline className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        <Button
          type="button"
          variant={editor.isActive({ textAlign: 'left' }) ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
        >
          <AlignLeft className="h-4 w-4" />
        </Button>
        
        <Button
          type="button"
          variant={editor.isActive({ textAlign: 'center' }) ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
        >
          <AlignCenter className="h-4 w-4" />
        </Button>
        
        <Button
          type="button"
          variant={editor.isActive({ textAlign: 'right' }) ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
        >
          <AlignRight className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        <Select onValueChange={(value) => editor.chain().focus().setFontFamily(value).run()}>
          <SelectTrigger className="w-32 h-8">
            <SelectValue placeholder="Fonte" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Arial">Arial</SelectItem>
            <SelectItem value="Helvetica">Helvetica</SelectItem>
            <SelectItem value="Times New Roman">Times</SelectItem>
            <SelectItem value="Georgia">Georgia</SelectItem>
            <SelectItem value="Verdana">Verdana</SelectItem>
          </SelectContent>
        </Select>

        <input
          type="color"
          onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
          className="w-8 h-8 border rounded cursor-pointer"
          title="Cor do texto"
        />

        <input
          type="color"
          onChange={(e) => editor.chain().focus().toggleHighlight({ color: e.target.value }).run()}
          className="w-8 h-8 border rounded cursor-pointer"
          title="Cor de fundo"
        />
      </div>
    );
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">Carregando...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Helmet>
        <title>Editar Aula - Admin</title>
      </Helmet>

      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setLocation(`/admin/cursos/${lesson?.moduleId ? Math.floor(lesson.moduleId / 10) : 1}/modulos`)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Editar conteúdo
            </Button>
            <div>
              <h1 className="text-xl font-semibold">Editar Aula</h1>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.isPublished}
                onCheckedChange={(checked) => setFormData({ ...formData, isPublished: checked })}
              />
              <span className="text-sm font-medium">Publicado</span>
            </div>
            <Button variant="outline" size="sm">
              <Eye className="h-4 w-4 mr-2" />
              Visualizar
            </Button>
          </div>
        </div>

        {/* Layout em duas colunas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna principal - Formulário */}
          <div className="lg:col-span-2 space-y-6">
            {/* Informações Básicas */}
            <Card>
              <CardContent className="p-6 space-y-6">
                {/* Título */}
                <div>
                  <Label htmlFor="title" className="text-sm font-medium">Título da Aula *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Digite o título da aula"
                    className="mt-1"
                  />
                </div>

                {/* Plataforma de Vídeo */}
                <div>
                  <Label className="text-sm font-medium">Plataforma de Vídeo</Label>
                  <Select 
                    value={formData.videoPlatform} 
                    onValueChange={(value: any) => setFormData({ ...formData, videoPlatform: value })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Selecione a plataforma" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="youtube">
                        <div className="flex items-center gap-2">
                          <Video className="h-4 w-4 text-red-500" />
                          YouTube
                        </div>
                      </SelectItem>
                      <SelectItem value="vimeo">
                        <div className="flex items-center gap-2">
                          <Video className="h-4 w-4 text-blue-500" />
                          Vimeo
                        </div>
                      </SelectItem>
                      <SelectItem value="panda">
                        <div className="flex items-center gap-2">
                          <Video className="h-4 w-4 text-green-500" />
                          Panda
                        </div>
                      </SelectItem>
                      <SelectItem value="vturb">
                        <div className="flex items-center gap-2">
                          <Video className="h-4 w-4 text-purple-500" />
                          vTurb
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* URL do Vídeo */}
                <div>
                  <Label htmlFor="videoUrl" className="text-sm font-medium">URL do vídeo</Label>
                  <Input
                    id="videoUrl"
                    value={formData.videoUrl}
                    onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                    placeholder="https://..."
                    className="mt-1"
                  />
                </div>

                {/* Texto/Descrição */}
                <div>
                  <Label className="text-sm font-medium">Texto</Label>
                  <div className="mt-1">
                    {/* Toolbar do Editor */}
                    <div className="border border-gray-200 bg-gray-50 p-2 flex flex-wrap gap-1 rounded-t-md">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => editor?.chain().focus().toggleBold().run()}
                        className={`h-8 w-8 p-0 ${editor?.isActive('bold') ? 'bg-gray-200' : ''}`}
                      >
                        <Bold className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => editor?.chain().focus().toggleItalic().run()}
                        className={`h-8 w-8 p-0 ${editor?.isActive('italic') ? 'bg-gray-200' : ''}`}
                      >
                        <Italic className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => editor?.chain().focus().toggleUnderline().run()}
                        className={`h-8 w-8 p-0 ${editor?.isActive('underline') ? 'bg-gray-200' : ''}`}
                      >
                        <Underline className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => editor?.chain().focus().setTextAlign('left').run()}
                        className={`h-8 w-8 p-0 ${editor?.isActive({ textAlign: 'left' }) ? 'bg-gray-200' : ''}`}
                      >
                        <AlignLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => editor?.chain().focus().setTextAlign('center').run()}
                        className={`h-8 w-8 p-0 ${editor?.isActive({ textAlign: 'center' }) ? 'bg-gray-200' : ''}`}
                      >
                        <AlignCenter className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => editor?.chain().focus().setTextAlign('right').run()}
                        className={`h-8 w-8 p-0 ${editor?.isActive({ textAlign: 'right' }) ? 'bg-gray-200' : ''}`}
                      >
                        <AlignRight className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => editor?.chain().focus().setColor('#ef4444').run()}
                        className="h-8 w-8 p-0"
                      >
                        <Type className="h-4 w-4 text-red-500" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => editor?.chain().focus().setColor('#3b82f6').run()}
                        className="h-8 w-8 p-0"
                      >
                        <Type className="h-4 w-4 text-blue-500" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => editor?.chain().focus().setColor('#10b981').run()}
                        className="h-8 w-8 p-0"
                      >
                        <Type className="h-4 w-4 text-green-500" />
                      </Button>
                    </div>
                    {/* Editor */}
                    <EditorContent editor={editor} className="prose max-w-none" />
                  </div>
                  {formData.type === 'text' ? (
                    <div className="mt-1 border rounded-lg overflow-hidden">
                      <RichTextToolbar />
                      <EditorContent 
                        editor={editor} 
                        className="prose max-w-none p-4 min-h-[200px] focus:outline-none"
                      />
                    </div>
                  ) : (
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Descrição ou conteúdo adicional da aula"
                      rows={4}
                      className="mt-1"
                    />
                  )}
                </div>

                {/* Material Extra */}
                <div>
                  <Label className="text-sm font-medium">Material Extra</Label>
                  <div className="mt-2">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500 mb-2">
                        Adicione imagens, PDFs ou outros materiais
                      </p>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={() => document.getElementById('material-upload')?.click()}
                      >
                        Selecionar Arquivos
                      </Button>
                      <input
                        id="material-upload"
                        type="file"
                        multiple
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
                        onChange={handleMaterialUpload}
                        className="hidden"
                      />
                    </div>
                    
                    {/* Lista de materiais adicionados */}
                    {formData.extraMaterials.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {formData.extraMaterials.map((file, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div className="flex items-center gap-2">
                              {file.type.includes('image') ? (
                                <Image className="h-4 w-4 text-blue-500" />
                              ) : (
                                <FileText className="h-4 w-4 text-gray-500" />
                              )}
                              <span className="text-sm">{file.name}</span>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeMaterial(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Coluna lateral - Capa e configurações */}
          <div className="space-y-6">
            {/* Capa do Conteúdo */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Capa do conteúdo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed border-gray-300 rounded-lg aspect-video flex items-center justify-center bg-gray-50">
                  {formData.coverImage ? (
                    <img 
                      src={formData.coverImage} 
                      alt="Capa" 
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <div className="text-center">
                      <Image className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">Nenhuma imagem</p>
                    </div>
                  )}
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full mt-3"
                  onClick={() => document.getElementById('cover-upload')?.click()}
                >
                  Adicionar imagem
                </Button>
                <input
                  id="cover-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleCoverUpload}
                  className="hidden"
                />
              </CardContent>
            </Card>

            {/* Configurações */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Configurações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Toggle Premium */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Conteúdo Premium</Label>
                    <p className="text-xs text-muted-foreground">Apenas para assinantes</p>
                  </div>
                  <Switch
                    checked={formData.isPremium}
                    onCheckedChange={(checked) => setFormData({ ...formData, isPremium: checked })}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Botão Salvar */}
            <Button 
              onClick={() => updateLessonMutation.mutate(formData)}
              disabled={updateLessonMutation.isPending || !formData.title}
              className="w-full"
              size="lg"
            >
              {updateLessonMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}