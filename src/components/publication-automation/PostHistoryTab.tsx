import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CheckCircle, Clock, XCircle, AlertCircle, Twitter, Instagram, Facebook, RefreshCw, Trash2, Image } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface PlatformLog {
  id: string;
  platform: string;
  status: string;
  error_message: string | null;
  posted_at: string | null;
}

interface ScheduledPost {
  id: string;
  content: string;
  media_urls: string[];
  platforms: string[];
  scheduled_at: string | null;
  status: string;
  created_at: string;
  post_platform_logs: PlatformLog[];
}

const PLATFORM_ICONS: Record<string, any> = {
  twitter: Twitter,
  instagram: Instagram,
  facebook: Facebook,
  threads: () => <span className="font-bold text-xs">@</span>,
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  draft: { label: "Rascunho", color: "secondary", icon: Clock },
  scheduled: { label: "Agendado", color: "default", icon: Clock },
  processing: { label: "Processando", color: "default", icon: RefreshCw },
  completed: { label: "Concluído", color: "default", icon: CheckCircle },
  failed: { label: "Falhou", color: "destructive", icon: XCircle },
  partial: { label: "Parcial", color: "default", icon: AlertCircle },
};

const PLATFORM_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending: { label: "Pendente", color: "secondary" },
  success: { label: "Sucesso", color: "default" },
  failed: { label: "Falhou", color: "destructive" },
  skipped: { label: "Ignorado", color: "secondary" },
};

const PostHistoryTab = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, [user?.id]);

  const fetchPosts = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from("scheduled_posts")
        .select(`
          *,
          post_platform_logs (*)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Type assertion for the joined data
      const typedData = (data || []).map(post => ({
        ...post,
        media_urls: (post.media_urls || []) as string[],
        post_platform_logs: (post.post_platform_logs || []) as PlatformLog[],
      }));
      
      setPosts(typedData);
    } catch (error: any) {
      console.error("Error fetching posts:", error);
      toast.error("Erro ao carregar histórico");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (postId: string) => {
    try {
      const { error } = await supabase
        .from("scheduled_posts")
        .delete()
        .eq("id", postId);

      if (error) throw error;

      setPosts(prev => prev.filter(p => p.id !== postId));
      toast.success("Post removido");
    } catch (error: any) {
      console.error("Error deleting post:", error);
      toast.error("Erro ao remover post");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold text-lg mb-2">Nenhuma publicação ainda</h3>
          <p className="text-muted-foreground">
            Suas publicações aparecerão aqui após criar um post
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <ScrollArea className="h-[600px]">
      <div className="space-y-4 pr-4">
        {posts.map((post) => {
          const statusConfig = STATUS_CONFIG[post.status] || STATUS_CONFIG.draft;
          const StatusIcon = statusConfig.icon;

          return (
            <Card key={post.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={statusConfig.color as any} className="gap-1">
                        <StatusIcon className="w-3 h-3" />
                        {statusConfig.label}
                      </Badge>
                      {post.scheduled_at && post.status === "scheduled" && (
                        <span className="text-sm text-muted-foreground">
                          Agendado para {format(new Date(post.scheduled_at), "PPp", { locale: ptBR })}
                        </span>
                      )}
                    </div>
                    <CardDescription>
                      Criado em {format(new Date(post.created_at), "PPp", { locale: ptBR })}
                    </CardDescription>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remover publicação?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta ação não pode ser desfeita. O post será removido permanentemente.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(post.id)}>
                          Remover
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Content Preview */}
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm whitespace-pre-wrap line-clamp-3">
                    {post.content}
                  </p>
                </div>

                {/* Media Preview */}
                {post.media_urls && post.media_urls.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {post.media_urls.map((url, index) => (
                      <div key={index} className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border">
                        <img
                          src={url}
                          alt={`Media ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "/placeholder.svg";
                          }}
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Platform Status */}
                <div className="space-y-2">
                  <p className="text-sm font-medium">Status por plataforma:</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {post.platforms.map((platformId) => {
                      const log = post.post_platform_logs?.find(l => l.platform === platformId);
                      const PlatformIcon = PLATFORM_ICONS[platformId] || Clock;
                      const platformStatus = log?.status || "pending";
                      const platformConfig = PLATFORM_STATUS_CONFIG[platformStatus];

                      return (
                        <div
                          key={platformId}
                          className="flex items-center justify-between p-2 bg-muted/30 rounded-lg"
                        >
                          <div className="flex items-center gap-2">
                            <PlatformIcon className="w-4 h-4" />
                            <span className="text-sm capitalize">{platformId}</span>
                          </div>
                          <Badge variant={platformConfig.color as any} className="text-xs">
                            {platformConfig.label}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Error Messages */}
                {post.post_platform_logs?.some(l => l.error_message) && (
                  <div className="p-3 bg-destructive/10 rounded-lg">
                    <p className="text-sm font-medium text-destructive mb-1">Erros:</p>
                    {post.post_platform_logs
                      .filter(l => l.error_message)
                      .map(log => (
                        <p key={log.id} className="text-sm text-destructive">
                          <span className="capitalize">{log.platform}:</span> {log.error_message}
                        </p>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </ScrollArea>
  );
};

export default PostHistoryTab;
