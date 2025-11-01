import EmailIframeRenderer from './EmailIframeRenderer'

interface LivePreviewProps {
  code: string
}

export default function LivePreview({ code }: LivePreviewProps) {
  return (
    <div className="h-full overflow-auto bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="text-sm text-gray-500 mb-4 px-4">
          Live Preview
        </div>
        <EmailIframeRenderer code={code} />
      </div>
    </div>
  )
}
