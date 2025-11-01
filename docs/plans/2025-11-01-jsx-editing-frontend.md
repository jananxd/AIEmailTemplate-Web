# JSX Editing Support - Frontend Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Integrate backend JSX parsing API with existing Monaco editor to enable users to edit emails as React Email JSX and save to backend.

**Architecture:** Update existing Code tab to send JSX to backend's new parse endpoint, handle `jsx_source` field in API responses, remove placeholder `codeToCanvas` implementation, and rely on backend for JSX→JSON transformation.

**Tech Stack:** React 19, TypeScript, Monaco Editor, @babel/standalone, TanStack Query, Zustand

**Codebase:** `/Users/johncarlomiel/development/personal/AIEmailTemplate-Web`

---

## Task 1: Update Email Type to Include jsx_source

**Files:**
- Modify: `src/types/email.ts`

**Step 1: Add jsx_source field to Email interface**

Modify `src/types/email.ts`:

```typescript
export interface Email {
  id: string
  meta: EmailMeta
  jsonStructure: EmailJSON
  jsxSource?: string | null  // Add this line
  variables: string[]
  prompt: string
  attachedImage?: string
  projectId?: string
  createdAt: string
  updatedAt: string
}
```

**Step 2: Verify TypeScript compiles**

```bash
bun run build
```

Expected: No TypeScript errors

**Step 3: Commit**

```bash
git add src/types/email.ts
git commit -m "feat: add jsx_source field to Email type"
```

---

## Task 2: Update API Client to Handle jsx_source

**Files:**
- Modify: `src/lib/api.ts`

**Step 1: Update transformEmailResponse to include jsx_source**

Find the `transformEmailResponse` function (around line 10) and update it:

```typescript
function transformEmailResponse(backendEmail: any): Email {
  return {
    id: backendEmail.id,
    meta: {
      subject: backendEmail.subject || '',
      previewText: backendEmail.preview || '',
    },
    jsonStructure: backendEmail.json_state,
    jsxSource: backendEmail.jsx_source || null,  // Add this line
    variables: backendEmail.variables || [],
    prompt: backendEmail.prompt || '',
    attachedImage: backendEmail.attached_image,
    projectId: backendEmail.project_id,
    createdAt: backendEmail.created_at,
    updatedAt: backendEmail.updated_at,
  }
}
```

**Step 2: Update updateEmail to support jsx_source parameter**

Find the `updateEmail` method in the `ApiClient` class and update it to accept `jsx_source`:

```typescript
async updateEmail(id: string, data: Partial<Email>): Promise<Email> {
  const payload: any = {}

  // Map camelCase to snake_case for backend
  if (data.meta !== undefined) {
    payload.subject = data.meta.subject
    payload.preview = data.meta.previewText
  }

  if (data.jsonStructure !== undefined) {
    payload.json_state = data.jsonStructure
  }

  // Add jsx_source support
  if (data.jsxSource !== undefined) {
    payload.jsx_source = data.jsxSource
  }

  const response = await this.request<any>(`/emails/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })

  return transformEmailResponse(response)
}
```

**Step 3: Test type checking**

```bash
bun run build
```

Expected: No TypeScript errors

**Step 4: Commit**

```bash
git add src/lib/api.ts
git commit -m "feat: add jsx_source support to API client"
```

---

## Task 3: Remove Placeholder codeToCanvas Implementation

**Files:**
- Modify: `src/utils/codeToCanvas.ts`

**Step 1: Remove placeholder codeToCanvas (no longer needed)**

Since backend now handles JSX→JSON parsing, we don't need the frontend placeholder.

Replace `src/utils/codeToCanvas.ts` with a note that this is handled by backend:

```typescript
/**
 * JSX to Canvas parsing is now handled by the backend.
 *
 * The backend provides a PATCH /emails/:id endpoint that accepts jsx_source
 * and returns the parsed json_state.
 *
 * This file is kept for backward compatibility but should not be used.
 */

export interface ParseResult {
  success: boolean
  blocks?: any[]
  error?: string
}

/**
 * @deprecated Use backend API endpoint instead: PATCH /emails/:id with { jsx_source }
 */
