import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";

interface Banner {
  id: string;
  title: string | null;
  description: string | null;
  image_url: string;
  link_url: string | null;
  link_text: string | null;
  priority: number;
}

export const DashboardBannerCarousel = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBanners = async () => {
    try {
      const { data, error } = await supabase
        .from("dashboard_banners")
        .select("id, title, description, image_url, link_url, link_text, priority")
        .eq("is_active", true)
        .order("priority", { ascending: false });

      if (error) throw error;
      setBanners(data || []);
    } catch (error) {
      console.error("Error fetching banners:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  // Auto-rotate banners
  useEffect(() => {
    if (banners.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [banners.length]);

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  }, [banners.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  }, [banners.length]);

  if (isLoading || banners.length === 0) {
    return null;
  }

  const currentBanner = banners[currentIndex];

  return (
    <div className="relative w-full rounded-xl overflow-hidden mb-4 md:mb-6 touch-pan-x">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentBanner.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="relative"
        >
          {/* Banner Image - More compact on mobile */}
          <div className="relative aspect-[2.5/1] sm:aspect-[3/1] md:aspect-[4/1] w-full">
            <img
              src={currentBanner.image_url}
              alt={currentBanner.title || "Banner promocional"}
              className="w-full h-full object-cover"
            />
            
            {/* Overlay gradient for text visibility */}
            <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/40 to-transparent sm:from-background/80 sm:via-transparent" />
            
            {/* Content overlay - Better mobile positioning */}
            {(currentBanner.title || currentBanner.description || currentBanner.link_url) && (
              <div className="absolute inset-0 flex flex-col justify-center p-3 sm:p-4 md:p-8 max-w-[70%] sm:max-w-lg">
                {currentBanner.title && (
                  <h3 className="text-sm sm:text-lg md:text-2xl font-bold text-foreground mb-0.5 sm:mb-1 md:mb-2 line-clamp-2">
                    {currentBanner.title}
                  </h3>
                )}
                {currentBanner.description && (
                  <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground mb-1.5 sm:mb-2 md:mb-4 line-clamp-2 hidden xs:block">
                    {currentBanner.description}
                  </p>
                )}
                {currentBanner.link_url && (
                  <a
                    href={currentBanner.link_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex"
                  >
                    <Button size="sm" variant="gradient" className="gap-1 text-xs sm:text-sm h-7 sm:h-8 px-2 sm:px-3">
                      {currentBanner.link_text || "Saiba mais"}
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                  </a>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation arrows - Smaller on mobile */}
      {banners.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-1 sm:left-2 top-1/2 -translate-y-1/2 bg-background/50 hover:bg-background/80 h-6 w-6 sm:h-8 sm:w-8 rounded-full"
            onClick={goToPrevious}
          >
            <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 bg-background/50 hover:bg-background/80 h-6 w-6 sm:h-8 sm:w-8 rounded-full"
            onClick={goToNext}
          >
            <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
          </Button>

          {/* Dots indicator - Closer to bottom on mobile */}
          <div className="absolute bottom-2 sm:bottom-3 left-1/2 -translate-x-1/2 flex gap-1 sm:gap-1.5">
            {banners.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`h-1.5 sm:h-2 rounded-full transition-all ${
                  index === currentIndex 
                    ? "bg-primary w-3 sm:w-4" 
                    : "bg-foreground/30 hover:bg-foreground/50 w-1.5 sm:w-2"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};
