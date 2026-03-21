import React, { useState } from "react";
import { AdminLayout } from "@/components/admin/layout/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Copy, Check, PlugZap, Activity, ShoppingCart } from "lucide-react";

interface WebhookOption {
    id: string;
    name: string;
    url: string;
    icon: React.ReactNode;
    description: string;
    color: string;
}

export default function IntegracoesPage() {
    const { toast } = useToast();
    const [copiedId, setCopiedId] = useState<string | null>(null);

    // Obtém o domínio base dinamicamente onde o app está rodando (mesmo domínio do front + API)
    // Como estamos testando local e enviando pra prd, usamos um fallback confiável para prd se `window` não estiver pronto
    const mainDomain = typeof window !== 'undefined'
        ? window.location.origin
        : 'https://designcup.com.br';

    const webhooks: WebhookOption[] = [
        {
            id: "hotmart",
            name: "Hotmart",
            description: "Copie a URL abaixo e cole no painel de Configurações de Webhook da Hotmart selecionando os eventos de compra e cancelamento.",
            url: `${mainDomain}/api/webhook/hotmart`,
            icon: <ShoppingCart className="h-5 w-5 text-white" />,
            color: "bg-[#F35815]" // Laranja aproximado da Hotmart
        },
        {
            id: "greenn",
            name: "Greenn",
            description: "Copie a URL abaixo e cole na edição do produto da Greenn, na aba Webhook, selecionando Venda Paga, Cancelada e Reembolsada.",
            url: `${mainDomain}/api/webhook/greenn`,
            icon: <Activity className="h-5 w-5 text-white" />,
            color: "bg-[#06D6A0]" // Verde aproximado da Greenn
        },
        {
            id: "kiwify",
            name: "Kiwify",
            description: "Copie a URL abaixo e cole nas configurações de Aplicativos > Webhooks da Kiwify.",
            url: `${mainDomain}/api/webhook/kiwify`, // Futura rota ou rota atual placeholder
            icon: <PlugZap className="h-5 w-5 text-white" />,
            color: "bg-[#1E1E1E]" // Pretp/Chumbo aproximado da Kiwify
        }
    ];

    const handleCopy = (id: string, url: string) => {
        navigator.clipboard.writeText(url);
        setCopiedId(id);
        toast({
            title: "URL Copiada!",
            description: "A URL do webhook foi copiada para a área de transferência.",
        });

        setTimeout(() => {
            setCopiedId(null);
        }, 2000);
    };

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Integrações de Pagamento</h1>
                    <p className="text-muted-foreground mt-2">
                        Gerencie as URLs de Webhook para sincronizar compras e assinaturas das plataformas automaticamente com a DesignCup.
                    </p>
                </div>

                <div className="grid gap-6">
                    {webhooks.map((webhook) => (
                        <Card key={webhook.id} className="overflow-hidden border-border/50 shadow-sm">
                            <div className="flex flex-col md:flex-row">
                                {/* Lateral com Logo/Cor */}
                                <div className={`${webhook.color} p-6 md:w-48 flex flex-col items-center justify-center gap-3`}>
                                    <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
                                        {webhook.icon}
                                    </div>
                                    <span className="font-bold text-white text-lg tracking-wide">{webhook.name}</span>
                                </div>

                                {/* Conteúdo e URL */}
                                <div className="p-6 flex-1 flex flex-col justify-center">
                                    <h3 className="font-semibold text-lg mb-1">Webhook para {webhook.name}</h3>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        {webhook.description}
                                    </p>

                                    <div className="flex gap-2">
                                        <Input
                                            value={webhook.url}
                                            readOnly
                                            className="font-mono text-sm bg-muted/50 focus-visible:ring-0"
                                        />
                                        <Button
                                            variant={copiedId === webhook.id ? "default" : "secondary"}
                                            onClick={() => handleCopy(webhook.id, webhook.url)}
                                            className="shrink-0 transition-all w-28"
                                        >
                                            {copiedId === webhook.id ? (
                                                <>
                                                    <Check className="mr-2 h-4 w-4" />
                                                    Copiado
                                                </>
                                            ) : (
                                                <>
                                                    <Copy className="mr-2 h-4 w-4" />
                                                    Copiar URL
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        </AdminLayout>
    );
}
