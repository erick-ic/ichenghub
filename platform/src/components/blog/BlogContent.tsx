'use client';

import React, { useMemo, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypePrism from 'rehype-prism-plus';
import { Copy } from 'lucide-react';
import type { HeadingItem } from '@/lib/headingUtils';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { useEscapeKey } from '@/hooks/useEscapeKey';

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

function rehypeHeadingIds() {
  const idCount: Record<string, number> = {};
  
  function getTextContent(node: any): string {
    if (node.type === 'text') {
      return node.value || '';
    }
    if (node.type === 'element' && node.children) {
      return node.children.map((child: any) => getTextContent(child)).join('');
    }
    return '';
  }
  
  return function (tree: any) {
    function visit(node: any) {
      if (node.type === 'element' && ['h2', 'h3'].includes(node.tagName)) {
        const text = getTextContent(node);
        let slug = generateSlug(text);
        if (!slug && text) {
          slug = generateSlug(text.replace(/[^\p{L}\p{N}]/gu, ''));
        }
        if (idCount[slug]) {
          idCount[slug]++;
          slug = `${slug}-${idCount[slug]}`;
        } else {
          idCount[slug] = 1;
        }
        node.properties = node.properties || {};
        node.properties.id = slug;
      }
      if (node.children) {
        node.children.forEach(visit);
      }
    }
    visit(tree);
  };
}

interface BlogContentProps {
  content: string;
  headings: HeadingItem[];
}

function InlineCode({ children, ...props }: { children: React.ReactNode; [key: string]: any }) {
  return (
    <code
      className="bg-gray-100 dark:bg-gray-800 text-[#e52129] dark:text-[#ff6b6b] px-1.5 py-0.5 rounded font-mono text-sm font-normal mx-0.5 border border-gray-200/50 dark:border-gray-700/30 before:content-none after:content-none inline"
      {...props}
    >
      {children}
    </code>
  );
}

function Heading1({ children }: { children: React.ReactNode }) {
  return (
    <h1 className="font-bold !text-gray-900 dark:!text-white mt-10 mb-6 !text-2xl md:!text-[32px] leading-tight">
      {children}
    </h1>
  );
}

function Heading2({ children, id }: { children: React.ReactNode; id: string }) {
  return (
    <h2
      id={id}
      className="border-l-4 border-[#e52129] pl-3 font-bold !text-gray-900 dark:!text-white mt-8 mb-4 !text-lg md:!text-xl leading-tight"
    >
      {children}
    </h2>
  );
}

function Heading3({ children, id }: { children: React.ReactNode; id: string }) {
  return (
    <h3
      id={id}
      className="font-bold !text-gray-900 dark:!text-white mt-6 mb-3 !text-base md:!text-lg leading-tight"
    >
      {children}
    </h3>
  );
}

function Blockquote({ children }: { children: React.ReactNode }) {
  return (
    <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 bg-gray-200 dark:bg-gray-700/40 rounded-r-lg px-5 py-4 my-6 text-gray-700 dark:text-gray-300">
      {children}
    </blockquote>
  );
}

function UnorderedList({ children }: { children: React.ReactNode }) {
  return (
    <ul className="list-disc list-outside space-y-2 ml-4 my-4 text-gray-700 dark:text-gray-300">
      {children}
    </ul>
  );
}

function OrderedList({ children }: { children: React.ReactNode }) {
  return (
    <ol className="list-decimal list-outside space-y-2 ml-4 my-4 text-gray-700 dark:text-gray-300">
      {children}
    </ol>
  );
}

function ListItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="ml-2">
      {children}
    </li>
  );
}

function Table({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto my-6">
      <table className="min-w-full border-collapse border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        {children}
      </table>
    </div>
  );
}

function TableHead({ children }: { children: React.ReactNode }) {
  return <thead className="bg-gray-200 dark:bg-gray-700">{children}</thead>;
}

function TableBody({ children }: { children: React.ReactNode }) {
  return <tbody className="divide-y divide-gray-200 dark:divide-gray-700">{children}</tbody>;
}

function TableRow({ children }: { children: React.ReactNode }) {
  return <tr>{children}</tr>;
}

function TableCell({ children, isHeader }: { children: React.ReactNode; isHeader?: boolean }) {
  const Base = isHeader ? 'th' : 'td';
  return (
    <Base className={`px-4 py-3 text-sm ${isHeader ? 'font-semibold text-gray-700 dark:text-gray-200' : 'text-gray-600 dark:text-gray-300'}`}>
      {children}
    </Base>
  );
}

function ImageLightbox({ src, alt, onClose }: { src?: string; alt?: string; onClose: () => void }) {
  useBodyScrollLock(true);
  useEscapeKey(true, onClose);
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm animate-fade-in"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <button
        className="absolute top-4 right-4 p-2 text-white/70 hover:text-white transition-colors"
        onClick={onClose}
        aria-label="Close preview"
      >
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      <img
        src={src}
        alt={alt || ''}
        className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl"
      />
    </div>
  );
}

function LazyImage({ src, alt, onClick, ...props }: { src?: string; alt?: string; onClick?: () => void; [key: string]: any }) {
  return (
    <img
      src={src}
      alt={alt || ''}
      loading="lazy"
      decoding="async"
      className="max-w-full h-auto rounded-lg my-6 cursor-pointer hover:opacity-90 transition-opacity"
      onClick={onClick}
      {...props}
    />
  );
}

