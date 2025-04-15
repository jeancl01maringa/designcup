import { useState, createContext, useContext } from "react";

type MobileMenuContextType = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
};

const MobileMenuContext = createContext<MobileMenuContextType | undefined>(undefined);

export function useMobileMenuProvider() {
  const [isOpen, setIsOpen] = useState(false);
  
  return {
    value: { isOpen, setIsOpen },
    Context: MobileMenuContext
  };
}

export function useMobileMenu() {
  const context = useContext(MobileMenuContext);
  
  if (context === undefined) {
    throw new Error("useMobileMenu must be used within a MobileMenuProvider");
  }
  
  return context;
}
