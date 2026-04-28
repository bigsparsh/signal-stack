"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  ScrollText,
  FolderKanban,
  Loader2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface DashboardStats {
  totalLogs: number;
  errorCount: number;
  warnCount: number;
  errorRate: number;
  projectCount: number;
  recentLogs: {
    id: string;
    level: string;
    message: string;
    source: string | null;
    timestamp: string;
    projectName: string;
  }[];
  levelBreakdown: Record<string, number>;
  sourceBreakdown: { source: string; count: number }[];
}

const levelDotColor: Record<string, string> = {
  error: "bg-red-400",
  fatal: "bg-rose-400",
  warn: "bg-amber-400",
  info: "bg-emerald-400",
  debug: "bg-blue-400",
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function DashboardOverview() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
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
    recentLogs: [],
    levelBreakdown: {},
    sourceBreakdown: [],
  };

  const statCards = [
    {
      title: "Total Logs",
      value: s.totalLogs.toLocaleString(),
      icon: ScrollText,
      color: "text-violet-400",
      bg: "bg-violet-500/10",
    },
    {
      title: "Error Rate",
      value: `${s.errorRate}%`,
      icon: AlertTriangle,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
    },
    {
      title: "Projects",
      value: s.projectCount.toString(),
      icon: FolderKanban,
      color: "text-cyan-400",
      bg: "bg-cyan-500/10",
    },
    {
      title: "Errors",
      value: s.errorCount.toLocaleString(),
      icon: Activity,
      color: "text-red-400",
      bg: "bg-red-500/10",
    },
  ];

  return (
    <ScrollArea className="flex-1 -m-6">
      <div className="p-6 space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Overview of your log activity and system health.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => (
            <Card
              key={stat.title}
              className="border-border/50 bg-card/50 backdrop-blur-sm"
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`rounded-lg p-2 ${stat.bg}`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Activity & Level Breakdown */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest log events across your projects</CardDescription>
            </CardHeader>
            <CardContent>
              {s.recentLogs.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  No logs yet. Connect a project and start sending logs.
                </p>
              ) : (
                <div className="space-y-4">
                  {s.recentLogs.slice(0, 8).map((log) => (
                    <div key={log.id} className="flex items-start gap-3">
                      <div
                        className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${
                          levelDotColor[log.level] ?? "bg-gray-400"
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{log.message}</p>
                        <p className="text-xs text-muted-foreground">
                          {log.source ?? log.projectName} &bull; {timeAgo(log.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Log Level Distribution</CardTitle>
              <CardDescription>Breakdown of logs by severity level</CardDescription>
            </CardHeader>
            <CardContent>
              {s.totalLogs === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  No data available yet.
                </p>
              ) : (
                <div className="space-y-4">
                  {(["info", "warn", "error", "debug", "fatal"] as const).map((level) => {
                    const count = s.levelBreakdown[level] ?? 0;
                    const pct = s.totalLogs > 0 ? Math.round((count / s.totalLogs) * 100) : 0;
                    const colors: Record<string, string> = {
                      info: "bg-emerald-500",
                      warn: "bg-amber-500",
                      error: "bg-red-500",
                      debug: "bg-blue-500",
                      fatal: "bg-rose-500",
                    };
                    if (count === 0) return null;
                    return (
                      <div key={level} className="space-y-1.5">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className={`text-xs capitalize ${
                                level === "error"
                                  ? "border-red-500/30 bg-red-500/10 text-red-400"
                                  : level === "warn"
                                  ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
                                  : level === "fatal"
                                  ? "border-rose-500/30 bg-rose-500/10 text-rose-400"
                                  : level === "debug"
                                  ? "border-blue-500/30 bg-blue-500/10 text-blue-400"
                                  : "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                              }`}
                            >
                              {level}
                            </Badge>
                            <span className="text-muted-foreground">{count.toLocaleString()}</span>
                          </div>
                          <span className="text-muted-foreground">{pct}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-muted">
                          <div
                            className={`h-2 rounded-full ${colors[level]} transition-all`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Top Error Sources */}
        {s.sourceBreakdown.length > 0 && (
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Top Error Sources</CardTitle>
              <CardDescription>Services generating the most errors</CardDescription>
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
                        <span>{src.source}</span>
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
      </div>
    </ScrollArea>
  );
}
