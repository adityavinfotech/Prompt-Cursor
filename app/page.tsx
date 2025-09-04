"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Sparkles, Code, Zap, Users, Shield, Rocket, Moon, Sun } from "lucide-react"
import Link from "next/link"
import { useTheme } from "next-themes"

export interface RequirementFormData {
  taskType?: string
  goal?: string
  components?: string[]
  inputs?: string
  outputs?: string
  referenceFiles?: File[]
  referenceFileContents?: { name: string; content: string; type: string }[]
  referenceUrls?: string[]
  requirement?: string
  context?: string
}

export interface Question {
  id: string
  text: string
  priority: "critical" | "important" | "nice-to-have"
  answer?: string
}

export interface Assumption {
  id: string
  text: string
  confidence: number
  accepted: boolean
}

export interface Analysis {
  goals: string[]
  constraints: string[]
  dependencies: string[]
  edgeCases: string[]
  acceptanceCriteria: string[]
  questions: Question[]
  assumptions: Assumption[]
}

export interface GeneratedPrompts {
  cursor: string
  copilot: string
  warp: string
  windsurf: string
}

export interface EditedPrompts {
  cursor?: string
  copilot?: string
  warp?: string
  windsurf?: string
}

export interface Session {
  id: string
  timestamp: Date
  requirement: string
  formData?: RequirementFormData
  analysis?: Analysis
  prompts?: GeneratedPrompts
  editedPrompts?: EditedPrompts
}

export default function LandingPage() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="min-h-screen bg-background dark:bg-gradient-to-br dark:from-background dark:via-background dark:to-purple-950/20">
      {/* Glassmorphism Navigation */}
      <nav className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-4xl px-4">
        <div className="glass dark:glass-dark rounded-full px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg">AI Prompt Architect</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/app" className="text-sm hover:text-primary transition-colors">
              Features
            </Link>
            <Link href="/app" className="text-sm hover:text-primary transition-colors">
              Pricing
            </Link>
            <button
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              className="p-2 rounded-full hover:bg-white/10 dark:hover:bg-black/10 transition-colors relative"
              aria-label="Toggle theme"
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute top-2 left-2 h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </button>
            <Link href="/app">
              <Button size="sm" className="rounded-full">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 gradient-bg" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />

        {/* Curved Light Element */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-primary/20 to-transparent rounded-t-[100%] transform scale-x-150" />

        <div className="relative z-10 text-center max-w-4xl mx-auto">
          <Badge variant="secondary" className="mb-6 glass dark:glass-dark border-0">
            <Sparkles className="w-3 h-3 mr-1" />
            Powered by Advanced AI
          </Badge>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 text-balance">
            Transform Requirements into
            <span className="text-primary block">Perfect AI Prompts</span>
          </h1>

          <p className="text-xl md:text-2xl text-muted-foreground mb-8 text-pretty max-w-2xl mx-auto leading-relaxed">
            Generate structured, IDE-optimized prompts from your development requirements. Boost productivity with
            AI-powered analysis and multi-platform compatibility.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Link href="/app">
              <Button size="lg" className="rounded-full px-8 py-6 text-lg group">
                Start Building
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Button
              variant="outline"
              size="lg"
              className="rounded-full px-8 py-6 text-lg glass dark:glass-dark border-0 bg-transparent"
            >
              Watch Demo
            </Button>
          </div>

          {/* Email Signup */}
          <div className="glass dark:glass-dark rounded-2xl p-6 max-w-md mx-auto">
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 bg-input border-0 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary/50 outline-none"
              />
              <Button className="rounded-lg px-6">Join Waitlist</Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">We'll notify you when we launch.</p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Everything you need to
              <span className="text-primary block">supercharge development</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-pretty">
              From requirement analysis to IDE-specific prompts, we've got every step of your workflow covered.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: <Code className="w-8 h-8" />,
                title: "Multi-Step Analysis",
                description:
                  "Break down complex requirements into structured, actionable components with AI-powered analysis.",
              },
              {
                icon: <Zap className="w-8 h-8" />,
                title: "IDE Optimization",
                description:
                  "Generate prompts tailored for Cursor, Copilot, Warp, and Windsurf with platform-specific formatting.",
              },
              {
                icon: <Users className="w-8 h-8" />,
                title: "Team Collaboration",
                description:
                  "Share and iterate on prompts with your team. Keep everyone aligned on project requirements.",
              },
              {
                icon: <Shield className="w-8 h-8" />,
                title: "Smart Validation",
                description: "Automatic validation of requirements with edge case detection and assumption tracking.",
              },
              {
                icon: <Rocket className="w-8 h-8" />,
                title: "Instant Generation",
                description: "Transform requirements into production-ready prompts in seconds, not hours.",
              },
              {
                icon: <Sparkles className="w-8 h-8" />,
                title: "AI-Powered Insights",
                description: "Get intelligent suggestions for improving your requirements and development approach.",
              },
            ].map((feature, index) => (
              <Card
                key={index}
                className="glass dark:glass-dark border-0 hover:scale-105 transition-transform duration-300"
              >
                <CardContent className="p-6">
                  <div className="text-primary mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="glass dark:glass-dark rounded-3xl p-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to transform your
              <span className="text-primary block">development workflow?</span>
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join thousands of developers who are already using AI Prompt Architect to streamline their coding process.
            </p>
            <Link href="/app">
              <Button size="lg" className="rounded-full px-12 py-6 text-lg">
                Get Started Free
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-border/50">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-bold text-lg">AI Prompt Architect</span>
            </div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <Link href="#" className="hover:text-primary transition-colors">
                Privacy
              </Link>
              <Link href="#" className="hover:text-primary transition-colors">
                Terms
              </Link>
              <Link href="#" className="hover:text-primary transition-colors">
                Support
              </Link>
            </div>
          </div>
          <div className="text-center text-sm text-muted-foreground mt-8">
            2024 AI Prompt Architect. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