export function codeToCanvas(_code: string): ParseResult {
  console.warn('codeToCanvas is deprecated. Backend handles JSX parsing now.')

  return {
    success: true,
    blocks: [],
    error: undefined,
  }
}
```

**Step 2: Verify build still works**

```bash
bun run build
```

Expected: No errors (function is still exported for backward compat)

**Step 3: Commit**

```bash
git add src/utils/codeToCanvas.ts
git commit -m "refactor: deprecate codeToCanvas in favor of backend parsing"
```

---

## Task 4: Update CodeTab to Use jsx_source from Backend

**Files:**
- Modify: `src/pages/EmailDetail.tsx`

**Step 1: Update initial code loading to use jsx_source**

Find the `useEffect` that sets `codeEditorValue` (around line 35) and update it:

```typescript
// Update code when email data changes
useEffect(() => {
  if (data && !isCodeDirty) {
    // Use jsx_source from backend if available
    if (data.jsxSource) {
      setCodeEditorValue(data.jsxSource)
    } else {
      // Fallback: generate JSX from jsonStructure (for legacy emails)
      const generatedCode = canvasToCode(data.jsonStructure.root.children || [])
      setCodeEditorValue(generatedCode)
    }
  }
}, [data, isCodeDirty])
```

**Step 2: Update handleSaveCode to send jsx_source to backend**

Replace the `handleSaveCode` function (around line 101) with this new implementation:

```typescript
const handleSaveCode = async (code: string) => {
  try {
    // Send JSX to backend - it will parse and validate
    await updateEmail.mutateAsync({
      id: email.id,
      data: {
        jsxSource: code, // Backend parses this to json_state
      },
    })

    setIsCodeDirty(false)
    setCodeEditorValue(code)
    toast.success('Code saved successfully')
  } catch (error: any) {
    // Backend returns helpful error messages for invalid JSX
    const errorMessage = error.details || error.error || 'Failed to save code'
    toast.error(errorMessage)
    throw error
  }
}
```

**Step 3: Remove unused codeToCanvas import and calls**

Since we're no longer using client-side parsing, remove the import and parsing logic:

```typescript
// Remove this import at the top
// import { codeToCanvas } from '../utils/codeToCanvas'

// Update the save handler to remove parsing check
// The old code had:
// const parseResult = codeToCanvas(code)
// if (!parseResult.success) { ... }
//
// This is now removed - backend handles parsing
```

**Step 4: Test manually**

Start the dev server:
```bash
bun run dev
```

1. Open an existing email in Code tab
2. Edit the JSX code
3. Save with Cmd/Ctrl+S
4. Verify it saves successfully
5. Try saving invalid JSX (e.g., `<Text>unclosed`)
6. Verify you get helpful error message from backend

Expected:
- Valid JSX saves successfully
- Invalid JSX shows backend error message
- Code persists after page refresh

**Step 5: Commit**

```bash
git add src/pages/EmailDetail.tsx
git commit -m "feat: integrate backend JSX parsing with Code tab"
```

---

## Task 5: Update CodeTab to Show Better Error Messages

**Files:**
- Modify: `src/components/email-editor/CodeTab.tsx`

**Step 1: Remove client-side validation (backend validates now)**

Update `src/components/email-editor/CodeTab.tsx`:

Remove the `validateCode` import and validation logic since backend now handles it:

```typescript
// Remove this import
// import { validateCode } from '../../utils/validateCode'

// Update handleSave to remove client-side validation
const handleSave = useCallback(async () => {
  // Remove validation check - backend will validate
  // const validation = validateCode(code)
  // if (!validation.isValid) {
  //   setValidationErrors(validation.errors)
  //   return
  // }

  try {
    setValidationErrors([])
    await onSave(code)
    resetDirty()
  } catch (error: any) {
    // Show backend error message
    const errorMsg = error.details || error.error || 'Failed to save'
    setValidationErrors([errorMsg])
  }
}, [code, onSave, resetDirty])
```

**Step 2: Update error display to show backend errors**

The error display already exists, but update the message to indicate errors come from backend:

```typescript
{validationErrors.length > 0 && (
  <div className="bg-red-600 text-white px-3 py-2 rounded text-sm">
    <strong>JSX Parsing Error:</strong>
    <ul className="mt-1 ml-4 list-disc">
      {validationErrors.map((error, i) => (
        <li key={i}>{error}</li>
      ))}
    </ul>
  </div>
)}
```

**Step 3: Test error handling**

```bash
bun run dev
```

1. Open Code tab
2. Write invalid JSX: `<Text>Missing closing tag`
3. Try to save
4. Verify backend error shows: "JSX parsing failed: SyntaxError: ..."

Expected: Clear error message from backend displayed

**Step 4: Commit**

```bash
git add src/components/email-editor/CodeTab.tsx
git commit -m "feat: show backend JSX parsing errors in Code tab"
```

---

## Task 6: Update Canvas→Code Generation to Match Backend Format

**Files:**
- Modify: `src/utils/canvasToCode.ts`

**Step 1: Update canvasToCode to generate backend-compatible JSX**

The current `canvasToCode` generates JSX with Tailwind classes, but backend expects React Email components with style props.

Update `src/utils/canvasToCode.ts` to match backend's JSX format:

```typescript
import type { EmailNode } from '../types/email'

