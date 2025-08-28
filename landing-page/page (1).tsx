"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { RequirementInput } from "@/components/requirement-input"
import { AnalysisModal } from "@/components/analysis-modal"
import { PromptsPage } from "@/components/prompts-page"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import type { Analysis, GeneratedPrompts, Session } from "@/types"

export default function AppPage() {
  const [requirement, setRequirement] = useState("")
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [prompts, setPrompts] = useState<GeneratedPrompts | null>(null)
  const [sessions, setSessions] = useState<Session[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [currentPage, setCurrentPage] = useState<"requirement" | "analyse" | "prompt">("requirement")
  const [showAnalysisModal, setShowAnalysisModal] = useState(false)

  const handleAnalyze = async () => {
    if (!requirement.trim()) return

    setIsAnalyzing(true)

    setTimeout(() => {
      const mockAnalysis: Analysis = {
        goals: [
          "Implement OAuth authentication",
          "Support Google and GitHub providers",
          "Secure user session management",
        ],
        constraints: [
          "Must use secure cookie storage",
          "Implement proper error handling",
          "Follow OAuth 2.0 standards",
        ],
        dependencies: [
          "OAuth provider configuration",
          "Session management library",
          "Environment variables for client secrets",
        ],
        edgeCases: [
          "User denies OAuth permission",
          "Network timeout during authentication",
          "Invalid or expired tokens",
        ],
        acceptanceCriteria: [
          "Users can sign in with Google",
          "Users can sign in with GitHub",
          "Sessions persist across browser restarts",
          "Proper error messages for failed authentication",
        ],
        questions: [
          {
            id: "1",
            text: "Which framework are you using (Next.js, React, etc.)?",
            priority: "critical",
          },
          {
            id: "2",
            text: "What user roles or permissions are needed?",
            priority: "important",
          },
          {
            id: "3",
            text: "Should sign-up be restricted to specific domains?",
            priority: "nice-to-have",
          },
        ],
        assumptions: [
          {
            id: "1",
            text: "Using standard OAuth 2.0 flow",
            confidence: 0.9,
            accepted: true,
          },
          {
            id: "2",
            text: "Redirect to dashboard after login",
            confidence: 0.7,
            accepted: true,
          },
          {
            id: "3",
            text: "Store minimal user profile data",
            confidence: 0.8,
            accepted: true,
          },
        ],
      }

      setAnalysis(mockAnalysis)
      setIsAnalyzing(false)
      setShowAnalysisModal(true)
    }, 2000)
  }

  const handleGeneratePrompts = async () => {
    if (!analysis) return

    setIsGenerating(true)

    setTimeout(() => {
      const mockPrompts: GeneratedPrompts = {
        cursor: `# OAuth Authentication Implementation

## Goal
Implement OAuth authentication with Google and GitHub providers for secure user login.

## Context
- Framework: Next.js (assumed)
- Authentication flow: OAuth 2.0
- Session management: Secure cookies
- User roles: Standard user access

## Requirements
- Support Google OAuth
- Support GitHub OAuth  
- Secure session handling
- Proper error handling
- Redirect to dashboard after login

## Implementation Plan
1. Install authentication library (NextAuth.js recommended)
2. Configure OAuth providers in environment
3. Create authentication API routes
4. Implement login/logout components
5. Add session middleware
6. Handle error states

## Acceptance Criteria
- Users can sign in with Google
- Users can sign in with GitHub
- Sessions persist across browser restarts
- Proper error messages for failed authentication

## Output Format
Provide working code with proper TypeScript types and error handling.`,

        copilot: `Create OAuth authentication system with the following specifications:

GOAL: Implement secure OAuth login with Google and GitHub

TECHNICAL REQUIREMENTS:
- OAuth 2.0 standard compliance
- Secure cookie-based sessions
- Support for Google and GitHub providers
- Proper error handling and user feedback
- Redirect to dashboard after successful login

IMPLEMENTATION STEPS:
1. Set up OAuth provider configurations
2. Create authentication routes and handlers
3. Implement login/logout UI components
4. Add session management middleware
5. Handle authentication errors gracefully

CONSTRAINTS:
- Must store minimal user data
- Follow security best practices
- Implement proper CSRF protection
- Use environment variables for secrets

Please generate the complete authentication system with TypeScript support.`,

        warp: `# OAuth Authentication Setup

## Objective
Build OAuth authentication supporting Google and GitHub login

## Technical Specs
- OAuth 2.0 implementation
- Secure session management
- Error handling for auth failures
- Dashboard redirect on success

## Development Tasks
1. Configure OAuth applications (Google/GitHub)
2. Set up authentication library
3. Create login/logout flows
4. Implement session middleware
5. Add error handling

## Environment Setup
- GOOGLE_CLIENT_ID
- GOOGLE_CLIENT_SECRET  
- GITHUB_CLIENT_ID
- GITHUB_CLIENT_SECRET
- NEXTAUTH_SECRET
- NEXTAUTH_URL

Generate the authentication system with proper security measures.`,

        windsurf: `## OAuth Authentication Implementation

### Project Goal
Create secure OAuth authentication system with Google and GitHub providers

### Technical Requirements
- OAuth 2.0 standard implementation
- Secure cookie-based session management
- Support for multiple OAuth providers (Google, GitHub)
- Comprehensive error handling
- Post-login dashboard redirect

### Architecture Components
1. **Authentication Provider Setup**
   - Google OAuth configuration
   - GitHub OAuth configuration
   - Environment variable management

2. **Session Management**
   - Secure cookie storage
   - Session persistence
   - Automatic token refresh

3. **UI Components**
   - Login form with provider buttons
   - Logout functionality
   - Loading and error states

4. **Security Measures**
   - CSRF protection
   - Secure token storage
   - Input validation

### Implementation Approach
Build a complete authentication system following OAuth 2.0 standards with proper TypeScript typing and comprehensive error handling.`,
      }

      setPrompts(mockPrompts)
      setIsGenerating(false)
      setCurrentPage("prompt")
      setShowAnalysisModal(false)
    }, 1500)
  }

  const handleUpdateAnalysis = (updatedAnalysis: Analysis) => {
    setAnalysis(updatedAnalysis)
    setPrompts(null)
  }

  const renderNavigation = () => (
    <div className="flex justify-center mb-8">
      <div className="flex bg-muted p-1 rounded-full border">
        <Button
          variant={currentPage === "requirement" ? "default" : "ghost"}
          onClick={() => setCurrentPage("requirement")}
          className="rounded-full px-6"
        >
          Requirement
        </Button>
        <Button
          variant={currentPage === "analyse" ? "default" : "ghost"}
          onClick={() => setCurrentPage("analyse")}
          className="rounded-full px-6"
          disabled={!analysis}
        >
          Analyse
        </Button>
        <Button
          variant={currentPage === "prompt" ? "default" : "ghost"}
          onClick={() => setCurrentPage("prompt")}
          className="rounded-full px-6"
          disabled={!prompts}
        >
          Prompt
        </Button>
      </div>
    </div>
  )

  const renderPageContent = () => {
    switch (currentPage) {
      case "requirement":
        return (
          <div className="max-w-2xl mx-auto">
            <RequirementInput
              value={requirement}
              onChange={setRequirement}
              onAnalyze={handleAnalyze}
              isAnalyzing={isAnalyzing}
            />
          </div>
        )
      case "analyse":
        return (
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <h2 className="text-2xl font-bold mb-4">Analysis Complete</h2>
                  <p className="text-muted-foreground mb-6">
                    Your requirement has been analyzed. Click below to view details or generate prompts.
                  </p>
                  <div className="flex gap-4 justify-center">
                    <Button onClick={() => setShowAnalysisModal(true)} variant="outline">
                      View Analysis Details
                    </Button>
                    <Button onClick={handleGeneratePrompts} disabled={isGenerating}>
                      {isGenerating ? "Generating..." : "Generate Prompts"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )
      case "prompt":
        return prompts ? <PromptsPage prompts={prompts} /> : null
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-6">
        {renderNavigation()}
        {renderPageContent()}
      </div>

      {showAnalysisModal && analysis && (
        <AnalysisModal
          analysis={analysis}
          onUpdate={handleUpdateAnalysis}
          onGeneratePrompts={handleGeneratePrompts}
          isGenerating={isGenerating}
          onClose={() => setShowAnalysisModal(false)}
        />
      )}
    </div>
  )
}
