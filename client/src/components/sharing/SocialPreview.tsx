import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface SocialPreviewProps {
  imageUrl: string;
  title: string;
  description: string;
}

export function SocialPreview({ imageUrl, title, description }: SocialPreviewProps) {
  return (
    <div className="w-full">
      <Tabs defaultValue="facebook" className="w-full">
        <TabsList className="grid grid-cols-3">
          <TabsTrigger value="facebook">Facebook</TabsTrigger>
          <TabsTrigger value="twitter">Twitter</TabsTrigger>
          <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
        </TabsList>
        
        <TabsContent value="facebook" className="mt-4">
          <Card className="overflow-hidden max-w-[500px] mx-auto border border-gray-300 rounded-md">
            <div className="bg-gray-100 py-1 px-2 text-xs text-gray-600 border-b border-gray-300">
              facebook.com
            </div>
            <div>
              <img 
                src={imageUrl} 
                alt={title} 
                className="w-full h-64 object-cover"
              />
            </div>
            <CardContent className="p-3">
              <h3 className="text-[#385898] text-sm font-semibold hover:underline">
                Design para Estética
              </h3>
              <h4 className="text-sm text-gray-900 font-semibold mt-1 line-clamp-2">
                {title}
              </h4>
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                {description}
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="twitter" className="mt-4">
          <Card className="overflow-hidden max-w-[500px] mx-auto border border-gray-300 rounded-xl">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center">
                  <span className="text-gray-500 font-bold">DE</span>
                </div>
                <div>
                  <p className="font-bold text-gray-900">Design para Estética</p>
                  <p className="text-gray-500 text-sm">@designestetica</p>
                </div>
              </div>
              
              <p className="text-gray-900 mb-3">
                {title}
              </p>
              <div className="rounded-xl overflow-hidden border border-gray-300">
                <img 
                  src={imageUrl} 
                  alt={title} 
                  className="w-full h-64 object-cover"
                />
                <div className="p-3 bg-white">
                  <p className="text-gray-500 text-sm line-clamp-2">
                    {description}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="whatsapp" className="mt-4">
          <Card className="overflow-hidden max-w-[500px] mx-auto border border-gray-300 rounded-md">
            <div className="bg-[#128C7E] py-1 px-3 text-xs text-white">
              Compartilhado via WhatsApp
            </div>
            <div>
              <img 
                src={imageUrl} 
                alt={title} 
                className="w-full h-64 object-cover"
              />
            </div>
            <CardContent className="p-3 bg-[#DCF8C6]">
              <h4 className="text-sm text-gray-900 font-semibold line-clamp-1">
                {title}
              </h4>
              <p className="text-xs text-gray-700 mt-1 line-clamp-2">
                {description}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Toque para mais informações
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}