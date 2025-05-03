import React, { useState, useEffect } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Category, Post } from "@shared/schema";
import { cn } from "@/lib/utils";
import { uploadToSupabase } from "@/lib/admin/uploadToSupabase";
import { useToast } from "@/hooks/use-toast";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, PlusCircle, X, Image } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const formSchema = z.object({
  title: z.string().min(3, {
    message: "O título deve ter pelo menos 3 caracteres.",
  }),
  description: z.string().optional(),
  categoryId: z.string().nullable().transform(val => val ? parseInt(val, 10) : null),
  status: z.string().default("rascunho"),
  imageUrl: z.string().nullable(),
  licenseType: z.string().default("premium"),
  tags: z.array(z.string()).default([]),
  formats: z.array(z.string()).default([]),
});

type FormValues = z.infer<typeof formSchema>;

const FORMATS = [
  { id: "feed", name: "FEED", description: "Para publicação no feed do Instagram" },
  { id: "cartaz", name: "CARTAZ", description: "Para divulgação impressa ou digital" },
  { id: "stories", name: "STORIES", description: "Formato vertical para stories" },
];

interface PostFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: FormValues) => void;
  post?: Post;
  categories: Category[];
}

export function PostForm({ isOpen, onClose, onSubmit, post, categories }: PostFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  // Inicializar form com valores padrão ou do post existente
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: post?.title || "",
      description: post?.description || "",
      categoryId: post?.categoryId ? String(post.categoryId) : null,
      status: post?.status || "rascunho",
      imageUrl: post?.imageUrl || null,
      licenseType: post?.licenseType || "premium",
      tags: post?.tags || [],
      formats: post?.formats || [],
    },
  });
  
  // Resetar formulário quando o post muda
  useEffect(() => {
    form.reset({
      title: post?.title || "",
      description: post?.description || "",
      categoryId: post?.categoryId ? String(post.categoryId) : null,
      status: post?.status || "rascunho",
      imageUrl: post?.imageUrl || null,
      licenseType: post?.licenseType || "premium",
      tags: post?.tags || [],
      formats: post?.formats || [],
    });
    
    setImagePreview(post?.imageUrl || null);
  }, [post, form]);
  
  // Manipular adição de tag
  const handleAddTag = () => {
    if (newTag.trim() && !form.getValues().tags.includes(newTag.trim())) {
      const currentTags = form.getValues().tags;
      form.setValue("tags", [...currentTags, newTag.trim()]);
      setNewTag("");
    }
  };
  
  // Manipular remoção de tag
  const handleRemoveTag = (tag: string) => {
    const currentTags = form.getValues().tags;
    form.setValue("tags", currentTags.filter(t => t !== tag));
  };
  
  // Manipular toggle de formato
  const handleFormatToggle = (format: string) => {
    const currentFormats = form.getValues().formats;
    if (currentFormats.includes(format)) {
      form.setValue("formats", currentFormats.filter(f => f !== format));
    } else {
      form.setValue("formats", [...currentFormats, format]);
    }
  };
  
  // Manipular alteração de imagem
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      
      // Criar URL temporária para preview
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Manipular envio do formulário
  const handleFormSubmit = async (values: FormValues) => {
    setIsLoading(true);
    
    try {
      // Se houver uma nova imagem, fazer upload
      if (imageFile) {
        const path = `posts/${Date.now()}_${imageFile.name.replace(/\s+/g, '_')}`;
        const imageUrl = await uploadToSupabase(imageFile, path);
        
        if (imageUrl) {
          values.imageUrl = imageUrl;
        } else {
          throw new Error("Falha ao fazer upload da imagem");
        }
      }
      
      // Enviar dados para o servidor
      await onSubmit(values);
      onClose();
    } catch (error) {
      console.error("Erro ao salvar post:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao salvar a postagem.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{post ? "Editar" : "Nova"} Postagem</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6 pt-4">
            {/* Informações básicas */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Postagem</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Ex: Cartaz de Promoção Primavera" 
                      {...field} 
                    />
                  </FormControl>
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
                  <div className="flex items-center gap-2">
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value !== null ? field.value.toString() : ""}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id.toString()}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      title="Nova Categoria"
                    >
                      <PlusCircle className="h-4 w-4" />
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Licença */}
              <FormField
                control={form.control}
                name="licenseType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Licença de Uso</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="premium">
                            Premium 
                            <span className="ml-2 text-yellow-500">👑</span>
                          </SelectItem>
                          <SelectItem value="standard">Standard</SelectItem>
                          <SelectItem value="free">Gratuito</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormDescription>
                      Determine como sua arte pode ser usada.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Status */}
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="aprovado">
                            Aprovado 
                            <span className="ml-2 text-green-500">✓</span>
                          </SelectItem>
                          <SelectItem value="rascunho">Rascunho</SelectItem>
                          <SelectItem value="rejeitado">Rejeitado</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* Tags */}
            <FormItem>
              <FormLabel>Tags</FormLabel>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Adicionar tag"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleAddTag}
                  title="Nova Tag"
                >
                  <PlusCircle className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex flex-wrap gap-1 mt-2">
                {form.getValues().tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => handleRemoveTag(tag)}
                    />
                  </Badge>
                ))}
                {form.getValues().tags.length === 0 && (
                  <div className="text-sm text-muted-foreground">
                    Tags comuns
                  </div>
                )}
              </div>
              <FormMessage />
            </FormItem>
            
            {/* Formatos */}
            <FormItem>
              <FormLabel>Formatos da Postagem</FormLabel>
              <div className="flex flex-wrap gap-3 mt-2">
                {FORMATS.map((format) => {
                  const isActive = form.getValues().formats.includes(format.id);
                  return (
                    <div
                      key={format.id}
                      className={cn(
                        "p-4 border rounded-md cursor-pointer transition-all relative",
                        "hover:border-primary",
                        isActive ? "border-primary bg-primary/5" : "border-border"
                      )}
                      onClick={() => handleFormatToggle(format.id)}
                    >
                      <div className="text-sm font-medium">{format.name}</div>
                      {isActive && (
                        <Badge className="absolute -top-2 -right-2 text-xs">
                          Essencial
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
              <FormMessage />
            </FormItem>
            
            {/* Imagem de Capa */}
            <FormItem>
              <FormLabel>Capa</FormLabel>
              <div className="mt-2 border-2 border-dashed border-border rounded-md p-4">
                {imagePreview ? (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="max-h-48 mx-auto rounded-md object-contain"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview(null);
                        form.setValue("imageUrl", null);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center h-32 cursor-pointer">
                    <Image className="h-10 w-10 text-muted-foreground mb-2" />
                    <span className="text-sm text-muted-foreground">
                      Clique para fazer upload ou arraste uma imagem
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageChange}
                    />
                  </label>
                )}
              </div>
              <FormMessage />
            </FormItem>
            
            {/* Descrição */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição (opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descrição da postagem..."
                      className="resize-none"
                      rows={4}
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Próximo"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}