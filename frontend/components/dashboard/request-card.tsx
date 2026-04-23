"use client";

import { Calendar, Clock, Code, Hash, Layers } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export interface LogData {
  type: "log";
  id?: string;
  level: string;
  message: string;
  timestamp: string;
  source?: string;
  metadata?: string | Record<string, any>;
}

const levelColors: Record<string, string> = {
  error: "border-red-500/30 bg-red-500/10 text-red-400",
  fatal: "border-rose-500/30 bg-rose-500/10 text-rose-400",
  warn: "border-amber-500/30 bg-amber-500/10 text-amber-400",
  info: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  debug: "border-blue-500/30 bg-blue-500/10 text-blue-400",
};

export function RequestCard({ log }: { log: LogData }) {
  const date = new Date(log.timestamp);
  
  let metadataObj = null;
  if (log.metadata) {
    try {
      metadataObj = typeof log.metadata === 'string' ? JSON.parse(log.metadata) : log.metadata;
    } catch (e) {
      metadataObj = { raw: log.metadata };
    }
  }

  return (
    <Card className="mt-4 border-border/50 bg-card/40 backdrop-blur-sm overflow-hidden">
      <CardHeader className="pb-3 bg-muted/20">
        <div className="flex items-center justify-between">
          <Badge variant="outline" className={`capitalize ${levelColors[log.level.toLowerCase()] || ""}`}>
            {log.level}
          </Badge>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            {date.toLocaleDateString()}
            <Clock className="h-3 w-3 ml-1" />
            {date.toLocaleTimeString()}
          </div>
        </div>
        <CardTitle className="text-base mt-2 font-mono break-all">
          {log.message}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-3">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Layers className="h-3 w-3" />
              Source
            </div>
            <p className="text-sm font-medium">{log.source || "Unknown"}</p>
          </div>
          {log.id && (
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Hash className="h-3 w-3" />
                ID
              </div>
              <p className="text-sm font-mono truncate">{log.id}</p>
            </div>
          )}
        </div>

        {metadataObj && Object.keys(metadataObj).length > 0 && (
          <>
            <Separator className="bg-border/50" />
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Code className="h-3 w-3" />
                Metadata
              </div>
              <div className="rounded-md bg-muted/50 p-3 overflow-x-auto">
                <pre className="text-xs font-mono text-violet-400">
                  {JSON.stringify(metadataObj, null, 2)}
                </pre>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
