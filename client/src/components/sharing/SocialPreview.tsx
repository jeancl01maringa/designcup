import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface SocialPreviewProps {
  imageUrl: string;
  title: string;
  description: string;
  brandName?: string;
  brandColor?: string;
  useOverlay?: boolean;
  overlayOpacity?: number;
  addWatermark?: boolean;
  platform?: string;
}

export function SocialPreview({ 
  imageUrl, 
  title, 
  description, 
  brandName = "Design para Estética", 
  brandColor = "#AA5E2F",
  useOverlay = false,
  overlayOpacity = 0.2,
  addWatermark = false,
  platform = "facebook"
}: SocialPreviewProps) {

  // Converte as iniciais da marca para o avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Gera um nome de usuário para a rede social
  const getSocialUsername = (name: string) => {
    return "@" + name.toLowerCase().replace(/\s+/g, '');
  };

  const renderImage = () => (
    <div className="relative">
      <img 
        src={imageUrl} 
        alt={title} 
        className="w-full h-64 object-cover"
      />
      
      {/* Sobreposição colorida */}
      {useOverlay && (
        <div 
          className="absolute inset-0" 
          style={{ 
            backgroundColor: brandColor,
            opacity: overlayOpacity
          }}
        />
      )}
      
      {/* Marca d'água */}
      {addWatermark && (
        <div className="absolute bottom-2 right-2 text-white text-xs font-semibold drop-shadow-md">
          {brandName}
        </div>
      )}
    </div>
  );

  return (
    <div className="w-full">
      <Tabs defaultValue={platform} className="w-full">
        <TabsList className="grid grid-cols-4">
          <TabsTrigger value="facebook">Facebook</TabsTrigger>
          <TabsTrigger value="twitter">Twitter</TabsTrigger>
          <TabsTrigger value="instagram">Instagram</TabsTrigger>
          <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
        </TabsList>
        
        <TabsContent value="facebook" className="mt-4">
          <Card className="overflow-hidden max-w-[500px] mx-auto border border-border rounded-md">
            <div className="bg-muted py-1 px-2 text-xs text-muted-foreground border-b border-border">
              facebook.com
            </div>
            {renderImage()}
            <CardContent className="p-3">
              <h3 
                className="text-sm font-semibold hover:underline"
                style={{ color: brandColor }}
              >
                {brandName}
              </h3>
              <h4 className="text-sm text-foreground font-semibold mt-1 line-clamp-2">
                {title}
              </h4>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {description}
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="twitter" className="mt-4">
          <Card className="overflow-hidden max-w-[500px] mx-auto border border-border rounded-xl">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-2">
                <div 
                  className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center"
                  style={{ backgroundColor: brandColor }}
                >
                  <span className="text-white font-bold">{getInitials(brandName)}</span>
                </div>
                <div>
                  <p className="font-bold text-foreground">{brandName}</p>
                  <p className="text-muted-foreground text-sm">{getSocialUsername(brandName)}</p>
                </div>
              </div>
              
              <p className="text-foreground mb-3">
                {title}
              </p>
              <div className="rounded-xl overflow-hidden border border-border">
                {renderImage()}
                <div className="p-3 bg-card">
                  <p className="text-muted-foreground text-sm line-clamp-2">
                    {description}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="instagram" className="mt-4">
          <Card className="overflow-hidden max-w-[500px] mx-auto border border-border rounded-xl">
            <div className="p-2 border-b border-border flex items-center gap-2">
              <div 
                className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center"
                style={{ backgroundColor: brandColor }}
              >
                <span className="text-white text-xs font-bold">{getInitials(brandName)}</span>
              </div>
              <span className="text-sm font-semibold">{brandName}</span>
            </div>
            <div className="aspect-square w-full max-h-[500px] overflow-hidden">
              {renderImage()}
            </div>
            <CardContent className="p-3 bg-card">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{brandName}</span>
                <span className="text-sm text-foreground">{title}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Ver todos os {Math.floor(Math.random() * 20) + 5} comentários
              </p>
              <p className="text-[10px] text-gray-400 mt-1">HÁ 1 HORA</p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="whatsapp" className="mt-4">
          <Card className="overflow-hidden max-w-[500px] mx-auto border border-border rounded-md">
            <div 
              className="py-1 px-3 text-xs text-white"
              style={{ backgroundColor: "#128C7E" }}
            >
              Compartilhado via WhatsApp
            </div>
            {renderImage()}
            <CardContent className="p-3 bg-[#DCF8C6]">
              <h4 className="text-sm text-foreground font-semibold line-clamp-1">
                {title}
              </h4>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {description}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Toque para mais informações
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}