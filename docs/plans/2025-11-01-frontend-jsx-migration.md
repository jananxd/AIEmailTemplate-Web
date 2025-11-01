# Frontend JSX Migration Implementation Plan

**Date:** 2025-11-01
**Purpose:** Update frontend to work with backend's JSX-only storage system (removing json_state support)
**Status:** Ready for implementation
**Complexity:** Medium - Mostly type updates and API mapping changes

---

## Overview

The backend has completed migration from dual storage (json_state + jsx_source) to JSX-only storage (jsx_source + props_schema). The frontend currently supports both formats but needs to be updated to:

1. Remove `jsonStructure` (json_state) from the Email type
2. Make `jsxSource` required instead of optional
3. Update API transformations to match new backend schema
4. Remove deprecated canvas/block editor references to json_state
5. Update type definitions for props_schema support

**Current State:**
- ✅ Frontend already has JSX code editor (Monaco)
- ✅ Frontend already sends JSX to backend via PATCH
- ✅ Backend already returns jsx_source in responses
- ⚠️ Frontend still expects `json_state` in API responses
- ⚠️ Frontend Email type has optional `jsxSource` and required `jsonStructure`

**Target State:**
- Email type has required `jsxSource` and `propsSchema`
- API client only sends/receives jsx_source and props_schema
- All references to json_state removed
- Canvas editor (if kept) works from JSX source only

---

## Tasks

### **Task 1: Update Email Type Definition**

**File:** `src/types/email.ts`

**Current:**
```typescript
export interface Email {
  id: string
  meta: EmailMeta
  jsonStructure: EmailJSON  // ❌ Remove
  jsxSource?: string | null  // ❌ Make required
  variables: string[]
  prompt: string
  attachedImage?: string
  projectId?: string
  createdAt: string
  updatedAt: string
}
```

**Target:**
```typescript
export interface Email {
  id: string
  meta: EmailMeta
  jsxSource: string  // ✅ Required
  propsSchema: PropSchema  // ✅ Add
  variables: string[]  // May become deprecated
  prompt: string
  attachedImage?: string
  projectId?: string
  createdAt: string
  updatedAt: string
}

export interface PropSchema {
  [propName: string]: {
    type: string
    required: boolean
  }
}
```

**Steps:**
1. Remove `EmailJSON`, `EmailNode`, and all related node type interfaces (section, heading, text, button, image, divider, spacer) - these are now obsolete
2. Change `jsxSource` from optional to required
3. Add `propsSchema: PropSchema` field
4. Remove `jsonStructure: EmailJSON` field
5. Consider if `variables: string[]` is still needed (props_schema might replace this)

**Test Plan:**
- TypeScript compilation passes
- All components using Email type still compile

---

### **Task 2: Update API Client Transformation**

**File:** `src/lib/api.ts`

**Current Issues:**
- Line 17: Maps `json_state` to `jsonStructure`
- Line 142: Sends `json_state` in PATCH payload
- Missing `props_schema` handling

**Changes Needed:**

1. **Update `transformEmailResponse` function (lines 10-26):**

```typescript
function transformEmailResponse(backendEmail: any): Email {
  return {
    id: backendEmail.id,
    meta: {
      subject: backendEmail.subject || '',
      previewText: backendEmail.preview || '',
    },
    jsxSource: backendEmail.jsx_source,  // ✅ Required now
    propsSchema: backendEmail.props_schema || {},  // ✅ Add
    variables: extractVariablesFromProps(backendEmail.props_schema),  // ✅ Derive from props
    prompt: backendEmail.prompt || '',
    attachedImage: backendEmail.attached_image,
    projectId: backendEmail.project_id,
    createdAt: backendEmail.created_at,
    updatedAt: backendEmail.updated_at,
  }
}

// Helper to extract variable names from props schema
function extractVariablesFromProps(propsSchema: any): string[] {
  if (!propsSchema || typeof propsSchema !== 'object') return []
  return Object.keys(propsSchema)
}
```

2. **Update `updateEmail` function (lines 132-156):**

