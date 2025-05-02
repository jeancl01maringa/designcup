import { Link } from "wouter";
import { Facebook, Instagram, Twitter, Mail, Phone } from "lucide-react";

const FooterLogo = () => (
  <div>
    <div className="flex items-center">
      <svg className="h-7 w-7 text-[#AA5E2F]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
        <path d="M8 12a4 4 0 108 0 4 4 0 00-8 0z" stroke="currentColor" strokeWidth="2" fill="none" />
      </svg>
      <span className="ml-2 font-bold text-lg">
        <span className="text-[#1D1D1D]">Design</span><span className="text-[#AA5E2F]">paraEstética</span>
      </span>
    </div>
    <p className="mt-4 text-[#4B4B4B] text-sm">
      A melhor plataforma de Artes para Estética do Brasil. Criando artes 100% editáveis para profissionais da beleza.
    </p>
  </div>
);

const QuickLinks = () => (
  <div>
    <h3 className="text-[#1D1D1D] font-medium text-lg mb-4">Links Rápidos</h3>
    <ul className="space-y-2">
      <li><Link href="/" className="text-[#4B4B4B] hover:text-[#AA5E2F] transition duration-300">Início</Link></li>
      <li><Link href="/categorias" className="text-[#4B4B4B] hover:text-[#AA5E2F] transition duration-300">Categorias</Link></li>
      <li><Link href="/video-aulas" className="text-[#4B4B4B] hover:text-[#AA5E2F] transition duration-300">Vídeo Aulas</Link></li>
      <li><Link href="/mais" className="text-[#4B4B4B] hover:text-[#AA5E2F] transition duration-300">Contato</Link></li>
    </ul>
  </div>
);

const Categories = () => (
  <div>
    <h3 className="text-[#1D1D1D] font-medium text-lg mb-4">Categorias</h3>
    <ul className="space-y-2">
      <li><Link href="/categorias" className="text-[#4B4B4B] hover:text-[#AA5E2F] transition duration-300">Estética Facial</Link></li>
      <li><Link href="/categorias" className="text-[#4B4B4B] hover:text-[#AA5E2F] transition duration-300">Estética Corporal</Link></li>
      <li><Link href="/categorias" className="text-[#4B4B4B] hover:text-[#AA5E2F] transition duration-300">Maquiagem</Link></li>
      <li><Link href="/categorias" className="text-[#4B4B4B] hover:text-[#AA5E2F] transition duration-300">Unhas</Link></li>
    </ul>
  </div>
);

const Contact = () => (
  <div>
    <h3 className="text-[#1D1D1D] font-medium text-lg mb-4">Contato</h3>
    <ul className="space-y-3">
      <li className="flex items-center text-[#4B4B4B]">
        <Mail className="h-5 w-5 mr-2 text-[#AA5E2F]" />
        contato@designparaestetica.com.br
      </li>
      <li className="flex items-center text-[#4B4B4B]">
        <Phone className="h-5 w-5 mr-2 text-[#AA5E2F]" />
        (11) 9 8765-4321
      </li>
    </ul>
    <div className="mt-4 flex space-x-4">
      <a href="#" className="text-[#AA5E2F] hover:text-[#95512A] transition duration-300">
        <Instagram className="h-6 w-6" />
      </a>
      <a href="#" className="text-[#AA5E2F] hover:text-[#95512A] transition duration-300">
        <Twitter className="h-6 w-6" />
      </a>
      <a href="#" className="text-[#AA5E2F] hover:text-[#95512A] transition duration-300">
        <Facebook className="h-6 w-6" />
      </a>
    </div>
  </div>
);

const FooterBottom = () => (
  <div className="border-t border-[#F5E9DE] mt-10 pt-8">
    <div className="flex flex-col md:flex-row justify-between items-center">
      <p className="text-[#4B4B4B] text-sm">© {new Date().getFullYear()} Design para Estética. Todos os direitos reservados.</p>
      <div className="mt-4 md:mt-0">
        <ul className="flex space-x-6">
          <li><a href="#" className="text-[#4B4B4B] hover:text-[#AA5E2F] text-sm transition duration-300">Termos de Uso</a></li>
          <li><a href="#" className="text-[#4B4B4B] hover:text-[#AA5E2F] text-sm transition duration-300">Política de Privacidade</a></li>
        </ul>
      </div>
    </div>
  </div>
);

export default function Footer() {
  return (
    <footer className="bg-[#FAF3EC] py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <FooterLogo />
          <QuickLinks />
          <Categories />
          <Contact />
        </div>
        <FooterBottom />
      </div>
    </footer>
  );
}