/**
 * Convert Canvas blocks to React Email JSX (backend-compatible format)
 */
export function canvasToCode(blocks: EmailNode[]): string {
  const blockToJSX = (block: EmailNode, indent = 6): string => {
    const spaces = ' '.repeat(indent)

    switch (block.type) {
      case 'heading': {
        const level = block.level || 1
        return `${spaces}<Heading as="h${level}">${block.text || ''}</Heading>`
      }

      case 'text':
        return `${spaces}<Text>${block.text || ''}</Text>`

      case 'button':
        return `${spaces}<Button href="${block.href || '#'}">${block.label || 'Click me'}</Button>`

      case 'image':
        return `${spaces}<Img src="${block.src || ''}" alt="${block.alt || ''}" width={${block.width || 600}} height={${block.height || 400}} />`

      case 'divider':
        return `${spaces}<Hr style={{ borderColor: '${block.color || '#E5E7EB'}', width: '${block.width || 100}%' }} />`

      case 'spacer':
        return `${spaces}<Section style={{ height: '${block.height || 20}px' }} />`

      case 'section': {
        const children = block.children?.map(child => blockToJSX(child, indent + 2)).join('\n') || ''
        const bgColor = block.backgroundColor || '#FFFFFF'
        const padding = block.padding || '20px'
        return `${spaces}<Section style={{ backgroundColor: '${bgColor}', padding: '${padding}' }}>\n${children}\n${spaces}</Section>`
      }

      default:
        return ''
    }
  }

  const blocksJSX = blocks.map(block => blockToJSX(block, 6)).join('\n\n')

  // Generate backend-compatible JSX format
  return `<Html>
  <Head>
    <title>Email Template</title>
  </Head>
  <Preview>Email preview text</Preview>
  <Body style={{ backgroundColor: '#f6f9fc', margin: '0' }}>
    <Container style={{ width: '600px', maxWidth: '100%', margin: '0 auto', background: '#fff', padding: '20px' }}>
${blocksJSX}
    </Container>
  </Body>
</Html>`
}
```

**Step 2: Test Canvas→Code generation**

```bash
bun run dev
```

1. Go to Canvas tab
2. Add some blocks (heading, text, button)
3. Switch to Code tab
4. Verify JSX format matches backend expectation (no import statements, clean JSX)

Expected: JSX shows `<Html>`, `<Body>`, `<Container>` structure

**Step 3: Commit**

```bash
git add src/utils/canvasToCode.ts
git commit -m "feat: update canvasToCode to generate backend-compatible JSX"
```

---

## Task 7: Handle jsx_source in Generated Emails

**Files:**
- Modify: `src/lib/api.ts` (if not already done in Task 2)

**Step 1: Verify generateEmail response includes jsx_source**

Check that the `generateEmail` method in `src/lib/api.ts` properly transforms the response:

```typescript
async generateEmail(data: GenerateEmailRequest): Promise<{ email: Email; generated?: boolean }> {
  const formData = new FormData()
  formData.append('prompt', data.prompt)

  if (data.projectId) {
    formData.append('project_id', data.projectId)
  }

  if (data.attachedImage) {
    formData.append('attached_image', data.attachedImage)
  }

  if (data.userId) {
    formData.append('user_id', data.userId)
  }

  const headers: HeadersInit = {
    ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
  }

  const response = await fetch(`${this.baseURL}/emails/generate`, {
    method: 'POST',
    headers,
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      error: 'UnknownError',
      message: 'An unknown error occurred',
    }))
    throw error
  }

  const result = await response.json()

  return {
    email: transformEmailResponse(result.email),  // Includes jsx_source
    generated: result.generated,
  }
}
```

**Step 2: Test email generation**

```bash
bun run dev
```

1. Generate a new email
2. Open it in Code tab
3. Verify JSX code appears (from backend's `jsx_source`)

Expected: Generated emails have JSX code ready to edit

**Step 3: Commit (if changes needed)**

```bash
git add src/lib/api.ts
git commit -m "feat: ensure generateEmail includes jsx_source"
```

---

## Task 8: Add JSX Syntax Highlighting Improvements

**Files:**
- Modify: `src/components/email-editor/CodeEditor.tsx`

**Step 1: Update Monaco language to typescript/tsx for better JSX support**

The current code already uses `typescript` language which supports JSX. Let's verify the configuration:

```typescript
// Already in CodeEditor.tsx - verify this exists:
<Editor
  height="100%"
  defaultLanguage="typescript"  // ✓ Correct - supports JSX
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
/>
```

**Step 2: Verify configureMonaco provides React Email autocomplete**

Check `src/utils/configureMonaco.ts` to ensure React Email components are available:

```bash
cat src/utils/configureMonaco.ts
```

If it doesn't exist or needs updating, create/update it:

```typescript
import type { Monaco } from '@monaco-editor/react'

