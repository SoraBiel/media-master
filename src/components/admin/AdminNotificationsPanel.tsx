import { useState, useEffect, useRef } from "react";
import { Bell, Plus, Trash2, Upload, ExternalLink, Image as ImageIcon } from "lucide-react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  image_url: string | null;
  link_url: string | null;
  link_text: string | null;
  is_active: boolean;
  priority: number;
  expires_at: string | null;
  created_at: string;
}

export const AdminNotificationsPanel = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const [form, setForm] = useState({
    title: "",
    message: "",
    type: "info",
    link_url: "",
    link_text: "",
    priority: "0",
    is_active: true,
    expires_at: "",
  });

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("priority", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleUploadImage = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `notification-${Date.now()}.${fileExt}`;
      
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
    if (!form.title || !form.message) {
      toast({ title: "Erro", description: "Título e mensagem são obrigatórios", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      let imageUrl: string | null = null;
      if (imageFile) {
        imageUrl = await handleUploadImage(imageFile);
      }

      const payload = {
        title: form.title,
        message: form.message,
        type: form.type,
        link_url: form.link_url || null,
        link_text: form.link_text || null,
        priority: parseInt(form.priority) || 0,
        is_active: form.is_active,
        expires_at: form.expires_at || null,
        ...(imageUrl && { image_url: imageUrl }),
      };

      if (selectedNotification) {
        const { error } = await supabase
          .from("notifications")
          .update(payload)
          .eq("id", selectedNotification.id);
        if (error) throw error;
        toast({ title: "Notificação atualizada!" });
      } else {
        const { error } = await supabase.from("notifications").insert(payload);
        if (error) throw error;
        toast({ title: "Notificação criada!" });
      }

      resetForm();
      setDialogOpen(false);
      fetchNotifications();
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedNotification) return;

    try {
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("id", selectedNotification.id);

      if (error) throw error;
      toast({ title: "Notificação removida!" });
      setDeleteDialogOpen(false);
      setSelectedNotification(null);
      fetchNotifications();
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  };

  const handleToggleActive = async (notification: Notification) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_active: !notification.is_active })
        .eq("id", notification.id);

      if (error) throw error;
      fetchNotifications();
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  };

  const resetForm = () => {
    setForm({
      title: "",
      message: "",
      type: "info",
      link_url: "",
      link_text: "",
      priority: "0",
      is_active: true,
      expires_at: "",
    });
    setImageFile(null);
    setSelectedNotification(null);
  };

  const openEditDialog = (notification: Notification) => {
    setSelectedNotification(notification);
    setForm({
      title: notification.title,
      message: notification.message,
      type: notification.type,
      link_url: notification.link_url || "",
      link_text: notification.link_text || "",
      priority: notification.priority.toString(),
      is_active: notification.is_active,
      expires_at: notification.expires_at ? notification.expires_at.split("T")[0] : "",
    });
    setDialogOpen(true);
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "warning":
        return <Badge className="bg-warning text-warning-foreground">Aviso</Badge>;
      case "success":
        return <Badge className="bg-success">Sucesso</Badge>;
      case "promo":
        return <Badge className="bg-telegram">Promo</Badge>;
      default:
        return <Badge variant="secondary">Info</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Notificações ({notifications.length})
        </CardTitle>
        <Button
          size="sm"
          onClick={() => {
            resetForm();
            setDialogOpen(true);
          }}
        >
          <Plus className="w-4 h-4 mr-1" />
          Nova Notificação
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Carregando...</div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>Nenhuma notificação criada</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Prioridade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {notifications.map((notification) => (
                <TableRow key={notification.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {notification.image_url && (
                        <img
                          src={notification.image_url}
                          alt=""
                          className="w-8 h-8 rounded object-cover"
                        />
                      )}
                      <div>
                        <p className="font-medium">{notification.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {notification.message}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getTypeBadge(notification.type)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{notification.priority}</Badge>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={notification.is_active}
                      onCheckedChange={() => handleToggleActive(notification)}
                    />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(notification.created_at), "dd/MM/yy HH:mm", { locale: ptBR })}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(notification)}
                      >
                        Editar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={() => {
                          setSelectedNotification(notification);
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedNotification ? "Editar Notificação" : "Nova Notificação"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Título *</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Título da notificação"
              />
            </div>
            <div>
              <Label>Mensagem *</Label>
              <Textarea
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="Conteúdo da notificação"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tipo</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="warning">Aviso</SelectItem>
                    <SelectItem value="success">Sucesso</SelectItem>
                    <SelectItem value="promo">Promoção</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Prioridade</Label>
                <Input
                  type="number"
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>
            <div>
              <Label>Imagem (opcional)</Label>
              <div className="flex items-center gap-2 mt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => imageInputRef.current?.click()}
                >
                  <Upload className="w-4 h-4 mr-1" />
                  Upload
                </Button>
                {imageFile && (
                  <span className="text-sm text-muted-foreground">{imageFile.name}</span>
                )}
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                />
              </div>
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
                <Label>Texto do Link</Label>
                <Input
                  value={form.link_text}
                  onChange={(e) => setForm({ ...form, link_text: e.target.value })}
                  placeholder="Ver mais"
                />
              </div>
            </div>
            <div>
              <Label>Expira em (opcional)</Label>
              <Input
                type="date"
                value={form.expires_at}
                onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={form.is_active}
                onCheckedChange={(checked) => setForm({ ...form, is_active: checked })}
              />
              <Label>Ativa</Label>
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
            <AlertDialogTitle>Excluir notificação?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A notificação será removida permanentemente.
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
