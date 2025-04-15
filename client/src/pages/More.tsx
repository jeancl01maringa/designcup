import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";

export default function More() {
  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-serif font-bold text-center mb-10">Mais Informações</h1>
      
      <Tabs defaultValue="about" className="max-w-3xl mx-auto">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="about">Sobre Nós</TabsTrigger>
          <TabsTrigger value="faq">Perguntas Frequentes</TabsTrigger>
          <TabsTrigger value="contact">Contato</TabsTrigger>
        </TabsList>
        
        <TabsContent value="about" className="mt-6">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-2xl font-medium mb-4">Sobre o Design para Estética</h2>
              <p className="mb-4">
                Somos a principal plataforma de artes para profissionais de estética no Brasil, 
                oferecendo templates de alta qualidade 100% editáveis para todas as suas necessidades.
              </p>
              <p>
                Nossa missão é ajudar profissionais de estética a criarem uma presença online profissional
                e atrativa, sem precisar contratar designers caros ou gastar horas tentando criar materiais do zero.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="faq" className="mt-6">
          <Card>
            <CardContent className="p-6 space-y-4">
              <div>
                <h3 className="text-lg font-medium">Como funciona a assinatura?</h3>
                <p className="text-gray-600">Nossa assinatura dá acesso ilimitado a todos os templates e atualizações mensais.</p>
              </div>
              <div>
                <h3 className="text-lg font-medium">Preciso saber design para usar os templates?</h3>
                <p className="text-gray-600">Não! Nossos templates são fáceis de editar mesmo sem conhecimento prévio.</p>
              </div>
              <div>
                <h3 className="text-lg font-medium">Posso editar no celular?</h3>
                <p className="text-gray-600">Sim, todos os nossos templates podem ser editados em dispositivos móveis.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="contact" className="mt-6">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-2xl font-medium mb-4">Entre em Contato</h2>
              <p className="mb-6">Estamos sempre disponíveis para ajudar com qualquer dúvida.</p>
              
              <div className="space-y-4">
                <div className="flex items-center">
                  <svg className="h-5 w-5 mr-3 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                  </svg>
                  <span>contato@designparaestetica.com.br</span>
                </div>
                <div className="flex items-center">
                  <svg className="h-5 w-5 mr-3 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                  </svg>
                  <span>(11) 9 8765-4321</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
