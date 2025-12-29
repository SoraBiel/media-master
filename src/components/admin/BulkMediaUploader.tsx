import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, X, CheckCircle2, AlertCircle, Loader2, Pause, Play, FolderOpen, Clock } from "lucide-react";
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

interface UploadStats {
  startTime: number;
  bytesUploaded: number;
  filesPerSecond: number;
  estimatedSecondsRemaining: number;
}

export const BulkMediaUploader = ({
  onFilesUploaded,
  onFilesSelected,
  bucket = "media-packs",
  concurrency = 15,
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
  const [stats, setStats] = useState<UploadStats>({
    startTime: 0,
    bytesUploaded: 0,
    filesPerSecond: 0,
    estimatedSecondsRemaining: 0,
  });
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [totalSize, setTotalSize] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const pauseRef = useRef(false);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) {
      const mins = Math.floor(seconds / 60);
      const secs = Math.round(seconds % 60);
      return `${mins}m ${secs}s`;
    }
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${mins}m`;
  };

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length > 0) {
      setFiles(selectedFiles);
      onFilesSelected(selectedFiles.length);
      const total = selectedFiles.reduce((acc, f) => acc + f.size, 0);
      setTotalSize(total);
      setProgress({ total: selectedFiles.length, completed: 0, failed: 0, currentBatch: 0 });
      setUploadedFiles([]);
      setErrors([]);
      setStats({ startTime: 0, bytesUploaded: 0, filesPerSecond: 0, estimatedSecondsRemaining: 0 });
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

  const uploadBatch = async (batch: File[]): Promise<{ uploaded: UploadedFile[]; bytesUploaded: number }> => {
    const results = await Promise.all(
      batch.map(file => uploadSingleFile(file))
    );
    const uploaded = results.filter((r): r is UploadedFile => r !== null);
    const bytesUploaded = uploaded.reduce((acc, f) => acc + f.size, 0);
    return { uploaded, bytesUploaded };
  };

  const startUpload = async () => {
    if (files.length === 0) return;

    setIsUploading(true);
    setIsPaused(false);
    pauseRef.current = false;

    const startTime = Date.now();
    setStats(prev => ({ ...prev, startTime }));

    const allUploaded: UploadedFile[] = [];
    const allErrors: string[] = [];
    let completed = 0;
    let failed = 0;
    let totalBytesUploaded = 0;

    for (let i = 0; i < files.length; i += concurrency) {
      while (pauseRef.current) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      const batch = files.slice(i, i + concurrency);
      const batchNumber = Math.floor(i / concurrency) + 1;
      
      setProgress(prev => ({ ...prev, currentBatch: batchNumber }));

      const { uploaded, bytesUploaded } = await uploadBatch(batch);
      
      completed += uploaded.length;
      failed += batch.length - uploaded.length;
      totalBytesUploaded += bytesUploaded;
      
      if (uploaded.length < batch.length) {
        const failedCount = batch.length - uploaded.length;
        allErrors.push(`Lote ${batchNumber}: ${failedCount} arquivo(s) falharam`);
      }

      allUploaded.push(...uploaded);
      
      // Calculate speed and ETA
      const elapsedSeconds = (Date.now() - startTime) / 1000;
      const filesPerSecond = completed / elapsedSeconds;
      const remainingFiles = files.length - completed - failed;
      const estimatedSecondsRemaining = filesPerSecond > 0 ? remainingFiles / filesPerSecond : 0;

      setProgress({
        total: files.length,
        completed,
        failed,
        currentBatch: batchNumber,
      });
      
      setStats({
        startTime,
        bytesUploaded: totalBytesUploaded,
        filesPerSecond,
        estimatedSecondsRemaining,
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
    setIsUploading(false);
    setIsPaused(false);
    pauseRef.current = false;
  };

  const clearFiles = () => {
    setFiles([]);
    setUploadedFiles([]);
    setErrors([]);
    setTotalSize(0);
    setProgress({ total: 0, completed: 0, failed: 0, currentBatch: 0 });
    setStats({ startTime: 0, bytesUploaded: 0, filesPerSecond: 0, estimatedSecondsRemaining: 0 });
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
          accept="image/*,video/*,audio/*,application/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        <input
          ref={folderInputRef}
          type="file"
          // @ts-ignore
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

      {/* File Count & Size */}
      {files.length > 0 && !isUploading && (
        <div className="flex flex-col gap-2 p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium">
                {files.length.toLocaleString()} arquivos
              </span>
              <span className="text-sm text-muted-foreground ml-2">
                ({formatBytes(totalSize)})
              </span>
            </div>
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
          <p className="text-xs text-muted-foreground">
            Sem limite de tamanho por arquivo. Uploads paralelos para máxima velocidade.
          </p>
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

            {/* Speed & ETA */}
            <div className="flex items-center justify-between p-2 bg-primary/5 rounded-lg text-sm">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                <span>Tempo restante:</span>
                <span className="font-bold text-primary">
                  {stats.estimatedSecondsRemaining > 0 
                    ? formatTime(stats.estimatedSecondsRemaining) 
                    : "Calculando..."}
                </span>
              </div>
              <div className="text-muted-foreground">
                {stats.filesPerSecond > 0 
                  ? `${stats.filesPerSecond.toFixed(1)} arquivos/s` 
                  : "—"}
                {" • "}
                {formatBytes(stats.bytesUploaded)} enviados
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
            {uploadedFiles.length.toLocaleString()} arquivos enviados ({formatBytes(stats.bytesUploaded)})
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
