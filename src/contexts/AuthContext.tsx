import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

export interface Profile {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  current_plan: "free" | "basic" | "pro" | "agency";
  onboarding_completed: boolean;
  is_online: boolean;
  is_suspended: boolean;
  created_at: string | null;
  updated_at: string | null;
  last_seen_at: string | null;
}

type VendorType = "vendor" | "vendor_instagram" | "vendor_tiktok" | "vendor_model";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isAdmin: boolean;
  isVendor: boolean;
  isIndicador: boolean;
  vendorRoles: VendorType[];
  isLoading: boolean;
  signUp: (email: string, password: string, fullName: string, phone: string, referralCode?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isVendor, setIsVendor] = useState(false);
  const [isIndicador, setIsIndicador] = useState(false);
  const [vendorRoles, setVendorRoles] = useState<VendorType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (profileError) {
        console.error("Error fetching profile:", profileError);
        return;
      }

      if (profileData) {
        setProfile(profileData as Profile);

        // Update online status
        await supabase
          .from("profiles")
          .update({ is_online: true, last_seen_at: new Date().toISOString() })
          .eq("user_id", userId);
      }

      // Check if user is admin and vendor roles
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);

      const roles = roleData?.map(r => r.role) || [];
      setIsAdmin(roles.includes("admin"));
      setIsIndicador(roles.includes("indicador"));
      
      // Check for any vendor role
      const vendorTypeRoles = roles.filter(r => 
        r === "vendor" || r === "vendor_instagram" || r === "vendor_tiktok" || r === "vendor_model"
      ) as VendorType[];
      setVendorRoles(vendorTypeRoles);
      setIsVendor(vendorTypeRoles.length > 0);
    } catch (error) {
      console.error("Error in fetchProfile:", error);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Use setTimeout to avoid deadlock
          setTimeout(() => {
            fetchProfile(session.user.id);
          }, 0);
        } else {
          setProfile(null);
          setIsAdmin(false);
          setIsVendor(false);
          setIsIndicador(false);
          setVendorRoles([]);
        }

        if (event === "SIGNED_OUT") {
          setProfile(null);
          setIsAdmin(false);
          setIsVendor(false);
          setIsIndicador(false);
          setVendorRoles([]);
        }

        setIsLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Update offline status on unmount
  useEffect(() => {
    const handleBeforeUnload = async () => {
      if (user) {
        await supabase
          .from("profiles")
          .update({ is_online: false, last_seen_at: new Date().toISOString() })
          .eq("user_id", user.id);
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [user]);

  const signUp = async (email: string, password: string, fullName: string, phone: string, referralCode?: string) => {
    const redirectUrl = `${window.location.origin}/dashboard`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
          phone: phone,
        },
      },
    });

    // If signup was successful and we have a referral code, create the referral record
    if (!error && data?.user && referralCode) {
      try {
        // Find the referrer by their referral code (first 8 chars of user_id)
        const { data: referrerProfiles } = await supabase
          .from("profiles")
          .select("user_id")
          .ilike("user_id", `${referralCode}%`);

        if (referrerProfiles && referrerProfiles.length > 0) {
          const referrerId = referrerProfiles[0].user_id;
          
          // Prevent self-referral
          if (referrerId !== data.user.id) {
            // Create referral record
            await supabase.from("referrals").insert({
              referrer_id: referrerId,
              referred_id: data.user.id,
              referral_code: referralCode,
              status: "pending",
            });
          }
        }
      } catch (refError) {
        console.error("Error creating referral:", refError);
        // Don't fail signup if referral creation fails
      }
    }

    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return { error };
  };

  const signOut = async () => {
    if (user) {
      await supabase
        .from("profiles")
        .update({ is_online: false })
        .eq("user_id", user.id);
    }
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        isAdmin,
        isVendor,
        isIndicador,
        vendorRoles,
        isLoading,
        signUp,
        signIn,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
