import React, { useRef, useEffect } from 'react';
import { FileText, X, Layout, Eye, Code, PanelLeftOpen, Sparkles } from 'lucide-react';

interface Tab {
  id: string;
  name: string;
  path: string | null;
  isDirty?: boolean;
}

interface TabBarProps {
  tabs: Tab[];
  activeTabId: string | null;
  onTabSelect: (id: string) => void;
  onTabClose: (id: string) => void;
  viewMode: 'split' | 'editor' | 'preview';
  setViewMode: (mode: 'split' | 'editor' | 'preview') => void;
  isPrettyPrint: boolean;
  onTogglePrettyPrint: () => void;
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
}

const TabBar: React.FC<TabBarProps> = ({ 
  tabs, activeTabId, onTabSelect, onTabClose, viewMode, setViewMode, 
  isPrettyPrint, onTogglePrettyPrint, isSidebarCollapsed, onToggleSidebar 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll handling or overflow check if needed
  }, [tabs]);

  return (
    <div className="flex items-center justify-between bg-[var(--bg-tabbar)] border-b border-[var(--border-base)] h-9 shrink-0 select-none">
      <div className="flex items-center h-full flex-1 min-w-0">
        {/* Sidebar Toggle when collapsed */}
        {isSidebarCollapsed && (
          <button 
            onClick={onToggleSidebar}
            className="px-2 h-full border-r border-[var(--border-base)] hover:bg-[var(--bg-item-hover)] text-[var(--text-muted)] transition-colors border-none shadow-none outline-none bg-transparent"
            title="사이드바 확대"
          >
            <PanelLeftOpen size={16} />
          </button>
        )}

        <div ref={containerRef} className="flex items-center h-full overflow-x-auto no-scrollbar flex-1">
          {tabs.map(tab => (
            <div 
              key={tab.id}
              onClick={() => onTabSelect(tab.id)}
              className={`flex items-center px-3 h-full border-r border-[var(--border-base)] text-[11px] font-medium min-w-[120px] max-w-[200px] cursor-default group transition-colors ${
                activeTabId === tab.id ? 'bg-[var(--bg-app)] border-t-2 border-[var(--accent)] text-[var(--text-main)]' : 'text-[var(--text-muted)] hover:bg-[var(--bg-item-hover)]'
              }`}
            >
              <FileText size={12} className={`mr-2 ${activeTabId === tab.id ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'}`} />
              <span className="truncate flex-1">
                {tab.name}{tab.isDirty ? ' *' : ''}
              </span>
              <X 
                size={12} 
                className="ml-2 opacity-0 group-hover:opacity-100 hover:bg-[var(--bg-item-active)] rounded p-0.5 shrink-0" 
                onClick={(e) => {
                  e.stopPropagation();
                  onTabClose(tab.id);
                }}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center h-full px-2 space-x-2 border-l border-[var(--border-base)]">
        {/* Pretty Print Transform Button (Orange when active) */}
        <button 
          onClick={onTogglePrettyPrint}
          className={`flex items-center space-x-1.5 px-3 py-1 rounded transition-all border-none shadow-none outline-none bg-transparent ${
            isPrettyPrint 
              ? 'text-[var(--accent)]' 
              : 'text-[var(--text-muted)] hover:bg-[var(--bg-item-hover)]'
          }`}
          title="Pretty Print 변환 (코드 정렬 및 강조)"
        >
          <Sparkles size={14} className={isPrettyPrint ? 'animate-pulse' : ''} />
          <span className="text-[10px] font-bold whitespace-nowrap">Pretty Print</span>
        </button>

        <div className="flex items-center space-x-1 border-l border-[var(--border-base)] pl-2">
          <button 
            onClick={() => setViewMode('editor')}
            className={`p-1.5 rounded transition-colors border-none shadow-none outline-none bg-transparent ${viewMode === 'editor' ? 'text-[var(--accent)] bg-[var(--bg-item-active)]' : 'text-[var(--text-muted)] hover:bg-[var(--bg-item-hover)]'}`}
            title="Editor Only"
          >
            <Code size={14} />
          </button>
          <button 
            onClick={() => setViewMode('split')}
            className={`p-1.5 rounded transition-colors border-none shadow-none outline-none bg-transparent ${viewMode === 'split' ? 'text-[var(--accent)] bg-[var(--bg-item-active)]' : 'text-[var(--text-muted)] hover:bg-[var(--bg-item-hover)]'}`}
            title="Split View"
          >
            <Layout size={14} />
          </button>
          <button 
            onClick={() => setViewMode('preview')}
            className={`p-1.5 rounded transition-colors border-none shadow-none outline-none bg-transparent ${viewMode === 'preview' ? 'text-[var(--accent)] bg-[var(--bg-item-active)]' : 'text-[var(--text-muted)] hover:bg-[var(--bg-item-hover)]'}`}
            title="Preview Only"
          >
            <Eye size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TabBar;
