import React, { createContext, useContext, useState, useCallback, ReactNode, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { compressImages, getCompressionStats, isCompressibleImage } from "@/utils/imageCompression";

interface BackgroundUpload {
  id: string;
  packName: string;
  bucket: string;
  totalFiles: number;
  completedFiles: number;
  failedFiles: number;
  status: 'uploading' | 'completed' | 'error' | 'cancelled' | 'compressing';
  uploadedUrls: { url: string; name: string; type: string; size: number }[];
  startTime: number;
  savedBytes?: number;
  onComplete?: (files: { url: string; name: string; type: string; size: number }[]) => void;
}

interface BackgroundUploadContextType {
  uploads: BackgroundUpload[];
  startBackgroundUpload: (params: {
    id: string;
    packName: string;
    files: File[];
    bucket: string;
    concurrency?: number;
    compressImages?: boolean;
    autoSaveMediaId?: string;
    existingFiles?: { url: string; name: string; type: string; size: number }[];
    onComplete?: (files: { url: string; name: string; type: string; size: number }[]) => void;
  }) => void;
  cancelUpload: (id: string) => void;
  clearCompletedUploads: () => void;
  isUploading: boolean;
  totalProgress: number;
}

const BackgroundUploadContext = createContext<BackgroundUploadContextType | null>(null);

export const useBackgroundUpload = () => {
  const context = useContext(BackgroundUploadContext);
  if (!context) {
    throw new Error("useBackgroundUpload must be used within BackgroundUploadProvider");
  }
  return context;
};

// Notification sound utility
const playNotificationSound = () => {
  try {
    // Create a simple notification sound using Web Audio API
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.4);
  } catch (error) {
    console.log("Could not play notification sound:", error);
  }
};

