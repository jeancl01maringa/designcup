import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSupportNumber } from "@/hooks/use-support-number";

interface SupportContactProps {
  variant?: "default" | "ghost" | "outline";
  size?: "sm" | "default" | "lg";
  showIcon?: boolean;
  className?: string;
}

export function SupportContact({ 
  variant = "ghost", 
  size = "sm", 
  showIcon = true,
  className = ""
}: SupportContactProps) {
  const { whatsappUrl } = useSupportNumber();

  if (!whatsappUrl) return null;

  return (
    <Button
      variant={variant}
      size={size}
      className={`flex items-center gap-2 ${className}`}
      onClick={() => window.open(`${whatsappUrl}?text=Olá, preciso de ajuda!`, '_blank')}
    >
      {showIcon && <MessageSquare className="h-4 w-4" />}
      <span>Suporte</span>
    </Button>
  );
}