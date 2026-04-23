"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  Key,
  Terminal,
  MessageSquare,
  Activity,
  CheckCircle2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const steps = [
  {
    title: "Welcome to Signalstack",
    description: "Your all-in-one platform for log ingestion and AI-powered analysis.",
    icon: <Activity className="h-10 w-10 text-violet-500" />,
    content: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Signalstack helps you monitor your backends in real-time, catch errors before they affect users, and use AI to find patterns in your logs.
        </p>
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="rounded-lg border border-border/50 bg-muted/30 p-3 text-xs">
            <Badge variant="outline" className="mb-2">Step 1</Badge>
            <p className="font-medium">Get API Key</p>
          </div>
          <div className="rounded-lg border border-border/50 bg-muted/30 p-3 text-xs">
            <Badge variant="outline" className="mb-2">Step 2</Badge>
            <p className="font-medium">Install SDK</p>
          </div>
        </div>
      </div>
    ),
  },
  {
    title: "Setup API Key",
    description: "Every project needs an API key to securely send logs.",
    icon: <Key className="h-10 w-10 text-cyan-500" />,
    content: (
      <div className="space-y-4">
        <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
          <li>Navigate to the <span className="text-foreground font-medium">Projects</span> page.</li>
          <li>Click on <span className="text-foreground font-medium">Create New Project</span>.</li>
          <li>Once created, copy the <span className="text-foreground font-medium">API Key</span> from the project settings.</li>
          <li>Keep this key secret — it identifies your service to our backend.</li>
        </ol>
      </div>
    ),
  },
  {
    title: "Integrate SDK",
    description: "Send logs from your Node.js or TypeScript backend.",
    icon: <Terminal className="h-10 w-10 text-emerald-500" />,
    content: (
      <div className="space-y-4">
        <div className="rounded-md bg-zinc-950 p-4 font-mono text-xs text-zinc-300">
          <p className="text-zinc-500">// Install the SDK</p>
          <p>pnpm add @signalstack/sdk</p>
          <p className="mt-4 text-zinc-500">// Initialize and log</p>
          <p><span className="text-violet-400">const</span> stack = <span className="text-violet-400">new</span> <span className="text-cyan-400">Signalstack</span>(&apos;YOUR_API_KEY&apos;);</p>
          <p>stack.<span className="text-emerald-400">log</span>(&apos;info&apos;, &apos;Service started&apos;);</p>
        </div>
        <p className="text-xs text-muted-foreground">
          You can also include metadata like request IDs or user emails to better trace issues.
        </p>
      </div>
    ),
  },
  {
    title: "AI Analysis",
    description: "Ask questions and get insights from your data.",
    icon: <MessageSquare className="h-10 w-10 text-blue-500" />,
    content: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Go to the <span className="text-foreground font-medium">AI Chat</span> to query your logs using natural language.
        </p>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs bg-muted/50 p-2 rounded-md">
            <CheckCircle2 className="h-3 w-3 text-violet-400" />
            <span>&quot;Show me all errors from the last 2 hours&quot;</span>
          </div>
          <div className="flex items-center gap-2 text-xs bg-muted/50 p-2 rounded-md">
            <CheckCircle2 className="h-3 w-3 text-violet-400" />
            <span>&quot;Plot a graph of request latency&quot;</span>
          </div>
        </div>
      </div>
    ),
  },
];

export function HelpGuide() {
  const [currentStep, setCurrentStep] = useState(0);

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 gap-2 text-xs text-muted-foreground hover:text-foreground">
          <Badge variant="outline" className="px-1.5 py-0 text-[10px] bg-violet-500/10 text-violet-400 border-violet-500/20 uppercase font-bold">Help</Badge>
          How to use
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] border-border/50 bg-card/95 backdrop-blur-xl">
        <div className="flex flex-col items-center text-center pt-4">
          <div className="mb-6 rounded-2xl bg-muted/50 p-4 ring-1 ring-border/50">
            {steps[currentStep].icon}
          </div>
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-2xl font-bold tracking-tight">
              {steps[currentStep].title}
            </DialogTitle>
            <DialogDescription className="text-sm">
              {steps[currentStep].description}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="mt-6 min-h-[160px]">
          {steps[currentStep].content}
        </div>

        <div className="mt-8 flex items-center justify-between border-t border-border/40 pt-4">
          <div className="flex gap-1">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === currentStep ? "w-6 bg-violet-500" : "w-1.5 bg-muted"
                }`}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9"
              onClick={prevStep}
              disabled={currentStep === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {currentStep < steps.length - 1 ? (
              <Button
                className="h-9 px-4 bg-violet-600 hover:bg-violet-700 text-white"
                onClick={nextStep}
              >
                Next
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <DialogTrigger asChild>
                <Button className="h-9 px-4 bg-emerald-600 hover:bg-emerald-700 text-white">
                  Get Started
                </Button>
              </DialogTrigger>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
