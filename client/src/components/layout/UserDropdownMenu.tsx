import React from 'react';
import {
  User,
  LogOut,
  CreditCard,
  Clock,
  Heart,
  Bookmark,
  Users,
  MessageSquare,
  Infinity,
  Crown
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { useSupportNumber } from '@/hooks/use-support-number';

interface UserPlan {
  planName: string;
  periodo: string;
  valor: string;
  isActive: boolean;
}

interface UserDropdownMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UserDropdownMenu({ isOpen, onClose }: UserDropdownMenuProps) {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const { whatsappUrl } = useSupportNumber();

  // Buscar informações do plano do usuário
  const { data: userPlan, isLoading: planLoading } = useQuery<UserPlan>({
    queryKey: ["/api/user/plan"],
    enabled: !!user && isOpen,
  });

  if (!isOpen || !user) return null;

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      onClose();
      navigate('/loguin');
      toast({
        title: 'Logout realizado',
        description: 'Você saiu da sua conta com sucesso.',
      });
    } catch (error) {
      toast({
        title: 'Erro ao fazer logout',
        description: 'Não foi possível sair da sua conta.',
        variant: 'destructive',
      });
    }
  };

  const handleClick = (path: string) => {
    onClose();
    navigate(path);
  };

  // Overlay para fechar o dropdown ao clicar fora
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <>
      {/* Overlay invisível para fechar ao clicar fora */}
      <div
        className="fixed inset-0 z-40"
        onClick={handleOverlayClick}
      />

      {/* Caixa do menu alinhada precisamente abaixo do Header via relative/absolute */}
      <div
        className="absolute right-0 top-[calc(100%+8px)] z-50 w-[260px] md:w-[280px] bg-card text-card-foreground border border-border rounded-lg shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho com fundo escuro e layout alinhado à esquerda */}
        <div className="bg-muted border-b border-border pt-4 pb-4 px-4 md:px-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
              <img
                src={user.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username)}&background=0084FF&color=fff`}
                alt={user.username}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0 flex flex-col items-start">
              <div className="flex items-center gap-2">
                <h3 className="text-foreground font-medium text-sm truncate">{user.username}</h3>
              </div>
              <p className="text-muted-foreground text-xs truncate mt-0.5">{user.email}</p>
            </div>
          </div>
        </div>

        {/* Lista de opções minimalista */}
        <ul className="py-2">
          <li className="hover:bg-accent/50 transition-colors duration-200">
            <button
              className="w-full px-5 py-2.5 flex items-center justify-between gap-3"
              onClick={() => handleClick('/planos')}
            >
              <div className="flex items-center gap-3">
                <Crown className="w-4 h-4 text-muted-foreground" />
                <p className="font-medium text-sm text-foreground">Planos ativos</p>
              </div>
              {(user?.tipo === 'premium' || (userPlan && userPlan.planName !== 'Plano Gratuito')) ? (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-gradient-to-r from-[#8C8261] to-[#FFFFFF] text-[#121212] tracking-wider uppercase">
                  Premium Pro
                </span>
              ) : (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-muted-foreground/20 text-muted-foreground tracking-wider uppercase">
                  Gratuito
                </span>
              )}
            </button>
          </li>

          <li className="hover:bg-accent/50 transition-colors duration-200">
            <button
              className="w-full px-5 py-2.5 flex items-center gap-3"
              onClick={() => handleClick('/perfil')}
            >
              <User className="w-4 h-4 text-muted-foreground" />
              <p className="font-medium text-sm text-foreground">Minha conta</p>
            </button>
          </li>

          <li className="hover:bg-accent/50 transition-colors duration-200">
            <button
              className="w-full px-5 py-2.5 flex items-center gap-3"
              onClick={() => handleClick('/assinatura')}
            >
              <CreditCard className="w-4 h-4 text-muted-foreground" />
              <p className="font-medium text-sm text-foreground">Assinatura</p>
            </button>
          </li>

          <li className="hover:bg-accent/50 transition-colors duration-200">
            <button
              className="w-full px-5 py-2.5 flex items-center gap-3"
              onClick={() => handleClick('/edicoes-recentes')}
            >
              <Clock className="w-4 h-4 text-muted-foreground" />
              <p className="font-medium text-sm text-foreground">Edições recentes</p>
            </button>
          </li>

          <li className="hover:bg-accent/50 transition-colors duration-200">
            <button
              className="w-full px-5 py-2.5 flex items-center gap-3"
              onClick={() => handleClick('/curtidas')}
            >
              <Heart className="w-4 h-4 text-muted-foreground" />
              <p className="font-medium text-sm text-foreground">Curtidas</p>
            </button>
          </li>

          <li className="hover:bg-accent/50 transition-colors duration-200">
            <button
              className="w-full px-5 py-2.5 flex items-center gap-3"
              onClick={() => handleClick('/salvos')}
            >
              <Bookmark className="w-4 h-4 text-muted-foreground" />
              <p className="font-medium text-sm text-foreground">Salvos</p>
            </button>
          </li>

          <li className="hover:bg-accent/50 transition-colors duration-200">
            <button
              className="w-full px-5 py-2.5 flex items-center gap-3"
              onClick={() => handleClick('/seguindo')}
            >
              <Users className="w-4 h-4 text-muted-foreground" />
              <p className="font-medium text-sm text-foreground">Seguindo</p>
            </button>
          </li>
        </ul>

        {/* Divisor */}
        <div className="h-px bg-border mx-4 my-1"></div>

        {/* Suporte e Logout */}
        <ul className="py-2">
          {whatsappUrl && (
            <li className="hover:bg-accent/50 transition-colors duration-200">
              <a
                href={`${whatsappUrl}?text=Olá, preciso de ajuda!`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full px-5 py-2.5 flex items-center gap-3"
                onClick={onClose}
              >
                <MessageSquare className="w-4 h-4 text-emerald-500" />
                <p className="font-medium text-sm text-emerald-600 dark:text-emerald-500">Suporte por WhatsApp</p>
              </a>
            </li>
          )}

          <li className="hover:bg-accent/50 transition-colors duration-200">
            <button
              className="w-full px-5 py-2.5 flex items-center gap-3"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 text-red-500" />
              <p className="font-medium text-sm text-red-600 dark:text-red-500">Sair da conta</p>
            </button>
          </li>
        </ul>
      </div>
    </>
  );
}