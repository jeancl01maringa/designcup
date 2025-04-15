import HeroSection from "@/components/home/HeroSection";
import SearchSection from "@/components/home/SearchSection";
import CategorySection from "@/components/home/CategorySection";
import ArtworkGrid from "@/components/home/ArtworkGrid";

export default function Home() {
  return (
    <>
      <HeroSection />
      <SearchSection />
      <CategorySection />
      <ArtworkGrid />
    </>
  );
}
