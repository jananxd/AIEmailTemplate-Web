import type { EmailNode } from '../../types/email'
import { substituteVariables } from '../../lib/variableParser'

interface EmailPreviewProps {
  blocks: EmailNode[]
  variables?: Record<string, string>
}

export default function EmailPreview({ blocks, variables = {} }: EmailPreviewProps) {
  const renderBlock = (block: EmailNode): React.ReactNode => {
    switch (block.type) {
      case 'heading': {
        const text = substituteVariables(block.text || '', variables)
        const level = block.level || 1
        const headingClass = level === 1 ? 'text-3xl' : level === 2 ? 'text-2xl' : 'text-xl'
        return (
          <div key={block.id} className={`font-bold mb-4 ${headingClass}`}>
            {text}
          </div>
        )
      }

      case 'text': {
        const text = substituteVariables(block.text || '', variables)
        return <p key={block.id} className="mb-4">{text}</p>
      }

      case 'button': {
        const label = substituteVariables(block.label || '', variables)
        return (
          <div key={block.id} className="mb-4">
            <a
              href={block.href}
              target={block.target}
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {label}
            </a>
          </div>
        )
      }

      case 'image':
        return block.src ? (
          <img
            key={block.id}
            src={block.src}
            alt={block.alt}
            width={block.width}
            height={block.height}
            className="max-w-full h-auto mb-4"
          />
        ) : null

      case 'divider':
        return (
          <hr
            key={block.id}
            style={{
              borderColor: block.color || '#E5E7EB',
              borderWidth: `${block.thickness || 1}px`,
              width: `${block.width || 100}%`,
            }}
            className="my-4"
          />
        )

      case 'spacer':
        return <div key={block.id} style={{ height: `${block.height || 20}px` }} />

      case 'section':
        return (
          <div
            key={block.id}
            style={{
              backgroundColor: block.backgroundColor || '#FFFFFF',
              padding: block.padding || '20px',
              borderRadius: block.borderRadius || '0px',
            }}
            className="mb-4"
          >
            {block.children?.map(renderBlock)}
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
      {blocks.map(renderBlock)}
    </div>
  )
}
