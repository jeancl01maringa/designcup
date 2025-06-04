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
import { User, Mail, Phone, Calendar, Shield, Key, CreditCard, Download, Heart, Settings } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("perfil");

  // Dados do perfil para edição
  const [profileData, setProfileData] = useState({
    username: user?.username || "",
    email: user?.email || "",
    telefone: "",
    biografia: "",
    site: "",
    localizacao: ""
  });

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