const LANGUAGE_DISPLAY_NAMES: Record<string, string> = {
  javascript: 'JavaScript',
  js: 'JavaScript',
  typescript: 'TypeScript',
  ts: 'TypeScript',
  python: 'Python',
  py: 'Python',
  java: 'Java',
  go: 'Go',
  rust: 'Rust',
  cpp: 'C++',
  c: 'C',
  csharp: 'C#',
  cs: 'C#',
  php: 'PHP',
  ruby: 'Ruby',
  swift: 'Swift',
  kotlin: 'Kotlin',
  bash: 'Bash',
  shell: 'Shell',
  sh: 'Shell',
  sql: 'SQL',
  html: 'HTML',
  css: 'CSS',
  json: 'JSON',
  yaml: 'YAML',
  yml: 'YAML',
  xml: 'XML',
  markdown: 'Markdown',
  md: 'Markdown',
  dockerfile: 'Dockerfile',
  graphql: 'GraphQL',
  regex: 'Regex',
  text: 'Text',
};

function CodeBlock({ children, className, ...props }: { children: React.ReactNode; className?: string; [key: string]: any }) {
  const codeElement = (children as React.ReactElement)?.props || {};
  const codeClassName = codeElement.className || '';
  const langMatch = codeClassName.match(/language-(\w+)/);
  const langKey = langMatch ? langMatch[1].toLowerCase() : '';
  const langDisplayName = LANGUAGE_DISPLAY_NAMES[langKey] || langKey || '';
  const shouldShowLangLabel = langDisplayName && langDisplayName !== 'Text';

  return (
    <div className="relative group my-6">
      <pre className={`bg-[#1e1e1e] rounded-xl overflow-hidden p-4 md:p-6 text-sm md:text-base ${className || ''}`} {...props}>
        {children}
      </pre>
      {shouldShowLangLabel && (
        <span className="absolute top-2 left-3 px-2 py-0.5 text-xs text-gray-400 bg-gray-800/80 rounded z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          {langDisplayName}
        </span>
      )}
      <button
        type="button"
        className="copy-button absolute top-2 right-3 flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-gray-400 hover:text-white rounded-lg transition-all duration-200 backdrop-blur-sm z-10 opacity-0 group-hover:opacity-100"
        aria-label="Copy code"
      >
        <span className="copy-icon">
          <Copy className="h-4 w-4" />
        </span>
        <span className="copy-icon-hidden">
          <CheckIcon />
        </span>
        <span className="copy-text text-xs">复制</span>
        <span className="copy-text-hidden text-xs text-green-400">已复制</span>
      </button>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg className="h-4 w-4 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
  );
}

function BlogContentComponent({ content, headings }: BlogContentProps) {
  const h2List = headings.filter((h) => h.level === 2);
  const h3List = headings.filter((h) => h.level === 3);

  const h2CounterRef = useRef(0);
  const h3CounterRef = useRef(0);

  h2CounterRef.current = 0;
  h3CounterRef.current = 0;

  const [previewImage, setPreviewImage] = React.useState<{ src?: string; alt?: string } | null>(null);

  const handleImageClick = (src?: string, alt?: string) => {
    setPreviewImage({ src, alt });
  };

  const closePreview = () => {
    setPreviewImage(null);
  };

  const components = useMemo(() => ({
    code({ className, children, ...props }: any) {
      const isCodeBlock = className && className.toString().includes('language-');
      if (isCodeBlock) {
        return <code className={className} {...props}>{children}</code>;
      }
      return <InlineCode {...props}>{children}</InlineCode>;
    },
    pre({ children, className, ...props }: any) {
      return <CodeBlock className={className} {...props}>{children}</CodeBlock>;
    },
    h1({ children }: any) {
      return <Heading1>{children}</Heading1>;
    },
    h2({ children, id, ...props }: any) {
      return <Heading2 id={id || ''} {...props}>{children}</Heading2>;
    },
    h3({ children, id, ...props }: any) {
      return <Heading3 id={id || ''} {...props}>{children}</Heading3>;
    },
    blockquote({ children }: any) {
      return <Blockquote>{children}</Blockquote>;
    },
    ul({ children }: any) {
      return <UnorderedList>{children}</UnorderedList>;
    },
    ol({ children }: any) {
      return <OrderedList>{children}</OrderedList>;
    },
    li({ children }: any) {
      return <ListItem>{children}</ListItem>;
    },
    table({ children }: any) {
      return <Table>{children}</Table>;
    },
    thead({ children }: any) {
      return <TableHead>{children}</TableHead>;
    },
    tbody({ children }: any) {
      return <TableBody>{children}</TableBody>;
    },
    tr({ children }: any) {
      return <TableRow>{children}</TableRow>;
    },
    th({ children }: any) {
      return <TableCell isHeader>{children}</TableCell>;
    },
    td({ children }: any) {
      return <TableCell>{children}</TableCell>;
    },
    img({ src, alt, ...props }: any) {
      return <LazyImage src={src} alt={alt} onClick={() => handleImageClick(src, alt)} {...props} />;
    },
  }), [handleImageClick]);

  return (
    <div className="max-w-none">
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw, rehypeHeadingIds, rehypePrism]} components={components}>
        {content}
      </ReactMarkdown>
      {previewImage && (
        <ImageLightbox
          src={previewImage.src}
          alt={previewImage.alt}
          onClose={closePreview}
        />
      )}
    </div>
  );
}

export default React.memo(BlogContentComponent);
