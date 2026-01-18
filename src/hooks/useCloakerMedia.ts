import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface CloakerMedia {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  media_type: 'image' | 'video';
  safe_url: string | null;
  safe_file_path: string | null;
  offer_url: string | null;
  offer_file_path: string | null;
  destination_url: string | null;
  is_active: boolean;
  block_bots: boolean;
  block_vpn: boolean;
  allowed_countries: string[] | null;
  total_views: number;
  created_at: string;
  updated_at: string;
}

export interface CloakerMediaView {
  id: string;
  media_id: string;
  ip_address: string | null;
  user_agent: string | null;
  country: string | null;
  city: string | null;
  device_type: string | null;
  browser: string | null;
  os: string | null;
  is_bot: boolean;
  is_vpn: boolean;
  was_blocked: boolean;
  served_type: 'safe' | 'offer';
  referrer: string | null;
  viewed_at: string;
}

export interface CloakerMediaStats {
  totalViews: number;
  blockedViews: number;
  allowedViews: number;
  safeServed: number;
  offerServed: number;
  byCountry: Record<string, number>;
  byDevice: Record<string, number>;
  byBrowser: Record<string, number>;
}

export function useCloakerMedia() {
  const { user } = useAuth();
  const [mediaList, setMediaList] = useState<CloakerMedia[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMedia = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('cloaker_media')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMediaList((data || []) as CloakerMedia[]);
    } catch (error) {
      console.error('Error fetching cloaker media:', error);
      toast.error('Erro ao carregar mídias cloakadas');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, [user]);

  const generateSlug = () => {
    return Math.random().toString(36).substring(2, 10);
  };

  const uploadFile = async (file: File, type: 'safe' | 'offer'): Promise<string | null> => {
    if (!user) return null;

    const fileExt = file.name.split('.').pop();
    const filePath = `${user.id}/${type}/${Date.now()}.${fileExt}`;

    const { error } = await supabase.storage
      .from('cloaker-media')
      .upload(filePath, file);

    if (error) {
      console.error('Upload error:', error);
      toast.error('Erro ao fazer upload do arquivo');
      return null;
    }

    return filePath;
  };

  const getPublicUrl = (filePath: string): string => {
    const { data } = supabase.storage
      .from('cloaker-media')
      .getPublicUrl(filePath);
    return data.publicUrl;
  };

  const createMedia = async (mediaData: {
    name: string;
    media_type: 'image' | 'video';
    safe_url?: string;
    safe_file?: File;
    offer_url?: string;
    offer_file?: File;
    destination_url?: string;
    block_bots?: boolean;
    block_vpn?: boolean;
    allowed_countries?: string[];
  }) => {
    if (!user) return null;

    try {
      let safe_file_path = null;
      let offer_file_path = null;

      // Upload files if provided
      if (mediaData.safe_file) {
        safe_file_path = await uploadFile(mediaData.safe_file, 'safe');
      }
      if (mediaData.offer_file) {
        offer_file_path = await uploadFile(mediaData.offer_file, 'offer');
      }

      const { data, error } = await supabase
        .from('cloaker_media')
        .insert({
          user_id: user.id,
          name: mediaData.name,
          slug: generateSlug(),
          media_type: mediaData.media_type,
          safe_url: mediaData.safe_url || null,
          safe_file_path,
          offer_url: mediaData.offer_url || null,
          offer_file_path,
          destination_url: mediaData.destination_url || null,
          block_bots: mediaData.block_bots ?? true,
          block_vpn: mediaData.block_vpn ?? false,
          allowed_countries: mediaData.allowed_countries || null,
        })
        .select()
        .single();

      if (error) throw error;
      
      toast.success('Mídia cloakada criada com sucesso!');
      await fetchMedia();
      return data as CloakerMedia;
    } catch (error: any) {
      console.error('Error creating cloaker media:', error);
      toast.error(error.message || 'Erro ao criar mídia cloakada');
      return null;
    }
  };

  const updateMedia = async (id: string, updates: Partial<CloakerMedia> & {
    safe_file?: File;
    offer_file?: File;
  }) => {
    if (!user) return false;

    try {
      let safe_file_path = updates.safe_file_path;
      let offer_file_path = updates.offer_file_path;

      // Upload new files if provided
      if (updates.safe_file) {
        safe_file_path = await uploadFile(updates.safe_file, 'safe');
      }
      if (updates.offer_file) {
        offer_file_path = await uploadFile(updates.offer_file, 'offer');
      }

      const updateData: any = { ...updates };
      delete updateData.safe_file;
      delete updateData.offer_file;
      
      if (safe_file_path !== undefined) {
        updateData.safe_file_path = safe_file_path;
      }
      if (offer_file_path !== undefined) {
        updateData.offer_file_path = offer_file_path;
      }

      const { error } = await supabase
        .from('cloaker_media')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('Mídia atualizada com sucesso!');
      await fetchMedia();
      return true;
    } catch (error) {
      console.error('Error updating cloaker media:', error);
      toast.error('Erro ao atualizar mídia');
      return false;
    }
  };

  const deleteMedia = async (id: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('cloaker_media')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('Mídia excluída com sucesso!');
      await fetchMedia();
      return true;
    } catch (error) {
      console.error('Error deleting cloaker media:', error);
      toast.error('Erro ao excluir mídia');
      return false;
    }
  };

  return {
    mediaList,
    isLoading,
    createMedia,
    updateMedia,
    deleteMedia,
    refetch: fetchMedia,
    getPublicUrl,
  };
}

export function useCloakerMediaViews(mediaId: string | null) {
  const [views, setViews] = useState<CloakerMediaView[]>([]);
  const [stats, setStats] = useState<CloakerMediaStats>({
    totalViews: 0,
    blockedViews: 0,
    allowedViews: 0,
    safeServed: 0,
    offerServed: 0,
    byCountry: {},
    byDevice: {},
    byBrowser: {},
  });
  const [isLoading, setIsLoading] = useState(false);

  const fetchViews = async () => {
    if (!mediaId) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('cloaker_media_views')
        .select('*')
        .eq('media_id', mediaId)
        .order('viewed_at', { ascending: false })
        .limit(500);

      if (error) throw error;

      const viewsData = (data || []) as CloakerMediaView[];
      setViews(viewsData);

      // Calculate stats
      const calculatedStats: CloakerMediaStats = {
        totalViews: viewsData.length,
        blockedViews: viewsData.filter(v => v.was_blocked).length,
        allowedViews: viewsData.filter(v => !v.was_blocked).length,
        safeServed: viewsData.filter(v => v.served_type === 'safe').length,
        offerServed: viewsData.filter(v => v.served_type === 'offer').length,
        byCountry: {},
        byDevice: {},
        byBrowser: {},
      };

      viewsData.forEach(view => {
        if (view.country) {
          calculatedStats.byCountry[view.country] = (calculatedStats.byCountry[view.country] || 0) + 1;
        }
        if (view.device_type) {
          calculatedStats.byDevice[view.device_type] = (calculatedStats.byDevice[view.device_type] || 0) + 1;
        }
        if (view.browser) {
          calculatedStats.byBrowser[view.browser] = (calculatedStats.byBrowser[view.browser] || 0) + 1;
        }
      });

      setStats(calculatedStats);
    } catch (error) {
      console.error('Error fetching media views:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchViews();
  }, [mediaId]);

  return { views, stats, isLoading, refetch: fetchViews };
}