export function configureMonaco(monaco: Monaco) {
  // Add React Email components to autocomplete
  monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
    jsx: monaco.languages.typescript.JsxEmit.React,
    target: monaco.languages.typescript.ScriptTarget.ES2020,
    esModuleInterop: true,
    allowSyntheticDefaultImports: true,
  })

  // Add custom type definitions for React Email components
  const reactEmailTypes = `
    declare module '@react-email/components' {
      export const Html: any;
      export const Head: any;
      export const Body: any;
      export const Container: any;
      export const Section: any;
      export const Text: any;
      export const Heading: any;
      export const Button: any;
      export const Img: any;
      export const Hr: any;
      export const Link: any;
      export const Preview: any;
    }
  `

  monaco.languages.typescript.typescriptDefaults.addExtraLib(
    reactEmailTypes,
    'file:///node_modules/@react-email/components/index.d.ts'
  )
}
```

**Step 3: Test autocomplete**

```bash
bun run dev
```

1. Open Code tab
2. Start typing `<T` - should suggest `<Text>`
3. Start typing `<B` - should suggest `<Button>`, `<Body>`

Expected: Autocomplete shows React Email components

**Step 4: Commit**

```bash
git add src/utils/configureMonaco.ts src/components/email-editor/CodeEditor.tsx
git commit -m "feat: improve JSX autocomplete for React Email components"
```

---

## Task 9: Add Loading State for JSX Source

**Files:**
- Modify: `src/pages/EmailDetail.tsx`

**Step 1: Show loading indicator while backend generates JSX**

For legacy emails without `jsx_source`, the backend generates it on-demand. Add a loading state:

```typescript
// In EmailDetail.tsx, add loading state
const [isLoadingJSX, setIsLoadingJSX] = useState(false)

// Update the useEffect that loads code
useEffect(() => {
  if (data && !isCodeDirty) {
    if (data.jsxSource) {
      // JSX already available
      setCodeEditorValue(data.jsxSource)
      setIsLoadingJSX(false)
    } else {
      // Fallback: generate JSX from jsonStructure (shown to user immediately)
      setIsLoadingJSX(true)
      const generatedCode = canvasToCode(data.jsonStructure.root.children || [])
      setCodeEditorValue(generatedCode)
      setIsLoadingJSX(false)
    }
  }
}, [data, isCodeDirty])
```

**Step 2: Pass loading state to CodeTab**

```typescript
// Update CodeTab rendering
<CodeTab
  initialCode={codeEditorValue}
  onSave={handleSaveCode}
  isLoading={isLoadingJSX}  // Add this prop
/>
```

**Step 3: Update CodeTab to show loading state**

```typescript
// In CodeTab.tsx, add isLoading prop
interface CodeTabProps {
  initialCode: string
  onSave: (code: string) => Promise<void>
  isLoading?: boolean  // Add this
}

export default function CodeTab({ initialCode, onSave, isLoading = false }: CodeTabProps) {
  // ... existing code ...

  // Show loading overlay if needed
  {isLoading && (
    <div className="absolute inset-0 bg-gray-900/50 flex items-center justify-center z-20">
      <div className="bg-white rounded-lg p-6">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto" />
        <p className="mt-4 text-gray-900">Generating JSX...</p>
      </div>
    </div>
  )}
}
```

**Step 4: Test loading state**

Since backend auto-generates JSX instantly, this is more of a safeguard. Loading should be nearly instant.

**Step 5: Commit**

```bash
git add src/pages/EmailDetail.tsx src/components/email-editor/CodeTab.tsx
git commit -m "feat: add loading state for JSX generation"
```

---

## Task 10: Update Documentation

**Files:**
- Create: `docs/jsx-editing-guide.md`

**Step 1: Create user guide for JSX editing**

Create `docs/jsx-editing-guide.md`:

```markdown
# JSX Editing Guide

