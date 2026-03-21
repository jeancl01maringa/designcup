import { useState } from "react";
import { useLocation } from "wouter";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useSupportNumber } from "@/hooks/use-support-number";
import {
  User,
  CreditCard,
  Heart,
  Bookmark,
  Users,
  Edit3,
  MessageSquare,
  LogOut,
  ChevronUp
} from "lucide-react";

export function ProfileMobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const [location] = useLocation();
  const { logoutMutation } = useAuth();
  const { whatsappUrl } = useSupportNumber();

  const menuItems = [
    { href: "/perfil", icon: User, label: "Minha Conta" },
    { href: "/assinatura", icon: CreditCard, label: "Assinatura" },
    { href: "/curtidas", icon: Heart, label: "Curtidas" },
    { href: "/salvos", icon: Bookmark, label: "Salvos" },
    { href: "/seguindo", icon: Users, label: "Seguindo" },
    { href: "/edicoes-recentes", icon: Edit3, label: "Edições" },
  ];

  return (
    <div className="lg:hidden">
      <div className="fixed bottom-0 left-0 right-0 z-40">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <button className="w-full bg-background border-t border-border/50 flex items-center justify-center py-2 hover:bg-muted/30 transition-colors">
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            </button>
          </SheetTrigger>

          <SheetContent side="bottom" className="w-full h-auto p-0 rounded-t-2xl border-t border-border/50">
            <div className="bg-background rounded-t-2xl">
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-8 h-1 bg-muted-foreground/20 rounded-full" />
              </div>

              {/* Title */}
              <div className="px-6 py-3">
                <h2 className="text-sm font-medium text-muted-foreground text-center tracking-wide uppercase">
                  Meu Perfil
                </h2>
              </div>

              {/* Menu items */}
              <div className="px-4 pb-2">
                <div className="grid grid-cols-3 gap-1 mb-3">
                  {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location === item.href;

                    return (
                      <Link key={item.href} href={item.href}>
                        <a
                          onClick={() => setIsOpen(false)}
                          className={cn(
                            "flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl transition-colors duration-150",
                            isActive
                              ? "text-foreground"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                          )}
                        >
                          <Icon
                            className={cn(
                              "w-5 h-5 transition-colors",
                              isActive ? "text-foreground" : "text-muted-foreground"
                            )}
                            strokeWidth={isActive ? 2 : 1.5}
                          />
                          <span className={cn(
                            "text-xs leading-tight text-center",
                            isActive ? "font-semibold text-foreground" : "font-normal"
                          )}>
                            {item.label}
                          </span>
                          {isActive && (
                            <div className="w-1 h-1 rounded-full bg-foreground" />
                          )}
                        </a>
                      </Link>
                    );
                  })}
                </div>

                {/* Divider */}
                <div className="border-t border-border/30 mb-2" />

                {/* Bottom actions */}
                <div className="flex gap-1 pb-2">
                  {whatsappUrl && (
                    <a
                      href={`${whatsappUrl}?text=Olá, preciso de ajuda!`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setIsOpen(false)}
                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
                    >
                      <MessageSquare className="w-4 h-4" strokeWidth={1.5} />
                      <span className="text-xs font-medium">Suporte</span>
                    </a>
                  )}

                  <button
                    onClick={() => {
                      logoutMutation.mutate();
                      setIsOpen(false);
                    }}
                    disabled={logoutMutation.isPending}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
                  >
                    <LogOut className="w-4 h-4" strokeWidth={1.5} />
                    <span className="text-xs font-medium">Sair</span>
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