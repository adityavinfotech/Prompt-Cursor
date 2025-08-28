"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Edit, Save, X, Plus, Trash2 } from "lucide-react"
import type { Analysis, Question, Assumption } from "@/app/page"

interface EditSectionProps {
  analysis: Analysis
  onSave: (editedAnalysis: Partial<Analysis>) => void
  onCancel: () => void
  isEditing: boolean
  onToggleEdit: () => void
}

export function EditSection({ 
  analysis, 
  onSave, 
  onCancel, 
  isEditing, 
  onToggleEdit 
}: EditSectionProps) {
  const [editedAnalysis, setEditedAnalysis] = useState<Analysis>(analysis)
  const [hasChanges, setHasChanges] = useState(false)

  const updateField = (field: keyof Analysis, value: any) => {
    setEditedAnalysis(prev => ({ ...prev, [field]: value }))
    setHasChanges(true)
  }

  const addListItem = (field: 'goals' | 'constraints' | 'dependencies' | 'edgeCases' | 'acceptanceCriteria') => {
    const currentList = editedAnalysis[field] as string[]
    updateField(field, [...currentList, ""])
  }

  const updateListItem = (
    field: 'goals' | 'constraints' | 'dependencies' | 'edgeCases' | 'acceptanceCriteria', 
    index: number, 
    value: string
  ) => {
    const currentList = editedAnalysis[field] as string[]
    const newList = [...currentList]
    newList[index] = value
    updateField(field, newList)
  }

  const removeListItem = (
    field: 'goals' | 'constraints' | 'dependencies' | 'edgeCases' | 'acceptanceCriteria', 
    index: number
  ) => {
    const currentList = editedAnalysis[field] as string[]
    updateField(field, currentList.filter((_, i) => i !== index))
  }

  const addQuestion = () => {
    const newQuestion: Question = {
      id: `q${Date.now()}`,
      text: "",
      priority: "important",
      answer: ""
    }
    updateField('questions', [...editedAnalysis.questions, newQuestion])
  }

  const updateQuestion = (index: number, field: keyof Question, value: any) => {
    const newQuestions = [...editedAnalysis.questions]
    newQuestions[index] = { ...newQuestions[index], [field]: value }
    updateField('questions', newQuestions)
  }

  const removeQuestion = (index: number) => {
    updateField('questions', editedAnalysis.questions.filter((_, i) => i !== index))
  }

  const addAssumption = () => {
    const newAssumption: Assumption = {
      id: `a${Date.now()}`,
      text: "",
      confidence: 0.7,
      accepted: true
    }
    updateField('assumptions', [...editedAnalysis.assumptions, newAssumption])
  }

  const updateAssumption = (index: number, field: keyof Assumption, value: any) => {
    const newAssumptions = [...editedAnalysis.assumptions]
    newAssumptions[index] = { ...newAssumptions[index], [field]: value }
    updateField('assumptions', newAssumptions)
  }

  const removeAssumption = (index: number) => {
    updateField('assumptions', editedAnalysis.assumptions.filter((_, i) => i !== index))
  }

  const handleSave = () => {
    onSave(editedAnalysis)
    setHasChanges(false)
    onToggleEdit()
  }

  const handleCancel = () => {
    setEditedAnalysis(analysis)
    setHasChanges(false)
    onCancel()
    onToggleEdit()
  }

  const renderEditableList = (
    title: string,
    field: 'goals' | 'constraints' | 'dependencies' | 'edgeCases' | 'acceptanceCriteria',
    icon: React.ReactNode
  ) => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <h4 className="font-medium">{title}</h4>
        </div>
        {isEditing && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => addListItem(field)}
            className="h-8 w-8 p-0"
          >
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </div>
      <div className="space-y-2">
        {(editedAnalysis[field] as string[]).map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            {isEditing ? (
              <>
                <Textarea
                  value={item}
                  onChange={(e) => updateListItem(field, index, e.target.value)}
                  className="min-h-[60px] text-sm"
                  placeholder={`Enter ${title.toLowerCase().slice(0, -1)}...`}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeListItem(field, index)}
                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <p className="text-sm p-2 bg-muted rounded border">{item}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5 text-primary" />
            Analysis Editor
          </CardTitle>
          <div className="flex items-center gap-2">
            {hasChanges && (
              <Badge variant="outline" className="text-yellow-600 border-yellow-300">
                Unsaved Changes
              </Badge>
            )}
            {isEditing ? (
              <>
                <Button variant="outline" size="sm" onClick={handleCancel}>
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSave} disabled={!hasChanges}>
                  <Save className="h-4 w-4 mr-1" />
                  Save Changes
                </Button>
              </>
            ) : (
              <Button variant="outline" size="sm" onClick={onToggleEdit}>
                <Edit className="h-4 w-4 mr-1" />
                Edit Analysis
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Goals */}
        {renderEditableList(
          "Goals",
          "goals",
          <div className="h-4 w-4 bg-green-600 rounded-full" />
        )}

        <Separator />

        {/* Constraints */}
        {renderEditableList(
          "Constraints",
          "constraints",
          <div className="h-4 w-4 bg-orange-600 rounded-full" />
        )}

        <Separator />

        {/* Dependencies */}
        {renderEditableList(
          "Dependencies",
          "dependencies",
          <div className="h-4 w-4 bg-blue-600 rounded-full" />
        )}

        <Separator />

        {/* Edge Cases */}
        {renderEditableList(
          "Edge Cases",
          "edgeCases",
          <div className="h-4 w-4 bg-red-600 rounded-full" />
        )}

        <Separator />

        {/* Acceptance Criteria */}
        {renderEditableList(
          "Acceptance Criteria",
          "acceptanceCriteria",
          <div className="h-4 w-4 bg-purple-600 rounded-full" />
        )}

        <Separator />

        {/* Questions */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Questions</h4>
            {isEditing && (
              <Button
                variant="outline"
                size="sm"
                onClick={addQuestion}
                className="h-8 w-8 p-0"
              >
                <Plus className="h-4 w-4" />
              </Button>
            )}
          </div>
          <div className="space-y-3">
            {editedAnalysis.questions.map((question, index) => (
              <div key={question.id} className="p-3 border rounded-lg space-y-2">
                <div className="flex items-center gap-2">
                  {isEditing ? (
                    <>
                      <Textarea
                        value={question.text}
                        onChange={(e) => updateQuestion(index, 'text', e.target.value)}
                        className="flex-1 min-h-[60px]"
                        placeholder="Enter question..."
                      />
                      <select
                        value={question.priority}
                        onChange={(e) => updateQuestion(index, 'priority', e.target.value)}
                        className="px-2 py-1 border rounded text-sm"
                      >
                        <option value="critical">Critical</option>
                        <option value="important">Important</option>
                        <option value="nice-to-have">Nice to Have</option>
                      </select>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeQuestion(index)}
                        className="h-8 w-8 p-0 text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <p className="flex-1 text-sm">{question.text}</p>
                      <Badge variant="outline" className="text-xs">
                        {question.priority}
                      </Badge>
                    </>
                  )}
                </div>
                {question.answer && !isEditing && (
                  <p className="text-sm text-muted-foreground bg-muted p-2 rounded">
                    Answer: {question.answer}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Assumptions */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Assumptions</h4>
            {isEditing && (
              <Button
                variant="outline"
                size="sm"
                onClick={addAssumption}
                className="h-8 w-8 p-0"
              >
                <Plus className="h-4 w-4" />
              </Button>
            )}
          </div>
          <div className="space-y-3">
            {editedAnalysis.assumptions.map((assumption, index) => (
              <div key={assumption.id} className="p-3 border rounded-lg space-y-2">
                <div className="flex items-start gap-2">
                  {isEditing ? (
                    <>
                      <Textarea
                        value={assumption.text}
                        onChange={(e) => updateAssumption(index, 'text', e.target.value)}
                        className="flex-1 min-h-[60px]"
                        placeholder="Enter assumption..."
                      />
                      <div className="flex flex-col gap-1">
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.1"
                          value={assumption.confidence}
                          onChange={(e) => updateAssumption(index, 'confidence', parseFloat(e.target.value))}
                          className="w-20"
                        />
                        <span className="text-xs text-center">
                          {Math.round(assumption.confidence * 100)}%
                        </span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeAssumption(index)}
                        className="h-8 w-8 p-0 text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <p className="flex-1 text-sm">{assumption.text}</p>
                      <Badge variant={assumption.accepted ? "default" : "secondary"} className="text-xs">
                        {Math.round(assumption.confidence * 100)}% confidence
                      </Badge>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
