import { useState, useCallback, useRef, useEffect } from 'react'
import type { editor } from 'monaco-editor'

export interface UseCodeEditorOptions {
  initialValue?: string
  onChange?: (value: string) => void
}

export function useCodeEditor({ initialValue = '', onChange }: UseCodeEditorOptions = {}) {
  const [code, setCode] = useState(initialValue)
  const [isDirty, setIsDirty] = useState(false)
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)

  // Update code when initialValue changes (e.g., when email data loads)
  useEffect(() => {
    if (initialValue && initialValue !== code && !isDirty) {
      console.log('useCodeEditor: Updating code from initialValue, length:', initialValue.length)
      setCode(initialValue)
    }
  }, [initialValue, code, isDirty])

  const handleEditorChange = useCallback((value: string | undefined) => {
    const newValue = value || ''
    setCode(newValue)
    setIsDirty(newValue !== initialValue)
    onChange?.(newValue)
  }, [initialValue, onChange])

  const handleEditorDidMount = useCallback((editor: editor.IStandaloneCodeEditor) => {
    editorRef.current = editor

    // Add keyboard shortcut for save (Cmd/Ctrl+S)
    editor.addCommand(
      // Monaco KeyMod and KeyCode
      2048 | 49, // Ctrl/Cmd + S
      () => {
        // Dispatch custom event for save
        window.dispatchEvent(new CustomEvent('editor-save'))
      }
    )
  }, [])

  const resetDirty = useCallback(() => {
    setIsDirty(false)
  }, [])

  const formatCode = useCallback(() => {
    if (editorRef.current) {
      editorRef.current.getAction('editor.action.formatDocument')?.run()
    }
  }, [])

  return {
    code,
    isDirty,
    editorRef,
    handleEditorChange,
    handleEditorDidMount,
    resetDirty,
    formatCode,
  }
}
