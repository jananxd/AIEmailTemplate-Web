import type { EmailNode } from '../types/email'

/**
 * Convert Canvas blocks to React email code
 */
export function canvasToCode(blocks: EmailNode[]): string {
  const blockToCode = (block: EmailNode, indent = 2): string => {
    const indentStr = ' '.repeat(indent)

    switch (block.type) {
      case 'heading': {
        const level = block.level || 1
        return `${indentStr}<Text className="text-${level === 1 ? '3xl' : level === 2 ? '2xl' : 'xl'} font-bold">
${indentStr}  ${block.text || ''}
${indentStr}</Text>`
      }

      case 'text':
        return `${indentStr}<Text>${block.text || ''}</Text>`

      case 'button':
        return `${indentStr}<Button href="${block.href || '#'}" className="bg-blue-600 text-white px-6 py-3 rounded">
${indentStr}  ${block.label || 'Click me'}
${indentStr}</Button>`

      case 'image':
        return `${indentStr}<Img
${indentStr}  src="${block.src || ''}"
${indentStr}  alt="${block.alt || ''}"
${indentStr}  width={${block.width || 600}}
${indentStr}  height={${block.height || 400}}
${indentStr}/>`

      case 'divider':
        return `${indentStr}<Hr style={{ borderColor: '${block.color || '#E5E7EB'}', width: '${block.width || 100}%' }} />`

      case 'spacer':
        return `${indentStr}<div style={{ height: '${block.height || 20}px' }} />`

      case 'section': {
        const children = block.children?.map(child => blockToCode(child, indent + 2)).join('\n') || ''
        return `${indentStr}<Section style={{ backgroundColor: '${block.backgroundColor || '#FFFFFF'}', padding: '${block.padding || '20px'}' }}>
${children}
${indentStr}</Section>`
      }

      default:
        return ''
    }
  }

  const blocksCode = blocks.map(block => blockToCode(block, 6)).join('\n\n')

  return `import * as React from 'react';
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Button,
  Img,
  Hr,
  Tailwind,
  Preview,
} from '@react-email/components';

const EmailTemplate = () => {
  return (
    <Html lang="en" dir="ltr">
      <Tailwind>
        <Head />
        <Body className="bg-white font-sans">
          <Container className="max-w-2xl mx-auto">
${blocksCode}
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default EmailTemplate;`
}
