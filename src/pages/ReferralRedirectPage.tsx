import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

const REFERRAL_COOKIE_KEY = "nexo_referral_code";
const COOKIE_DURATION_DAYS = 30;

const ReferralRedirectPage = () => {
  const { code } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (code) {
      // Store referral code
      localStorage.setItem(REFERRAL_COOKIE_KEY, code.toUpperCase());
      localStorage.setItem(
        `${REFERRAL_COOKIE_KEY}_expires`,
        String(Date.now() + COOKIE_DURATION_DAYS * 24 * 60 * 60 * 1000)
      );
    }
    
    // Redirect to signup
    navigate("/signup", { replace: true });
  }, [code, navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Redirecionando...</p>
      </div>
    </div>
  );
};

export default ReferralRedirectPage;