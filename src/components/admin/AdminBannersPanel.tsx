import { useState, useEffect, useRef } from "react";
import { Image as ImageIcon, Plus, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Banner {
  id: string;
  title: string | null;
  description: string | null;
  image_url: string;
  link_url: string | null;
  link_text: string | null;
  is_active: boolean;
  priority: number;
  expires_at: string | null;
  created_at: string;
}

export const AdminBannersPanel = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedBanner, setSelectedBanner] = useState<Banner | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const [form, setForm] = useState({
    title: "",
    description: "",
    link_url: "",
    link_text: "",
    priority: "0",
    is_active: true,
    expires_at: "",
  });

  const fetchBanners = async () => {
    try {
      // Admins can see all banners via their RLS policy
      const { data, error } = await supabase
        .from("dashboard_banners")
        .select("*")
        .order("priority", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      setBanners(data || []);
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const handleImageChange = (file: File | null) => {
    setImageFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  };

  const handleUploadImage = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `banner-${Date.now()}.${fileExt}`;
      
      const { error } = await supabase.storage
        .from("product-images")
        .upload(fileName, file);

      if (error) throw error;

      const { data } = supabase.storage.from("product-images").getPublicUrl(fileName);
      return data.publicUrl;
    } catch (error: any) {
      toast({ title: "Erro no upload", description: error.message, variant: "destructive" });
      return null;
    }
  };

  const handleSubmit = async () => {
    if (!selectedBanner && !imageFile) {
      toast({ title: "Erro", description: "A imagem é obrigatória", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      let imageUrl: string | null = selectedBanner?.image_url || null;
      
      if (imageFile) {
        imageUrl = await handleUploadImage(imageFile);
        if (!imageUrl) {
          setIsSubmitting(false);
          return;
        }
      }

      const payload = {
        title: form.title || null,
        description: form.description || null,
        image_url: imageUrl!,
        link_url: form.link_url || null,
        link_text: form.link_text || null,
        priority: parseInt(form.priority) || 0,
        is_active: form.is_active,
        expires_at: form.expires_at || null,
      };

      if (selectedBanner) {
        const { error } = await supabase
          .from("dashboard_banners")
          .update(payload)
          .eq("id", selectedBanner.id);
        if (error) throw error;
        toast({ title: "Banner atualizado!" });
      } else {
        const { error } = await supabase.from("dashboard_banners").insert(payload);
        if (error) throw error;
        toast({ title: "Banner criado!" });
      }

      resetForm();
      setDialogOpen(false);
      fetchBanners();
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedBanner) return;

    try {
      const { error } = await supabase
        .from("dashboard_banners")
        .delete()
        .eq("id", selectedBanner.id);

      if (error) throw error;
      toast({ title: "Banner removido!" });
      setDeleteDialogOpen(false);
      setSelectedBanner(null);
      fetchBanners();
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  };

  const handleToggleActive = async (banner: Banner) => {
    try {
      const { error } = await supabase
        .from("dashboard_banners")
        .update({ is_active: !banner.is_active })
        .eq("id", banner.id);

      if (error) throw error;
      fetchBanners();
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  };

  const resetForm = () => {
    setForm({
      title: "",
      description: "",
      link_url: "",
      link_text: "",
      priority: "0",
      is_active: true,
      expires_at: "",
    });
    setImageFile(null);
    setImagePreview(null);
    setSelectedBanner(null);
  };

  const openEditDialog = (banner: Banner) => {
    setSelectedBanner(banner);
    setForm({
      title: banner.title || "",
      description: banner.description || "",
      link_url: banner.link_url || "",
      link_text: banner.link_text || "",
      priority: banner.priority.toString(),
      is_active: banner.is_active,
      expires_at: banner.expires_at ? banner.expires_at.split("T")[0] : "",
    });
    setImagePreview(banner.image_url);
    setDialogOpen(true);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="w-5 h-5" />
          Banners do Dashboard ({banners.length})
        </CardTitle>
        <Button
          size="sm"
          onClick={() => {
            resetForm();
            setDialogOpen(true);
          }}
        >
          <Plus className="w-4 h-4 mr-1" />
          Novo Banner
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Carregando...</div>
        ) : banners.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>Nenhum banner criado</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Preview</TableHead>
                <TableHead>Título</TableHead>
                <TableHead>Prioridade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {banners.map((banner) => (
                <TableRow key={banner.id}>
                  <TableCell>
                    <img
                      src={banner.image_url}
                      alt=""
                      className="w-24 h-12 rounded object-cover"
                    />
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">{banner.title || "Sem título"}</p>
                    {banner.description && (
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {banner.description}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{banner.priority}</Badge>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={banner.is_active}
                      onCheckedChange={() => handleToggleActive(banner)}
                    />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(banner.created_at), "dd/MM/yy HH:mm", { locale: ptBR })}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(banner)}
                      >
                        Editar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={() => {
                          setSelectedBanner(banner);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedBanner ? "Editar Banner" : "Novo Banner"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Imagem do Banner *</Label>
              <div className="mt-1">
                {imagePreview ? (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-6 w-6"
                      onClick={() => handleImageChange(null)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-32 border-dashed"
                    onClick={() => imageInputRef.current?.click()}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="w-6 h-6" />
                      <span className="text-sm">Clique para upload</span>
                      <span className="text-xs text-muted-foreground">Recomendado: 1200x400px</span>
                    </div>
                  </Button>
                )}
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleImageChange(e.target.files?.[0] || null)}
                />
              </div>
            </div>
            <div>
              <Label>Título (opcional)</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Título do banner"
              />
            </div>
            <div>
              <Label>Descrição (opcional)</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Descrição curta"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Link URL</Label>
                <Input
                  value={form.link_url}
                  onChange={(e) => setForm({ ...form, link_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <div>
                <Label>Texto do botão</Label>
                <Input
                  value={form.link_text}
                  onChange={(e) => setForm({ ...form, link_text: e.target.value })}
                  placeholder="Saiba mais"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Prioridade</Label>
                <Input
                  type="number"
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div>
                <Label>Expira em</Label>
                <Input
                  type="date"
                  value={form.expires_at}
                  onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={form.is_active}
                onCheckedChange={(checked) => setForm({ ...form, is_active: checked })}
              />
              <Label>Ativo</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir banner?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O banner será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};
