"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Search, Download, Loader2, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface LogEntry {
  id: string;
  level: string;
  message: string;
  metadata: string | null;
  source: string | null;
  timestamp: string;
  projectId: string;
  projectName: string;
}

interface ProjectOption {
  id: string;
  name: string;
}

const levelStyles: Record<string, string> = {
  info: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  warn: "border-amber-500/30 bg-amber-500/10 text-amber-400",
  error: "border-red-500/30 bg-red-500/10 text-red-400",
  debug: "border-blue-500/30 bg-blue-500/10 text-blue-400",
  fatal: "border-rose-500/30 bg-rose-500/10 text-rose-400",
};

function formatTimestamp(ts: string): string {
  return new Date(ts).toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

export default function LogsPage() {
  const searchParams = useSearchParams();
  const projectFilter = searchParams.get("project");

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [level, setLevel] = useState("all");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(0);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>(projectFilter ?? "all");
  const PAGE_SIZE = 50;

  // Load project list
  useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then((data: ProjectOption[]) => setProjects(data))
      .catch(console.error);
  }, []);

  const fetchLogs = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (level !== "all") params.set("level", level);
    if (search) params.set("search", search);
    params.set("limit", PAGE_SIZE.toString());
    params.set("offset", (page * PAGE_SIZE).toString());

    const endpoint =
      selectedProject && selectedProject !== "all"
        ? `/api/projects/${selectedProject}/logs?${params}`
        : `/api/logs?${params}`;

    fetch(endpoint)
      .then((r) => r.json())
      .then((data) => {
        setLogs(data.logs);
        setTotal(data.total);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [level, search, page, selectedProject]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(0);
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const handleExport = () => {
    const csv = [
      "Timestamp,Level,Message,Source,Project",
      ...logs.map(
        (l) =>
          `"${l.timestamp}","${l.level}","${l.message.replace(/"/g, '""')}","${l.source ?? ""}","${l.projectName ?? ""}"`
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "signalstack-logs.csv";
    a.click();
  };

  return (
    <div className="flex flex-1 min-h-0 flex-col space-y-6">
      <div className="shrink-0">
        <h1 className="text-3xl font-bold tracking-tight">Logs</h1>
        <p className="text-muted-foreground mt-1">
          Real-time log stream across all connected services.
        </p>
      </div>

      <div className="flex shrink-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={level} onValueChange={(v) => { setLevel(v); setPage(0); }}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="error">Errors</TabsTrigger>
            <TabsTrigger value="warn">Warnings</TabsTrigger>
            <TabsTrigger value="info">Info</TabsTrigger>
            <TabsTrigger value="debug">Debug</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex items-center gap-2">
          <Select value={selectedProject} onValueChange={(v) => { if (v) { setSelectedProject(v); setPage(0); } }}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Projects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="log-search"
              placeholder="Search logs..."
              className="pl-9 w-64"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>
          <Button variant="outline" size="icon" onClick={fetchLogs} title="Refresh">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button variant="outline" size="icon" onClick={handleExport} title="Export CSV">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card className="flex-1 min-h-0 border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
        <ScrollArea className="h-full">
          <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-violet-400" />
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <p className="text-sm">No logs found.</p>
              <p className="text-xs mt-1">Try adjusting your filters or send some logs first.</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50 hover:bg-transparent">
                    <TableHead className="w-[170px]">Timestamp</TableHead>
                    <TableHead className="w-[80px]">Level</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead className="w-[140px]">Source</TableHead>
                    <TableHead className="w-[140px]">Project</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow
                      key={log.id}
                      className="border-border/30 cursor-pointer transition-colors hover:bg-muted/50"
                    >
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {formatTimestamp(log.timestamp)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-xs ${levelStyles[log.level] ?? ""}`}
                        >
                          {log.level}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[400px] truncate text-sm">
                        {log.message}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {log.source ?? "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {log.projectName ?? "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex items-center justify-between border-t border-border/30 px-4 py-3">
                <p className="text-xs text-muted-foreground">
                  Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of{" "}
                  {total.toLocaleString()} logs
                </p>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={page === 0}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-xs text-muted-foreground px-2">
                    {page + 1} / {totalPages || 1}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={page + 1 >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </ScrollArea>
    </Card>
  </div>
);
}
