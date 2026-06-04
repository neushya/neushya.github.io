import React, { useState } from 'react';
import type { Tab } from '../App';
import Editor from './Editor';
import type { EditorHandle } from './Editor';
import Preview from './Preview';
import type { PreviewHandle } from './Preview';
import { Search, FilePlus, FolderOpen, Download, Code, Eye, Sparkles } from 'lucide-react';

interface MobileLayoutProps {
  activeTab: Tab | undefined;
  onContentChange: (content: string) => void;
  onNewFile: () => void;
  onOpenFile: () => void;
  onExport: () => void;
  isPrettyPrint: boolean;
  onTogglePrettyPrint: () => void;
  isDarkMode: boolean;
  editorRef: React.RefObject<EditorHandle>;
  previewRef: React.RefObject<PreviewHandle>;
  onFind: (query?: string) => void;
}

const MobileLayout: React.FC<MobileLayoutProps> = ({
  activeTab,
  onContentChange,
  onNewFile,
  onOpenFile,
  onExport,
  isPrettyPrint,
  onTogglePrettyPrint,
  isDarkMode,
  editorRef,
  previewRef,
  onFind
}) => {
  const [activeView, setActiveView] = useState<'editor' | 'preview'>('editor');

  return (
    <div className="flex flex-col h-screen w-full bg-[var(--bg-app)] text-[var(--text-main)] overflow-hidden font-sans">
      {/* Mobile Top Bar */}
      <header className="flex items-center justify-between px-4 h-12 border-b border-[var(--border-base)] bg-[var(--bg-header)] shrink-0">
        <div className="flex items-center space-x-4">
          <button onClick={onNewFile} className="p-1.5 text-[var(--text-muted)] active:text-[var(--accent)]">
            <FilePlus size={20} />
          </button>
          <button onClick={onOpenFile} className="p-1.5 text-[var(--text-muted)] active:text-[var(--accent)]">
            <FolderOpen size={20} />
          </button>
        </div>
        
        <span className="text-[13px] font-bold truncate max-w-[150px]">
          {activeTab?.name || "Zenito MD"}
        </span>

        <div className="flex items-center space-x-3">
          <button onClick={() => onFind()} className="p-1.5 text-[var(--text-muted)]">
            <Search size={20} />
          </button>
          <button onClick={onExport} className="p-1.5 text-[var(--accent)] active:scale-95 transition-transform">
            <Download size={20} />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 relative overflow-hidden">
        {activeTab ? (
          <div className="h-full w-full">
            <div className={activeView === 'editor' ? 'h-full w-full block' : 'hidden'}>
              <Editor 
                ref={editorRef}
                value={activeTab.content}
                onChange={onContentChange}
                isDarkMode={isDarkMode}
              />
            </div>
            <div className={activeView === 'preview' ? 'h-full w-full block' : 'hidden'}>
              <Preview 
                ref={previewRef}
                content={activeTab.content}
                isPrettyPrint={isPrettyPrint}
                activeTabPath={activeTab.path}
              />
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center space-y-4 px-10 text-center">
            <div className="text-3xl opacity-20 font-bold uppercase italic tracking-tighter">Zenito Mobile</div>
            <p className="text-[12px] text-[var(--text-muted)]">탭을 눌러 파일을 열거나 새 문서를 작성하세요</p>
            <button 
              onClick={onOpenFile}
              className="mt-4 px-6 py-2 bg-orange-500 text-white rounded-full font-bold shadow-lg active:bg-orange-600"
            >
              Open File
            </button>
          </div>
        )}
      </main>

      {/* Mobile Bottom Tab Bar */}
      <footer className="h-14 border-t border-[var(--border-base)] bg-[var(--bg-sidebar)] flex items-center justify-around px-2 shrink-0">
        <button 
          onClick={() => setActiveView('editor')}
          className={`flex flex-col items-center justify-center flex-1 h-full space-y-1 transition-colors ${activeView === 'editor' ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'}`}
        >
          <Code size={22} />
          <span className="text-[10px] font-medium">Editor</span>
        </button>

        <div className="w-px h-6 bg-[var(--border-base)] opacity-50" />

        <button 
          onClick={onTogglePrettyPrint}
          className={`flex flex-col items-center justify-center flex-1 h-full space-y-1 transition-colors ${isPrettyPrint ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'}`}
        >
          <Sparkles size={20} className={isPrettyPrint ? 'animate-pulse' : ''} />
          <span className="text-[10px] font-medium">Pretty</span>
        </button>

        <div className="w-px h-6 bg-[var(--border-base)] opacity-50" />

        <button 
          onClick={() => setActiveView('preview')}
          className={`flex flex-col items-center justify-center flex-1 h-full space-y-1 transition-colors ${activeView === 'preview' ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'}`}
        >
          <Eye size={22} />
          <span className="text-[10px] font-medium">Preview</span>
        </button>
      </footer>
    </div>
  );
};

export default MobileLayout;
