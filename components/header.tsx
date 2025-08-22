import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"
import { Brain, Github } from "lucide-react"

export function Header() {
  return (
    <header className="border-b bg-card">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-primary rounded-lg">
              <Brain className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">AI IDE Prompt Agent</h1>
              <p className="text-sm text-muted-foreground">Transform requirements into structured IDE prompts</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2"
              >
                <Github className="h-4 w-4" />
                GitHub
              </a>
            </Button>
            <ModeToggle />
          </div>
        </div>
      </div>
    </header>
  )
}
