import { User, Heart, Bookmark, Users, Edit3, Settings, CreditCard, MessageSquare, LogOut } from "lucide-react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { usePlatformLogo } from "@/hooks/use-platform-logo";
import { useSupportNumber } from "@/hooks/use-support-number";
import { useAuth } from "@/hooks/use-auth";

interface ProfileSidebarProps {
  className?: string;
}

export function ProfileSidebar({ className }: ProfileSidebarProps) {
  const [location] = useLocation();
  const { logoUrl, hasCustomLogo } = usePlatformLogo();
  const { whatsappUrl, supportNumber } = useSupportNumber();
  const { logoutMutation } = useAuth();

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
    <div className={cn("w-64 bg-white border-r border-gray-200 h-full", className)}>
      {/* Header do sidebar */}
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800">Meu Perfil</h2>
        <p className="text-sm text-gray-500 mt-1">Gerencie sua conta e preferências</p>
      </div>

      {/* Menu de navegação */}
      <nav className="p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            
            return (
              <li key={item.href}>
                <Link href={item.href}>
                  <a
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

        {/* Seção de ações */}
        <div className="pt-4 mt-4 border-t border-gray-200">
          <ul className="space-y-2">
            {/* Suporte por WhatsApp */}
            {whatsappUrl && (
              <li>
                <a
                  href={`${whatsappUrl}?text=Olá, preciso de ajuda!`}
                  target="_blank"
                  rel="noopener noreferrer"
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
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors duration-200 text-gray-700 hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
              >
                <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                  <LogOut className="w-4 h-4 text-red-600" />
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

      {/* Footer do sidebar */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
        <div className="text-xs text-gray-500 text-center">
          <div className="flex items-center justify-center mb-2">
            {hasCustomLogo ? (
              <img 
                src={logoUrl} 
                alt="Logo da Plataforma" 
                className="h-6 w-auto max-w-[80px] object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : (
              <span className="font-medium">Design para Estética</span>
            )}
          </div>
          <p className="mt-1">© 2025 - Todos os direitos reservados</p>
        </div>
      </div>
    </div>
  );
}