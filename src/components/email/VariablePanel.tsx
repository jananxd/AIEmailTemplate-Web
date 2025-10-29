import { useState, useEffect } from 'react'
import { extractVariablesFromJSON } from '../../lib/variableParser'
import type { EmailNode } from '../../types/email'

interface VariablePanelProps {
  blocks: EmailNode[]
  onVariablesChange: (variables: Record<string, string>) => void
}

export default function VariablePanel({ blocks, onVariablesChange }: VariablePanelProps) {
  const [variables, setVariables] = useState<Record<string, string>>({})

  useEffect(() => {
    // Extract all variables from blocks
    const root = { id: 'root', type: 'section' as const, children: blocks }
    const detectedVars = extractVariablesFromJSON(root)

    // Initialize missing variables
    const newVars = { ...variables }
    let hasChanges = false

    detectedVars.forEach((varName) => {
      if (!(varName in newVars)) {
        newVars[varName] = ''
        hasChanges = true
      }
    })

    if (hasChanges) {
      setVariables(newVars)
    }
  }, [blocks])

  const handleChange = (varName: string, value: string) => {
    const updated = { ...variables, [varName]: value }
    setVariables(updated)
    onVariablesChange(updated)
  }

  const varNames = Object.keys(variables)

  if (varNames.length === 0) {
    return null
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">
        Test Variables
      </h3>
      <div className="space-y-2">
        {varNames.map((varName) => (
          <div key={varName}>
            <label className="block text-xs text-gray-600 mb-1">
              {varName}
            </label>
            <input
              type="text"
              value={variables[varName]}
              onChange={(e) => handleChange(varName, e.target.value)}
              placeholder={`Enter ${varName}...`}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        ))}
      </div>
    </div>
  )
}
