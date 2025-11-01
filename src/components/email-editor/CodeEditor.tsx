import { Editor } from '@monaco-editor/react'
import type { editor } from 'monaco-editor'
import { configureMonaco } from '../../utils/configureMonaco'

interface CodeEditorProps {
  value: string
  onChange: (value: string | undefined) => void
  onMount: (editor: editor.IStandaloneCodeEditor) => void
  readOnly?: boolean
}

export default function CodeEditor({ value, onChange, onMount, readOnly = false }: CodeEditorProps) {
  return (
    <div className="h-full w-full">
      <Editor
        height="100%"
        defaultLanguage="typescript"
        value={value}
        onChange={onChange}
        onMount={onMount}
        beforeMount={configureMonaco}
        theme="vs-dark"
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: 'on',
          roundedSelection: true,
          scrollBeyondLastLine: false,
          automaticLayout: true,
          readOnly,
          formatOnPaste: true,
          formatOnType: true,
          tabSize: 2,
          wordWrap: 'on',
        }}
        loading={
          <div className="flex items-center justify-center h-full">
            <div className="text-white">Loading editor...</div>
          </div>
        }
      />
    </div>
  )
}
