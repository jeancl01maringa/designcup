import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SocialPreview } from "@/components/sharing/SocialPreview";
import { ColorPicker } from "@/components/ui/color-picker";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ImageUploader } from "@/components/ui/image-uploader";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function SocialSharingDemo() {
  const [title, setTitle] = useState("Novo curso de design para profissionais de estética");
  const [description, setDescription] = useState("Aprenda design profissional para destacar seu negócio nas redes sociais. Curso exclusivo para profissionais de estética.");
  const [imageUrl, setImageUrl] = useState("https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D");
  const [brandName, setBrandName] = useState("Designcup");
  const [brandColor, setBrandColor] = useState("#AA5E2F");
  const [useOverlay, setUseOverlay] = useState(false);
  const [overlayOpacity, setOverlayOpacity] = useState(0.3);
  const [addWatermark, setAddWatermark] = useState(false);
  const [platform, setPlatform] = useState("facebook");

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold tracking-tight">Compartilhamento em Redes Sociais</h1>
        <p className="text-muted-foreground mt-2">
          Pré-visualize e personalize como seu conteúdo aparecerá nas redes sociais
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Conteúdo e Imagem</CardTitle>
              <CardDescription>
                Personalize o conteúdo compartilhado nas redes sociais
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Título do compartilhamento"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descrição que será exibida nos compartilhamentos"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="imageUpload">Imagem</Label>
                <ImageUploader
                  onImageUploaded={setImageUrl}
                  defaultImageUrl={imageUrl}
                  maxSizeMB={2}
                  maxWidthOrHeight={1200}
                  buttonText="Alterar imagem"
                  className="h-auto"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Marca e Estilo</CardTitle>
              <CardDescription>
                Ajuste a aparência da sua marca nos compartilhamentos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="brandName">Nome da Marca</Label>
                <Input
                  id="brandName"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  placeholder="Nome da sua marca ou empresa"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="brandColor">Cor da Marca</Label>
                <ColorPicker
                  color={brandColor}
                  onChange={setBrandColor}
                />
              </div>

              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="useOverlay">Usar sobreposição de cor</Label>
                    <p className="text-xs text-muted-foreground">
                      Adiciona uma sobreposição suave da cor da marca
                    </p>
                  </div>
                  <Switch
                    id="useOverlay"
                    checked={useOverlay}
                    onCheckedChange={setUseOverlay}
                  />
                </div>

                {useOverlay && (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label htmlFor="overlayOpacity">Opacidade da Sobreposição</Label>
                      <span className="text-xs text-muted-foreground">
                        {Math.round(overlayOpacity * 100)}%
                      </span>
                    </div>
                    <Slider
                      id="overlayOpacity"
                      min={0.1}
                      max={0.7}
                      step={0.05}
                      value={[overlayOpacity]}
                      onValueChange={(values) => setOverlayOpacity(values[0])}
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="space-y-0.5">
                  <Label htmlFor="addWatermark">Adicionar marca d'água</Label>
                  <p className="text-xs text-muted-foreground">
                    Exibe o nome da marca no canto da imagem
                  </p>
                </div>
                <Switch
                  id="addWatermark"
                  checked={addWatermark}
                  onCheckedChange={setAddWatermark}
                />
              </div>

              <div className="space-y-2 pt-2">
                <Label htmlFor="platformSelect">Plataforma Padrão</Label>
                <Tabs
                  value={platform}
                  onValueChange={setPlatform}
                  className="w-full"
                >
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="facebook">Facebook</TabsTrigger>
                    <TabsTrigger value="twitter">Twitter</TabsTrigger>
                    <TabsTrigger value="instagram">Instagram</TabsTrigger>
                    <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-7 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Pré-visualização</CardTitle>
              <CardDescription>
                Veja como seu conteúdo aparecerá nas redes sociais
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SocialPreview
                imageUrl={imageUrl}
                title={title}
                description={description}
                brandName={brandName}
                brandColor={brandColor}
                useOverlay={useOverlay}
                overlayOpacity={overlayOpacity}
                addWatermark={addWatermark}
                platform={platform}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}