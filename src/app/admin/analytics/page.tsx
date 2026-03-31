"use client";

import { useState, useEffect } from "react";
import { BarChart3, Eye, FileText, TrendingUp, Loader2, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface AnalyticsData {
  totalViews: number;
  uniqueDays: number;
  pages: { slug: string; views: number }[];
  daily: { date: string; views: number }[];
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => { loadData(); }, [days]);

  async function loadData() {
    setLoading(true);
    const res = await fetch(`/api/admin/analytics?days=${days}`);
    if (res.ok) setData(await res.json());
    setLoading(false);
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

  const maxDaily = Math.max(...(data?.daily.map(d => d.views) || [1]), 1);

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">Page views and visitor insights.</p>
        </div>
        <div className="flex gap-1">
          {[7, 30, 90].map((d) => (
            <button key={d} onClick={() => setDays(d)} className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${days === d ? "border-primary bg-primary/10 text-primary" : "hover:bg-muted"}`}>
              {d}d
            </button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Page Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data?.totalViews || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Last {days} days</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Days</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data?.uniqueDays || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Days with at least 1 view</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Views / Day</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data?.uniqueDays ? Math.round((data.totalViews || 0) / data.uniqueDays) : 0}</div>
            <p className="text-xs text-muted-foreground mt-1">On active days</p>
          </CardContent>
        </Card>
      </div>

      {/* Daily chart */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><BarChart3 className="h-4 w-4" />Views Over Time</CardTitle></CardHeader>
        <CardContent>
          {data?.daily && data.daily.length > 0 ? (
            <div className="flex items-end gap-[2px] h-40">
              {data.daily.map((d) => (
                <div key={d.date} className="flex-1 flex flex-col items-center gap-1 group relative">
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 rounded bg-foreground text-background text-[10px] px-1.5 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                    {d.date}: {d.views} views
                  </div>
                  <div
                    className="w-full bg-primary/80 hover:bg-primary rounded-t-sm transition-colors min-h-[2px]"
                    style={{ height: `${Math.max((d.views / maxDaily) * 100, 2)}%` }}
                  />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">No data yet. Views will appear here as visitors browse your docs.</p>
          )}
        </CardContent>
      </Card>

      {/* Popular pages */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><FileText className="h-4 w-4" />Popular Pages</CardTitle></CardHeader>
        <CardContent>
          {data?.pages && data.pages.length > 0 ? (
            <div className="space-y-2">
              {data.pages.map((p, i) => (
                <div key={p.slug} className="flex items-center gap-3">
                  <span className="text-xs font-mono text-muted-foreground w-6 text-right">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate">/{p.slug}</span>
                    </div>
                    <div className="mt-1 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${(p.views / (data.pages[0]?.views || 1)) * 100}%` }} />
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-xs shrink-0">{p.views} views</Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">No page views recorded yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
