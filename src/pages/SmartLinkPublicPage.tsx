import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface SmartLinkButtonWithCount {
  id: string;
  title: string;
  url: string | null;
  icon: string | null;
  is_active: boolean;
  funnel_id: string | null;
  funnel_tag: string | null;
  position: number;
  click_count: number;
}

interface SmartLinkPage {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  avatar_url: string | null;
  background_color: string;
  text_color: string;
  button_style: string;
  meta_pixel_id: string | null;
  google_analytics_id: string | null;
  tiktok_pixel_id: string | null;
  page_type: "linkbio" | "redirector";
  redirect_url: string | null;
  total_views?: number;
}


interface SmartLinkPublicPageProps {
  slugOverride?: string;
}

const SmartLinkPublicPage = ({ slugOverride }: SmartLinkPublicPageProps) => {
  const params = useParams<{ slug: string }>();
  const slug = slugOverride ?? params.slug;
  const [page, setPage] = useState<SmartLinkPage | null>(null);
  const [buttons, setButtons] = useState<SmartLinkButtonWithCount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchPage = async () => {
      if (!slug) {
        setNotFound(true);
        setIsLoading(false);
        return;
      }

      try {
        // Fetch page by slug
        const { data: pageData, error: pageError } = await supabase
          .from("smart_link_pages")
          .select("*")
          .eq("slug", slug)
          .eq("is_active", true)
          .maybeSingle();

        if (pageError || !pageData) {
          setNotFound(true);
          setIsLoading(false);
          return;
        }

        const fetchedPage = pageData as SmartLinkPage;

        // Handle redirector type - show splash then redirect
        if (fetchedPage.page_type === "redirector" && fetchedPage.redirect_url) {
          // Record view before redirecting
          await supabase.from("smart_link_views").insert({
            page_id: fetchedPage.id,
            utm_source: new URLSearchParams(window.location.search).get("utm_source"),
            utm_medium: new URLSearchParams(window.location.search).get("utm_medium"),
            utm_campaign: new URLSearchParams(window.location.search).get("utm_campaign"),
            referrer: document.referrer || null,
            user_agent: navigator.userAgent,
          });

          // Update view count
          await supabase
            .from("smart_link_pages")
            .update({ total_views: (fetchedPage.total_views || 0) + 1 })
            .eq("id", fetchedPage.id);

          setPage(fetchedPage);
          setIsLoading(false);

          // Redirect after a brief delay to show splash
          setTimeout(() => {
            window.location.href = fetchedPage.redirect_url!;
          }, fetchedPage.avatar_url ? 1500 : 500);
          return;
        }

        setPage(fetchedPage);

        // Fetch buttons only for linkbio type
        const { data: buttonsData } = await supabase
          .from("smart_link_buttons")
          .select("*")
          .eq("page_id", fetchedPage.id)
          .eq("is_active", true)
          .order("position", { ascending: true });

        setButtons((buttonsData as SmartLinkButtonWithCount[]) || []);

        // Record page view
        const urlParams = new URLSearchParams(window.location.search);
        await supabase.from("smart_link_views").insert({
          page_id: pageData.id,
          utm_source: urlParams.get("utm_source"),
          utm_medium: urlParams.get("utm_medium"),
          utm_campaign: urlParams.get("utm_campaign"),
          utm_content: urlParams.get("utm_content"),
          utm_term: urlParams.get("utm_term"),
          referrer: document.referrer || null,
          user_agent: navigator.userAgent,
        });

        // Update total_views counter
        await supabase
          .from("smart_link_pages")
          .update({ total_views: (pageData.total_views || 0) + 1 })
          .eq("id", pageData.id);

      } catch (error) {
        console.error("Error fetching page:", error);
        setNotFound(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPage();
  }, [slug]);

  // Inject pixels via useEffect (must be declared before early returns)
  useEffect(() => {
    if (!page) return;

    // Set document title
    document.title = page.title;

    // Meta Pixel
    if (page.meta_pixel_id) {
      const script = document.createElement("script");
      script.innerHTML = `
        !function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window, document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
        fbq('init', '${page.meta_pixel_id}');
        fbq('track', 'PageView');
      `;
      document.head.appendChild(script);
    }

    // Google Analytics
    if (page.google_analytics_id) {
      const gtagScript = document.createElement("script");
      gtagScript.src = `https://www.googletagmanager.com/gtag/js?id=${page.google_analytics_id}`;
      gtagScript.async = true;
      document.head.appendChild(gtagScript);

      const inlineScript = document.createElement("script");
      inlineScript.innerHTML = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${page.google_analytics_id}');
      `;
      document.head.appendChild(inlineScript);
    }

    // TikTok Pixel
    if (page.tiktok_pixel_id) {
      const ttScript = document.createElement("script");
      ttScript.innerHTML = `
        !function (w, d, t) {
          w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
          ttq.load('${page.tiktok_pixel_id}');
          ttq.page();
        }(window, document, 'ttq');
      `;
      document.head.appendChild(ttScript);
    }
  }, [page]);

  const handleButtonClick = async (button: SmartLinkButtonWithCount) => {
    if (!page) return;

    // Record click
    const urlParams = new URLSearchParams(window.location.search);
    await supabase.from("smart_link_clicks").insert({
      button_id: button.id,
      page_id: page.id,
      utm_source: urlParams.get("utm_source"),
      utm_medium: urlParams.get("utm_medium"),
      utm_campaign: urlParams.get("utm_campaign"),
      utm_content: urlParams.get("utm_content"),
      utm_term: urlParams.get("utm_term"),
      referrer: document.referrer || null,
      user_agent: navigator.userAgent,
    });

    // Update click counter
    await supabase
      .from("smart_link_buttons")
      .update({ click_count: (button.click_count || 0) + 1 })
      .eq("id", button.id);

    // If button has a funnel, redirect to Telegram bot with tag
    if (button.funnel_id) {
      // TODO: Implement funnel start logic
      // For now, just open the URL if exists
      if (button.url) {
        window.open(button.url, "_blank");
      }
    } else if (button.url) {
      // Append UTM parameters to outbound links
      const targetUrl = new URL(button.url);
      urlParams.forEach((value, key) => {
        if (!targetUrl.searchParams.has(key)) {
          targetUrl.searchParams.set(key, value);
        }
      });
      window.open(targetUrl.toString(), "_blank");
    }
  };

  const getButtonClasses = (style: string) => {
    const baseClasses = "w-full py-3.5 px-6 font-medium transition-all duration-200 hover:scale-[1.02] hover:shadow-lg flex items-center justify-center gap-2";
    
    switch (style) {
      case "pill":
        return `${baseClasses} rounded-full`;
      case "square":
        return `${baseClasses} rounded-none`;
      case "outline":
        return `${baseClasses} rounded-lg bg-transparent border-2`;
      case "rounded":
      default:
        return `${baseClasses} rounded-lg`;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (notFound || !page) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <h1 className="text-2xl font-bold mb-2">Página não encontrada</h1>
        <p className="text-muted-foreground">Esta Smart Link não existe ou foi desativada.</p>
      </div>
    );
  }

  // Redirector splash screen
  if (page.page_type === "redirector") {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center p-4"
        style={{ backgroundColor: page.background_color }}
      >
        <div className="text-center space-y-4 animate-fade-in">
          {page.avatar_url && (
            <img
              src={page.avatar_url}
              alt={page.title}
              className="w-28 h-28 rounded-full mx-auto object-cover border-4 animate-scale-in"
              style={{ borderColor: page.text_color + "40" }}
            />
          )}
          <h1
            className="text-2xl font-bold"
            style={{ color: page.text_color }}
          >
            {page.title}
          </h1>
          <div className="flex items-center justify-center gap-2">
            <Loader2 
              className="w-5 h-5 animate-spin" 
              style={{ color: page.text_color }}
            />
            <span 
              className="text-sm opacity-70"
              style={{ color: page.text_color }}
            >
              Redirecionando...
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>

      <div
        className="min-h-screen flex flex-col items-center p-4 py-8 sm:py-12"
        style={{ backgroundColor: page.background_color }}
      >
        <div className="w-full max-w-md mx-auto space-y-6">
          {/* Profile */}
          <div className="text-center space-y-3">
            {page.avatar_url && (
              <img
                src={page.avatar_url}
                alt={page.title}
                className="w-24 h-24 rounded-full mx-auto object-cover border-4"
                style={{ borderColor: page.text_color + "40" }}
              />
            )}
            <h1
              className="text-2xl font-bold"
              style={{ color: page.text_color }}
            >
              {page.title}
            </h1>
            {page.description && (
              <p
                className="text-sm opacity-80"
                style={{ color: page.text_color }}
              >
                {page.description}
              </p>
            )}
          </div>

          {/* Buttons */}
          <div className="space-y-3">
            {buttons.map((button) => (
              <button
                key={button.id}
                onClick={() => handleButtonClick(button)}
                className={`${getButtonClasses(page.button_style)} relative`}
                style={{
                  backgroundColor: page.button_style === "outline" 
                    ? "transparent" 
                    : page.text_color,
                  color: page.button_style === "outline" 
                    ? page.text_color 
                    : page.background_color,
                  borderColor: page.button_style === "outline" 
                    ? page.text_color 
                    : undefined,
                  paddingLeft: button.icon ? "3rem" : undefined,
                }}
              >
                {button.icon && (
                  <img
                    src={button.icon}
                    alt=""
                    className="w-7 h-7 rounded object-cover flex-shrink-0 absolute left-3"
                    loading="eager"
                  />
                )}
                <span>{button.title}</span>
              </button>
            ))}
          </div>

          {/* Footer */}
          <div className="text-center pt-8">
            <a
              href="/"
              className="text-xs opacity-50 hover:opacity-75 transition-opacity"
              style={{ color: page.text_color }}
            >
              Feito com Nexo
            </a>
          </div>
        </div>
      </div>
    </>
  );
};

export default SmartLinkPublicPage;