export const BackgroundUploadProvider = ({ children }: { children: ReactNode }) => {
  const [uploads, setUploads] = useState<BackgroundUpload[]>([]);
  const { toast } = useToast();
  const cancelledRef = useRef<Set<string>>(new Set());

  const startBackgroundUpload = useCallback(async ({
    id,
    packName,
    files: originalFiles,
    bucket,
    concurrency = 40,
    compressImages: shouldCompress = true,
    autoSaveMediaId,
    existingFiles = [],
    onComplete
  }: {
    id: string;
    packName: string;
    files: File[];
    bucket: string;
    concurrency?: number;
    compressImages?: boolean;
    autoSaveMediaId?: string;
    existingFiles?: { url: string; name: string; type: string; size: number }[];
    onComplete?: (files: { url: string; name: string; type: string; size: number }[]) => void;
  }) => {
    // Initial state with compression status
    const newUpload: BackgroundUpload = {
      id,
      packName,
      bucket,
      totalFiles: originalFiles.length,
      completedFiles: 0,
      failedFiles: 0,
      status: shouldCompress ? 'compressing' : 'uploading',
      uploadedUrls: [],
      startTime: Date.now(),
      onComplete
    };

    setUploads(prev => [...prev, newUpload]);

    // Compress images first if enabled
    let files = originalFiles;
    let savedBytes = 0;

    if (shouldCompress) {
      const imageCount = originalFiles.filter(f => isCompressibleImage(f)).length;
      if (imageCount > 0) {
        toast({
          title: "Comprimindo imagens...",
          description: `${imageCount} imagens serão otimizadas para upload mais rápido.`,
        });

        files = await compressImages(originalFiles, {
          maxWidth: 1920,
          maxHeight: 1920,
          quality: 0.85,
          format: 'webp'
        }, 8);

        const stats = getCompressionStats(originalFiles, files);
        savedBytes = stats.savedBytes;

        if (stats.savedPercent > 0) {
          toast({
            title: "Imagens comprimidas!",
            description: `Economia de ${(stats.savedBytes / 1024 / 1024).toFixed(1)}MB (${stats.savedPercent}%)`,
          });
        }
      }
    }

    // Update status to uploading
    setUploads(prev => prev.map(u => 
      u.id === id ? { ...u, status: 'uploading', savedBytes } : u
    ));

    toast({
      title: "Upload turbo iniciado!",
      description: `${files.length.toLocaleString()} arquivos • ${concurrency}x paralelo`,
    });

    // Ultra-fast upload with minimal overhead
    const uploadedFiles: { url: string; name: string; type: string; size: number }[] = [];
    let completedCount = 0;
    let failedCount = 0;
    let lastUpdateTime = 0;
    const UPDATE_INTERVAL = 100; // Only update UI every 100ms for speed

    const uploadFile = async (file: File): Promise<void> => {
      if (cancelledRef.current.has(id)) return;

      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(7);
      const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filePath = `uploads/${timestamp}_${random}_${safeFileName}`;

      let retries = 0;
      const maxRetries = 2; // Reduced retries for speed

      while (retries < maxRetries) {
        try {
          const { data, error } = await supabase.storage
            .from(bucket)
            .upload(filePath, file, { upsert: true });

          if (error) throw error;

          const { data: urlData } = supabase.storage
            .from(bucket)
            .getPublicUrl(data.path);

          uploadedFiles.push({
            url: urlData.publicUrl,
            name: file.name,
            type: file.type,
            size: file.size
          });

          completedCount++;

          // Throttled UI updates for speed
          const now = Date.now();
          if (now - lastUpdateTime > UPDATE_INTERVAL) {
            lastUpdateTime = now;
            setUploads(prev => prev.map(u => 
              u.id === id ? { ...u, completedFiles: completedCount, failedFiles: failedCount } : u
            ));
          }

          return;
        } catch (error: any) {
          retries++;
          if (retries >= maxRetries) {
            failedCount++;
          } else {
            await new Promise(r => setTimeout(r, 500 * retries)); // Faster retry
          }
        }
      }
    };

    // Process with maximum parallelism
    let index = 0;
    const executing: Promise<void>[] = [];

    for (const file of files) {
      if (cancelledRef.current.has(id)) break;

      const promise = uploadFile(file).then(() => {
        executing.splice(executing.indexOf(promise), 1);
      });
      executing.push(promise);

      if (executing.length >= concurrency) {
        await Promise.race(executing);
      }
    }

    await Promise.all(executing);

    // Final update
    if (cancelledRef.current.has(id)) {
      cancelledRef.current.delete(id);
      return;
    }

    const finalStatus = failedCount === files.length ? 'error' : 'completed';
    setUploads(prev => prev.map(u => 
      u.id === id ? { 
        ...u, 
        status: finalStatus, 
        uploadedUrls: uploadedFiles,
        completedFiles: completedCount,
        failedFiles: failedCount
      } : u
    ));

    if (finalStatus === 'completed') {
      const elapsed = ((Date.now() - newUpload.startTime) / 1000).toFixed(1);
      
      // Play notification sound
      playNotificationSound();
      
      // Auto-save to database if mediaId is provided
      if (autoSaveMediaId) {
        try {
          const allFiles = [...existingFiles, ...uploadedFiles];
          const { error } = await supabase
            .from("admin_media")
            .update({
              media_files: allFiles.map(f => ({ url: f.url, name: f.name, type: f.type, size: f.size })),
              file_count: allFiles.length,
              updated_at: new Date().toISOString(),
            })
            .eq("id", autoSaveMediaId);
          
          if (!error) {
            toast({
              title: "Salvo automaticamente!",
              description: `${allFiles.length.toLocaleString()} arquivos salvos em "${packName}" (${elapsed}s)`,
            });
          } else {
            toast({
              title: "Upload concluído, mas erro ao salvar",
              description: `${completedCount.toLocaleString()} arquivos enviados, mas falha ao salvar no banco.`,
              variant: "destructive"
            });
          }
        } catch (error) {
          console.error("Error auto-saving media:", error);
          toast({
            title: "Erro ao salvar",
            description: "Upload concluído mas houve erro ao salvar automaticamente.",
            variant: "destructive"
          });
        }
      } else {
        toast({
          title: "Upload concluído!",
          description: `${completedCount.toLocaleString()} arquivos em ${elapsed}s`,
        });
      }
      
      onComplete?.(uploadedFiles);
    } else {
      toast({
        title: "Upload finalizado com erros",
        description: `${completedCount.toLocaleString()} enviados, ${failedCount.toLocaleString()} falharam.`,
        variant: "destructive"
      });
    }
  }, [toast]);

  const cancelUpload = useCallback((id: string) => {
    cancelledRef.current.add(id);
    setUploads(prev => prev.map(u => u.id === id ? { ...u, status: 'cancelled' } : u));
    toast({ title: "Upload cancelado" });
  }, [toast]);

  const clearCompletedUploads = useCallback(() => {
    setUploads(prev => prev.filter(u => u.status === 'uploading'));
  }, []);

  const isUploading = uploads.some(u => u.status === 'uploading');
  
  const totalProgress = uploads.length > 0 
    ? Math.round(uploads.reduce((acc, u) => acc + (u.completedFiles / u.totalFiles) * 100, 0) / uploads.length)
    : 0;

  return (
    <BackgroundUploadContext.Provider value={{
      uploads,
      startBackgroundUpload,
      cancelUpload,
      clearCompletedUploads,
      isUploading,
      totalProgress
    }}>
      {children}
    </BackgroundUploadContext.Provider>
  );
};