## Overview

The Code tab allows you to edit emails as React Email JSX code. Changes are automatically parsed by the backend and synced with the Canvas view.

## How It Works

1. **Load Email** - Opens with JSX code in Monaco editor
2. **Edit JSX** - Make changes using React Email components
3. **Save** - Press `Cmd/Ctrl+S` or click "Save" button
4. **Backend Parses** - Server validates and converts JSX → JSON
5. **Canvas Syncs** - Canvas view updates with your changes

## Supported Components

### Text Components
- `<Text>` - Plain text paragraph
- `<Heading as="h1|h2|h3">` - Headings

### Interactive Components
- `<Button href="#">` - Call-to-action button
- `<Link href="#">` - Text link

### Media
- `<Img src="" alt="" width={} height={} />` - Images

### Layout
- `<Section>` - Container section
- `<Hr />` - Horizontal divider

### Structure (Required)
- `<Html>` - Root element
- `<Head>` - Email metadata
- `<Preview>` - Email preview text
- `<Body>` - Email body
- `<Container>` - Content container

## Example Template

\`\`\`tsx
<Html>
  <Head>
    <title>Welcome Email</title>
  </Head>
  <Preview>Welcome to our platform!</Preview>
  <Body style={{ backgroundColor: '#f6f9fc', margin: '0' }}>
    <Container style={{ width: '600px', maxWidth: '100%', margin: '0 auto', background: '#fff', padding: '20px' }}>
      <Heading as="h1">Welcome, {{firstName}}!</Heading>
      <Text>Thanks for signing up.</Text>
      <Button href="https://example.com/get-started">Get Started</Button>
    </Container>
  </Body>
</Html>
\`\`\`

## Template Variables

Use `{{variableName}}` syntax for dynamic content:
- `{{firstName}}` - User's first name
- `{{company}}` - Company name
- Any custom variables

## Error Handling

If your JSX is invalid, the backend will return a helpful error message:

**Common Errors:**
- `SyntaxError: Unexpected token` - Missing closing tag
- `Unknown component: Foo` - Using unsupported component
- `Validation failed` - Invalid props or structure

**Fix:** Check the error message, correct the JSX, and save again.

## Tips

1. **Use Autocomplete** - Start typing `<` to see available components
2. **Format Code** - Right-click → Format Document
3. **Save Often** - Use `Cmd/Ctrl+S` to save frequently
4. **Check Preview** - Right panel shows live preview of your changes
5. **Test Variables** - Use Send Test Email to see variable interpolation

## Keyboard Shortcuts

- `Cmd/Ctrl+S` - Save
- `Cmd/Ctrl+F` - Find
- `Cmd/Ctrl+H` - Find and replace
- `Alt+Shift+F` - Format document
```

**Step 2: Commit**

```bash
git add docs/jsx-editing-guide.md
git commit -m "docs: add JSX editing user guide"
```

---

## Summary

**Implementation Complete:**

1. ✅ Added `jsx_source` field to Email type
2. ✅ Updated API client to handle `jsx_source`
3. ✅ Deprecated client-side `codeToCanvas` parsing
4. ✅ Integrated backend JSX parsing with Code tab save
5. ✅ Updated error handling to show backend errors
6. ✅ Updated Canvas→Code generation to match backend format
7. ✅ Ensured generated emails include `jsx_source`
8. ✅ Improved JSX syntax highlighting and autocomplete
9. ✅ Added loading states for JSX generation
10. ✅ Created user documentation

**Architecture Changes:**
- **Before:** FE tried to parse JSX locally (placeholder)
- **After:** FE sends JSX to BE, BE parses and validates, FE displays result

**User Flow:**
1. Load email → Shows `jsx_source` in Monaco
2. Edit JSX → Real-time preview in right panel
3. Save → Backend validates and parses → Success or helpful error
4. Refresh → Shows saved JSX from backend

**Benefits:**
- Single source of truth for JSX→JSON parsing (backend)
- Consistent validation across FE and BE
- Helpful error messages from backend
- No need for FE to maintain complex JSX parser
- Works with existing Monaco editor setup

**Testing Checklist:**
- [ ] Load email shows JSX code
- [ ] Edit and save valid JSX works
- [ ] Save invalid JSX shows backend error
- [ ] Generated emails include JSX
- [ ] Canvas→Code generates correct JSX format
- [ ] Page refresh persists JSX changes
- [ ] Autocomplete shows React Email components
- [ ] Template variables work in JSX
