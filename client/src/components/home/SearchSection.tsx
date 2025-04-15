import { useState } from "react";
import { useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

export default function SearchSection() {
  const [searchQuery, setSearchQuery] = useState("");
  const [, navigate] = useLocation();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <section className="py-8 md:py-10">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <form className="flex items-center" onSubmit={handleSearch}>
            <div className="relative flex-grow">
              <Input
                type="text"
                className="w-full px-5 py-6 text-base border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Busque por uma arte ou material que precisa..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button 
              type="submit" 
              className="bg-primary hover:bg-primary/90 text-white px-6 py-6 h-auto rounded-r-md transition duration-300 flex-shrink-0"
            >
              <span className="hidden sm:inline">Pesquisar</span>
              <Search className="h-5 w-5 sm:hidden" />
            </Button>
          </form>
        </div>
      </div>
    </section>
  );
}
