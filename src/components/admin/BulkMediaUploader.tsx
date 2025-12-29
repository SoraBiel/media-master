import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, X, CheckCircle2, AlertCircle, Loader2, Pause, Play, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";

interface UploadedFile {
  name: string;
  url: string;
  type: string;
  size: number;
}

interface BulkMediaUploaderProps {
  onFilesUploaded: (files: UploadedFile[]) => void;
  onFilesSelected: (count: number) => void;
  bucket?: string;
  concurrency?: number;
}

interface UploadProgress {
  total: number;
  completed: number;
  failed: number;
  currentBatch: number;
}

export const BulkMediaUploader = ({
  onFilesUploaded,
  onFilesSelected,
  bucket = "media-packs",
  concurrency = 10, // Upload 10 files at a time for speed
}: BulkMediaUploaderProps) => {
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState<UploadProgress>({
    total: 0,
    completed: 0,
    failed: 0,
    currentBatch: 0,
  });
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const pauseRef = useRef(false);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length > 0) {
      setFiles(selectedFiles);
      onFilesSelected(selectedFiles.length);
      setProgress({ total: selectedFiles.length, completed: 0, failed: 0, currentBatch: 0 });
      setUploadedFiles([]);
      setErrors([]);
    }
  }, [onFilesSelected]);

  const uploadSingleFile = async (file: File): Promise<UploadedFile | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `media/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
    
    try {
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(fileName);
      
      return {
        name: file.name,
        url: urlData.publicUrl,
        type: file.type,
        size: file.size,
      };
    } catch (error: any) {
      console.error(`Failed to upload ${file.name}:`, error);
      return null;
    }
  };

  const uploadBatch = async (batch: File[]): Promise<UploadedFile[]> => {
    const results = await Promise.all(
      batch.map(file => uploadSingleFile(file))
    );
    return results.filter((r): r is UploadedFile => r !== null);
  };

  const startUpload = async () => {
    if (files.length === 0) return;

    setIsUploading(true);
    setIsPaused(false);
    pauseRef.current = false;
    abortControllerRef.current = new AbortController();

    const allUploaded: UploadedFile[] = [];
    const allErrors: string[] = [];
    let completed = 0;
    let failed = 0;

    // Process in batches for speed
    for (let i = 0; i < files.length; i += concurrency) {
      // Check for pause
      while (pauseRef.current) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      const batch = files.slice(i, i + concurrency);
      const batchNumber = Math.floor(i / concurrency) + 1;
      
      setProgress(prev => ({
        ...prev,
        currentBatch: batchNumber,
      }));

      const results = await uploadBatch(batch);
      
      completed += results.length;
      failed += batch.length - results.length;
      
      if (results.length < batch.length) {
        const failedCount = batch.length - results.length;
        allErrors.push(`Batch ${batchNumber}: ${failedCount} arquivo(s) falharam`);
      }

      allUploaded.push(...results);
      
      setProgress({
        total: files.length,
        completed,
        failed,
        currentBatch: batchNumber,
      });
      setUploadedFiles([...allUploaded]);
      setErrors([...allErrors]);
    }

    setIsUploading(false);
    onFilesUploaded(allUploaded);
  };

  const togglePause = () => {
    pauseRef.current = !pauseRef.current;
    setIsPaused(!isPaused);
  };

  const cancelUpload = () => {
    abortControllerRef.current?.abort();
    setIsUploading(false);
    setIsPaused(false);
    pauseRef.current = false;
  };

  const clearFiles = () => {
    setFiles([]);
    setUploadedFiles([]);
    setErrors([]);
    setProgress({ total: 0, completed: 0, failed: 0, currentBatch: 0 });
    onFilesSelected(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (folderInputRef.current) folderInputRef.current.value = "";
  };

  const progressPercent = progress.total > 0 
    ? Math.round((progress.completed / progress.total) * 100) 
    : 0;

  const remainingFiles = progress.total - progress.completed - progress.failed;

  return (
    <div className="space-y-4">
      {/* File Selection */}
      <div className="flex gap-2">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        <input
          ref={folderInputRef}
          type="file"
          // @ts-ignore - webkitdirectory is not in the standard type definitions
          webkitdirectory=""
          directory=""
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="flex-1"
        >
          <Upload className="w-4 h-4 mr-2" />
          Selecionar Arquivos
        </Button>
        
        <Button
          type="button"
          variant="outline"
          onClick={() => folderInputRef.current?.click()}
          disabled={isUploading}
          className="flex-1"
        >
          <FolderOpen className="w-4 h-4 mr-2" />
          Selecionar Pasta
        </Button>
      </div>

      {/* File Count */}
      {files.length > 0 && !isUploading && (
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <span className="text-sm">
            <strong>{files.length.toLocaleString()}</strong> arquivos selecionados
          </span>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={clearFiles}>
              <X className="w-4 h-4 mr-1" />
              Limpar
            </Button>
            <Button size="sm" onClick={startUpload}>
              <Upload className="w-4 h-4 mr-1" />
              Iniciar Upload
            </Button>
          </div>
        </div>
      )}

      {/* Upload Progress */}
      <AnimatePresence>
        {isUploading && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3 p-4 bg-card border border-border rounded-xl"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isPaused ? (
                  <Pause className="w-5 h-5 text-amber-500" />
                ) : (
                  <Loader2 className="w-5 h-5 text-primary animate-spin" />
                )}
                <span className="font-medium">
                  {isPaused ? "Pausado" : "Enviando..."}
                </span>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={togglePause}>
                  {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                </Button>
                <Button size="sm" variant="destructive" onClick={cancelUpload}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <Progress value={progressPercent} className="h-3" />

            <div className="grid grid-cols-3 gap-4 text-center text-sm">
              <div className="p-2 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-green-500">
                  {progress.completed.toLocaleString()}
                </div>
                <div className="text-muted-foreground text-xs">Enviados</div>
              </div>
              <div className="p-2 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-amber-500">
                  {remainingFiles.toLocaleString()}
                </div>
                <div className="text-muted-foreground text-xs">Restantes</div>
              </div>
              <div className="p-2 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-red-500">
                  {progress.failed.toLocaleString()}
                </div>
                <div className="text-muted-foreground text-xs">Falhas</div>
              </div>
            </div>

            <div className="text-xs text-muted-foreground text-center">
              {progressPercent}% completo • Lote {progress.currentBatch} de {Math.ceil(progress.total / concurrency)}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Completion Status */}
      {!isUploading && uploadedFiles.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl"
        >
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            <span className="font-medium text-green-500">Upload Concluído!</span>
          </div>
          <p className="text-sm text-muted-foreground">
            {uploadedFiles.length.toLocaleString()} arquivos enviados com sucesso
            {progress.failed > 0 && (
              <span className="text-red-500"> • {progress.failed} falhas</span>
            )}
          </p>
        </motion.div>
      )}

      {/* Errors */}
      {errors.length > 0 && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <span className="text-sm font-medium text-red-500">Alguns arquivos falharam</span>
          </div>
          <div className="text-xs text-muted-foreground max-h-20 overflow-y-auto">
            {errors.slice(0, 5).map((err, i) => (
              <div key={i}>{err}</div>
            ))}
            {errors.length > 5 && <div>...e mais {errors.length - 5} erros</div>}
          </div>
        </div>
      )}
    </div>
  );
};

export default BulkMediaUploader;
