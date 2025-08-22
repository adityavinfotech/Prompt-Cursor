"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { History, Clock, FileText, Zap } from "lucide-react"
import type { Session } from "@/app/page"

interface HistoryPanelProps {
  sessions: Session[]
  onLoadSession: (session: Session) => void
}

export function HistoryPanel({ sessions, onLoadSession }: HistoryPanelProps) {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  const truncateText = (text: string, maxLength = 100) => {
    return text.length > maxLength ? text.substring(0, maxLength) + "..." : text
  }

  if (sessions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            Session History
          </CardTitle>
          <CardDescription>Your previous prompt generation sessions will appear here</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No sessions yet</p>
            <p className="text-sm text-muted-foreground mt-1">Generate your first prompt to see it here</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5 text-primary" />
          Session History
        </CardTitle>
        <CardDescription>Browse and restore previous prompt generation sessions</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sessions.map((session, index) => (
            <div key={session.id}>
              <div className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{formatDate(session.timestamp)}</span>
                    <div className="flex gap-1">
                      {session.analysis && (
                        <Badge variant="secondary" className="text-xs">
                          <FileText className="h-3 w-3 mr-1" />
                          Analyzed
                        </Badge>
                      )}
                      {session.prompts && (
                        <Badge variant="secondary" className="text-xs">
                          <Zap className="h-3 w-3 mr-1" />
                          Prompts
                        </Badge>
                      )}
                    </div>
                  </div>

                  <p className="text-sm font-medium">{truncateText(session.requirement)}</p>

                  {session.analysis && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      <Badge variant="outline" className="text-xs">
                        {session.analysis.goals.length} goals
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {session.analysis.questions.length} questions
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {session.analysis.assumptions.length} assumptions
                      </Badge>
                    </div>
                  )}
                </div>

                <Button variant="outline" size="sm" onClick={() => onLoadSession(session)} className="ml-4">
                  Load
                </Button>
              </div>
              {index < sessions.length - 1 && <Separator className="mt-4" />}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
