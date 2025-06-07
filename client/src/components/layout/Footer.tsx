import { Link } from "wouter";
import { Facebook, Instagram, Mail, Phone, Heart } from "lucide-react";
import { useSupportNumber } from "@/hooks/use-support-number";
import { useSocialMedia } from "@/hooks/use-social-media";

const HeroMessage = () => (
  <div className="text-left mb-12">
    <h2 className="text-xl font-medium text-[#333] mb-2">
      Criado com <Heart className="inline w-5 h-5 text-red-500 mx-1 fill-current" /> por Jean Carlos
    </h2>
    <p className="text-[#666] text-xl leading-relaxed">
      Recursos profissionais e artes premium para transformar o seu negócio.
    </p>
  </div>
);

const LinksUteis = () => (
  <div>
    <h3 className="text-[#333] font-medium text-lg mb-4">Links Úteis</h3>
    <ul className="space-y-3">
      <li><Link href="/sobre" className="text-[#333] hover:text-[#a15e38] transition duration-300">Sobre nós</Link></li>
      <li><Link href="/planos" className="text-[#333] hover:text-[#a15e38] transition duration-300">Planos</Link></li>
      <li><Link href="/duvidas" className="text-[#333] hover:text-[#a15e38] transition duration-300">Dúvidas</Link></li>
    </ul>
  </div>
);

const Politicas = () => (
  <div>
    <h3 className="text-[#333] font-medium text-lg mb-4">Políticas</h3>
    <ul className="space-y-3">
      <li><a href="#" className="text-[#333] hover:text-[#a15e38] transition duration-300">Termos de uso</a></li>
      <li><a href="#" className="text-[#333] hover:text-[#a15e38] transition duration-300">Política de privacidade</a></li>
      <li><a href="#" className="text-[#333] hover:text-[#a15e38] transition duration-300">Denúncia e Direitos Autorais</a></li>
    </ul>
  </div>
);

const Contato = () => {
  const { supportNumber, whatsappUrl } = useSupportNumber();
  const { instagram, facebook, pinterest } = useSocialMedia();
  
  return (
    <div>
      <h3 className="text-[#333] font-medium text-lg mb-4">Contato</h3>
      <ul className="space-y-3">
        <li className="flex items-center text-[#333]">
          <Mail className="h-5 w-5 mr-2 text-[#a15e38]" />
          <span className="text-sm">contato@designparaestetica.com.br</span>
        </li>
        <li className="flex items-center text-[#333]">
          {whatsappUrl ? (
            <a 
              href={`${whatsappUrl}?text=Olá, gostaria de mais informações!`}
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center hover:text-[#a15e38] transition-colors"
            >
              <Phone className="h-5 w-5 mr-2 text-[#a15e38]" />
              <span className="text-sm">WhatsApp: {supportNumber || "(44) 99941-9906"}</span>
            </a>
          ) : (
            <>
              <Phone className="h-5 w-5 mr-2 text-[#a15e38]" />
              <span className="text-sm">WhatsApp: {supportNumber || "(44) 99941-9906"}</span>
            </>
          )}
        </li>
      </ul>
      
      <div className="mt-4">
        <p className="text-[#333] font-medium text-sm mb-3">Redes sociais</p>
        <div className="flex space-x-4">
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

const FooterBottom = () => (
  <div className="border-t border-gray-200 mt-10 pt-6">
    <div className="text-center">
      <p className="text-[#333] text-sm">
        © 2025 Design para Estética. Todos os direitos reservados.
      </p>
    </div>
  </div>
);

export default function Footer() {
  return (
    <footer className="bg-white py-12 border-t border-gray-100">
      <div className="container mx-auto px-4 max-w-6xl">
        <HeroMessage />
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <LinksUteis />
          <Politicas />
          <Contato />
        </div>
        
        <FooterBottom />
      </div>
    </footer>
  );
}
