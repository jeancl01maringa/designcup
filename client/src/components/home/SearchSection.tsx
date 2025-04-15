import { useState } from "react";
import { useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ChevronDown } from "lucide-react";

export default function SearchSection() {
  const [searchQuery, setSearchQuery] = useState("");
  const [, navigate] = useLocation();
  const [showFormatDropdown, setShowFormatDropdown] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState("Formatos");

  const formats = [
    { id: "all", name: "Formatos" },
    { id: "feed", name: "Feed" },
    { id: "square", name: "Cartaz" },
    { id: "stories", name: "Stories" },
    { id: "portrait", name: "Imagens" }
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const formatParam = selectedFormat !== "Formatos" ? `&format=${selectedFormat.toLowerCase()}` : "";
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}${formatParam}`);
    }
  };

  const selectFormat = (format: string) => {
    setSelectedFormat(format);
    setShowFormatDropdown(false);
  };

  return (
    <section className="pb-6">
      <div className="container mx-auto px-4">
        <div className="max-w-xl mx-auto">
          <form className="flex flex-col" onSubmit={handleSearch}>
            <div className="flex">
              <div className="relative flex-grow">
                <Input
                  type="text"
                  className="w-full px-4 py-3 h-[48px] text-base border border-gray-300 rounded-l-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Buscar artes por palavra-chave..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <div className="relative">
                <button
                  type="button"
                  className="flex justify-between items-center text-sm px-4 py-3 h-[48px] border border-l-0 border-gray-300 bg-white hover:bg-gray-50"
                  onClick={() => setShowFormatDropdown(!showFormatDropdown)}
                >
                  <span>{selectedFormat}</span>
                  <ChevronDown className="ml-2 h-4 w-4" />
                </button>
                
                {showFormatDropdown && (
                  <div className="absolute right-0 mt-1 w-40 bg-white border border-gray-200 rounded-md shadow-lg z-20">
                    <div className="py-1">
                      {formats.map(format => (
                        <button
                          key={format.id}
                          type="button"
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${format.id === 'feed' ? 'text-[#dc2626] font-medium' : ''}`}
                          onClick={() => selectFormat(format.name)}
                        >
                          {format.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <Button 
                type="submit" 
                className="bg-[#4F46E5] hover:bg-[#4F46E5]/90 text-white h-[48px] rounded-r-md transition duration-300 flex-shrink-0"
              >
                <Search className="h-5 w-5" />
              </Button>
            </div>
          </form>
          
          <div className="flex items-center mt-4">
            <div className="flex items-center text-[#2563EB] text-sm">
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
              <span>Escolha sua categoria</span>
            </div>
            <div className="ml-auto">
              <button type="button" className="text-[#2563EB] text-sm hover:underline">
                Ver todas as Categorias
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
