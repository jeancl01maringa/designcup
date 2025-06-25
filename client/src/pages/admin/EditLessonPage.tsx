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
import { ArrowLeft, Eye, Upload, FileText, Image, Video, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

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
  });

  // Buscar dados da aula
  const { data: lesson, isLoading } = useQuery<Lesson>({
    queryKey: [`/api/admin/lessons/${lessonId}`],
    enabled: lessonId > 0,
  });

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
      const payload = {
        title: data.title,
        description: data.description,
        content: data.videoUrl, // Store video URL in content field
        type: data.type,
        orderIndex: data.orderIndex,
        id: lessonId,
      };
      
      const response = await apiRequest("PUT", `/api/admin/lessons/${lessonId}`, payload);
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
      setFormData({ ...formData, coverImage: url });
    }
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
                  <Label htmlFor="videoUrl" className="text-sm font-medium">URL do vídeo *</Label>
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
                  <Label htmlFor="description" className="text-sm font-medium">Texto</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descrição ou conteúdo adicional da aula"
                    rows={4}
                    className="mt-1"
                  />
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
              disabled={updateLessonMutation.isPending || !formData.title || !formData.videoUrl}
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