```typescript
async updateEmail(id: string, data: Partial<Email>): Promise<{ email: Email }> {
  const payload: any = {}

  // Map camelCase to snake_case for backend
  if (data.meta !== undefined) {
    payload.subject = data.meta.subject
    payload.preview = data.meta.previewText
  }

  if (data.jsxSource !== undefined) {
    payload.jsx_source = data.jsxSource
  }

  // props_schema is auto-extracted by backend from jsx_source
  // Don't send it manually

  const response = await this.request<any>(`/emails/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })

  return { email: transformEmailResponse(response) }
}
```

3. **Remove all `json_state` references:**
   - Delete line 17: `jsonStructure: backendEmail.json_state`
   - Delete line 141-143: `if (data.jsonStructure !== undefined) { payload.json_state = data.jsonStructure }`

**Test Plan:**
- Create test to verify API transformation works
- Test PATCH email endpoint returns correct data shape
- Test GET email endpoint returns correct data shape

---

### **Task 3: Update Email Detail Page**

**File:** `src/pages/EmailDetail.tsx`

**Current Issue:**
- Line 123 comment: "Backend parses this to json_state" - outdated

**Changes:**

1. **Update comment at line 123:**

```typescript
await updateEmail.mutateAsync({
  id: email.id,
  data: {
    jsxSource: bareJsx, // Backend validates and extracts props_schema automatically
  },
})
```

2. **Check for any references to `email.jsonStructure`:**
   - Replace with `email.jsxSource` where appropriate
   - If canvas editor needs JSON structure, it should be derived from JSX client-side

3. **Update variable extraction logic:**
   - If currently using `email.variables`, consider switching to `Object.keys(email.propsSchema)`

**Test Plan:**
- Save email from code editor
- Verify props are correctly extracted and displayed
- Check variable panel shows correct variables

---

### **Task 4: Clean Up Deprecated Utils**

**Files to review:**
- `src/utils/codeToCanvas.ts` - Already deprecated, can be removed
- `src/utils/canvasToCode.ts` - Check if still needed
- `src/components/block-editor/` - Determine if block editor is still used

**Decision Matrix:**

| Component | Keep? | Reason |
|-----------|-------|--------|
| `codeToCanvas.ts` | ❌ Remove | Already deprecated, backend handles parsing |
| `canvasToCode.ts` | ⚠️ Review | Check if canvas editor still used |
| Block editor components | ⚠️ Review | Determine if UI still supports visual editing |

**If keeping canvas editor:**
- It must work from JSX source as the source of truth
- Canvas state is ephemeral (generated from JSX on load)
- Changes in canvas generate new JSX
- No more json_state storage

**If removing canvas editor:**
- Remove all block editor components
- Remove canvas tab from email editor
- Focus on JSX code editor only
- Simplify UI to code-first workflow

**Steps:**
1. Search codebase for imports of these utils
2. Determine if canvas/block editor is actively used
3. Either:
   - **Option A:** Update canvas to derive from JSX (complex)
   - **Option B:** Remove canvas editor entirely (recommended)

**Test Plan:**
- If keeping canvas: Test visual editor works from JSX
- If removing: Verify code editor still works

---

### **Task 5: Update Variable Panel**

**File:** `src/components/email/VariablePanel.tsx`

**Current:** Likely uses `email.variables` array

**Change:** Use `email.propsSchema` instead

**Example:**

```typescript
// Before
const variables = email.variables

// After
const variables = Object.keys(email.propsSchema || {})
const requiredVariables = Object.entries(email.propsSchema || {})
  .filter(([_, schema]) => schema.required)
  .map(([name]) => name)
