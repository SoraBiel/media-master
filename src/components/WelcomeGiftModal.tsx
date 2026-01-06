import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Flame, Sparkles, Heart, Gift, Percent } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface Model {
  id: string;
  name: string;
  bio: string | null;
  niche: string | null;
  price_cents: number;
  image_url: string | null;
}

interface WelcomeGiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

const DISCOUNT_PERCENT = 50; // 50% discount for first purchase

export const WelcomeGiftModal = ({ isOpen, onClose, userId }: WelcomeGiftModalProps) => {
  const [model, setModel] = useState<Model | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [direction, setDirection] = useState<'left' | 'right' | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      fetchRandomModel();
    }
  }, [isOpen]);

  const fetchRandomModel = async () => {
    try {
      setIsLoading(true);
      // Fetch all available models
      const { data, error } = await supabase
        .from("models_for_sale")
        .select("id, name, bio, niche, price_cents, image_url")
        .eq("is_sold", false)
        .limit(50);

      if (error) throw error;

      if (data && data.length > 0) {
        // Pick a random model
        const randomIndex = Math.floor(Math.random() * data.length);
        setModel(data[randomIndex]);
      }
    } catch (error) {
      console.error("Error fetching model:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (cents: number) => {
    return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const getDiscountedPrice = (cents: number) => {
    return Math.round(cents * (1 - DISCOUNT_PERCENT / 100));
  };

  const handleAccept = async () => {
    if (!model) return;

    setDirection('right');
    
    // Mark that user has seen the welcome gift
    await supabase
      .from("profiles")
      .update({ onboarding_completed: true })
      .eq("user_id", userId);

    setTimeout(() => {
      // Navigate to checkout with discount via query params
      const discountedPrice = getDiscountedPrice(model.price_cents);
      navigate(`/checkout?type=model&id=${model.id}&discount=${DISCOUNT_PERCENT}&original_price=${model.price_cents}&discounted_price=${discountedPrice}&welcome_gift=true`);
      onClose();
    }, 300);
  };

  const handleReject = async () => {
    setDirection('left');
    
    // Mark that user has seen the welcome gift
    await supabase
      .from("profiles")
      .update({ onboarding_completed: true })
      .eq("user_id", userId);

    setTimeout(() => {
      navigate("/my-purchases");
      onClose();
    }, 300);
  };

  const handleClose = async () => {
    // Mark that user has seen the welcome gift
    await supabase
      .from("profiles")
      .update({ onboarding_completed: true })
      .eq("user_id", userId);

    navigate("/my-purchases");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="relative w-full max-w-md"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute -top-2 -right-2 z-10 p-2 rounded-full bg-background/80 backdrop-blur-sm border border-border hover:bg-background transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Gift badge */}
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="absolute -top-6 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-pink-500 via-purple-500 to-orange-500 text-white text-sm font-bold shadow-lg"
          >
            <Gift className="w-4 h-4" />
            PRESENTE DE BOAS-VINDAS
            <Gift className="w-4 h-4" />
          </motion.div>

          {isLoading ? (
            <div className="bg-card rounded-3xl p-8 text-center">
              <div className="animate-pulse flex flex-col items-center gap-4">
                <div className="w-full h-64 bg-muted rounded-2xl" />
                <div className="w-3/4 h-6 bg-muted rounded" />
                <div className="w-1/2 h-4 bg-muted rounded" />
              </div>
            </div>
          ) : model ? (
            <AnimatePresence mode="wait">
              <motion.div
                key={model.id}
                initial={{ scale: 0.95, opacity: 0, x: direction === 'left' ? -100 : direction === 'right' ? 100 : 0 }}
                animate={{ scale: 1, opacity: 1, x: 0 }}
                exit={{ 
                  scale: 0.95, 
                  opacity: 0, 
                  x: direction === 'left' ? -300 : direction === 'right' ? 300 : 0,
                  rotate: direction === 'left' ? -15 : direction === 'right' ? 15 : 0
                }}
                transition={{ duration: 0.3 }}
                className="relative overflow-hidden rounded-3xl shadow-2xl bg-card"
              >
                {/* Glowing border effect */}
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-pink-500/20 via-purple-500/20 to-orange-500/20 pointer-events-none" />
                
                {/* Image Section */}
                <div className="relative h-72 bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400">
                  {model.image_url ? (
                    <img 
                      src={model.image_url} 
                      alt={model.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-center">
                        <Flame className="w-16 h-16 text-white/80 mx-auto mb-2" />
                        <p className="text-white/60 text-sm">Modelo Premium</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  
                  {/* Top badges */}
                  <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold shadow-lg"
                    >
                      <Flame className="w-3.5 h-3.5" />
                      HOT
                    </motion.div>
                    
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.1 }}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-green-500 text-white text-xs font-bold shadow-lg"
                    >
                      <Percent className="w-3.5 h-3.5" />
                      {DISCOUNT_PERCENT}% OFF
                    </motion.div>
                  </div>

                  {/* Price tag */}
                  <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="absolute bottom-4 right-4 text-right"
                  >
                    <p className="text-white/60 text-xs line-through">{formatPrice(model.price_cents)}</p>
                    <p className="text-2xl font-bold text-white">{formatPrice(getDiscountedPrice(model.price_cents))}</p>
                  </motion.div>

                  {/* Name */}
                  <div className="absolute bottom-4 left-4">
                    <h3 className="text-2xl font-bold text-white">{model.name}</h3>
                    {model.niche && (
                      <p className="text-white/70 text-sm">{model.niche}</p>
                    )}
                  </div>
                </div>

                {/* Info Section */}
                <div className="p-5 space-y-4">
                  {model.bio && (
                    <p className="text-muted-foreground text-sm line-clamp-2">{model.bio}</p>
                  )}

                  <div className="flex items-center gap-2 p-3 rounded-xl bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-orange-500/10 border border-pink-500/20">
                    <Sparkles className="w-5 h-5 text-yellow-400" />
                    <span className="text-sm font-medium">Funil completo incluso + Scripts + Mídias</span>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-3 pt-2">
                    <Button
                      variant="outline"
                      size="lg"
                      className="flex-1 h-14 rounded-full border-2 hover:bg-destructive/10 hover:border-destructive hover:text-destructive transition-all"
                      onClick={handleReject}
                    >
                      <X className="w-6 h-6" />
                    </Button>
                    
                    <Button
                      size="lg"
                      className="flex-1 h-14 rounded-full bg-gradient-to-r from-pink-500 via-red-500 to-orange-500 hover:from-pink-600 hover:via-red-600 hover:to-orange-600 text-white font-bold shadow-lg"
                      onClick={handleAccept}
                    >
                      <Heart className="w-6 h-6 mr-2 fill-current" />
                      QUERO!
                    </Button>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          ) : (
            <div className="bg-card rounded-3xl p-8 text-center">
              <Gift className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Nenhum modelo disponível</h3>
              <p className="text-muted-foreground mb-4">
                Não há modelos disponíveis no momento.
              </p>
              <Button onClick={handleClose}>
                Continuar para Minhas Compras
              </Button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
