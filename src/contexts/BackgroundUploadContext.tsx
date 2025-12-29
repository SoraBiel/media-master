import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface UploadingFile {
  name: string;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
}

interface BackgroundUpload {
  id: string;
  packName: string;
  bucket: string;
  totalFiles: number;
  completedFiles: number;
  failedFiles: number;
  status: 'uploading' | 'completed' | 'error' | 'cancelled';
  files: UploadingFile[];
  uploadedUrls: { url: string; name: string; type: string; size: number }[];
  startTime: number;
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

export const BackgroundUploadProvider = ({ children }: { children: ReactNode }) => {
  const [uploads, setUploads] = useState<BackgroundUpload[]>([]);
  const { toast } = useToast();
  const cancelledRef = React.useRef<Set<string>>(new Set());

  const updateUpload = useCallback((id: string, updates: Partial<BackgroundUpload>) => {
    setUploads(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u));
  }, []);

  const startBackgroundUpload = useCallback(async ({
    id,
    packName,
    files,
    bucket,
    concurrency = 25,
    onComplete
  }: {
    id: string;
    packName: string;
    files: File[];
    bucket: string;
    concurrency?: number;
    onComplete?: (files: { url: string; name: string; type: string; size: number }[]) => void;
  }) => {
    // Initialize upload state
    const initialFiles: UploadingFile[] = files.map(f => ({
      name: f.name,
      progress: 0,
      status: 'pending'
    }));

    const newUpload: BackgroundUpload = {
      id,
      packName,
      bucket,
      totalFiles: files.length,
      completedFiles: 0,
      failedFiles: 0,
      status: 'uploading',
      files: initialFiles,
      uploadedUrls: [],
      startTime: Date.now(),
      onComplete
    };

    setUploads(prev => [...prev, newUpload]);

    toast({
      title: "Upload iniciado em background",
      description: `${files.length.toLocaleString()} arquivos sendo enviados. Você pode continuar usando a Nexo.`,
    });

    // Process uploads in batches
    const uploadedFiles: { url: string; name: string; type: string; size: number }[] = [];
    let completedCount = 0;
    let failedCount = 0;

    const uploadFile = async (file: File, index: number): Promise<void> => {
      if (cancelledRef.current.has(id)) return;

      // Update file status to uploading
      setUploads(prev => prev.map(u => {
        if (u.id !== id) return u;
        const newFiles = [...u.files];
        newFiles[index] = { ...newFiles[index], status: 'uploading', progress: 0 };
        return { ...u, files: newFiles };
      }));

      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(7);
      const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filePath = `uploads/${timestamp}_${random}_${safeFileName}`;

      let retries = 0;
      const maxRetries = 3;

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

          // Update progress
          setUploads(prev => prev.map(u => {
            if (u.id !== id) return u;
            const newFiles = [...u.files];
            newFiles[index] = { ...newFiles[index], status: 'completed', progress: 100 };
            return { 
              ...u, 
              files: newFiles, 
              completedFiles: completedCount,
              uploadedUrls: [...uploadedFiles]
            };
          }));

          return;
        } catch (error: any) {
          retries++;
          if (retries >= maxRetries) {
            failedCount++;
            setUploads(prev => prev.map(u => {
              if (u.id !== id) return u;
              const newFiles = [...u.files];
              newFiles[index] = { 
                ...newFiles[index], 
                status: 'error', 
                progress: 0,
                error: error.message 
              };
              return { ...u, files: newFiles, failedFiles: failedCount };
            }));
          } else {
            // Wait with exponential backoff before retry
            await new Promise(r => setTimeout(r, Math.pow(2, retries) * 1000));
          }
        }
      }
    };

    // Process in concurrent batches
    const processInBatches = async () => {
      let index = 0;
      const executing: Promise<void>[] = [];

      for (const file of files) {
        if (cancelledRef.current.has(id)) break;

        const currentIndex = index++;
        const promise = uploadFile(file, currentIndex).then(() => {
          executing.splice(executing.indexOf(promise), 1);
        });
        executing.push(promise);

        if (executing.length >= concurrency) {
          await Promise.race(executing);
        }
      }

      await Promise.all(executing);
    };

    await processInBatches();

    // Finalize upload
    if (cancelledRef.current.has(id)) {
      cancelledRef.current.delete(id);
      return;
    }

    const finalStatus = failedCount === files.length ? 'error' : 'completed';
    updateUpload(id, { 
      status: finalStatus,
      uploadedUrls: uploadedFiles,
      completedFiles: completedCount,
      failedFiles: failedCount
    });

    if (finalStatus === 'completed') {
      toast({
        title: "Upload concluído!",
        description: `${completedCount.toLocaleString()} arquivos enviados com sucesso.`,
      });
      onComplete?.(uploadedFiles);
    } else {
      toast({
        title: "Upload finalizado com erros",
        description: `${completedCount.toLocaleString()} enviados, ${failedCount.toLocaleString()} falharam.`,
        variant: "destructive"
      });
    }
  }, [toast, updateUpload]);

  const cancelUpload = useCallback((id: string) => {
    cancelledRef.current.add(id);
    updateUpload(id, { status: 'cancelled' });
    toast({
      title: "Upload cancelado",
      description: "O upload foi interrompido.",
    });
  }, [updateUpload, toast]);

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
