import { ExternalLink as ExternalLinkIcon } from "lucide-react";
import { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ExternalLinkProps extends HTMLAttributes<HTMLAnchorElement> {
  href: string;
  children: ReactNode;
  showIcon?: boolean;
}

export function ExternalLink({
  href,
  children,
  className,
  showIcon = true,
  ...props
}: ExternalLinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "text-blue-600 hover:underline inline-flex items-center",
        className
      )}
      {...props}
    >
      <span>{children}</span>
      {showIcon && <ExternalLinkIcon className="ml-1 h-3 w-3" />}
    </a>
  );
}