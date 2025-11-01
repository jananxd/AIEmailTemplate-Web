import { useEffect, useCallback } from 'react'

export function useUnsavedChanges(isDirty: boolean, message = 'You have unsaved changes. Are you sure you want to leave?') {
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault()
        e.returnValue = message
        return message
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isDirty, message])

  const getConfirmation = useCallback(() => {
    if (!isDirty) return true
    return window.confirm(message)
  }, [isDirty, message])

  return { getConfirmation }
}
