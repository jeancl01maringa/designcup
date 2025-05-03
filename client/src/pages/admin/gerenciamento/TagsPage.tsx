import { useState } from "react";
import { Helmet } from "react-helmet";
import { TagsManagement } from "@/components/admin/gerenciamento/TagsManagement";

export default function TagsPage() {
  const [isTagsManagementOpen, setIsTagsManagementOpen] = useState(true);
  
  return (
    <div className="container mx-auto py-8">
      <Helmet>
        <title>Gerenciar Tags - Painel Administrativo</title>
      </Helmet>
      
      {/* Utiliza o componente de gerenciamento de tags em um painel lateral */}
      <TagsManagement 
        open={isTagsManagementOpen} 
        onOpenChange={setIsTagsManagementOpen} 
      />
    </div>
  );
}