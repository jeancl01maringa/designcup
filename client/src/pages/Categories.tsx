import { Card, CardContent } from "@/components/ui/card";

export default function Categories() {
  const categories = [
    { id: 1, name: "Estética Facial", description: "Materiais para promoção de serviços de estética facial." },
    { id: 2, name: "Estética Corporal", description: "Templates para divulgação de procedimentos corporais." },
    { id: 3, name: "Maquiagem", description: "Artes para profissionais de maquiagem e beleza." },
    { id: 4, name: "Unhas", description: "Modelos para manicures e especialistas em unhas." },
    { id: 5, name: "Sobrancelhas", description: "Templates para designers de sobrancelhas." },
    { id: 6, name: "Promoções", description: "Artes especiais para divulgação de promoções e pacotes." }
  ];

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-serif font-bold text-center mb-10">Categorias</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map(category => (
          <Card key={category.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <h2 className="text-xl font-medium mb-2">{category.name}</h2>
              <p className="text-gray-600">{category.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
