import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { AdminLayout } from "@/components/admin/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Save, Eye, Upload, Link, Play, FileText, Image, HelpCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface Lesson {
  id: number;
  moduleId: number;
  title: string;
  description: string;
  content: string;
  type: 'video' | 'text' | 'quiz';
  duration?: number;
  orderIndex: number;
  videoUrl?: string;
  files?: string[];
}

export default function EditLessonPage() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const lessonId = parseInt(params.lessonId || "0");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isPublished, setIsPublished] = useState(true);
  const [activeTab, setActiveTab] = useState("media");
  const [lessonData, setLessonData] = useState({
    title: "",
    description: "",
    content: "",
    type: "video" as const,
    videoUrl: "",
    files: [] as string[]
  });

  // Buscar dados da aula
  const { data: lesson, isLoading } = useQuery<Lesson>({
    queryKey: [`/api/admin/lessons/${lessonId}`],
    enabled: lessonId > 0,
  });

  // Atualizar estado quando os dados carregarem
  useEffect(() => {
    if (lesson) {
      setLessonData({
        title: lesson.title,
        description: lesson.description || "",
        content: lesson.content || "",
        type: lesson.type,
        videoUrl: lesson.videoUrl || "",
        files: lesson.files || []
      });
    }
  }, [lesson]);

  // Salvar aula
  const saveLessonMutation = useMutation({
    mutationFn: async (data: typeof lessonData) => {
      const res = await apiRequest("PUT", `/api/admin/lessons/${lessonId}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/lessons/${lessonId}`] });
      toast({ title: "Aula salva com sucesso!" });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao salvar aula",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    if (!lessonData.title.trim()) {
      toast({
        title: "Erro",
        description: "O título da aula é obrigatório",
        variant: "destructive",
      });
      return;
    }
    saveLessonMutation.mutate(lessonData);
  };

  const handleBack = () => {
    window.history.back();
  };

  const handlePreview = () => {
    // Implementar preview da aula
    toast({ title: "Preview em desenvolvimento" });
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">Carregando aula...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Helmet>
        <title>Editar Aula - Admin</title>
      </Helmet>

      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={handleBack} className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <span className="text-muted-foreground">Editar conteúdo</span>
            <div className="flex items-center gap-2">
              <Switch checked={isPublished} onCheckedChange={setIsPublished} />
              <span className="text-sm font-medium">Publicado</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={handlePreview} className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Visualizar
            </Button>
            <Button variant="ghost" size="icon">
              <Link className="h-4 w-4" />
            </Button>
            <Button onClick={handleBack} variant="ghost" size="icon">
              ×
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={lessonData.title}
                onChange={(e) => setLessonData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Ex: 01 - Boas vindas"
                className="text-lg"
              />
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="media">Mídia</TabsTrigger>
                <TabsTrigger value="text">Texto</TabsTrigger>
                <TabsTrigger value="files">Arquivos</TabsTrigger>
                <TabsTrigger value="reading">Leitura complementar</TabsTrigger>
              </TabsList>

              {/* Mídia Tab */}
              <TabsContent value="media" className="space-y-4">
                <div className="text-center p-8 border-2 border-dashed rounded-lg">
                  <div className="text-sm text-muted-foreground mb-4">
                    Você pode inserir <strong>uma mídia (vídeo ou áudio)</strong>, no tipo: mov, mp4, avi, mkv, aiff, mid, wav, mp3.
                  </div>
                  <div className="text-sm text-muted-foreground mb-6">
                    O arquivo pode ter no <strong>máximo 20 GB</strong>.
                  </div>
                  <div className="space-y-3">
                    <Button className="flex items-center gap-2">
                      <Play className="h-4 w-4" />
                      Adicionar do Hotmart Player
                    </Button>
                    <Button variant="outline" className="flex items-center gap-2">
                      <Upload className="h-4 w-4" />
                      Enviar mídia
                    </Button>
                  </div>
                </div>
              </TabsContent>

              {/* Texto Tab */}
              <TabsContent value="text" className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-4">
                    <Button className="flex items-center gap-2">
                      <Play className="h-4 w-4" />
                      Adicionar do Hotmart Player
                    </Button>
                    <Button variant="outline" className="flex items-center gap-2">
                      <Upload className="h-4 w-4" />
                      Enviar mídia
                    </Button>
                  </div>
                  
                  <Label htmlFor="content">Texto</Label>
                  <div className="border rounded-lg">
                    {/* Rich Text Editor Toolbar */}
                    <div className="flex items-center gap-1 p-2 border-b bg-gray-50">
                      <Button variant="ghost" size="sm">B</Button>
                      <Button variant="ghost" size="sm">I</Button>
                      <Button variant="ghost" size="sm">U</Button>
                      <Button variant="ghost" size="sm">≡</Button>
                      <Button variant="ghost" size="sm">•</Button>
                      <Button variant="ghost" size="sm">1.</Button>
                      <Button variant="ghost" size="sm">⟵</Button>
                      <Button variant="ghost" size="sm">⟶</Button>
                      <Button variant="ghost" size="sm">🔗</Button>
                      <Button variant="ghost" size="sm">📎</Button>
                      <Button variant="ghost" size="sm">≡</Button>
                      <Button variant="ghost" size="sm">A</Button>
                      <Button variant="ghost" size="sm">🎨</Button>
                      <Button variant="ghost" size="sm">📷</Button>
                    </div>
                    <Textarea
                      id="content"
                      value={lessonData.content}
                      onChange={(e) => setLessonData(prev => ({ ...prev, content: e.target.value }))}
                      placeholder="Digite o conteúdo da aula..."
                      className="min-h-64 border-0 resize-none focus:ring-0"
                    />
                  </div>
                </div>
              </TabsContent>

              {/* Arquivos Tab */}
              <TabsContent value="files" className="space-y-4">
                <div className="text-center p-8 border-2 border-dashed rounded-lg">
                  <div className="text-sm text-muted-foreground mb-4">
                    Adicione até <strong>10 arquivos</strong> de no máximo <strong>100MB</strong> cada.
                  </div>
                  <div className="text-sm text-muted-foreground mb-6">
                    Formatos permitidos: <strong>jpg, gif, png, bmp, pdf, zip, rar, epub, xls, xlsx, xltm, mp3, doc, docx, ppt, pptx</strong>.
                  </div>
                  <div className="space-y-3">
                    <Button className="flex items-center gap-2">
                      <Upload className="h-4 w-4" />
                      Selecionar do Club
                    </Button>
                    <Button variant="outline" className="flex items-center gap-2">
                      <Upload className="h-4 w-4" />
                      Enviar arquivo
                    </Button>
                  </div>
                </div>
              </TabsContent>

              {/* Leitura Complementar Tab */}
              <TabsContent value="reading" className="space-y-4">
                <div className="space-y-4">
                  <Label htmlFor="reading-links">Leitura complementar</Label>
                  <div className="text-sm text-muted-foreground mb-3">
                    Links externos com conteúdos complementares ao da sua aula.
                  </div>
                  <Textarea
                    id="reading-links"
                    placeholder="Cole aqui os links para leitura complementar..."
                    className="min-h-32"
                  />
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Capa do conteúdo */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-sm font-medium">Capa do conteúdo</CardTitle>
                  <HelpCircle className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center mb-3">
                  <Image className="h-8 w-8 text-gray-400" />
                </div>
                <Button variant="outline" size="sm" className="w-full">
                  Adicionar imagem
                </Button>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="space-y-3">
              <Button 
                onClick={handleSave} 
                className="w-full"
                disabled={saveLessonMutation.isPending}
              >
                {saveLessonMutation.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}