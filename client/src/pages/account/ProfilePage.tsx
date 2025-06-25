import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { User, Mail, Phone, Calendar, Shield, Key, CreditCard, Download, Heart, Settings, Camera, Upload, Clock, MessageSquare } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ProfileLayout } from "@/components/layout/ProfileLayout";

interface UserPlan {
  planName: string;
  periodo: string;
  valor: string;
  isActive: boolean;
}

interface ProfileData {
  bio?: string;
  site?: string;
  localizacao?: string;
}

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("perfil");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Type assertion for user data with subscription properties
  const userData = user as any;
  
  // Check if user is premium (Hotmart integration)
  const isPremiumUser = userData?.tipo === "premium";
  const isEmailPhoneEditable = !isPremiumUser;

  // Buscar dados do perfil
  const { data: profileData = {} as ProfileData, isLoading: profileLoading } = useQuery<ProfileData>({
    queryKey: ["/api/profile"],
    enabled: !!user,
  });

  // Buscar informações do plano do usuário
  const { data: userPlan, isLoading: planLoading } = useQuery<UserPlan>({
    queryKey: ["/api/user/plan"],
    enabled: !!user,
  });

  // Dados do perfil para edição
  const [editableData, setEditableData] = useState({
    username: user?.username || "",
    email: user?.email || "",
    telefone: userData?.telefone || "",
    biografia: "",
    site: "",
    localizacao: "",
  });

  // Dados para alteração de senha
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  // Sync user data when it loads
  useEffect(() => {
    if (user) {
      setEditableData(prev => ({
        ...prev,
        username: user.username || "",
        email: user.email || "",
        telefone: userData?.telefone || "",
      }));
    }
  }, [user, userData?.telefone]);

  // Sync profile data when it loads
  useEffect(() => {
    if (profileData && Object.keys(profileData).length > 0) {
      setEditableData(prev => ({
        ...prev,
        biografia: profileData.bio || "",
        site: profileData.site || "",
        localizacao: profileData.localizacao || "",
      }));
    }
  }, [profileData]);

  // Mutation para upload de foto
  const uploadPhotoMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await fetch('/api/profile/upload-photo', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Erro ao fazer upload da imagem');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Foto atualizada",
        description: "Sua foto de perfil foi atualizada com sucesso.",
      });
      
      // Usar a nova URL da imagem retornada pelo servidor
      const newImageUrl = data.newImageUrl || data.profileImage;
      
      // Forçar atualização imediata do cache do usuário com timestamp para evitar cache do navegador
      queryClient.setQueryData(["/api/user"], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          profileImage: `${newImageUrl}?t=${Date.now()}`,
        };
      });

      // Forçar atualização imediata do cache do perfil
      queryClient.setQueryData(["/api/profile"], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          profileImage: `${newImageUrl}?t=${Date.now()}`,
        };
      });

      // Invalidar todos os caches relacionados ao usuário
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      
      // Forçar re-render do Header que pode ter cache da imagem
      queryClient.refetchQueries({ queryKey: ["/api/user"] });
      
      // Limpar preview
      setSelectedImage(null);
      setImagePreview(null);
    },
    onError: (error: any) => {
      toast({
        title: "Erro no upload",
        description: error.message || "Não foi possível fazer upload da imagem.",
        variant: "destructive",
      });
    }
  });

  // Função para fazer upload da imagem
  const handleImageUpload = async () => {
    if (!selectedImage) return;
    uploadPhotoMutation.mutate(selectedImage);
  };

  // Função para lidar com seleção de imagem
  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Verificar se é uma imagem
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Arquivo inválido",
          description: "Por favor, selecione apenas arquivos de imagem.",
          variant: "destructive",
        });
        return;
      }

      // Verificar tamanho do arquivo (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Arquivo muito grande",
          description: "Por favor, selecione uma imagem menor que 5MB.",
          variant: "destructive",
        });
        return;
      }

      // Definir arquivo selecionado
      setSelectedImage(file);
      
      // Criar preview da imagem
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Salvar alterações do perfil
  const handleSaveProfile = async () => {
    try {
      const response = await apiRequest('PATCH', '/api/user/profile', editableData);
      
      if (response.ok) {
        toast({
          title: "Perfil atualizado",
          description: "Suas informações foram salvas com sucesso.",
        });
        
        // Invalidar cache para recarregar dados do usuário
        queryClient.invalidateQueries({ queryKey: ["/api/user"] });
        queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      } else {
        const errorData = await response.json();
        
        if (errorData.error === 'ALTERACAO_RESTRITA_PREMIUM') {
          toast({
            title: "Alteração restrita",
            description: "Entre em contato com o suporte para alterar email ou telefone.",
            variant: "destructive",
          });
        } else {
          throw new Error(errorData.message || 'Erro ao atualizar perfil');
        }
      }
    } catch (error: any) {
      toast({
        title: "Erro ao salvar",
        description: error.message || "Não foi possível atualizar seu perfil. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  // Alterar senha
  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Senhas não coincidem",
        description: "A nova senha e confirmação devem ser iguais.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await apiRequest('PATCH', '/api/user/password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      
      if (response.ok) {
        toast({
          title: "Senha alterada",
          description: "Sua senha foi alterada com sucesso.",
        });
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: ""
        });
      } else {
        throw new Error('Erro ao alterar senha');
      }
    } catch (error) {
      toast({
        title: "Erro ao alterar senha",
        description: "Não foi possível alterar sua senha. Verifique a senha atual.",
        variant: "destructive",
      });
    }
  };

  if (profileLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Carregando perfil...</div>
        </div>
      </div>
    );
  }

  return (
    <ProfileLayout>
      <div className="max-w-4xl">
        <div className="mb-6">
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Meu Perfil</h1>
          <p className="text-muted-foreground text-sm lg:text-base">
            Gerencie suas informações pessoais e configurações de conta
          </p>
        </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="perfil" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Perfil
          </TabsTrigger>
          <TabsTrigger value="seguranca" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Segurança
          </TabsTrigger>
          <TabsTrigger value="preferencias" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Preferências
          </TabsTrigger>
        </TabsList>

        {/* Aba Perfil */}
        <TabsContent value="perfil" className="space-y-6">
          {/* Seção de Foto do Perfil */}
          <Card>
            <CardHeader>
              <CardTitle>Foto do Perfil</CardTitle>
              <CardDescription>
                Clique na foto para alterar. Sua foto será exibida em todo o sistema.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row items-start gap-6">
                {/* Avatar clicável */}
                <div className="flex flex-col items-center space-y-4">
                  <div 
                    className="relative group cursor-pointer"
                    onClick={() => document.getElementById('profile-image-input')?.click()}
                  >
                    <Avatar className="h-24 w-24 transition-all group-hover:brightness-75">
                      <AvatarImage 
                        src={imagePreview || user?.profileImage || ""} 
                        alt="Foto do perfil"
                        className="object-cover"
                      />
                      <AvatarFallback className="text-lg bg-gray-200">
                        {user?.username?.charAt(0)?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 text-center max-w-24">
                    {user?.profileImage || imagePreview ? "Clique para alterar" : "Clique para adicionar foto"}
                  </p>
                </div>

                {/* Upload invisível */}
                <input
                  id="profile-image-input"
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />

                {/* Preview e botão de upload */}
                {selectedImage && (
                  <div className="flex-1 space-y-4">
                    <div className="space-y-2">
                      <Label>Nova foto selecionada</Label>
                      <div className="flex items-center gap-4">
                        <div className="text-sm text-gray-600">
                          {selectedImage.name} ({(selectedImage.size / 1024 / 1024).toFixed(2)} MB)
                        </div>
                        <Button 
                          onClick={handleImageUpload}
                          disabled={uploadPhotoMutation.isPending}
                          size="sm"
                          className="bg-[#1f4ed8] hover:bg-[#1d4ed8]/90"
                        >
                          {uploadPhotoMutation.isPending ? (
                            <>
                              <Upload className="h-4 w-4 mr-2 animate-spin" />
                              Convertendo para WebP...
                            </>
                          ) : (
                            <>
                              <Upload className="h-4 w-4 mr-2" />
                              Salvar Foto
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {!selectedImage && (
                  <div className="flex-1 space-y-2">
                    <p className="text-sm text-gray-500">
                      • Formatos aceitos: JPG, PNG, GIF
                    </p>
                    <p className="text-sm text-gray-500">
                      • Tamanho máximo: 5MB
                    </p>
                    <p className="text-sm text-gray-500">
                      • Recomendado: imagens quadradas
                    </p>

                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Informações Pessoais</CardTitle>
              <CardDescription>
                Atualize suas informações básicas que serão visíveis para outros usuários.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="username">Nome Completo</Label>
                  <Input
                    id="username"
                    value={editableData.username}
                    onChange={(e) => setEditableData(prev => ({ ...prev, username: e.target.value }))}
                    placeholder="Seu nome completo"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">
                    E-mail
                    {isPremiumUser && (
                      <span className="text-xs text-amber-600 ml-2">
                        (Solicite alteração via suporte)
                      </span>
                    )}
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={editableData.email}
                    onChange={(e) => setEditableData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="seu.email@exemplo.com"
                    disabled={isPremiumUser}
                    className={isPremiumUser ? "bg-gray-100 cursor-not-allowed" : ""}
                  />
                  {isPremiumUser && (
                    <p className="text-xs text-gray-500">
                      Usuários premium devem solicitar alteração de email via suporte devido à integração com Hotmart
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefone">
                    Telefone
                    {isPremiumUser && (
                      <span className="text-xs text-amber-600 ml-2">
                        (Solicite alteração via suporte)
                      </span>
                    )}
                  </Label>
                  <Input
                    id="telefone"
                    value={editableData.telefone}
                    onChange={(e) => setEditableData(prev => ({ ...prev, telefone: e.target.value }))}
                    placeholder="(11) 99999-9999"
                    disabled={isPremiumUser}
                    className={isPremiumUser ? "bg-gray-100 cursor-not-allowed" : ""}
                  />
                  {isPremiumUser && (
                    <p className="text-xs text-gray-500">
                      Usuários premium devem solicitar alteração de telefone via suporte devido à integração com Hotmart
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="site">Site</Label>
                  <Input
                    id="site"
                    value={editableData.site}
                    onChange={(e) => setEditableData(prev => ({ ...prev, site: e.target.value }))}
                    placeholder="www.seusite.com"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="biografia">Biografia</Label>
                <Textarea
                  id="biografia"
                  value={editableData.biografia}
                  onChange={(e) => setEditableData(prev => ({ ...prev, biografia: e.target.value }))}
                  placeholder="Conte um pouco sobre você e sua experiência..."
                  rows={4}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="localizacao">Localização</Label>
                <Input
                  id="localizacao"
                  value={editableData.localizacao}
                  onChange={(e) => setEditableData(prev => ({ ...prev, localizacao: e.target.value }))}
                  placeholder="Cidade, Estado"
                />
              </div>

              <Button onClick={handleSaveProfile} className="w-full">
                Salvar Alterações
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Segurança */}
        <TabsContent value="seguranca" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Alterar Senha</CardTitle>
              <CardDescription>
                Mantenha sua conta segura com uma senha forte.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Senha Atual</Label>
                <Input
                  id="current-password"
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">Nova Senha</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                />
              </div>
              <Button onClick={handlePasswordChange} className="w-full">
                <Key className="h-4 w-4 mr-2" />
                Alterar Senha
              </Button>
            </CardContent>
          </Card>
        </TabsContent>



        {/* Aba Preferências */}
        <TabsContent value="preferencias" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configurações Gerais</CardTitle>
              <CardDescription>
                Personalize sua experiência na plataforma.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h4 className="font-medium">Notificações por email</h4>
                  <p className="text-sm text-muted-foreground">Receba updates sobre novos templates</p>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="email-notifications" className="rounded" />
                  <label htmlFor="email-notifications" className="text-sm">Ativo</label>
                </div>
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h4 className="font-medium">Downloads automáticos</h4>
                  <p className="text-sm text-muted-foreground">Baixar automaticamente após personalizar</p>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="auto-download" className="rounded" />
                  <label htmlFor="auto-download" className="text-sm">Ativo</label>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </ProfileLayout>
  );
}