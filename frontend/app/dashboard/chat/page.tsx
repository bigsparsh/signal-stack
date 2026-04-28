"use client";

import { useState, useEffect, useRef } from "react";
import { Send, Bot, User, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
} from "@/components/ui/card";
import { ChatChart, ChartData } from "@/components/dashboard/chat-chart";
import { RequestCard, LogData } from "@/components/dashboard/request-card";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

type ParsedContent = {
  text: string;
  charts: ChartData[];
  logs: LogData[];
};

// Helper to extract JSON from code blocks and handle arrays or multiple objects
function parseMessageContent(content: string): ParsedContent {
  const jsonRegex = /```json\n([\s\S]*?)\n```/g;
  let text = content;
  const charts: ChartData[] = [];
  const logs: LogData[] = [];

  const matches = Array.from(content.matchAll(jsonRegex));
  
  for (const match of matches) {
    const rawJson = match[1].trim();
    try {
      // Try parsing as-is
      const parsed = JSON.parse(rawJson);
      
      // Handle array of objects
      if (Array.isArray(parsed)) {
        parsed.forEach(item => {
          if (item.type === "chart") charts.push(item);
          if (item.type === "log") logs.push(item);
        });
      } else {
        // Handle single object
        if (parsed.type === "chart") charts.push(parsed);
        if (parsed.type === "log") logs.push(parsed);
      }
      
      // Remove the JSON block from text
      text = text.replace(match[0], "");
    } catch (e) {
      // If parsing failed, it might be multiple concatenated objects like {}{}{}
      try {
        // Simple trick to handle multiple top-level objects if LLM forgot array
        const wrappedJson = `[${rawJson.replace(/\}\s*\{/g, "},{")}]`;
        const parsed = JSON.parse(wrappedJson);
        if (Array.isArray(parsed)) {
          parsed.forEach(item => {
            if (item.type === "chart") charts.push(item);
            if (item.type === "log") logs.push(item);
          });
          text = text.replace(match[0], "");
        }
      } catch (innerE) {
        console.error("Failed to parse message JSON even with cleanup:", rawJson);
      }
    }
  }

  return { text: text.trim(), charts, logs };
}

interface Project {
  id: string;
  name: string;
}

const suggestedQueries = [
  "What were the most common errors in the last hour?",
  "Show me a summary of failed requests today",
  "Which service has the highest error rate?",
  "Are there any anomalies in the current log patterns?",
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hello! I'm your AI log analyst. Ask me anything about your logs — error patterns, anomalies, trends, or just a quick summary. I have context on all your connected services.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading]);

  useEffect(() => {
    // Fetch projects to populate the selector
    fetch("/api/projects")
      .then((res) => res.json())
      .then((data) => {
        setProjects(data);
        if (data.length > 0) {
          setSelectedProjectId(data[0].id);
        }
      });
  }, []);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: input,
          projectId: selectedProjectId,
        }),
      });

      const data = await response.json();

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response || data.error || "Sorry, I couldn't process that request.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (error) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Failed to connect to the AI service. Please make sure the backend is running.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-1 min-h-0 flex-col overflow-hidden">
      <Card className="flex min-h-0 flex-1 flex-col border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden shadow-2xl">
        {/* Sticky Header inside Card */}
        <div className="flex items-center justify-between p-4 border-b border-border/40 bg-card/80 backdrop-blur-md shrink-0 z-10">
          <div>
            <h1 className="text-xl font-bold tracking-tight">AI Chat</h1>
            <p className="text-xs text-muted-foreground">
              Query your logs using natural language.
            </p>
          </div>
          <div className="w-[180px]">
            <Select value={selectedProjectId} onValueChange={(val) => val && setSelectedProjectId(val)}>
              <SelectTrigger className="h-9 bg-background/50 border-border/50">
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <ScrollArea className="flex-1 min-h-0 h-full">
          <div className="p-6 space-y-6">
            {messages.map((msg) => {
              const { text, charts, logs } = parseMessageContent(msg.content);
              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${
                    msg.role === "user" ? "justify-end" : ""
                  }`}
                >
                  {msg.role === "assistant" && (
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarFallback className="bg-gradient-to-br from-violet-500 to-cyan-500 text-white shadow-lg">
                        <Bot className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-violet-600 text-white shadow-lg shadow-violet-500/20"
                        : "bg-muted text-foreground border border-border/50"
                    }`}
                  >
                    {text && <div className="whitespace-pre-wrap">{text}</div>}
                    {charts.map((c, i) => <ChatChart key={i} chartData={c} />)}
                    {logs.map((l, i) => <RequestCard key={i} log={l} />)}
                  </div>
                  {msg.role === "user" && (
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarFallback className="bg-muted shadow-sm">
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              );
            })}
            {isLoading && (
              <div className="flex gap-3">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className="bg-gradient-to-br from-violet-500 to-cyan-500 text-white shadow-lg">
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-muted max-w-[70%] rounded-2xl px-4 py-3 text-sm flex items-center gap-2 border border-border/50">
                  <Loader2 className="h-4 w-4 animate-spin text-violet-500" />
                  Analyzing logs...
                </div>
              </div>
            )}

            {/* Suggested queries */}
            {messages.length <= 1 && (
              <div className="mt-8 grid gap-2 sm:grid-cols-2">
                {suggestedQueries.map((q) => (
                  <button
                    key={q}
                    onClick={() => setInput(q)}
                    className="rounded-xl border border-border/50 bg-muted/30 p-3 text-left text-sm text-muted-foreground transition-all hover:border-violet-500/30 hover:bg-muted/60 hover:text-foreground"
                  >
                    <Sparkles className="mb-1 h-3.5 w-3.5 text-violet-400" />
                    {q}
                  </button>
                ))}
              </div>
            )}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        {/* Input area */}
        <div className="border-t border-border/40 p-4 bg-card/80 backdrop-blur-md shrink-0">
          <div className="flex items-end gap-2 max-w-4xl mx-auto">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask about your logs..."
              className="min-h-[44px] max-h-[120px] resize-none border-border/50 bg-background/50 focus-visible:ring-violet-500/30"
              rows={1}
            />
            <Button
              onClick={handleSend}
              size="icon"
              disabled={isLoading || !input.trim()}
              className="h-11 w-11 shrink-0 bg-gradient-to-r from-violet-600 to-cyan-600 text-white hover:from-violet-700 hover:to-cyan-700 shadow-lg shadow-violet-500/20 transition-all active:scale-95"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
