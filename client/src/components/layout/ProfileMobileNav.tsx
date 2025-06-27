import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useSupportNumber } from "@/hooks/use-support-number";
import {
  Menu,
  User,
  CreditCard,
  Heart,
  Bookmark,
  Users,
  Edit3,
  MessageSquare,
  LogOut,
  X,
  ChevronDown
} from "lucide-react";

export function ProfileMobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const [location] = useLocation();
  const { logoutMutation } = useAuth();
  const { whatsappUrl } = useSupportNumber();

  const menuItems = [
    {
      href: "/perfil",
      icon: User,
      label: "Minha Conta",
      description: "Perfil e configurações"
    },
    {
      href: "/assinatura",
      icon: CreditCard,
      label: "Assinatura",
      description: "Gerenciar sua assinatura"
    },
    {
      href: "/curtidas",
      icon: Heart,
      label: "Curtidas",
      description: "Artes que você curtiu"
    },
    {
      href: "/salvos",
      icon: Bookmark,
      label: "Salvos",
      description: "Para usar depois"
    },
    {
      href: "/seguindo",
      icon: Users,
      label: "Seguindo",
      description: "Designers que você segue"
    },
    {
      href: "/edicoes-recentes",
      icon: Edit3,
      label: "Edições recentes",
      description: "Artes editadas no Canva"
    }
  ];

  return (
    <div className="lg:hidden">
      {/* Barra inferior tipo Instagram - sobe de baixo */}
      <div className="fixed bottom-0 left-0 right-0 z-40">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <button className="w-full bg-white shadow-lg border-t border-gray-200 flex flex-col items-center hover:bg-gray-50 transition-all duration-200 hover:shadow-xl">
              {/* Área do botão com seta para cima */}
              <div className="w-full py-2 flex items-center justify-center">
                <ChevronDown className="h-4 w-4 text-gray-600 rotate-180" />
              </div>
              {/* Parte principal da barra - só um pouquinho visível */}
              <div className="w-full h-2 bg-gradient-to-r from-blue-500 to-blue-600"></div>
            </button>
          </SheetTrigger>
        
          <SheetContent side="bottom" className="w-full h-auto p-0 rounded-t-xl">
            <div className="bg-white rounded-t-xl">
              {/* Header compacto */}
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800 text-center">Meu Perfil</h2>
              </div>

              {/* Menu items em grid - aproveitando a largura */}
              <div className="p-4">
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location === item.href;
                    
                    return (
                      <Link key={item.href} href={item.href}>
                        <a
                          onClick={() => setIsOpen(false)}
                          className={cn(
                            "flex flex-col items-center gap-2 p-3 rounded-lg transition-colors duration-200",
                            isActive
                              ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                          )}
                        >
                          <div
                            className={cn(
                              "w-10 h-10 rounded-full flex items-center justify-center",
                              isActive
                                ? "bg-blue-100"
                                : "bg-gray-100"
                            )}
                          >
                            <Icon
                              className={cn(
                                "w-5 h-5",
                                isActive ? "text-blue-600" : "text-gray-500"
                              )}
                            />
                          </div>
                          <div className="text-center">
                            <p
                              className={cn(
                                "font-medium text-xs leading-tight",
                                isActive ? "text-blue-700" : "text-gray-800"
                              )}
                            >
                              {item.label}
                            </p>
                          </div>
                        </a>
                      </Link>
                    );
                  })}
                </div>

                {/* Ações na parte inferior */}
                <div className="flex gap-2 pt-2 border-t border-gray-200">
                  {/* Suporte via WhatsApp */}
                  {whatsappUrl && (
                    <a
                      href={`${whatsappUrl}?text=Olá, preciso de ajuda!`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setIsOpen(false)}
                      className="flex-1 flex flex-col items-center gap-2 p-3 rounded-lg transition-colors duration-200 text-gray-700 hover:bg-green-50 hover:text-green-700"
                    >
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                        <MessageSquare className="w-4 h-4 text-green-600" />
                      </div>
                      <p className="font-medium text-xs text-green-600 text-center">
                        Suporte
                      </p>
                    </a>
                  )}

                  {/* Sair da conta */}
                  <button
                    onClick={() => {
                      logoutMutation.mutate();
                      setIsOpen(false);
                    }}
                    disabled={logoutMutation.isPending}
                    className="flex-1 flex flex-col items-center gap-2 p-3 rounded-lg transition-colors duration-200 text-gray-700 hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
                  >
                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                      <LogOut className="w-4 h-4 text-red-600" />
                    </div>
                    <p className="font-medium text-xs text-red-600 text-center">
                      Sair
                    </p>
                  </button>
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}