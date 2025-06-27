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
      navigate('/auth');
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

  // Função para determinar o nome do plano dinamicamente
  const getPlanName = () => {
    if (planLoading) {
      return 'Carregando...';
    }
    
    if (userPlan) {
      return userPlan.planName;
    }
    
    return 'Plano Gratuito';
  };

  // Overlay para fechar o dropdown ao clicar fora
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex justify-end items-start pt-16"
      onClick={handleOverlayClick}
    >
      <div 
        className="mr-2 w-[260px] md:w-[280px] bg-white rounded-lg shadow-lg overflow-hidden animate-in slide-in-from-top-5 duration-200 max-h-[calc(100vh-80px)] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho com fundo escuro e layout alinhado à esquerda */}
        <div className="bg-gray-800 pt-4 pb-3 px-4 md:pt-6 md:pb-4 md:px-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full border-2 border-white overflow-hidden flex-shrink-0">
              <img 
                src={user.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username)}&background=1D1D1D&color=fff`} 
                alt={user.username}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-medium text-base truncate">{user.username}</h3>
              <p className="text-gray-300 text-sm truncate mb-3">{user.email}</p>
            </div>
          </div>
          
          {/* Botão de upgrade para usuários gratuitos */}
          {(!userPlan || userPlan.planName === 'Plano Gratuito') && (
            <div className="mt-4">
              <button
                onClick={() => handleClick('/planos')}
                className="bg-white hover:bg-gray-100 text-gray-800 font-medium py-2 px-4 rounded-md transition-colors duration-200 flex items-center justify-center gap-2 text-sm w-full border border-gray-200"
              >
                <Crown className="w-4 h-4 text-amber-500" />
                Assinar Premium
              </button>
            </div>
          )}
          
          {/* Para usuários premium */}
          {userPlan && userPlan.planName !== 'Plano Gratuito' && (
            <div className="bg-amber-50 text-amber-700 py-2 px-4 rounded-md border border-amber-200/50 mt-3">
              <div className="flex items-center justify-center gap-2">
                <Crown className="w-4 h-4 text-amber-600 fill-amber-600" />
                <span className="font-medium text-sm">Premium</span>
              </div>
            </div>
          )}
        </div>

        {/* Lista de opções */}
        <ul className="py-1">
          <li className="hover:bg-[#f7f7f7] transition-colors duration-200">
            <button 
              className="w-full px-3 py-2 md:px-4 md:py-3 flex items-center gap-3"
              onClick={() => handleClick('/perfil')}
            >
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                <User className="w-5 h-5 text-blue-500" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-800">Minha conta</p>
                <p className="text-sm text-gray-500">Perfil, privacidade e dados</p>
              </div>
            </button>
          </li>

          <li className="hover:bg-[#f7f7f7] transition-colors duration-200">
            <button 
              className="w-full px-3 py-2 md:px-4 md:py-3 flex items-center gap-3"
              onClick={() => handleClick('/assinatura')}
            >
              <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-purple-500" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-800">Assinatura</p>
                <p className="text-sm text-gray-500">Gerenciar sua assinatura</p>
              </div>
            </button>
          </li>

          <li className="hover:bg-[#f7f7f7] transition-colors duration-200">
            <button 
              className="w-full px-3 py-2 md:px-4 md:py-3 flex items-center gap-3"
              onClick={() => handleClick('/edicoes-recentes')}
            >
              <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center">
                <Clock className="w-5 h-5 text-indigo-500" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-800">Edições recentes</p>
                <p className="text-sm text-gray-500">Histórico de edições</p>
              </div>
              <span className="ml-auto">
                <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                  <Infinity className="w-3 h-3 text-gray-500" />
                </div>
              </span>
            </button>
          </li>

          <li className="hover:bg-[#f7f7f7] transition-colors duration-200">
            <button 
              className="w-full px-3 py-2 md:px-4 md:py-3 flex items-center gap-3"
              onClick={() => handleClick('/curtidas')}
            >
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                <Heart className="w-5 h-5 text-red-500" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-800">Curtidas</p>
                <p className="text-sm text-gray-500">Seus itens favoritos</p>
              </div>
            </button>
          </li>

          <li className="hover:bg-[#f7f7f7] transition-colors duration-200">
            <button 
              className="w-full px-3 py-2 md:px-4 md:py-3 flex items-center gap-3"
              onClick={() => handleClick('/salvos')}
            >
              <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
                <Bookmark className="w-5 h-5 text-amber-500" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-800">Salvos</p>
                <p className="text-sm text-gray-500">Artes para usar depois</p>
              </div>
            </button>
          </li>

          <li className="hover:bg-[#f7f7f7] transition-colors duration-200">
            <button 
              className="w-full px-3 py-2 md:px-4 md:py-3 flex items-center gap-3"
              onClick={() => handleClick('/seguindo')}
            >
              <div className="w-10 h-10 rounded-full bg-sky-50 flex items-center justify-center">
                <Users className="w-5 h-5 text-sky-500" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-800">Seguindo</p>
                <p className="text-sm text-gray-500">Designers que você segue</p>
              </div>
            </button>
          </li>
        </ul>

        {/* Divisor */}
        <div className="h-px bg-gray-200 mx-4"></div>

        {/* Suporte e Logout */}
        <ul className="py-1">
          {whatsappUrl && (
            <li className="hover:bg-[#f7f7f7] transition-colors duration-200">
              <a 
                href={`${whatsappUrl}?text=Olá, preciso de ajuda!`}
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full px-3 py-2 md:px-4 md:py-3 flex items-center gap-3"
                onClick={onClose}
              >
                <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-green-500" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-green-600">Suporte por WhatsApp</p>
                  <p className="text-sm text-gray-500">Dúvidas e perguntas</p>
                </div>
              </a>
            </li>
          )}

          <li className="hover:bg-[#f7f7f7] transition-colors duration-200">
            <button 
              className="w-full px-3 py-2 md:px-4 md:py-3 flex items-center gap-3"
              onClick={handleLogout}
            >
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                <LogOut className="w-5 h-5 text-red-500" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-red-600">Sair da conta</p>
                <p className="text-sm text-gray-500">Encerrar sessão atual</p>
              </div>
            </button>
          </li>
        </ul>
      </div>
    </div>
  );
}