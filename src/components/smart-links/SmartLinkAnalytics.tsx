import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSmartLinkAnalytics, SmartLinkButton } from "@/hooks/useSmartLinks";
import { Eye, MousePointerClick, TrendingUp, Globe } from "lucide-react";
import { format, subDays, startOfDay, isAfter } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from "recharts";

interface SmartLinkAnalyticsProps {
  pageId: string | null;
  buttons: SmartLinkButton[];
}

const SmartLinkAnalytics = ({ pageId, buttons }: SmartLinkAnalyticsProps) => {
  const { clicks, viewCount, isLoading } = useSmartLinkAnalytics(pageId);

  const stats = useMemo(() => {
    const totalClicks = clicks.length;
    const ctr = viewCount > 0 ? ((totalClicks / viewCount) * 100).toFixed(1) : "0";

    // Clicks per button
    const clicksByButton = buttons.map(button => ({
      name: button.title,
      clicks: clicks.filter(c => c.button_id === button.id).length,
    })).sort((a, b) => b.clicks - a.clicks);

    // Clicks over time (last 7 days)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = startOfDay(subDays(new Date(), 6 - i));
      return {
        date,
        label: format(date, "EEE", { locale: ptBR }),
        clicks: 0,
        views: 0,
      };
    });

    clicks.forEach(click => {
      const clickDate = startOfDay(new Date(click.clicked_at));
      const dayIndex = last7Days.findIndex(d => 
        d.date.getTime() === clickDate.getTime()
      );
      if (dayIndex !== -1) {
        last7Days[dayIndex].clicks++;
      }
    });

    // UTM sources
    const sources: Record<string, number> = {};
    clicks.forEach(click => {
      const source = click.utm_source || "Direto";
      sources[source] = (sources[source] || 0) + 1;
    });
    const topSources = Object.entries(sources)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalClicks,
      ctr,
      clicksByButton,
      chartData: last7Days,
      topSources,
    };
  }, [clicks, viewCount, buttons]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="h-16 animate-pulse bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Eye className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{viewCount}</p>
                <p className="text-xs text-muted-foreground">Visualizações</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10">
                <MousePointerClick className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalClicks}</p>
                <p className="text-xs text-muted-foreground">Cliques</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/10">
                <TrendingUp className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.ctr}%</p>
                <p className="text-xs text-muted-foreground">Taxa de Cliques</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-info/10">
                <Globe className="w-5 h-5 text-info" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.topSources.length}</p>
                <p className="text-xs text-muted-foreground">Fontes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Clicks Over Time */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cliques (Últimos 7 dias)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.chartData}>
                  <defs>
                    <linearGradient id="clicksGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis 
                    dataKey="label" 
                    tick={{ fontSize: 12 }} 
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }} 
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="clicks"
                    stroke="hsl(var(--primary))"
                    fill="url(#clicksGradient)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Clicks by Button */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cliques por Botão</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.clicksByButton.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nenhum clique registrado ainda
              </p>
            ) : (
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.clicksByButton.slice(0, 5)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 12 }} allowDecimals={false} />
                    <YAxis 
                      type="category" 
                      dataKey="name" 
                      tick={{ fontSize: 12 }} 
                      width={100}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--popover))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar dataKey="clicks" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Sources */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Principais Fontes de Tráfego</CardTitle>
          <CardDescription>De onde vêm seus visitantes</CardDescription>
        </CardHeader>
        <CardContent>
          {stats.topSources.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhuma fonte registrada ainda
            </p>
          ) : (
            <div className="space-y-3">
              {stats.topSources.map((source, index) => (
                <div key={source.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-4">{index + 1}</span>
                    <span className="font-medium">{source.name}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">{source.count} cliques</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SmartLinkAnalytics;
