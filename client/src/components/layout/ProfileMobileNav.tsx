import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader } from "@/components/ui/sheet";
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
            variant="ghost"
            size="sm"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 px-3 py-2 rounded-lg transition-colors"
          >
            <Menu className="h-5 w-5" />
            <span className="text-sm font-medium">Menu</span>
          </Button>
        </SheetTrigger>
        
        <SheetContent side="left" className="w-80 p-0">
          <SheetHeader className="p-6 border-b border-gray-200">
            <SheetTitle className="text-left">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">Meu Perfil</h2>
                <p className="text-sm text-gray-500 mt-1">Gerencie sua conta</p>
              </div>
            </SheetTitle>
          </SheetHeader>
          
          <div className="h-full bg-white">

            {/* Menu items */}
            <nav className="p-6 flex-1">
              <ul className="space-y-3">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location === item.href;
                  
                  return (
                    <li key={item.href}>
                      <Link href={item.href}>
                        <a
                          onClick={() => setIsOpen(false)}
                          className={cn(
                            "flex items-center gap-4 px-4 py-4 rounded-xl transition-colors duration-200",
                            isActive
                              ? "bg-primary/10 text-primary border border-primary/20"
                              : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                          )}
                        >
                          <div
                            className={cn(
                              "w-10 h-10 rounded-lg flex items-center justify-center",
                              isActive
                                ? "bg-primary/20"
                                : "bg-gray-100"
                            )}
                          >
                            <Icon
                              className={cn(
                                "w-5 h-5",
                                isActive ? "text-primary" : "text-gray-600"
                              )}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p
                              className={cn(
                                "font-semibold text-base",
                                isActive ? "text-primary" : "text-gray-900"
                              )}
                            >
                              {item.label}
                            </p>
                            <p
                              className={cn(
                                "text-sm truncate mt-0.5",
                                isActive ? "text-primary/70" : "text-gray-500"
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
              <div className="pt-6 mt-6 border-t border-gray-200">
                <ul className="space-y-3">
                  {/* Suporte via WhatsApp */}
                  {whatsappUrl && (
                    <li>
                      <a
                        href={`${whatsappUrl}?text=Olá, preciso de ajuda!`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-4 px-4 py-4 rounded-xl transition-colors duration-200 text-gray-700 hover:bg-green-50 hover:text-green-700"
                      >
                        <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                          <MessageSquare className="w-5 h-5 text-green-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-base text-green-600">
                            Suporte por WhatsApp
                          </p>
                          <p className="text-sm text-green-500 truncate mt-0.5">
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
                      className="w-full flex items-center gap-4 px-4 py-4 rounded-xl transition-colors duration-200 text-gray-700 hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
                    >
                      <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                        <LogOut className="w-5 h-5 text-red-600" />
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <p className="font-semibold text-base text-red-600">
                          Sair da conta
                        </p>
                        <p className="text-sm text-red-500 truncate mt-0.5">
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