```

**Benefits:**
- Shows required vs optional props
- Shows prop types
- More accurate reflection of actual template props

**Test Plan:**
- Variable panel displays correctly
- Shows required/optional indicators
- Test with template that has typed props

---

### **Task 6: Update Code Editor Integration**

**Files:**
- `src/components/email-editor/CodeEditor.tsx`
- `src/hooks/useCodeEditor.ts`

**Check for:**
- Any references to `email.jsonStructure`
- Variable extraction from JSON vs props_schema
- Save logic (should already be sending jsx_source)

**Ensure:**
- Code editor saves jsx_source only
- Props are extracted from code (backend does this)
- Live preview works with JSX

**Test Plan:**
- Edit code in Monaco editor
- Save and verify props_schema updated
- Check live preview reflects changes

---

### **Task 7: Update Generation Flow**

**Files:**
- `src/lib/generationManager.ts`
- `src/store/generationStore.ts`
- `src/components/generation/GenerationInput.tsx`

**Check:**
- Generation result handling
- Phantom email creation
- Progress callbacks

**Ensure:**
- Generated emails have `jsxSource` and `propsSchema`
- No references to `jsonStructure`
- SSE stream handling works with new response format

**Test Plan:**
- Generate new email
- Verify email has jsx_source
- Check props_schema populated
- Test progress indicators work

---

### **Task 8: Update Tests**

**Files to check:**
- Any test files using Email type
- Mock data factories
- API mock responses

**Update:**
- Test fixtures to use new Email shape
- Mock API responses to include jsx_source and props_schema
- Remove json_state from all mocks

**Test Plan:**
- All unit tests pass
- All integration tests pass
- No TypeScript errors

---

### **Task 9: Update Documentation**

**Files:**
- `README.md`
- Any developer documentation
- Component documentation

**Update:**
- Remove references to json_state
- Clarify JSX-first architecture
- Update API examples
- Document props_schema format

---

### **Task 10: Database Type Sync** (If using generated types)

**File:** `src/types/database.types.ts` (if exists)

**Action:**
- Re-run Supabase type generation if using it
- Ensure frontend types match backend database schema

**Command:**
```bash
npx supabase gen types typescript --project-id <project-id> > src/types/database.types.ts
```

---

## Implementation Order

**Phase 1: Type Updates (Breaking Changes)**
1. Task 1: Update Email Type Definition ⚠️ BREAKING
2. Task 2: Update API Client Transformation ⚠️ BREAKING

**Phase 2: Component Updates**
3. Task 3: Update Email Detail Page
4. Task 6: Update Code Editor Integration
5. Task 5: Update Variable Panel
6. Task 7: Update Generation Flow

**Phase 3: Cleanup**
7. Task 4: Clean Up Deprecated Utils
8. Task 8: Update Tests
9. Task 9: Update Documentation
10. Task 10: Database Type Sync

---

## Testing Strategy

### **Unit Tests**
- Email type transformation
- API client methods
- Variable extraction from props_schema

### **Integration Tests**
- Generate email flow
- Save email flow
- Load and display email

### **Manual Testing Checklist**
- [ ] Generate new email
- [ ] Edit email in code editor
- [ ] Save changes
- [ ] Reload page, verify email loads
- [ ] Variable panel shows correct props
- [ ] Send test email with variables
- [ ] Create project with brand settings
- [ ] Generate branded email

---

## Rollback Plan

**If issues arise:**

1. **Revert type changes** in `src/types/email.ts`
2. **Revert API transformation** in `src/lib/api.ts`
3. **Restore json_state mapping** temporarily
4. **Add backward compatibility layer:**

```typescript
function transformEmailResponse(backendEmail: any): Email {
  return {
    // ... other fields
    jsxSource: backendEmail.jsx_source || generateJsxFromJson(backendEmail.json_state),
    propsSchema: backendEmail.props_schema || extractPropsFromJson(backendEmail.json_state),
  }
}
```

---

## Dependencies

- Backend JSX migration must be complete ✅
- Backend must return jsx_source and props_schema ✅
- Backend must accept jsx_source in PATCH ✅

---

## Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Breaking existing emails | High | Backend migration already complete, data is safe |
| Variable extraction differs | Medium | Test thoroughly, props_schema is more accurate |
| Canvas editor breaks | Medium | Decide early: fix or remove |
| User workflow disruption | Low | Code editor already primary interface |

---

## Success Criteria

- [ ] All TypeScript compilation errors resolved
- [ ] No references to `json_state` or `jsonStructure` in codebase
- [ ] All API calls use `jsx_source` and `props_schema`
- [ ] Email type has required `jsxSource` field
- [ ] Variable panel works from `propsSchema`
- [ ] All tests pass
- [ ] Manual testing checklist complete
- [ ] Documentation updated

---

## Estimated Effort

- **Task 1-2:** 1-2 hours (type updates, API client)
- **Task 3-7:** 3-4 hours (component updates)
- **Task 4:** 1-2 hours (cleanup decision + implementation)
- **Task 8-10:** 1-2 hours (tests and docs)

**Total:** 6-10 hours

---

## Notes

- Frontend is already mostly JSX-first, this is mainly cleanup
- The hardest decision is whether to keep or remove the canvas/block editor
- Most changes are type updates and removing obsolete fields
- Backend migration is complete, so this is safe to proceed
