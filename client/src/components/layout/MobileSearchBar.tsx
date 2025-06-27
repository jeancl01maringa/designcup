import { useState } from "react";
import { useLocation } from "wouter";
import { Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function MobileSearchBar() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      setLocation(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  return (
    <div className="md:hidden bg-gray-100 border-b border-gray-200 sticky top-[64px] z-40">
      <div className="container-global py-3">
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Buscar por título"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white border-gray-300 text-sm focus:border-[#191c2c] focus:ring-[#191c2c]"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            className="px-4 py-2 h-[40px] bg-[#191c2c] text-white border-[#191c2c] hover:bg-[#14182a] hover:border-[#14182a] rounded-full min-w-[80px] text-sm"
          >
            <Filter className="w-4 h-4 mr-1" />
            Filtros
          </Button>
        </form>
      </div>
    </div>
  );
}