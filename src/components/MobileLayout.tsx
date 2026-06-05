import React, { useState } from 'react';
import type { Tab } from '../App';
import Editor from './Editor';
import type { EditorHandle } from './Editor';
import Preview from './Preview';
import type { PreviewHandle } from './Preview';
import { Search, FilePlus, FolderOpen, Save, Code, Eye, Sparkles, Settings, RotateCcw } from 'lucide-react';

interface MobileLayoutProps {
  activeTab: Tab | undefined;
  onContentChange: (content: string) => void;
  onNewFile: () => void;
  onOpenFile: () => void;
  onExport: () => void;
  isPrettyPrint: boolean;
  onTogglePrettyPrint: () => void;
  isDarkMode: boolean;
  editorRef: React.RefObject<EditorHandle | null>;
  previewRef: React.RefObject<PreviewHandle | null>;
  onFind: (query?: string, forceSource?: 'editor' | 'preview') => void;
  onOpenTheme: () => void;
  onPanelActive: (panel: 'editor' | 'preview') => void;
  onReset: () => void;
  isSaving: boolean;
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
  onFind,
  onOpenTheme,
  onPanelActive,
  onReset,
  isSaving
}) => {
  const [activeView, setActiveView] = useState<'editor' | 'preview'>('editor');

  const handleViewChange = (view: 'editor' | 'preview') => {
    setActiveView(view);
    onPanelActive(view);
  };

  const handleFindClick = () => {
    onFind(undefined, activeView);
  };

  return (
    <div className="flex flex-col h-[100dvh] w-full bg-[var(--bg-app)] text-[var(--text-main)] overflow-hidden font-sans pt-[env(safe-area-inset-top)]">
      {/* Mobile Top Bar */}
      <header className="flex items-center justify-between px-4 h-12 border-b border-[var(--border-base)] bg-[var(--bg-header)] shrink-0">
        <div className="flex items-center space-x-3">
          <button onClick={onNewFile} className="p-1 text-[var(--text-muted)] active:text-[var(--accent)]" title="새 파일">
            <FilePlus size={18} />
          </button>
          <button onClick={onOpenFile} className="p-1 text-[var(--text-muted)] active:text-[var(--accent)]" title="파일 열기">
            <FolderOpen size={18} />
          </button>
          <button onClick={onReset} className="p-1 text-[var(--text-muted)] active:text-red-500" title="화면 초기화">
            <RotateCcw size={18} />
          </button>
        </div>
        
        <div className="flex flex-col items-center justify-center flex-1 mx-2 overflow-hidden">
          <span className="text-[12px] font-bold truncate max-w-[100px]">
            {activeTab?.name || "Zenito MD"}
          </span>
          {isSaving && <span className="text-[8px] text-blue-400 animate-pulse uppercase">Saving...</span>}
        </div>

        <div className="flex items-center space-x-2">
          <button onClick={handleFindClick} className="p-1 text-[var(--text-muted)]" title="검색">
            <Search size={18} />
          </button>
          <button onClick={onOpenTheme} className="p-1 text-[var(--text-muted)]" title="설정">
            <Settings size={18} />
          </button>
          <button onClick={onExport} className="p-1 text-[var(--accent)] active:scale-95 transition-transform" title="저장">
            <Save size={18} />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 relative overflow-hidden">
        {activeTab ? (
          activeTab.isPdf ? (
            <div className="h-full w-full bg-[#525659]">
              <iframe 
                src={`${activeTab.content}#view=FitH`} 
                className="w-full h-full border-none"
                title={activeTab.name}
              />
            </div>
          ) : (
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
          )
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

      {/* Mobile Bottom Info Bar */}
      <div className="px-4 h-5 text-[9px] text-[var(--text-muted)] bg-[var(--bg-sidebar)] border-t border-[var(--border-base)] flex items-center justify-between shrink-0 select-none">
          <span className="truncate">{activeTab?.path || activeTab?.name || "Ready"}</span>
          <div className="flex space-x-2">
            <span>UTF-8</span>
            {activeTab?.isPdf && <span>[READ ONLY]</span>}
          </div>
      </div>

      {/* Mobile Bottom Tab Bar with Safe Area Handling */}
      {!activeTab?.isPdf && (
        <footer className="bg-[var(--bg-sidebar)] border-t border-[var(--border-base)] shrink-0 pb-[env(safe-area-inset-bottom)]">
          <div className="h-14 flex items-center justify-around px-2">
            <button 
              onClick={() => handleViewChange('editor')}
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
              onClick={() => handleViewChange('preview')}
              className={`flex flex-col items-center justify-center flex-1 h-full space-y-1 transition-colors ${activeView === 'preview' ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'}`}
            >
              <Eye size={22} />
              <span className="text-[10px] font-medium">Preview</span>
            </button>
          </div>
        </footer>
      )}
    </div>
  );
};

export default MobileLayout;
