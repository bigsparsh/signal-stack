"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

interface StatsData {
  totalLogs: number;
  errorCount: number;
  warnCount: number;
  errorRate: number;
  projectCount: number;
  levelBreakdown: Record<string, number>;
  sourceBreakdown: { source: string; count: number }[];
}

const LEVEL_COLORS: Record<string, string> = {
  info: "#34d399",
  warn: "#fbbf24",
  error: "#f87171",
  debug: "#60a5fa",
  fatal: "#fb7185",
};

export default function ReportsPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
      </div>
    );
  }

  const s = stats ?? {
    totalLogs: 0,
    errorCount: 0,
    warnCount: 0,
    errorRate: 0,
    projectCount: 0,
    levelBreakdown: {},
    sourceBreakdown: [],
  };

  // Prepare chart data
  const levelData = Object.entries(s.levelBreakdown).map(([level, count]) => ({
    name: level,
    count,
    fill: LEVEL_COLORS[level] ?? "#94a3b8",
  }));

  const pieData = Object.entries(s.levelBreakdown).map(([level, count]) => ({
    name: level,
    value: count,
  }));

  const sourceData = s.sourceBreakdown.map((item) => ({
    name: item.source ?? "unknown",
    errors: item.count,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
        <p className="text-muted-foreground mt-1">
          System health visualisations and trend analysis.
        </p>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="errors">Error Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-4">
          {/* Summary cards */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardContent className="pt-6 text-center">
                <p className="text-sm text-muted-foreground">Total Logs</p>
                <p className="text-3xl font-bold mt-1">{s.totalLogs.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardContent className="pt-6 text-center">
                <p className="text-sm text-muted-foreground">Error Rate</p>
                <p className="text-3xl font-bold mt-1 text-red-400">{s.errorRate}%</p>
              </CardContent>
            </Card>
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardContent className="pt-6 text-center">
                <p className="text-sm text-muted-foreground">Connected Projects</p>
                <p className="text-3xl font-bold mt-1">{s.projectCount}</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {/* Bar chart: Logs by Level */}
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Logs by Level</CardTitle>
                <CardDescription>Volume of logs at each severity level</CardDescription>
              </CardHeader>
              <CardContent>
                {levelData.length === 0 ? (
                  <div className="flex h-[240px] items-center justify-center text-sm text-muted-foreground">
                    No data yet
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={levelData} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
                      <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 12 }} />
                      <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                          color: "hsl(var(--foreground))",
                        }}
                      />
                      <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                        {levelData.map((entry, i) => (
                          <Cell key={i} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Pie chart: Level Distribution */}
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Level Distribution</CardTitle>
                <CardDescription>Proportional breakdown of log levels</CardDescription>
              </CardHeader>
              <CardContent>
                {pieData.length === 0 ? (
                  <div className="flex h-[240px] items-center justify-center text-sm text-muted-foreground">
                    No data yet
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={3}
                        dataKey="value"
                        strokeWidth={0}
                      >
                        {pieData.map((entry, i) => (
                          <Cell key={i} fill={LEVEL_COLORS[entry.name] ?? "#94a3b8"} />
                        ))}
                      </Pie>
                      <Legend
                        wrapperStyle={{ fontSize: 12, color: "#94a3b8" }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                          color: "hsl(var(--foreground))",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="errors" className="mt-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardContent className="pt-6 text-center">
                <p className="text-sm text-muted-foreground">Total Errors</p>
                <p className="text-3xl font-bold mt-1 text-red-400">{s.errorCount.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardContent className="pt-6 text-center">
                <p className="text-sm text-muted-foreground">Warnings</p>
                <p className="text-3xl font-bold mt-1 text-amber-400">{s.warnCount.toLocaleString()}</p>
              </CardContent>
            </Card>
          </div>

          {/* Error by Source */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Errors by Source</CardTitle>
              <CardDescription>Top services generating errors</CardDescription>
            </CardHeader>
            <CardContent>
              {sourceData.length === 0 ? (
                <div className="flex h-[240px] items-center justify-center text-sm text-muted-foreground">
                  No error data yet
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={sourceData} layout="vertical" margin={{ left: 20 }}>
                    <XAxis type="number" tick={{ fill: "#94a3b8", fontSize: 12 }} />
                    <YAxis
                      dataKey="name"
                      type="category"
                      width={120}
                      tick={{ fill: "#94a3b8", fontSize: 12 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        color: "hsl(var(--foreground))",
                      }}
                    />
                    <Bar dataKey="errors" fill="#f87171" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Error sources list */}
          {sourceData.length > 0 && (
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Error Source Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {s.sourceBreakdown.map((src) => {
                    const pct =
                      s.errorCount > 0
                        ? Math.round((src.count / s.errorCount) * 100)
                        : 0;
                    return (
                      <div key={src.source} className="space-y-1.5">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="border-red-500/30 bg-red-500/10 text-red-400 text-xs">
                              {src.source}
                            </Badge>
                          </div>
                          <span className="text-muted-foreground">
                            {src.count} errors ({pct}%)
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-muted">
                          <div
                            className="h-2 rounded-full bg-red-500 transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
