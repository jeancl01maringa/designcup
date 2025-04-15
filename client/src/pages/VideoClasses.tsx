import { Card, CardContent } from "@/components/ui/card";

export default function VideoClasses() {
  const videos = [
    { 
      id: 1, 
      title: "Como usar templates para sua clínica estética", 
      duration: "15:30",
      thumbnail: "https://images.unsplash.com/photo-1560750588-73207b1ef5b8?ixlib=rb-1.2.1&auto=format&fit=crop&w=1080&h=1080&q=80"
    },
    { 
      id: 2, 
      title: "Editando arte para Instagram Stories", 
      duration: "10:45",
      thumbnail: "https://images.unsplash.com/photo-1551392505-f4056032826e?ixlib=rb-1.2.1&auto=format&fit=crop&w=1080&h=1080&q=80"
    },
    { 
      id: 3, 
      title: "Criando promoções impactantes", 
      duration: "18:22",
      thumbnail: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?ixlib=rb-1.2.1&auto=format&fit=crop&w=1080&h=1080&q=80"
    },
    { 
      id: 4, 
      title: "Personalização avançada de templates", 
      duration: "22:15",
      thumbnail: "https://images.unsplash.com/photo-1614159102922-39bb647f58f7?ixlib=rb-1.2.1&auto=format&fit=crop&w=1080&h=1080&q=80"
    }
  ];

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-serif font-bold text-center mb-10">Vídeo Aulas</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {videos.map(video => (
          <Card key={video.id} className="overflow-hidden hover:shadow-md transition-shadow">
            <div className="relative">
              <img 
                src={video.thumbnail} 
                alt={video.title} 
                className="w-full h-48 object-cover"
              />
              <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                {video.duration}
              </div>
            </div>
            <CardContent className="p-4">
              <h3 className="font-medium">{video.title}</h3>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
