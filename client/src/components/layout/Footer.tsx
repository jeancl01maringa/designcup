import { Link } from "wouter";
import { Facebook, Instagram, Mail, Phone, Heart } from "lucide-react";
import { useSupportNumber } from "@/hooks/use-support-number";

const HeroMessage = () => (
  <div className="text-center mb-12">
    <h2 className="text-xl font-medium text-[#333] mb-2">
      Criado com <Heart className="inline w-5 h-5 text-red-500 mx-1" /> por Jean Carlos
    </h2>
    <p className="text-[#666] text-base leading-relaxed">
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
              <span className="text-sm">WhatsApp: (44) 99941-9906</span>
            </a>
          ) : (
            <>
              <Phone className="h-5 w-5 mr-2 text-[#a15e38]" />
              <span className="text-sm">WhatsApp: (44) 99941-9906</span>
            </>
          )}
        </li>
      </ul>
      
      <div className="mt-4">
        <p className="text-[#333] font-medium text-sm mb-3">Redes sociais</p>
        <div className="flex space-x-4">
          <a href="#" className="text-[#a15e38] hover:text-[#8b4f2e] transition duration-300" title="Instagram">
            <Instagram className="h-5 w-5" />
          </a>
          <a href="#" className="text-[#a15e38] hover:text-[#8b4f2e] transition duration-300" title="Facebook">
            <Facebook className="h-5 w-5" />
          </a>
          <a href="#" className="text-[#a15e38] hover:text-[#8b4f2e] transition duration-300" title="Pinterest">
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.477 2 2 6.477 2 12c0 4.237 2.636 7.855 6.356 9.312-.088-.791-.167-2.005.035-2.868.181-.78 1.172-4.97 1.172-4.97s-.299-.6-.299-1.486c0-1.39.806-2.428 1.81-2.428.853 0 1.264.641 1.264 1.408 0 .858-.546 2.14-.828 3.33-.236.995.499 1.807 1.481 1.807 1.778 0 3.144-1.874 3.144-4.58 0-2.393-1.72-4.068-4.176-4.068-2.845 0-4.516 2.135-4.516 4.34 0 .859.331 1.781.745 2.281a.3.3 0 01.069.288l-.278 1.133c-.044.183-.145.223-.335.134-1.249-.581-2.03-2.407-2.03-3.874 0-3.154 2.292-6.052 6.608-6.052 3.469 0 6.165 2.473 6.165 5.776 0 3.447-2.173 6.22-5.19 6.22-1.013 0-1.965-.525-2.291-1.148l-.623 2.378c-.226.869-.835 1.958-1.244 2.621.937.29 1.931.446 2.962.446 5.523 0 10-4.477 10-10S17.523 2 12 2z"/>
            </svg>
          </a>
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
