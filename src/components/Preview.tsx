import React, { useState, forwardRef, useImperativeHandle, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import Highlighter from 'react-highlight-words';
import { X, ChevronUp, ChevronDown, Search } from 'lucide-react';
import 'highlight.js/styles/github-dark.css'; 

interface PreviewProps {
  content: string;
  isPrettyPrint: boolean;
  activeTabPath: string | null;
  externalSearchQuery?: string;
}

export interface PreviewHandle {
  find: (query?: string) => void;
}

const Preview = forwardRef<PreviewHandle, PreviewProps>(({ content, isPrettyPrint, activeTabPath, externalSearchQuery }, ref) => {
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [matchIndex, setMatchIndex] = useState(0);
  const [matchCount, setMatchCount] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => ({
    find: (query?: string) => {
      setShowSearch(true);
      if (query !== undefined) {
        setSearchQuery(query);
      }
      setTimeout(() => {
        const input = document.getElementById('preview-search-input');
        input?.focus();
      }, 50);
    }
  }));

  // 외부 검색어 연동
  useEffect(() => {
    if (externalSearchQuery) {
      setSearchQuery(externalSearchQuery);
      setShowSearch(true);
    }
  }, [externalSearchQuery]);

  // 검색 결과 하이라이트 요소 추적 및 개수 업데이트
  useEffect(() => {
    if (searchQuery) {
      const matches = document.querySelectorAll('.preview-highlight');
      setMatchCount(matches.length);
      setMatchIndex(matches.length > 0 ? 1 : 0);
    } else {
      setMatchCount(0);
      setMatchIndex(0);
    }
  }, [searchQuery, content]);

  const scrollToMatch = (index: number) => {
    const matches = document.querySelectorAll('.preview-highlight');
    if (matches.length > 0 && index > 0 && index <= matches.length) {
      matches.forEach((el, i) => {
        (el as HTMLElement).style.boxShadow = (i === index - 1) ? '0 0 0 2px var(--accent)' : 'none';
      });
      
      matches[index - 1].scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  };

  const handleNext = () => {
    if (matchCount === 0) return;
    const nextIndex = matchIndex >= matchCount ? 1 : matchIndex + 1;
    setMatchIndex(nextIndex);
    scrollToMatch(nextIndex);
  };

  const handlePrev = () => {
    if (matchCount === 0) return;
    const prevIndex = matchIndex <= 1 ? matchCount : matchIndex - 1;
    setMatchIndex(prevIndex);
    scrollToMatch(prevIndex);
  };

  const getFormattedContent = () => {
    if (!isPrettyPrint) return content;
    const ext = activeTabPath?.split('.').pop()?.toLowerCase() || '';
    const trimmed = content.trim();
    if (ext === 'json' || (trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
      try {
        const obj = JSON.parse(trimmed);
        return `\`\`\`json\n${JSON.stringify(obj, null, 2)}\n\`\`\``;
      } catch (e) {}
    }
    if (ext === 'html' || ext === 'xml' || trimmed.startsWith('<')) {
      return `\`\`\`html\n${content}\n\`\`\``;
    }
    const codeExts = ['js', 'ts', 'py', 'sql', 'css', 'c', 'cpp', 'java', 'rs', 'go', 'sh', 'yaml', 'yml'];
    if (codeExts.includes(ext)) {
      return `\`\`\`${ext}\n${content}\n\`\`\``;
    }
    if (ext === 'txt' || !ext) {
        return `\`\`\`text\n${content}\n\`\`\``;
    }
    return content;
  };

  const displayContent = getFormattedContent();

  const highlightText = (children: React.ReactNode) => {
    if (!searchQuery) return children;
    return React.Children.map(children, child => 
      typeof child === 'string' 
        ? <Highlighter highlightClassName="preview-highlight" searchWords={[searchQuery]} autoEscape={true} textToHighlight={child} /> 
        : child
    );
  };

  return (
    <div className="h-full w-full relative overflow-hidden bg-[var(--bg-app)] text-[var(--text-main)] transition-colors duration-200">
      {/* Floating Preview Search Bar */}
      {showSearch && (
        <div className="absolute top-4 right-8 z-50 flex items-center bg-[var(--bg-sidebar)] border border-[var(--border-base)] shadow-xl rounded-md px-3 py-1.5 animate-in slide-in-from-top-2 min-w-[320px]">
          <Search size={14} className="text-[var(--text-muted)] mr-2" />
          <input 
            id="preview-search-input"
            type="text"
            placeholder="프리뷰에서 찾기..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
                if (e.key === 'Escape') setShowSearch(false);
                if (e.key === 'Enter') handleNext();
            }}
            className="bg-transparent border-none outline-none text-[12px] flex-1 text-[var(--text-main)] placeholder:text-[var(--text-muted)]"
          />
          <div className="flex items-center ml-2 border-l border-[var(--border-base)] pl-2 space-x-1">
            <span className="text-[10px] text-[var(--text-muted)] min-w-[30px] text-center">
              {matchCount > 0 ? `${matchIndex}/${matchCount}` : '0/0'}
            </span>
            <button 
              onClick={handlePrev}
              className="p-1 hover:bg-[var(--bg-item-hover)] rounded text-[var(--text-muted)]"
            >
              <ChevronUp size={14} />
            </button>
            <button 
              onClick={handleNext}
              className="p-1 hover:bg-[var(--bg-item-hover)] rounded text-[var(--text-muted)]"
            >
              <ChevronDown size={14} />
            </button>
            <button 
              onClick={() => { setShowSearch(false); setSearchQuery(''); }}
              className="p-1 hover:bg-red-500/20 rounded text-[var(--text-muted)] hover:text-red-500"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      <div ref={scrollContainerRef} className="h-full w-full overflow-auto p-4 md:p-8 text-left custom-scrollbar">
        <style>{`
          .prose { 
            max-width: 100% !important;
            width: 100%;
            --tw-prose-body: var(--text-main);
            --tw-prose-headings: var(--text-main);
            --tw-prose-links: var(--accent);
            --tw-prose-bold: var(--text-main);
            --tw-prose-counters: var(--text-muted);
            --tw-prose-bullets: var(--text-muted);
            --tw-prose-quotes: var(--text-muted);
            --tw-prose-code: var(--accent);
            --tw-prose-pre-bg: var(--bg-sidebar);
            --tw-prose-pre-code: var(--text-main);
            --tw-prose-th-borders: var(--border-base);
            --tw-prose-td-borders: var(--border-base);
          }
          .prose pre { 
            width: 100%; 
            margin-left: 0; 
            margin-right: 0; 
            max-width: 100%;
          }
          .prose code {
            white-space: pre-wrap;
            word-break: break-all;
          }
          :root:not(.dark) .prose pre { background-color: #f6f8fa; border: 1px solid #d1d5db; }
          :root:not(.dark) .prose code:not(pre code) { background-color: #f3f4f6; color: #d73a49; }
          .preview-highlight { background-color: #ffd33d; color: black; border-radius: 2px; }
          .dark .preview-highlight { background-color: #f2cc60; color: black; }
        `}</style>
        
        <div className="prose prose-slate dark:prose-invert">
          <ReactMarkdown 
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight]}
            components={{
              p: ({children}) => <p>{highlightText(children)}</p>,
              li: ({children}) => <li>{highlightText(children)}</li>,
              h1: ({children}) => <h1>{highlightText(children)}</h1>,
              h2: ({children}) => <h2>{highlightText(children)}</h2>,
              h3: ({children}) => <h3>{highlightText(children)}</h3>,
              td: ({children}) => <td>{highlightText(children)}</td>,
              th: ({children}) => <th>{highlightText(children)}</th>,
              a: ({children}) => <a>{highlightText(children)}</a>,
              strong: ({children}) => <strong>{highlightText(children)}</strong>,
              em: ({children}) => <em>{highlightText(children)}</em>,
              span: ({children}) => <span>{highlightText(children)}</span>,
            }}
          >
            {displayContent}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
});

export default Preview;
