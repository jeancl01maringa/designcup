import { Link } from "wouter";
import { Facebook, Instagram, Mail, Phone, Heart } from "lucide-react";
import { useSupportNumber } from "@/hooks/use-support-number";
import { useSocialMedia } from "@/hooks/use-social-media";
import { usePlatformLogo } from "@/hooks/use-platform-logo";

const FooterLogo = () => {
  const { logoUrl, hasCustomLogo } = usePlatformLogo();
  
  return (
    <div className="mb-8">
      <div className="flex items-center mb-4">
        {hasCustomLogo ? (
          <img 
            src={logoUrl} 
            alt="Logo da Plataforma" 
            className="h-8 w-auto max-w-[200px] object-contain"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              target.nextElementSibling?.classList.remove('hidden');
            }}
          />
        ) : (
          <>
            <svg className="h-8 w-8 text-[#AA5E2F]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
              <path d="M8 12a4 4 0 108 0 4 4 0 00-8 0z" stroke="currentColor" strokeWidth="2" fill="none" />
            </svg>
            <span className="ml-3 font-bold text-xl">
              <span className="text-[#1D1D1D]">Design</span><span className="text-[#AA5E2F]">paraEstética</span>
            </span>
          </>
        )}
      </div>
      
      <div className="space-y-2">
        <p className="text-[#333] text-base font-medium">
          Criado com <Heart className="inline w-4 h-4 text-red-500 mx-1 fill-current" /> por Jean Carlos
        </p>
        <p className="text-[#666] text-base leading-relaxed">
          Recursos profissionais e artes premium para transformar o seu negócio.
        </p>
        <div className="flex items-center text-[#333] mt-3">
          <Mail className="h-4 w-4 mr-2 text-[#a15e38]" />
          <span className="text-sm">contato@designparaestetica.com.br</span>
        </div>
      </div>
    </div>
  );
};

const LinksUteis = () => (
  <div>
    <h3 className="text-[#333] font-semibold text-base mb-4">Links Úteis</h3>
    <ul className="space-y-3">
      <li><Link href="/sobre" className="text-[#666] hover:text-[#a15e38] transition duration-300 text-sm">Sobre nós</Link></li>
      <li><Link href="/planos" className="text-[#666] hover:text-[#a15e38] transition duration-300 text-sm">Planos</Link></li>
      <li><Link href="/duvidas" className="text-[#666] hover:text-[#a15e38] transition duration-300 text-sm">Dúvidas</Link></li>
    </ul>
  </div>
);

const Politicas = () => (
  <div>
    <h3 className="text-[#333] font-semibold text-base mb-4">Políticas</h3>
    <ul className="space-y-3">
      <li><a href="#" className="text-[#666] hover:text-[#a15e38] transition duration-300 text-sm">Termos de uso</a></li>
      <li><a href="#" className="text-[#666] hover:text-[#a15e38] transition duration-300 text-sm">Política de privacidade</a></li>
      <li><a href="#" className="text-[#666] hover:text-[#a15e38] transition duration-300 text-sm">Denúncia e Direitos Autorais</a></li>
    </ul>
  </div>
);

const FooterBottom = () => {
  const { supportNumber, whatsappUrl } = useSupportNumber();
  const { instagram, facebook, pinterest } = useSocialMedia();
  
  return (
    <div className="border-t border-gray-200 mt-10 pt-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-[#333] text-sm">
          © 2025 Design para Estética. Todos os direitos reservados.
        </p>
        
        <div className="flex items-center space-x-4">
          {whatsappUrl && (
            <a 
              href={`${whatsappUrl}?text=Olá, gostaria de mais informações!`}
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[#25D366] hover:opacity-80 transition duration-300" 
              title="WhatsApp"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.951 3.488"/>
              </svg>
            </a>
          )}
          {instagram && (
            <a 
              href={instagram} 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:opacity-80 transition duration-300" 
              title="Instagram"
            >
              <svg className="h-5 w-5" fill="url(#instagram-gradient)" viewBox="0 0 24 24">
                <defs>
                  <linearGradient id="instagram-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#405DE6" />
                    <stop offset="33%" stopColor="#5B51D8" />
                    <stop offset="66%" stopColor="#833AB4" />
                    <stop offset="100%" stopColor="#C13584" />
                  </linearGradient>
                </defs>
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </a>
          )}
          {facebook && (
            <a 
              href={facebook} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[#1877F2] hover:opacity-80 transition duration-300" 
              title="Facebook"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </a>
          )}
          {pinterest && (
            <a 
              href={pinterest} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[#E60023] hover:opacity-80 transition duration-300" 
              title="Pinterest"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.477 2 2 6.477 2 12c0 4.237 2.636 7.855 6.356 9.312-.088-.791-.167-2.005.035-2.868.181-.78 1.172-4.97 1.172-4.97s-.299-.6-.299-1.486c0-1.39.806-2.428 1.81-2.428.853 0 1.264.641 1.264 1.408 0 .858-.546 2.14-.828 3.33-.236.995.499 1.807 1.481 1.807 1.778 0 3.144-1.874 3.144-4.58 0-2.393-1.72-4.068-4.176-4.068-2.845 0-4.516 2.135-4.516 4.34 0 .859.331 1.781.745 2.281a.3.3 0 01.069.288l-.278 1.133c-.044.183-.145.223-.335.134-1.249-.581-2.03-2.407-2.03-3.874 0-3.154 2.292-6.052 6.608-6.052 3.469 0 6.165 2.473 6.165 5.776 0 3.447-2.173 6.22-5.19 6.22-1.013 0-1.965-.525-2.291-1.148l-.623 2.378c-.226.869-.835 1.958-1.244 2.621.937.29 1.931.446 2.962.446 5.523 0 10-4.477 10-10S17.523 2 12 2z"/>
              </svg>
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default function Footer() {
  return (
    <footer className="bg-white py-12 border-t border-gray-100">
      <div className="container mx-auto px-4 max-w-6xl">
        <FooterLogo />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <LinksUteis />
          <Politicas />
        </div>
        
        <FooterBottom />
      </div>
    </footer>
  );
}
