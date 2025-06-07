import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Users, Search, User, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProfileLayout } from "@/components/layout/ProfileLayout";

interface FollowedUser {
  id: number;
  username: string;
  profileImage?: string;
  postsCount: number;
  isDesigner: boolean;
}

export default function SeguindoPage() {
  const { user } = useAuth();

  // Buscar usuários que o usuário atual está seguindo
  const { data: followedUsers = [], isLoading } = useQuery<FollowedUser[]>({
    queryKey: ['/api/user/following'],
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutos em cache
    retry: 1
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-500" />
            </div>
            Seguindo
          </h1>
          <p className="text-muted-foreground mt-2">
            Designers e autores que você está seguindo
          </p>
        </div>

        {/* Loading skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="p-6">
              <div className="flex flex-col items-center space-y-4">
                <Skeleton className="h-16 w-16 rounded-full" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-8 w-20" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <ProfileLayout>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
            <Users className="w-6 h-6 text-blue-500" />
          </div>
          Seguindo
        </h1>
        <p className="text-muted-foreground mt-2">
          Designers e autores que você está seguindo
        </p>
      </div>

      {followedUsers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center mb-6">
            <Users className="w-10 h-10 text-blue-300" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">
            Você ainda não está seguindo ninguém
          </h2>
          <p className="text-gray-600 mb-8 max-w-md">
            Siga designers para ver mais artes como essas e acompanhar os trabalhos dos seus criadores favoritos!
          </p>
          <Link href="/">
            <Button className="bg-[#1f4ed8] hover:bg-[#1d4ed8]/90 text-white">
              <Search className="w-4 h-4 mr-2" />
              Explorar artes
            </Button>
          </Link>
        </div>
      ) : (
        <div>
          <div className="mb-6">
            <p className="text-sm text-gray-600">
              {followedUsers.length} {followedUsers.length === 1 ? 'pessoa seguida' : 'pessoas seguidas'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {followedUsers.map((followedUser) => (
              <Card key={followedUser.id} className="hover:shadow-lg transition-shadow duration-200">
                <CardContent className="p-6">
                  <div className="flex flex-col items-center space-y-4">
                    {/* Avatar do designer */}
                    <Avatar className="h-16 w-16">
                      <AvatarImage 
                        src={followedUser.profileImage} 
                        alt={followedUser.username}
                        className="object-cover"
                      />
                      <AvatarFallback className="text-lg bg-gray-200">
                        {followedUser.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    {/* Nome do designer */}
                    <div className="text-center">
                      <h3 className="font-semibold text-gray-800 text-sm">
                        {followedUser.username}
                      </h3>
                      {followedUser.isDesigner && (
                        <Badge variant="secondary" className="mt-1 text-xs">
                          <User className="w-3 h-3 mr-1" />
                          Designer
                        </Badge>
                      )}
                    </div>

                    {/* Estatísticas */}
                    <div className="text-center">
                      <p className="text-sm text-gray-500">
                        {followedUser.postsCount} {followedUser.postsCount === 1 ? 'arte' : 'artes'}
                      </p>
                    </div>

                    {/* Botão ver perfil */}
                    <Link href={`/autor/${followedUser.id}`}>
                      <Button variant="outline" size="sm" className="w-full">
                        <Eye className="w-4 h-4 mr-2" />
                        Ver perfil
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
      </div>
    </ProfileLayout>
  );
}