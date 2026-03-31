import React from 'react';
import CopyButton from '@/components/CopyButton';
import type { Components } from 'react-markdown';

const extractText = (node: React.ReactNode): string => {
  if (typeof node === 'string') return node;
  if (typeof node === 'number') return node.toString();
  if (Array.isArray(node)) return node.map(extractText).join('');
  if (React.isValidElement(node)) {
    const props = node.props as { children?: React.ReactNode };
    return extractText(props.children);
  }
  return '';
};

export const markdownComponents: Components = {
  h2: ({ children }) => (
    <div className="mt-5 mb-2 flex items-center gap-1.5 first:mt-0">
      <span className="size-1.5 rounded-full bg-[#c97d4e]" />
      <span className="font-mono text-[10px] font-medium tracking-widest text-[#c97d4e] uppercase">
        {children}
      </span>
    </div>
  ),
  p: ({ children }) => (
    <p className="text-sm leading-relaxed text-pretty text-[#b8b4ac]">
      {children}
    </p>
  ),
  pre: ({ children }) => {
    const childArray = React.Children.toArray(children);
    const codeElement = childArray[0] as React.ReactElement<{
      className?: string;
      children?: React.ReactNode;
    }>;

    const className = codeElement?.props?.className || '';
    const codeChildren = codeElement?.props?.children;

    const match = /language-(\w+)/.exec(className);
    let language = match ? match[1] : 'text';
    if (language === 'xml') language = 'astro';

    const rawCode = extractText(codeChildren).trimEnd();

    return (
      <div className="overflow-hidden rounded-xl border border-[#1e2028]">
        <div className="flex items-center justify-between border-b border-[#1e2028] bg-[#1c1e26] px-4 py-2">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-[#ff5f56]" />
              <span className="size-2.5 rounded-full bg-[#ffbd2e]" />
              <span className="size-2.5 rounded-full bg-[#27c93f]" />
            </div>
            <span className="font-mono text-[11px] font-semibold tracking-wider text-[#8b8b95] uppercase">
              {language}
            </span>
          </div>
          <CopyButton codeRaw={rawCode} />
        </div>
        <pre className="overflow-x-auto bg-[#0e0f11] p-5 font-mono text-[13px] leading-relaxed">
          {children}
        </pre>
      </div>
    );
  },
  code: ({ className, children, ...props }) => {
    const isBlock =
      className?.includes('language-') || className?.includes('hljs');

    if (isBlock) {
      return (
        <code className={`${className} hljs bg-transparent!`} {...props}>
          {children}
        </code>
      );
    }

    return (
      <code
        className="rounded bg-[#1c1e26] px-1.5 py-0.5 font-mono text-[13px] text-[#e8e4dc]"
        {...props}
      >
        {children}
      </code>
    );
  },
  ul: ({ children }) => <ul className="flex flex-col gap-1.5">{children}</ul>,
  li: ({ children }) => (
    <li className="flex items-start gap-2 text-sm text-[#b8b4ac]">
      <span className="mt-1.5 size-1 shrink-0 rounded-full bg-[#3a3a42]" />
      <span>{children}</span>
    </li>
  ),
};
