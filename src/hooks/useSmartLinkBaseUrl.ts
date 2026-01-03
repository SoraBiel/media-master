import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Public base URL used to share Smart Links.
 * Reads from admin_text_settings (key: smart_link_base_url).
 */
export const useSmartLinkBaseUrl = () => {
  const [raw, setRaw] = useState<string>("");

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const { data } = await supabase
        .from("admin_text_settings")
        .select("setting_value")
        .eq("setting_key", "smart_link_base_url")
        .maybeSingle();

      if (cancelled) return;
      setRaw(data?.setting_value || "");
    };

    run();

    return () => {
      cancelled = true;
    };
  }, []);

  return useMemo(() => raw.replace(/\/+$/, ""), [raw]);
};
