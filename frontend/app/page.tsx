import Link from "next/link";
import {
  Activity,
  ArrowRight,
  BarChart3,
  MessageSquare,
  Shield,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden">
      {/* Gradient background orbs */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-40 -right-40 h-[600px] w-[600px] rounded-full bg-violet-600/15 blur-[120px]" />
        <div className="absolute top-1/2 -left-40 h-[500px] w-[500px] rounded-full bg-cyan-500/10 blur-[120px]" />
        <div className="absolute -bottom-40 right-1/3 h-[400px] w-[400px] rounded-full bg-fuchsia-500/10 blur-[100px]" />
      </div>

      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/60 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg tracking-tight">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-cyan-500">
              <Activity className="h-4 w-4 text-white" />
            </div>
            Signalstack
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </Link>
            <Link href="/login">
              <Button size="sm" className="bg-gradient-to-r from-violet-600 to-cyan-600 text-white hover:from-violet-700 hover:to-cyan-700">
                Get Started
                <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-4 py-1.5 text-sm text-violet-400 mb-8">
          <Zap className="h-3.5 w-3.5" />
          AI-Powered Log Intelligence
        </div>
        <h1 className="max-w-4xl text-5xl font-bold tracking-tight sm:text-7xl">
          <span className="bg-gradient-to-b from-foreground to-foreground/60 bg-clip-text text-transparent">
            Your logs,{" "}
          </span>
          <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
            decoded.
          </span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted-foreground leading-relaxed">
          Signalstack ingests your application logs in real time, surfaces
          anomalies, and lets you query everything with natural language — so you
          can fix issues before your users notice.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link href="/login">
            <Button size="lg" className="bg-gradient-to-r from-violet-600 to-cyan-600 text-white hover:from-violet-700 hover:to-cyan-700 h-12 px-8 text-base">
              Start Free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link href="#features">
            <Button variant="outline" size="lg" className="h-12 px-8 text-base border-border/60">
              See Features
            </Button>
          </Link>
        </div>

        {/* Feature cards */}
        <section id="features" className="mx-auto mt-32 grid max-w-5xl gap-6 sm:grid-cols-3">
          {[
            {
              icon: <Activity className="h-5 w-5 text-violet-400" />,
              title: "Real-Time Ingestion",
              desc: "Drop in our SDK and stream logs from any backend — Node, Python, Go, or anything that speaks HTTP.",
            },
            {
              icon: <BarChart3 className="h-5 w-5 text-cyan-400" />,
              title: "Smart Dashboards",
              desc: "Uptime, error rates, and crash reports at a glance with auto-generated visualisations.",
            },
            {
              icon: <MessageSquare className="h-5 w-5 text-fuchsia-400" />,
              title: "AI Chat Interface",
              desc: "Ask questions about your logs in plain English and get instant, context-aware answers.",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="group relative rounded-2xl border border-border/50 bg-card/50 p-6 text-left backdrop-blur-sm transition-all hover:border-border hover:bg-card/80 hover:shadow-lg hover:shadow-violet-500/5"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
                {f.icon}
              </div>
              <h3 className="font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                {f.desc}
              </p>
            </div>
          ))}
        </section>

        {/* Trust bar */}
        <div className="mt-24 flex items-center gap-3 text-sm text-muted-foreground">
          <Shield className="h-4 w-4 text-emerald-400" />
          <span>SOC-2 Ready &bull; End-to-end encrypted &bull; Self-host available</span>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 py-8 text-center text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} Signalstack. All rights reserved.
      </footer>
    </div>
  );
}
