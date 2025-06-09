import React from "react";
import { Link } from "wouter";
import { AdminLayout } from "@/components/admin/layout/AdminLayout";
import { PageHeader } from "@/components/admin/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Megaphone, Zap, TrendingUp, Users, Eye, MousePointer } from "lucide-react";

export default function MarketingPage() {
  const marketingCards = [
    {
      title: "Popups Ativos",
      value: "2",
      description: "Campanhas em execução",
      icon: <Zap className="h-4 w-4" />,
      color: "bg-blue-500/10 text-blue-500",
      href: "/admin/marketing/popups"
    },
    {
      title: "Taxa de Conversão",
      value: "12.5%",
      description: "Último mês",
      icon: <TrendingUp className="h-4 w-4" />,
      color: "bg-green-500/10 text-green-500"
    },
    {
      title: "Visualizações",
      value: "1,847",
      description: "Este mês",
      icon: <Eye className="h-4 w-4" />,
      color: "bg-purple-500/10 text-purple-500"
    },
    {
      title: "Cliques",
      value: "231",
      description: "Este mês",
      icon: <MousePointer className="h-4 w-4" />,
      color: "bg-orange-500/10 text-orange-500"
    }
  ];

  return (
    <AdminLayout>
      <PageHeader 
        title="Marketing" 
        description="Gerencie campanhas promocionais e popups da plataforma"
      />

      {/* Estatísticas de Marketing */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {marketingCards.map((card, index) => (
          <Card key={index} className={card.href ? "cursor-pointer hover:shadow-md transition-shadow" : ""}>
            {card.href ? (
              <Link href={card.href}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                  <div className={`p-2 rounded-full ${card.color}`}>
                    {card.icon}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{card.value}</div>
                  <p className="text-xs text-muted-foreground">{card.description}</p>
                </CardContent>
              </Link>
            ) : (
              <>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                  <div className={`p-2 rounded-full ${card.color}`}>
                    {card.icon}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{card.value}</div>
                  <p className="text-xs text-muted-foreground">{card.description}</p>
                </CardContent>
              </>
            )}
          </Card>
        ))}
      </div>

      {/* Ferramentas de Marketing */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-blue-500" />
              Popups Promocionais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Crie e gerencie popups promocionais para aumentar conversões e engajamento dos usuários.
            </p>
            <div className="space-y-3 mb-8">
              <div className="flex justify-between text-sm">
                <span>Popups ativos</span>
                <span className="font-medium">2</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Taxa de clique média</span>
                <span className="font-medium">8.3%</span>
              </div>
            </div>
            <Link href="/admin/marketing/popups">
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                Gerenciar Popups
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-green-500" />
              Segmentação de Usuários
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Configure campanhas direcionadas por tipo de usuário, páginas específicas e comportamento.
            </p>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Usuários gratuitos</span>
                <span className="font-medium">1,234</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Usuários premium</span>
                <span className="font-medium">89</span>
              </div>
            </div>
            <Button variant="outline" className="w-full" disabled>
              Em breve
            </Button>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}