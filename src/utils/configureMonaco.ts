import type * as Monaco from 'monaco-editor'

/**
 * Configure Monaco editor with TypeScript validation
 * Runs when Monaco loads
 */
export function configureMonaco(monaco: typeof Monaco) {
  // TypeScript compiler options
  monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
    target: monaco.languages.typescript.ScriptTarget.ES2020,
    allowNonTsExtensions: true,
    moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
    module: monaco.languages.typescript.ModuleKind.ESNext,
    noEmit: true,
    esModuleInterop: true,
    jsx: monaco.languages.typescript.JsxEmit.React,
    reactNamespace: 'React',
    allowJs: true,
    typeRoots: ['node_modules/@types'],
  })

  // Enable validation
  monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
    noSemanticValidation: false,
    noSyntaxValidation: false,
  })

  // Add @react-email/components type definitions
  // For now, add basic types. In production, fetch real types
  const reactEmailTypes = `
    declare module '@react-email/components' {
      import * as React from 'react';

      export const Html: React.FC<React.HTMLAttributes<HTMLHtmlElement>>;
      export const Head: React.FC<React.HTMLAttributes<HTMLHeadElement>>;
      export const Body: React.FC<React.HTMLAttributes<HTMLBodyElement>>;
      export const Container: React.FC<React.HTMLAttributes<HTMLDivElement>>;
      export const Section: React.FC<React.HTMLAttributes<HTMLElement>>;
      export const Text: React.FC<React.HTMLAttributes<HTMLParagraphElement>>;
      export const Heading: React.FC<React.HTMLAttributes<HTMLHeadingElement> & { as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' }>;
      export const Button: React.FC<React.AnchorHTMLAttributes<HTMLAnchorElement>>;
      export const Img: React.FC<React.ImgHTMLAttributes<HTMLImageElement>>;
      export const Hr: React.FC<React.HTMLAttributes<HTMLHRElement>>;
      export const Link: React.FC<React.AnchorHTMLAttributes<HTMLAnchorElement>>;
      export const Tailwind: React.FC<{ children?: React.ReactNode }>;
      export const Preview: React.FC<{ children?: string }>;
      export const Row: React.FC<React.HTMLAttributes<HTMLTableRowElement>>;
      export const Column: React.FC<React.HTMLAttributes<HTMLTableCellElement>>;
    }
  `

  monaco.languages.typescript.typescriptDefaults.addExtraLib(
    reactEmailTypes,
    'file:///node_modules/@react-email/components/index.d.ts'
  )

  // Add React types (basic)
  const reactTypes = `
    declare module 'react' {
      export = React;
      export as namespace React;
      namespace React {
        type ReactNode = string | number | boolean | null | undefined;
        type FC<P = {}> = (props: P) => ReactNode;
        interface HTMLAttributes<T> {
          className?: string;
          style?: Record<string, string | number>;
          children?: ReactNode;
        }
        interface AnchorHTMLAttributes<T> extends HTMLAttributes<T> {
          href?: string;
          target?: string;
        }
        interface ImgHTMLAttributes<T> extends HTMLAttributes<T> {
          src?: string;
          alt?: string;
          width?: number | string;
          height?: number | string;
        }
      }
    }
  `

  monaco.languages.typescript.typescriptDefaults.addExtraLib(
    reactTypes,
    'file:///node_modules/@types/react/index.d.ts'
  )
}
