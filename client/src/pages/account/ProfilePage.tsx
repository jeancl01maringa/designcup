import { useState } from "react";
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
import { User, Mail, Phone, Calendar, Shield, Key, CreditCard, Download, Heart, Settings, Camera, Upload } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("perfil");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Buscar dados do perfil
  const { data: profileData = {}, isLoading: profileLoading } = useQuery({
    queryKey: ["/api/profile"],
    enabled: !!user,
  });

  // Dados do perfil para edição (inicializar com dados do usuário e perfil)
  const [editableData, setEditableData] = useState({
    username: user?.username || "",
    email: user?.email || "",
    telefone: "",
    biografia: "",
    site: "",
    localizacao: "",
  });

  // Estado para upload de imagem
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Dados para alteração de senha
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  // Salvar alterações do perfil
  const handleSaveProfile = async () => {
    try {
      setIsLoading(true);
      
      const response = await apiRequest('PATCH', '/api/user/profile', profileData);
      
      if (response.ok) {
        toast({
          title: "Perfil atualizado",
          description: "Suas informações foram salvas com sucesso.",
        });
      } else {
        throw new Error('Erro ao atualizar perfil');
      }
    } catch (error) {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível atualizar seu perfil. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
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

      // Verificar tamanho (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Arquivo muito grande",
          description: "A imagem deve ter no máximo 5MB.",
          variant: "destructive",
        });
        return;
      }

      setSelectedImage(file);
      
      // Criar preview da imagem
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Função para fazer upload da imagem
  const handleImageUpload = async () => {
    if (!selectedImage) return;

    try {
      setIsLoading(true);
      
      const formData = new FormData();
      formData.append('profileImage', selectedImage);

      const response = await fetch('/api/user/profile-image', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setProfileData(prev => ({ ...prev, profileImage: data.imageUrl }));
        setSelectedImage(null);
        setImagePreview(null);
        
        toast({
          title: "Foto atualizada",
          description: "Sua foto de perfil foi atualizada com sucesso.",
        });
      } else {
        throw new Error('Erro ao fazer upload da imagem');
      }
    } catch (error) {
      toast({
        title: "Erro no upload",
        description: "Não foi possível atualizar sua foto. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Alterar senha
  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Senhas não coincidem",
        description: "A nova senha e a confirmação devem ser iguais.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      
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
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Cabeçalho */}
        <div className="flex items-center gap-4 mb-8">
          <Avatar className="h-20 w-20">
            <AvatarImage src="" alt={user?.username || "Usuário"} />
            <AvatarFallback className="text-2xl">
              {user?.username?.slice(0, 2)?.toUpperCase() || "DA"}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">Meu Perfil</h1>
            <p className="text-gray-600 mt-1">
              Atualize suas informações pessoais e preferências de conta
            </p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant={user?.isAdmin ? "default" : "secondary"}>
                {user?.isAdmin ? "Administrador" : "Usuário"}
              </Badge>
            </div>
          </div>
        </div>

        {/* Tabs de navegação */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="perfil" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Perfil
            </TabsTrigger>
            <TabsTrigger value="seguranca" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Segurança
            </TabsTrigger>
            <TabsTrigger value="assinatura" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Assinatura
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
                  Sua foto será exibida em todo o sistema, incluindo no painel administrativo.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row items-start gap-6">
                  {/* Avatar atual */}
                  <div className="flex flex-col items-center space-y-4">
                    <Avatar className="h-24 w-24">
                      <AvatarImage 
                        src={imagePreview || profileData.profileImage || ""} 
                        alt="Foto do perfil" 
                      />
                      <AvatarFallback className="text-lg">
                        {user?.username?.charAt(0)?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <p className="text-sm text-gray-600 text-center">
                      {profileData.profileImage ? "Foto atual" : "Nenhuma foto"}
                    </p>
                  </div>

                  {/* Upload de foto */}
                  <div className="flex-1 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="profile-image">Escolher nova foto</Label>
                      <div className="flex items-center gap-4">
                        <Input
                          id="profile-image"
                          type="file"
                          accept="image/*"
                          onChange={handleImageSelect}
                          className="flex-1"
                        />
                        {selectedImage && (
                          <Button 
                            onClick={handleImageUpload}
                            disabled={isLoading}
                            size="sm"
                          >
                            {isLoading ? (
                              <>
                                <Upload className="h-4 w-4 mr-2 animate-spin" />
                                Enviando...
                              </>
                            ) : (
                              <>
                                <Upload className="h-4 w-4 mr-2" />
                                Salvar Foto
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">
                      Formatos aceitos: JPG, PNG, GIF. Tamanho máximo: 5MB.
                    </p>
                  </div>
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
                      value={profileData.username}
                      onChange={(e) => setProfileData(prev => ({ ...prev, username: e.target.value }))}
                      placeholder="Seu nome completo"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="seu@email.com"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="telefone">Telefone</Label>
                    <Input
                      id="telefone"
                      type="tel"
                      value={profileData.telefone}
                      onChange={(e) => setProfileData(prev => ({ ...prev, telefone: e.target.value }))}
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="localizacao">Localização</Label>
                    <Input
                      id="localizacao"
                      value={profileData.localizacao}
                      onChange={(e) => setProfileData(prev => ({ ...prev, localizacao: e.target.value }))}
                      placeholder="Cidade, Estado"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="biografia">Biografia</Label>
                  <textarea
                    id="biografia"
                    className="w-full min-h-[100px] px-3 py-2 border border-gray-300 rounded-md"
                    value={profileData.biografia}
                    onChange={(e) => setProfileData(prev => ({ ...prev, biografia: e.target.value }))}
                    placeholder="Uma breve descrição sobre você..."
                    maxLength={300}
                  />
                  <p className="text-sm text-gray-500">
                    Máximo de 300 caracteres
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="site">Site</Label>
                  <Input
                    id="site"
                    type="url"
                    value={profileData.site}
                    onChange={(e) => setProfileData(prev => ({ ...prev, site: e.target.value }))}
                    placeholder="https://seusite.com"
                  />
                </div>

                <Separator />

                <div className="flex justify-end">
                  <Button 
                    onClick={handleSaveProfile}
                    disabled={isLoading}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isLoading ? "Salvando..." : "Salvar Perfil"}
                  </Button>
                </div>
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
                  <Label htmlFor="currentPassword">Senha Atual</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                    placeholder="Digite sua senha atual"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nova Senha</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                    placeholder="Digite sua nova senha"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    placeholder="Confirme sua nova senha"
                  />
                </div>

                <Separator />

                <div className="flex justify-end">
                  <Button 
                    onClick={handleChangePassword}
                    disabled={isLoading || !passwordData.currentPassword || !passwordData.newPassword}
                    variant="outline"
                  >
                    {isLoading ? "Alterando..." : "Alterar Senha"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba Assinatura */}
          <TabsContent value="assinatura" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Status da Assinatura</CardTitle>
                <CardDescription>
                  Gerencie sua assinatura e planos.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <CreditCard className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Plano Gratuito</h3>
                  <p className="text-gray-600 mb-4">
                    Você está usando o plano gratuito. Faça upgrade para acessar recursos premium.
                  </p>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    Ver Planos Disponíveis
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba Preferências */}
          <TabsContent value="preferencias" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Preferências da Conta</CardTitle>
                <CardDescription>
                  Configure suas preferências de uso da plataforma.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Settings className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Em Desenvolvimento</h3>
                  <p className="text-gray-600">
                    As configurações de preferências estarão disponíveis em breve.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}