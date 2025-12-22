import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Users, Heart, CheckCircle2, ShoppingCart, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface TikTokAccount {
  id: string;
  username: string;
  followers: number;
  likes: number;
  description: string;
  niche: string;
  price_cents: number;
  is_verified: boolean;
  is_sold: boolean;
  image_url: string | null;
}

const TikTokAccountsPage = () => {
  const [accounts, setAccounts] = useState<TikTokAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNiche, setSelectedNiche] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    fetchAccounts();

    // Subscribe to realtime updates
    const channel = supabase
      .channel("tiktok-accounts")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tiktok_accounts",
        },
        () => {
          fetchAccounts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchAccounts = async () => {
    try {
      const { data, error } = await supabase
        .from("tiktok_accounts")
        .select("*")
        .eq("is_sold", false)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAccounts(data || []);
    } catch (error) {
      console.error("Error fetching accounts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBuy = (account: TikTokAccount) => {
    navigate(`/checkout?type=tiktok_account&id=${account.id}`);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M";
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    }
    return num.toString();
  };

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(cents / 100);
  };

  const niches = [...new Set(accounts.map((a) => a.niche).filter(Boolean))];

  const filteredAccounts = accounts.filter((account) => {
    const matchesSearch =
      account.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      account.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesNiche = !selectedNiche || account.niche === selectedNiche;
    return matchesSearch && matchesNiche;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Contas TikTok</h1>
          <p className="text-muted-foreground">
            Contas verificadas e prontas para uso
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar contas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={selectedNiche === null ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedNiche(null)}
            >
              Todos
            </Button>
            {niches.map((niche) => (
              <Button
                key={niche}
                variant={selectedNiche === niche ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedNiche(niche)}
              >
                {niche}
              </Button>
            ))}
          </div>
        </div>

        {/* Accounts Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="glass-card p-6 animate-pulse">
                <div className="w-20 h-20 bg-muted rounded-full mx-auto mb-4" />
                <div className="h-6 bg-muted rounded w-3/4 mx-auto mb-2" />
                <div className="h-4 bg-muted rounded w-1/2 mx-auto" />
              </div>
            ))}
          </div>
        ) : filteredAccounts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Nenhuma conta disponível no momento</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAccounts.map((account, index) => (
              <motion.div
                key={account.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="glass-card p-6 hover:border-telegram/50 transition-all group"
              >
                {/* Profile */}
                <div className="text-center mb-4">
                  <div className="w-20 h-20 mx-auto mb-3 rounded-full bg-gradient-to-br from-pink-500 via-red-500 to-yellow-500 p-0.5">
                    <div className="w-full h-full rounded-full bg-card flex items-center justify-center">
                      {account.image_url ? (
                        <img
                          src={account.image_url}
                          alt={account.username}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-2xl font-bold">
                          {account.username.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <h3 className="font-semibold text-lg">@{account.username}</h3>
                    {account.is_verified && (
                      <CheckCircle2 className="w-4 h-4 text-telegram" />
                    )}
                  </div>
                  {account.niche && (
                    <Badge variant="secondary" className="mt-2">
                      {account.niche}
                    </Badge>
                  )}
                </div>

                {/* Stats */}
                <div className="flex justify-center gap-6 mb-4">
                  <div className="text-center">
                    <div className="flex items-center gap-1 text-lg font-semibold">
                      <Users className="w-4 h-4" />
                      {formatNumber(account.followers)}
                    </div>
                    <p className="text-xs text-muted-foreground">Seguidores</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center gap-1 text-lg font-semibold">
                      <Heart className="w-4 h-4" />
                      {formatNumber(account.likes)}
                    </div>
                    <p className="text-xs text-muted-foreground">Curtidas</p>
                  </div>
                </div>

                {/* Description */}
                {account.description && (
                  <p className="text-sm text-muted-foreground text-center mb-4 line-clamp-2">
                    {account.description}
                  </p>
                )}

                {/* Price & Action */}
                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <div className="text-2xl font-bold gradient-text">
                    {formatPrice(account.price_cents)}
                  </div>
                  <Button
                    onClick={() => handleBuy(account)}
                    className="telegram-gradient text-white gap-2"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    Comprar
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default TikTokAccountsPage;
