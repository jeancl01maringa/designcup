import React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { insertPostSchema } from "@shared/schema";
import { generateUniqueFileName } from "@/lib/admin/uploadToSupabase";
import { uploadImageToSupabase } from "@/lib/admin/uploadToSupabase";
import { supabase } from "@/lib/supabase";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, ImagePlus } from "lucide-react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Category, Post } from "@shared/schema";

// Estender o schema do Zod para incluir validações adicionais
const postFormSchema = insertPostSchema.extend({
  title: z.string().min(5, "O título deve ter pelo menos 5 caracteres").max(100, "O título deve ter no máximo 100 caracteres"),
  description: z.string().min(10, "A descrição deve ter pelo menos 10 caracteres").max(500, "A descrição deve ter no máximo 500 caracteres"),
  image: z.instanceof(File).optional(),
  imageUrl: z.string().optional(),
}).refine(data => data.image || data.imageUrl, {
  message: "É necessário fornecer uma imagem ou URL de imagem",
  path: ["image"],
});

type PostFormValues = z.infer<typeof postFormSchema>;

interface PostFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  post?: Post;
  categories: Category[];
}

export function PostForm({ isOpen, onClose, onSubmit, post, categories }: PostFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [imagePreview, setImagePreview] = React.useState<string | null>(null);
  
  // Inicializar o formulário
  const form = useForm<PostFormValues>({
    resolver: zodResolver(postFormSchema),
    defaultValues: post ? {
      title: post.title,
      description: post.description || "",
      categoryId: post.categoryId || undefined,
      imageUrl: post.imageUrl,
      status: post.status || "rascunho",
      uniqueCode: post.uniqueCode,
    } : {
      title: "",
      description: "",
      categoryId: undefined,
      imageUrl: "",
      status: "rascunho",
      uniqueCode: Math.random().toString(36).substring(2, 10),
    },
  });
  
  // Resetar o formulário quando o diálogo fechar
  React.useEffect(() => {
    if (!isOpen) {
      form.reset();
      setImagePreview(null);
    } else if (post) {
      setImagePreview(post.imageUrl);
    }
  }, [isOpen, form, post]);
  
  // Manipular o upload de imagem
  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Validar o tipo de arquivo
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Tipo de arquivo inválido",
        description: "Por favor, selecione um arquivo de imagem (JPG, PNG, WebP).",
        variant: "destructive",
      });
      return;
    }
    
    // Validar o tamanho do arquivo (max 3MB)
    if (file.size > 3 * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: "O tamanho máximo permitido é 3MB.",
        variant: "destructive",
      });
      return;
    }
    
    // Atualizar o formulário
    form.setValue("image", file);
    
    // Mostrar preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };
  
  // Manipular o envio do formulário
  const handleSubmit = async (values: PostFormValues) => {
    setIsSubmitting(true);
    
    try {
      let imageUrl = values.imageUrl;
      
      // Se tem um novo arquivo de imagem, fazer upload para o Supabase
      if (values.image) {
        const fileName = generateUniqueFileName(values.image.name);
        const filePath = `posts/${fileName}`;
        
        // Upload para o Supabase Storage
        const { data, error } = await supabase.storage
          .from("images")
          .upload(filePath, values.image, {
            cacheControl: "3600",
            upsert: false,
          });
        
        if (error) {
          throw new Error(`Erro ao fazer upload da imagem: ${error.message}`);
        }
        
        // Obter URL pública
        const { data: publicUrlData } = supabase.storage
          .from("images")
          .getPublicUrl(filePath);
        
        imageUrl = publicUrlData.publicUrl;
      }
      
      // Dados finais para salvar
      const postData = {
        ...values,
        imageUrl,
        image: undefined, // Não enviar o arquivo para a API
      };
      
      // Enviar para o servidor
      await onSubmit(postData);
      
      toast({
        title: "Sucesso!",
        description: post ? "Post atualizado com sucesso." : "Post criado com sucesso.",
      });
      
      // Fechar o modal
      onClose();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Ocorreu um erro ao salvar o post.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{post ? "Editar Post" : "Criar Novo Post"}</DialogTitle>
          <DialogDescription>
            {post 
              ? "Atualize as informações do post existente." 
              : "Preencha os detalhes para criar um novo post."}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Título */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título</FormLabel>
                  <FormControl>
                    <Input placeholder="Título do post" {...field} />
                  </FormControl>
                  <FormDescription>
                    Um título claro e atrativo para o post.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Descrição */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Descrição do post" 
                      className="min-h-[100px]" 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Uma breve descrição do conteúdo do post.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Categoria */}
            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    defaultValue={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem 
                          key={category.id} 
                          value={category.id.toString()}
                        >
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    A categoria à qual este post pertence.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Imagem */}
            <div className="space-y-2">
              <Label htmlFor="image">Imagem</Label>
              
              <div className="flex flex-col gap-4">
                {/* Preview de imagem */}
                {imagePreview && (
                  <div className="relative rounded-md overflow-hidden w-full max-h-[200px]">
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="w-full h-auto object-cover"
                    />
                  </div>
                )}
                
                {/* Input de arquivo */}
                <div className="grid w-full items-center gap-1.5">
                  <Label 
                    htmlFor="image-upload" 
                    className={cn(
                      "flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-md cursor-pointer",
                      "hover:bg-muted/50 transition-colors",
                      imagePreview ? "border-muted" : "border-primary/30"
                    )}
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <ImagePlus className={cn(
                        "w-8 h-8 mb-4",
                        imagePreview ? "text-muted-foreground" : "text-primary/70"
                      )} />
                      <p className="text-sm text-muted-foreground">
                        {imagePreview 
                          ? "Clique para alterar a imagem" 
                          : "Clique para fazer upload de uma imagem"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        PNG, JPG ou WebP (máx. 3MB)
                      </p>
                    </div>
                    <Input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageChange}
                    />
                  </Label>
                </div>
              </div>
              
              {form.formState.errors.image && (
                <p className="text-sm font-medium text-destructive">
                  {form.formState.errors.image.message}
                </p>
              )}
            </div>
            
            {/* Status */}
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="rascunho">Rascunho</SelectItem>
                      <SelectItem value="aprovado">Aprovado</SelectItem>
                      <SelectItem value="rejeitado">Rejeitado</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    O status atual do post.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Código único - invisível para o usuário */}
            <input type="hidden" {...form.register("uniqueCode")} />
            
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>{post ? "Atualizar" : "Criar"}</>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}