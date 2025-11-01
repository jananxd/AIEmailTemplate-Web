interface UnsavedChangesModalProps {
  isOpen: boolean
  onSaveAndSwitch: () => void
  onDiscard: () => void
  onCancel: () => void
}

export default function UnsavedChangesModal({
  isOpen,
  onSaveAndSwitch,
  onDiscard,
  onCancel,
}: UnsavedChangesModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-3">
          Unsaved Changes
        </h2>
        <p className="text-gray-600 mb-6">
          You have unsaved code changes. What would you like to do?
        </p>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onDiscard}
            className="px-4 py-2 text-red-700 bg-red-50 rounded hover:bg-red-100 transition-colors"
          >
            Discard
          </button>
          <button
            onClick={onSaveAndSwitch}
            className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors"
          >
            Save & Switch
          </button>
        </div>
      </div>
    </div>
  )
}
