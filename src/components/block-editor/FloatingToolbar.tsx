import { Heading1, Type, MousePointerClick, Image, Minus, MoveVertical, Box } from 'lucide-react'
import type {
  HeadingNode,
  TextNode,
  ButtonNode,
  ImageNode,
  DividerNode,
  SpacerNode,
  SectionNode,
} from '../../types/email'

type BlockWithoutId =
  | Omit<HeadingNode, 'id'>
  | Omit<TextNode, 'id'>
  | Omit<ButtonNode, 'id'>
  | Omit<ImageNode, 'id'>
  | Omit<DividerNode, 'id'>
  | Omit<SpacerNode, 'id'>
  | Omit<SectionNode, 'id'>

interface FloatingToolbarProps {
  onAddBlock: (block: BlockWithoutId) => void
  position?: { x: number; y: number }
}

interface ToolbarItem {
  id: string
  icon: React.ReactNode
  label: string
  block: BlockWithoutId
}

const toolbarItems: ToolbarItem[] = [
  {
    id: 'heading',
    icon: <Heading1 className="w-5 h-5" />,
    label: 'Heading',
    block: {
      type: 'heading',
      level: 1,
      text: 'New Heading',
      children: [],
    },
  },
  {
    id: 'text',
    icon: <Type className="w-5 h-5" />,
    label: 'Text',
    block: {
      type: 'text',
      text: 'Enter your text here...',
      children: [],
    },
  },
  {
    id: 'button',
    icon: <MousePointerClick className="w-5 h-5" />,
    label: 'Button',
    block: {
      type: 'button',
      label: 'Click me',
      href: 'https://example.com',
      target: '_blank',
      children: [],
    },
  },
  {
    id: 'image',
    icon: <Image className="w-5 h-5" />,
    label: 'Image',
    block: {
      type: 'image',
      src: '',
      alt: '',
      width: 600,
      children: [],
    },
  },
  {
    id: 'divider',
    icon: <Minus className="w-5 h-5" />,
    label: 'Divider',
    block: {
      type: 'divider',
      color: '#E5E7EB',
      thickness: 1,
      width: 100,
      children: [],
    },
  },
  {
    id: 'spacer',
    icon: <MoveVertical className="w-5 h-5" />,
    label: 'Spacer',
    block: {
      type: 'spacer',
      height: 20,
      children: [],
    },
  },
  {
    id: 'section',
    icon: <Box className="w-5 h-5" />,
    label: 'Section',
    block: {
      type: 'section',
      backgroundColor: '#FFFFFF',
      padding: '20px',
      borderRadius: '0px',
      children: [],
    },
  },
]

export default function FloatingToolbar({ onAddBlock, position }: FloatingToolbarProps) {
  return (
    <div
      className="fixed bg-white border border-gray-200 rounded-lg shadow-lg p-2 flex gap-1 z-50"
      style={
        position
          ? { left: `${position.x}px`, top: `${position.y}px` }
          : { left: '50%', bottom: '24px', transform: 'translateX(-50%)' }
      }
    >
      {toolbarItems.map((item) => (
        <button
          key={item.id}
          onClick={() => onAddBlock(item.block)}
          className="flex flex-col items-center gap-1 p-3 rounded-md hover:bg-gray-100 transition-colors group"
          title={item.label}
        >
          <div className="text-gray-700 group-hover:text-blue-600 transition-colors">
            {item.icon}
          </div>
          <span className="text-xs text-gray-600 group-hover:text-blue-600 transition-colors">
            {item.label}
          </span>
        </button>
      ))}
    </div>
  )
}
