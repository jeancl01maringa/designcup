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
  X
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
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="bg-white shadow-sm hover:bg-gray-50 w-9 h-9 rounded-lg border border-gray-200"
          >
            <Menu className="h-4 w-4 text-gray-700" />
          </Button>
        </SheetTrigger>
        
        <SheetContent side="left" className="w-80 p-0">
          <div className="h-full bg-white">
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">Meu Perfil</h2>
                  <p className="text-sm text-gray-500 mt-1">Gerencie sua conta</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Menu items */}
            <nav className="p-4 flex-1">
              <ul className="space-y-2">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location === item.href;
                  
                  return (
                    <li key={item.href}>
                      <Link href={item.href}>
                        <a
                          onClick={() => setIsOpen(false)}
                          className={cn(
                            "flex items-center gap-3 px-3 py-3 rounded-lg transition-colors duration-200",
                            isActive
                              ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                          )}
                        >
                          <div
                            className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center",
                              isActive
                                ? "bg-blue-100"
                                : "bg-gray-100"
                            )}
                          >
                            <Icon
                              className={cn(
                                "w-4 h-4",
                                isActive ? "text-blue-600" : "text-gray-500"
                              )}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p
                              className={cn(
                                "font-medium text-sm",
                                isActive ? "text-blue-700" : "text-gray-800"
                              )}
                            >
                              {item.label}
                            </p>
                            <p
                              className={cn(
                                "text-xs truncate",
                                isActive ? "text-blue-600" : "text-gray-500"
                              )}
                            >
                              {item.description}
                            </p>
                          </div>
                        </a>
                      </Link>
                    </li>
                  );
                })}
              </ul>

              {/* Ações */}
              <div className="pt-4 mt-4 border-t border-gray-200">
                <ul className="space-y-2">
                  {/* Suporte via WhatsApp */}
                  {whatsappUrl && (
                    <li>
                      <a
                        href={`${whatsappUrl}?text=Olá, preciso de ajuda!`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-3 px-3 py-3 rounded-lg transition-colors duration-200 text-gray-700 hover:bg-green-50 hover:text-green-700"
                      >
                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                          <MessageSquare className="w-4 h-4 text-green-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-green-600">
                            Suporte por WhatsApp
                          </p>
                          <p className="text-xs text-green-500 truncate">
                            Dúvidas e perguntas
                          </p>
                        </div>
                      </a>
                    </li>
                  )}

                  {/* Sair da conta */}
                  <li>
                    <button
                      onClick={() => {
                        logoutMutation.mutate();
                        setIsOpen(false);
                      }}
                      disabled={logoutMutation.isPending}
                      className="w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors duration-200 text-gray-700 hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
                    >
                      <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                        <LogOut className="w-4 w-4 text-red-600" />
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <p className="font-medium text-sm text-red-600">
                          Sair da conta
                        </p>
                        <p className="text-xs text-red-500 truncate">
                          Encerrar sessão atual
                        </p>
                      </div>
                    </button>
                  </li>
                </ul>
              </div>
            </nav>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}