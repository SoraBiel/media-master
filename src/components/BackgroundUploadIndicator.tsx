import { useBackgroundUpload } from "@/contexts/BackgroundUploadContext";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Upload, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  ChevronDown, 
  ChevronUp,
  Trash2,
  Loader2,
  Zap,
  Minimize2,
  Maximize2
} from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export const BackgroundUploadIndicator = () => {
  const { uploads, cancelUpload, clearCompletedUploads, isUploading } = useBackgroundUpload();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  // Only show if there are uploads
  if (uploads.length === 0) return null;

  const activeUploads = uploads.filter(u => u.status === 'uploading' || u.status === 'compressing');
  const completedUploads = uploads.filter(u => u.status === 'completed' || u.status === 'error');

  const getElapsedTime = (startTime: number) => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const mins = Math.floor(elapsed / 60);
    const secs = elapsed % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
  };

  const currentProgress = activeUploads.length > 0 
    ? (activeUploads[0].completedFiles / activeUploads[0].totalFiles) * 100 
    : 100;

  // Minimized compact view - just a small pill with progress
  if (isMinimized) {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="fixed bottom-4 right-4 z-50"
      >
        <div 
          className="glass-card shadow-2xl border border-border/50 rounded-full px-3 py-2 flex items-center gap-2 cursor-pointer hover:scale-105 transition-transform"
          onClick={() => setIsMinimized(false)}
        >
          {isUploading ? (
            <>
              {activeUploads[0]?.status === 'compressing' ? (
                <Loader2 className="w-4 h-4 text-primary animate-spin" />
              ) : (
                <Upload className="w-4 h-4 text-primary animate-pulse" />
              )}
              <div className="w-16 h-1.5 bg-secondary rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${currentProgress}%` }}
                />
              </div>
              <span className="text-xs font-medium">
                {activeUploads[0]?.completedFiles || 0}/{activeUploads[0]?.totalFiles || 0}
              </span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4 text-success" />
              <span className="text-xs font-medium">{completedUploads.length} concluído(s)</span>
            </>
          )}
          <Maximize2 className="w-3 h-3 text-muted-foreground ml-1" />
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      className="fixed bottom-4 right-4 z-50 w-80 max-w-[calc(100vw-2rem)]"
    >
      <div className="glass-card shadow-2xl border border-border/50 overflow-hidden">
        {/* Header */}
        <div 
          className="p-3 flex items-center justify-between cursor-pointer hover:bg-secondary/30 transition-colors"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-2">
            {isUploading ? (
              <div className="relative">
                {activeUploads[0]?.status === 'compressing' ? (
                  <Loader2 className="w-5 h-5 text-primary animate-spin" />
                ) : (
                  <Upload className="w-5 h-5 text-primary animate-pulse" />
                )}
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-success rounded-full animate-ping" />
              </div>
            ) : (
              <CheckCircle2 className="w-5 h-5 text-success" />
            )}
            <div>
              <p className="text-sm font-medium">
                {activeUploads[0]?.status === 'compressing'
                  ? "Comprimindo imagens..."
                  : isUploading 
                    ? `Enviando ${activeUploads.reduce((acc, u) => acc + u.totalFiles, 0).toLocaleString()} arquivos`
                    : "Uploads concluídos"
                }
              </p>
              {isUploading && activeUploads.length > 0 && activeUploads[0].status !== 'compressing' && (
                <p className="text-xs text-muted-foreground">
                  {activeUploads[0].completedFiles.toLocaleString()} / {activeUploads[0].totalFiles.toLocaleString()} • {getElapsedTime(activeUploads[0].startTime)}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            {/* Minimize button */}
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={(e) => {
                e.stopPropagation();
                setIsMinimized(true);
              }}
              title="Minimizar"
            >
              <Minimize2 className="w-3 h-3" />
            </Button>
            {!isUploading && completedUploads.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={(e) => {
                  e.stopPropagation();
                  clearCompletedUploads();
                }}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            )}
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
        </div>

        {/* Progress bar for active upload */}
        {isUploading && activeUploads.length > 0 && (
          <div className="px-3 pb-2">
            <Progress 
              value={currentProgress} 
              className="h-1.5"
            />
          </div>
        )}

        {/* Expanded view */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-border/50"
            >
              <div className="p-3 space-y-2 max-h-60 overflow-y-auto">
                {uploads.map((upload) => (
                  <div 
                    key={upload.id}
                    className="p-2 rounded-lg bg-secondary/30 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {upload.status === 'compressing' && (
                          <Loader2 className="w-4 h-4 text-primary flex-shrink-0 animate-spin" />
                        )}
                        {upload.status === 'uploading' && (
                          <Upload className="w-4 h-4 text-primary flex-shrink-0 animate-pulse" />
                        )}
                        {upload.status === 'completed' && (
                          <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />
                        )}
                        {upload.status === 'error' && (
                          <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
                        )}
                        {upload.status === 'cancelled' && (
                          <X className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        )}
                        <span className="text-sm font-medium truncate">{upload.packName}</span>
                      </div>
                      {upload.status === 'uploading' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 flex-shrink-0"
                          onClick={() => cancelUpload(upload.id)}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                      {upload.status === 'compressing' ? (
                        <span>Comprimindo imagens...</span>
                      ) : (
                        <span>{upload.completedFiles.toLocaleString()} / {upload.totalFiles.toLocaleString()}</span>
                      )}
                      {upload.savedBytes && upload.savedBytes > 0 && (
                        <Badge className="bg-primary/20 text-primary text-[10px] px-1 py-0">
                          <Zap className="w-2 h-2 mr-0.5" />
                          -{formatBytes(upload.savedBytes)}
                        </Badge>
                      )}
                      {upload.failedFiles > 0 && (
                        <Badge variant="destructive" className="text-[10px] px-1 py-0">
                          {upload.failedFiles} falhas
                        </Badge>
                      )}
                      {upload.status === 'completed' && (
                        <Badge className="bg-success/20 text-success text-[10px] px-1 py-0">
                          Concluído
                        </Badge>
                      )}
                    </div>

                    {upload.status === 'uploading' && (
                      <Progress 
                        value={(upload.completedFiles / upload.totalFiles) * 100} 
                        className="h-1"
                      />
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
