import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageUploader } from "@/components/ui/image-uploader";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";

export default function ImageUploadDemo() {
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>("");
  const [maxSizeMB, setMaxSizeMB] = useState<number>(1);
  const [maxWidth, setMaxWidth] = useState<number>(1080);
  const [showSupabaseInfo, setShowSupabaseInfo] = useState(false);
  const [supabaseStatus, setSupabaseStatus] = useState<"checking" | "connected" | "error">("checking");
  const [errorMessage, setErrorMessage] = useState<string>("");

  // Verifica conexão com o Supabase
  React.useEffect(() => {
    const checkSupabaseConnection = async () => {
      try {
        setSupabaseStatus("checking");
        
        // Tenta listar buckets para verificar a conexão
        const { data, error } = await supabase.storage.listBuckets();
        
        if (error) {
          throw error;
        }
        
        setSupabaseStatus("connected");
        console.log("Buckets disponíveis:", data);
      } catch (error) {
        setSupabaseStatus("error");
        console.error("Erro ao conectar com Supabase:", error);
        setErrorMessage(error instanceof Error ? error.message : "Erro desconhecido");
      }
    };
    
    checkSupabaseConnection();
  }, []);

  const handleImageUploaded = (imageUrl: string) => {
    setUploadedImageUrl(imageUrl);
    console.log("Imagem enviada com sucesso:", imageUrl);
  };

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold tracking-tight">Upload de Imagens com Supabase</h1>
        <p className="text-muted-foreground mt-2">
          Upload de imagens com compressão automática para WebP e armazenamento no Supabase
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-5 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Upload de Imagem</CardTitle>
              <CardDescription>
                Selecione uma imagem para enviar ao Supabase Storage
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="maxSize">Tamanho máximo (MB): {maxSizeMB}MB</Label>
                <Input
                  id="maxSize"
                  type="range"
                  min="0.1"
                  max="5"
                  step="0.1"
                  value={maxSizeMB}
                  onChange={(e) => setMaxSizeMB(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="maxWidth">Largura/Altura máxima (px): {maxWidth}px</Label>
                <Input
                  id="maxWidth"
                  type="range"
                  min="400"
                  max="2000"
                  step="100"
                  value={maxWidth}
                  onChange={(e) => setMaxWidth(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
              
              <Separator className="my-4" />
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="showSupabaseInfo">Mostrar informações do Supabase</Label>
                    <p className="text-xs text-muted-foreground">
                      Exibir detalhes técnicos da conexão
                    </p>
                  </div>
                  <Switch
                    id="showSupabaseInfo"
                    checked={showSupabaseInfo}
                    onCheckedChange={setShowSupabaseInfo}
                  />
                </div>
                
                {showSupabaseInfo && (
                  <div className="bg-muted p-4 rounded-md text-sm">
                    <h3 className="font-medium mb-2">Status da conexão Supabase</h3>
                    <div className="flex items-center">
                      <div 
                        className={`w-3 h-3 rounded-full mr-2 ${
                          supabaseStatus === "checking" ? "bg-yellow-500" :
                          supabaseStatus === "connected" ? "bg-green-500" :
                          "bg-red-500"
                        }`} 
                      />
                      <span>
                        {supabaseStatus === "checking" ? "Verificando conexão..." :
                         supabaseStatus === "connected" ? "Conectado" :
                         "Erro de conexão"}
                      </span>
                    </div>
                    
                    {supabaseStatus === "error" && (
                      <div className="mt-2 text-red-500">
                        {errorMessage}
                      </div>
                    )}
                    
                    {supabaseStatus === "connected" && (
                      <div className="mt-2 space-y-1 text-xs">
                        <p>
                          As imagens enviadas são automaticamente armazenadas
                          no bucket 'images' do Supabase Storage, convertidas para WebP
                          e otimizadas para web.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="md:col-span-7 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Enviar Imagem</CardTitle>
              <CardDescription>
                Arraste uma imagem ou selecione do seu dispositivo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ImageUploader 
                onImageUploaded={handleImageUploaded}
                maxSizeMB={maxSizeMB}
                maxWidthOrHeight={maxWidth}
              />
            </CardContent>
          </Card>
          
          {uploadedImageUrl && (
            <Card>
              <CardHeader>
                <CardTitle>Imagem Enviada</CardTitle>
                <CardDescription>
                  Visualização da imagem otimizada armazenada no Supabase
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border rounded-md overflow-hidden">
                  <img
                    src={uploadedImageUrl}
                    alt="Imagem enviada"
                    className="w-full object-contain max-h-96"
                  />
                </div>
                
                <div className="p-4 bg-muted rounded-md">
                  <Label className="block mb-1">URL da imagem:</Label>
                  <div className="flex items-center">
                    <Input
                      value={uploadedImageUrl}
                      readOnly
                      className="text-xs font-mono"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Esta URL pode ser usada em qualquer lugar da plataforma para exibir esta imagem.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}