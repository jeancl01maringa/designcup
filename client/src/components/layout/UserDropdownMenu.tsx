import React from 'react';
import { 
  User,
  LogOut,
  CreditCard,
  Download,
  Heart,
  Bookmark,
  Users,
  MessageSquare,
  Infinity
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';

interface UserDropdownMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UserDropdownMenu({ isOpen, onClose }: UserDropdownMenuProps) {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

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
        className="mr-4 w-[300px] bg-white rounded-lg shadow-lg overflow-hidden animate-in slide-in-from-top-5 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho com fundo preto */}
        <div className="bg-black pt-8 pb-4 px-6 text-center">
          <div className="w-20 h-20 mx-auto mb-2 rounded-full border-4 border-white overflow-hidden">
            <img 
              src={user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username)}&background=1D1D1D&color=fff`} 
              alt={user.username}
              className="w-full h-full object-cover"
            />
          </div>
          <h3 className="text-white font-bold text-lg">{user.username}</h3>
          <p className="text-white/90 text-sm">{user.email}</p>
          <span className="inline-block mt-2 px-3 py-1 bg-white text-black text-xs font-semibold rounded-full">
            CONTA MENSAL
          </span>
        </div>

        {/* Lista de opções */}
        <ul className="py-2">
          <li className="hover:bg-[#f7f7f7] transition-colors duration-200">
            <button 
              className="w-full px-4 py-3 flex items-center gap-3"
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
              className="w-full px-4 py-3 flex items-center gap-3"
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
              className="w-full px-4 py-3 flex items-center gap-3"
              onClick={() => handleClick('/downloads')}
            >
              <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center">
                <Download className="w-5 h-5 text-indigo-500" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-800">Downloads</p>
                <p className="text-sm text-gray-500">Histórico de downloads</p>
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
              className="w-full px-4 py-3 flex items-center gap-3"
              onClick={() => handleClick('/favoritos')}
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
              className="w-full px-4 py-3 flex items-center gap-3"
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
              className="w-full px-4 py-3 flex items-center gap-3"
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
        <ul className="py-2">
          <li className="hover:bg-[#f7f7f7] transition-colors duration-200">
            <a 
              href="https://wa.me/5500000000000" 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-full px-4 py-3 flex items-center gap-3"
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

          <li className="hover:bg-[#f7f7f7] transition-colors duration-200">
            <button 
              className="w-full px-4 py-3 flex items-center gap-3"
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