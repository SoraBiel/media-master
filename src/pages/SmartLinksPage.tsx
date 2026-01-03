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
import { useSmartLinks, SmartLinkPageType, SmartLinkTemplate } from "@/hooks/useSmartLinks";
import { useSmartLinkBaseUrl } from "@/hooks/useSmartLinkBaseUrl";
import { Plus, Link2, Eye, ExternalLink, Trash2, Edit, Copy, ToggleLeft, ToggleRight, ArrowRight, Zap, Palette } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { SMART_LINK_TEMPLATES, SmartLinkTemplateConfig } from "@/lib/smartLinkTemplates";
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
import { cn } from "@/lib/utils";

const SmartLinksPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { pages, isLoading, limits, canCreatePage, createPage, updatePage, deletePage } = useSmartLinks();
  const smartLinkBaseUrl = useSmartLinkBaseUrl();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [newPageTitle, setNewPageTitle] = useState("");
  const [newPageSlug, setNewPageSlug] = useState("");
  const [newRedirectUrl, setNewRedirectUrl] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [pageType, setPageType] = useState<SmartLinkPageType>("linkbio");
  const [selectedTemplate, setSelectedTemplate] = useState<SmartLinkTemplate>("minimalist");
  const [createStep, setCreateStep] = useState<1 | 2>(1);

  const resetCreateForm = () => {
    setNewPageTitle("");
    setNewPageSlug("");
    setNewRedirectUrl("");
    setPageType("linkbio");
    setSelectedTemplate("minimalist");
    setCreateStep(1);
  };

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

    if (pageType === "redirector" && !newRedirectUrl.trim()) {
      toast({
        title: "URL obrigatória",
        description: "Informe a URL de redirecionamento.",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    const template = SMART_LINK_TEMPLATES.find((t) => t.id === selectedTemplate);

    const page = await createPage({
      title: newPageTitle,
      slug: newPageSlug,
      page_type: pageType,
      redirect_url: pageType === "redirector" ? newRedirectUrl : null,
      template: selectedTemplate,
      background_color: template?.background_color || "#1a1a2e",
      text_color: template?.text_color || "#ffffff",
      button_style: template?.button_style || "rounded",
    });

    if (page) {
      setIsCreateOpen(false);
      resetCreateForm();
      if (pageType === "linkbio") {
        navigate(`/smart-links/${page.id}`);
      }
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

  const getBaseUrl = () => {
    const base = (smartLinkBaseUrl || window.location.origin).replace(/\/+$/, "");
    return base;
  };

  const buildPublicUrl = (slug: string) => `${getBaseUrl()}/@${slug}`;

  const copyLink = (slug: string) => {
    const url = buildPublicUrl(slug);
    navigator.clipboard.writeText(url);
    toast({
      title: "Link copiado!",
      description: "O link foi copiado para a área de transferência.",
    });
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

            <Dialog open={isCreateOpen} onOpenChange={(open) => {
              setIsCreateOpen(open);
              if (!open) resetCreateForm();
            }}>
              <DialogTrigger asChild>
                <Button disabled={!canCreatePage()}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Página
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                {createStep === 1 ? (
                  <>
                    <DialogHeader className="text-center pb-4">
                      <DialogTitle className="text-xl">Escolha o tipo de página</DialogTitle>
                      <DialogDescription>
                        Selecione o tipo de Smart Link que deseja criar
                      </DialogDescription>
                    </DialogHeader>

                    <div className="grid grid-cols-2 gap-4 py-4">
                      {/* Link Bio Option */}
                      <button
                        type="button"
                        onClick={() => {
                          setPageType("linkbio");
                          setCreateStep(2);
                        }}
                        className={cn(
                          "flex flex-col items-center p-6 rounded-xl border-2 transition-all hover:border-primary hover:bg-primary/5",
                          "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                        )}
                      >
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mb-4">
                          <Palette className="w-7 h-7 text-primary" />
                        </div>
                        <h3 className="font-semibold mb-1">Link Bio</h3>
                        <p className="text-xs text-muted-foreground text-center">
                          Página com múltiplos botões e links personalizados
                        </p>
                      </button>

                      {/* Redirector Option */}
                      <button
                        type="button"
                        onClick={() => {
                          setPageType("redirector");
                          setCreateStep(2);
                        }}
                        className={cn(
                          "flex flex-col items-center p-6 rounded-xl border-2 transition-all hover:border-primary hover:bg-primary/5",
                          "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                        )}
                      >
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-green-500/20 to-green-500/10 flex items-center justify-center mb-4">
                          <Zap className="w-7 h-7 text-green-500" />
                        </div>
                        <h3 className="font-semibold mb-1">Redirecionador</h3>
                        <p className="text-xs text-muted-foreground text-center">
                          Redireciona automaticamente para um link ou grupo
                        </p>
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <DialogHeader className="text-center pb-2">
                      <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                        {pageType === "linkbio" ? (
                          <Palette className="w-6 h-6 text-primary" />
                        ) : (
                          <Zap className="w-6 h-6 text-green-500" />
                        )}
                      </div>
                      <DialogTitle className="text-xl">
                        {pageType === "linkbio" ? "Criar Link Bio" : "Criar Redirecionador"}
                      </DialogTitle>
                      <DialogDescription>
                        {pageType === "linkbio"
                          ? "Configure sua página de links personalizada"
                          : "Configure seu redirecionador automático"}
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-5 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="title" className="text-sm font-medium">
                          {pageType === "linkbio" ? "Título da Página" : "Nome do Redirecionador"}
                        </Label>
                        <Input
                          id="title"
                          placeholder={pageType === "linkbio" ? "Ex: Meus Links, Portfólio..." : "Ex: Grupo VIP, Link Especial..."}
                          value={newPageTitle}
                          onChange={(e) => setNewPageTitle(e.target.value)}
                          className="h-11"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="slug" className="text-sm font-medium">
                          URL Personalizada
                        </Label>
                        <div className="flex items-center gap-0 rounded-md border border-input bg-background overflow-hidden focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                          <span className="px-3 py-2.5 text-sm text-muted-foreground bg-muted/50 border-r border-input whitespace-nowrap font-mono">
                            /@
                          </span>
                          <Input
                            id="slug"
                            placeholder="meulink"
                            value={newPageSlug}
                            onChange={(e) => setNewPageSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))}
                            className="h-11 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none font-mono"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Letras minúsculas, números, hífen ou underscore
                        </p>
                      </div>

                      {pageType === "redirector" && (
                        <div className="space-y-2">
                          <Label htmlFor="redirect_url" className="text-sm font-medium">
                            URL de Destino
                          </Label>
                          <Input
                            id="redirect_url"
                            placeholder="https://t.me/seugrupo ou https://exemplo.com"
                            value={newRedirectUrl}
                            onChange={(e) => setNewRedirectUrl(e.target.value)}
                            className="h-11"
                          />
                          <p className="text-xs text-muted-foreground">
                            O visitante será redirecionado automaticamente para este link
                          </p>
                        </div>
                      )}

                      {pageType === "linkbio" && (
                        <div className="space-y-3">
                          <Label className="text-sm font-medium">Escolha um Template</Label>
                          <div className="grid grid-cols-3 gap-2">
                            {SMART_LINK_TEMPLATES.map((template) => (
                              <button
                                key={template.id}
                                type="button"
                                onClick={() => setSelectedTemplate(template.id as SmartLinkTemplate)}
                                className={cn(
                                  "flex flex-col items-center p-3 rounded-lg border-2 transition-all",
                                  selectedTemplate === template.id
                                    ? "border-primary bg-primary/5"
                                    : "border-border hover:border-muted-foreground/50"
                                )}
                              >
                                <div
                                  className="w-full h-12 rounded-md mb-2"
                                  style={{
                                    background: template.preview.gradient || template.background_color,
                                  }}
                                />
                                <span className="text-xs font-medium">{template.name}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <DialogFooter className="flex-col sm:flex-row gap-2 pt-2">
                      <Button
                        variant="ghost"
                        onClick={() => setCreateStep(1)}
                        className="sm:flex-1"
                      >
                        <ArrowRight className="w-4 h-4 mr-2 rotate-180" />
                        Voltar
                      </Button>
                      <Button
                        onClick={handleCreate}
                        disabled={
                          isCreating ||
                          !newPageTitle.trim() ||
                          !newPageSlug.trim() ||
                          (pageType === "redirector" && !newRedirectUrl.trim())
                        }
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
                            Criar {pageType === "linkbio" ? "Link Bio" : "Redirecionador"}
                          </>
                        )}
                      </Button>
                    </DialogFooter>
                  </>
                )}
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
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant="outline" 
                          className={cn(
                            "text-2xs",
                            page.page_type === "redirector" 
                              ? "border-green-500/50 text-green-400 bg-green-500/10" 
                              : "border-primary/50 text-primary bg-primary/10"
                          )}
                        >
                          {page.page_type === "redirector" ? (
                            <><Zap className="w-3 h-3 mr-1" />Redirector</>
                          ) : (
                            <><Palette className="w-3 h-3 mr-1" />Link Bio</>
                          )}
                        </Badge>
                        {page.is_active ? (
                          <Badge variant="default" className="text-2xs">Ativo</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-2xs">Inativo</Badge>
                        )}
                      </div>
                      <CardTitle className="text-lg">{page.title}</CardTitle>
                      <CardDescription className="flex items-center gap-1 font-mono text-xs">
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
                    {page.page_type === "redirector" && page.redirect_url && (
                      <div className="flex items-center gap-1.5 text-muted-foreground text-xs truncate max-w-[150px]">
                        <ArrowRight className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{page.redirect_url}</span>
                      </div>
                    )}
                  </div>

                  {/* Created date */}
                  <p className="text-xs text-muted-foreground">
                    Criado em {format(new Date(page.created_at), "dd 'de' MMM, yyyy", { locale: ptBR })}
                  </p>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2">
                    {page.page_type === "linkbio" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => navigate(`/smart-links/${page.id}`)}
                      >
                        <Edit className="w-4 h-4 mr-1.5" />
                        Editar
                      </Button>
                    )}

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
                      onClick={() => window.open(buildPublicUrl(page.slug), "_blank")}
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
