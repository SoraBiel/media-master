import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useSmartLinks } from "@/hooks/useSmartLinks";
import { Plus, Link2, Eye, MousePointerClick, ExternalLink, Trash2, Edit, Copy, ToggleLeft, ToggleRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
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

const SmartLinksPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { pages, isLoading, limits, canCreatePage, createPage, updatePage, deletePage } = useSmartLinks();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [newPageTitle, setNewPageTitle] = useState("");
  const [newPageSlug, setNewPageSlug] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!newPageSlug.trim() || !newPageTitle.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha o título e a URL da página.",
        variant: "destructive",
      });
      return;
    }

    // Validate slug format
    const slugRegex = /^[a-z0-9_-]+$/;
    if (!slugRegex.test(newPageSlug)) {
      toast({
        title: "URL inválida",
        description: "Use apenas letras minúsculas, números, hífen e underscore.",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    const page = await createPage({
      title: newPageTitle,
      slug: newPageSlug,
    });

    if (page) {
      setIsCreateOpen(false);
      setNewPageTitle("");
      setNewPageSlug("");
      navigate(`/smart-links/${page.id}`);
    }
    setIsCreating(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await deletePage(deleteId);
    setDeleteId(null);
  };

  const handleToggleActive = async (pageId: string, currentState: boolean) => {
    await updatePage(pageId, { is_active: !currentState });
  };

  const copyLink = (slug: string) => {
    const url = `${window.location.origin}/@${slug}`;
    navigator.clipboard.writeText(url);
    toast({
      title: "Link copiado!",
      description: "O link foi copiado para a área de transferência.",
    });
  };

  const getBaseUrl = () => {
    return window.location.origin;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Smart Links</h1>
            <p className="text-muted-foreground">
              Crie páginas estilo Linktree integradas aos seus funis
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-xs">
              {pages.length}/{limits.pages === 999 ? "∞" : limits.pages} páginas
            </Badge>

            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button disabled={!canCreatePage()}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Página
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader className="text-center pb-2">
                  <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                    <Link2 className="w-6 h-6 text-primary" />
                  </div>
                  <DialogTitle className="text-xl">Criar Smart Link</DialogTitle>
                  <DialogDescription>
                    Configure sua nova página de links personalizada
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-5 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-sm font-medium">
                      Título da Página
                    </Label>
                    <Input
                      id="title"
                      placeholder="Ex: Meus Links, Portfólio, Contatos..."
                      value={newPageTitle}
                      onChange={(e) => setNewPageTitle(e.target.value)}
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="slug" className="text-sm font-medium">
                      URL Personalizada
                    </Label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-mono">
                        {getBaseUrl().replace(/https?:\/\//, '')}/@
                      </div>
                      <Input
                        id="slug"
                        placeholder="meulink"
                        value={newPageSlug}
                        onChange={(e) => setNewPageSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))}
                        className="h-11 pl-[calc(100%-8rem)] font-mono"
                        style={{ paddingLeft: `${getBaseUrl().replace(/https?:\/\//, '').length * 7.5 + 36}px` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <span className="inline-block w-1 h-1 rounded-full bg-muted-foreground/50" />
                      Use letras minúsculas, números, hífen ou underscore
                    </p>
                  </div>
                </div>

                <DialogFooter className="flex-col sm:flex-row gap-2 pt-2">
                  <Button 
                    variant="ghost" 
                    onClick={() => setIsCreateOpen(false)}
                    className="sm:flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleCreate} 
                    disabled={isCreating || !newPageTitle.trim() || !newPageSlug.trim()}
                    className="sm:flex-1 gap-2"
                  >
                    {isCreating ? (
                      <>
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        Criando...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        Criar Página
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Pages Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-48" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : pages.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Link2 className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhuma página criada</h3>
              <p className="text-muted-foreground text-center mb-4">
                Crie sua primeira Smart Link para começar a compartilhar seus links
              </p>
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeira Página
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pages.map((page) => (
              <Card key={page.id} className="group hover:border-primary/50 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        {page.title}
                        {page.is_active ? (
                          <Badge variant="default" className="text-2xs">Ativo</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-2xs">Inativo</Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-1">
                        <Link2 className="w-3 h-3" />
                        /@{page.slug}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Stats */}
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Eye className="w-4 h-4" />
                      <span>{page.total_views} views</span>
                    </div>
                  </div>

                  {/* Created date */}
                  <p className="text-xs text-muted-foreground">
                    Criado em {format(new Date(page.created_at), "dd 'de' MMM, yyyy", { locale: ptBR })}
                  </p>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => navigate(`/smart-links/${page.id}`)}
                    >
                      <Edit className="w-4 h-4 mr-1.5" />
                      Editar
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => copyLink(page.slug)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => window.open(`/@${page.slug}`, "_blank")}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleToggleActive(page.id, page.is_active)}
                    >
                      {page.is_active ? (
                        <ToggleRight className="w-4 h-4 text-primary" />
                      ) : (
                        <ToggleLeft className="w-4 h-4" />
                      )}
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setDeleteId(page.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Delete Confirmation */}
        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir página?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação não pode ser desfeita. Todos os botões e estatísticas serão perdidos.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
};

export default SmartLinksPage;
