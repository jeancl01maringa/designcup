import React from "react";
import { Link } from "wouter";
import { Heart, Share } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProBadge } from "@/components/ui/pro-badge";
import { SocialShare } from "@/components/sharing/SocialShare";
import type { Artwork } from "@shared/schema";

interface ArtworkCardProps {
  artwork: Artwork;
}

export function ArtworkCard({ artwork }: ArtworkCardProps) {
  const formatLabel = {
    'square': 'Quadrado',
    'portrait': 'Retrato',
    'stories': 'Stories'
  }[artwork.format] || artwork.format;

  return (
    <Card className="overflow-hidden group">
      <div className="relative">
        <Link href={`/artwork/${artwork.id}`}>
          <a className="block cursor-pointer">
            <img 
              src={artwork.imageUrl} 
              alt={artwork.title} 
              className="w-full h-72 object-cover transition-transform group-hover:scale-105"
            />
          </a>
        </Link>
        
        <div className="absolute top-0 left-0 w-full p-3 flex justify-between items-center">
          <Badge variant="outline" className="bg-white/80 backdrop-blur-sm">
            {formatLabel}
          </Badge>
          
          {artwork.isPro && <ProBadge />}
        </div>
        
        <div className="absolute bottom-0 left-0 w-full p-3 bg-gradient-to-t from-black/70 to-transparent">
          <h3 className="text-white font-medium truncate">{artwork.title}</h3>
        </div>
      </div>
      
      <CardFooter className="p-3 flex justify-between bg-white">
        <Button variant="ghost" size="sm" className="rounded-full px-3 text-gray-600 hover:text-gray-900">
          <Heart className="h-4 w-4 mr-1" />
          <span className="text-xs">Salvar</span>
        </Button>
        
        <SocialShare artwork={artwork} />
      </CardFooter>
    </Card>
  );
}