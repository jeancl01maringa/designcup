import React, { useState } from "react";
import { Share, Facebook, Instagram, Twitter, Clipboard, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { SocialPreview } from "./SocialPreview";
import type { Artwork } from "@shared/schema";

interface SocialShareProps {
  artwork: Artwork;
}

export function SocialShare({ artwork }: SocialShareProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("preview");
  const [customTitle, setCustomTitle] = useState(artwork.title);
  const [customDescription, setCustomDescription] = useState(artwork.description || "");
  const [useCustomText, setUseCustomText] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl = `${window.location.origin}/artwork/${artwork.id}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      
      toast({
        title: "Link copiado!",
        description: "O link foi copiado para a área de transferência.",
      });
    });
  };

  const generateSocialShareLink = (platform: string) => {
    const title = useCustomText ? customTitle : artwork.title;
    const description = useCustomText ? customDescription : (artwork.description || "");
    
    switch (platform) {
      case "facebook":
        return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(title)}`;
      case "twitter":
        return `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(title)}`;
      case "whatsapp":
        return `https://wa.me/?text=${encodeURIComponent(`${title}: ${shareUrl}`)}`;
      default:
        return shareUrl;
    }
  };

  const handleShare = (platform: string) => {
    const shareLink = generateSocialShareLink(platform);
    window.open(shareLink, "_blank");
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Share className="h-4 w-4" />
          <span>Compartilhar</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Compartilhar Artwork</DialogTitle>
          <DialogDescription>
            Personalize e compartilhe este artwork em suas redes sociais
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="preview" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="preview">Pré-visualização</TabsTrigger>
            <TabsTrigger value="customize">Personalizar</TabsTrigger>
          </TabsList>
          
          <TabsContent value="preview" className="mt-4 space-y-4">
            <SocialPreview 
              imageUrl={artwork.imageUrl}
              title={useCustomText ? customTitle : artwork.title}
              description={useCustomText ? customDescription : (artwork.description || "")}
            />
            
            <div className="flex justify-center space-x-2 mt-6">
              <Button 
                variant="outline" 
                size="icon" 
                className="rounded-full bg-[#1877F2] text-white hover:bg-[#166FE5]"
                onClick={() => handleShare("facebook")}
              >
                <Facebook className="h-5 w-5" />
                <span className="sr-only">Compartilhar no Facebook</span>
              </Button>
              <Button 
                variant="outline" 
                size="icon" 
                className="rounded-full bg-gradient-to-tr from-[#FA7E1E] via-[#D62976] to-[#962FBF] text-white hover:opacity-90"
                onClick={() => handleShare("instagram")}
              >
                <Instagram className="h-5 w-5" />
                <span className="sr-only">Compartilhar no Instagram</span>
              </Button>
              <Button 
                variant="outline" 
                size="icon" 
                className="rounded-full bg-[#1DA1F2] text-white hover:bg-[#0c85d0]"
                onClick={() => handleShare("twitter")}
              >
                <Twitter className="h-5 w-5" />
                <span className="sr-only">Compartilhar no Twitter</span>
              </Button>
              <Button 
                variant="outline" 
                size="icon" 
                className="rounded-full bg-[#25D366] text-white hover:bg-[#128C7E]"
                onClick={() => handleShare("whatsapp")}
              >
                <svg 
                  className="h-5 w-5" 
                  fill="currentColor" 
                  viewBox="0 0 24 24" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                </svg>
                <span className="sr-only">Compartilhar no WhatsApp</span>
              </Button>
              <Button 
                variant="outline" 
                size="icon"
                onClick={handleCopyLink}
              >
                {copied ? (
                  <Check className="h-5 w-5 text-green-500" />
                ) : (
                  <Clipboard className="h-5 w-5" />
                )}
                <span className="sr-only">Copiar link</span>
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="customize" className="mt-4 space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="custom-text"
                checked={useCustomText}
                onCheckedChange={setUseCustomText}
              />
              <Label htmlFor="custom-text">Usar texto personalizado</Label>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  disabled={!useCustomText}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Input
                  id="description"
                  value={customDescription}
                  onChange={(e) => setCustomDescription(e.target.value)}
                  disabled={!useCustomText}
                />
              </div>
              
              <Button
                type="button"
                onClick={() => setActiveTab("preview")}
              >
                Ver pré-visualização
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end mt-4">
          <DialogClose asChild>
            <Button variant="outline">Fechar</Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}