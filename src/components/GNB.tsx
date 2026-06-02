import React, { useState } from 'react';
import { Menu, Search, FolderOpen, FilePlus, Save, FileType, LogOut, Undo2, Redo2 } from 'lucide-react';
import type { ShortcutItem } from './ShortcutSettings';

interface GNBProps {
  onNewFile: () => void;
  onOpenFile: () => void;
  onOpenFolder: () => void;
  onSave: () => void;
  onSaveAs: () => void;
  onClose: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onFind: (query?: string) => void;
  onOpenShortcuts: () => void;
  onOpenTheme: () => void;
  shortcuts: ShortcutItem[];
}

interface MenuItem {
  label?: string;
  id?: string;
  icon?: React.ReactNode;
  action?: () => void;
  divider?: boolean;
}

const GNB: React.FC<GNBProps> = ({ 
  onNewFile, onOpenFile, onOpenFolder, onSave, onSaveAs, onClose, 
  onUndo, onRedo, onFind, onOpenShortcuts, onOpenTheme, shortcuts
}) => {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [searchValue, setSearchValue] = useState('');
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;

  const getShortcutLabel = (id: string) => {
    const item = shortcuts.find(s => s.id === id);
    if (!item) return '';
    const label = isMac ? item.mac : item.windows;
    return label.replace('command', '⌘').replace('Ctrl', '⌃').replace('Shift', '⇧');
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onFind(searchValue);
    }
  };

  const menus = [
    { 
      name: '파일', 
      items: [
        { label: '새 탭 만들기', id: 'new-file', icon: <FilePlus size={14} />, action: onNewFile },
        { label: '파일 열기', id: 'open-file', icon: <FileType size={14} />, action: onOpenFile },
        { label: '폴더 열기', id: 'open-folder', icon: <FolderOpen size={14} />, action: onOpenFolder },
        { divider: true },
        { label: '저장', id: 'save', icon: <Save size={14} />, action: onSave },
        { label: '다른 이름으로 저장', id: 'save-as', icon: <Save size={14} />, action: onSaveAs },
        { divider: true },
        { label: '닫기', id: 'close', icon: <LogOut size={14} />, action: onClose },
      ] as MenuItem[]
    },
    { 
      name: '편집', 
      items: [
        { label: '실행 취소', id: 'undo', icon: <Undo2 size={14} />, action: onUndo },
        { label: '실행 복귀', id: 'redo', icon: <Redo2 size={14} />, action: onRedo },
        { divider: true },
        { label: '찾기', id: 'find', icon: <Search size={14} />, action: () => onFind() },
      ] as MenuItem[]
    },
    { 
      name: '설정', 
      items: [
        { label: '배경화면', action: onOpenTheme },
        { label: '단축키 설정', action: onOpenShortcuts },
      ] as MenuItem[]
    }
  ];

  return (
    <div className="flex items-center justify-between px-2 bg-[var(--bg-header)] text-[var(--text-main)] border-b border-[var(--border-base)] h-9 select-none shrink-0 relative z-[100]">
      <div className="flex items-center space-x-1 h-full">
        <Menu size={16} className="text-[var(--text-muted)] mr-2" />
        {menus.map(menu => (
          <div key={menu.name} className="relative h-full flex items-center">
            <button 
              onMouseEnter={() => activeMenu && setActiveMenu(menu.name)}
              onClick={() => setActiveMenu(activeMenu === menu.name ? null : menu.name)}
              className={`px-3 h-full text-[11px] font-normal transition-colors cursor-default ${activeMenu === menu.name ? 'bg-[var(--bg-item-hover)] text-[var(--text-main)]' : 'bg-transparent hover:bg-[var(--bg-item-hover)]'}`}
            >
              {menu.name}
            </button>
            {activeMenu === menu.name && (
              <div 
                className="absolute top-full left-0 w-64 bg-[var(--bg-sidebar)] border border-[var(--border-base)] shadow-2xl py-1"
                onMouseLeave={() => setActiveMenu(null)}
              >
                {menu.items.map((item, idx) => (
                  item.divider ? (
                    <div key={idx} className="h-px bg-[var(--border-base)] my-1 mx-1" />
                  ) : (
                    <button 
                      key={item.label} 
                      onClick={() => { item.action?.(); setActiveMenu(null); }}
                      className="w-full flex items-center px-4 py-1.5 text-[11px] hover:bg-[var(--bg-item-active)] text-left group"
                    >
                      {item.icon && <span className="mr-3 opacity-70 scale-90">{item.icon}</span>}
                      <span className="flex-1">{item.label}</span>
                      {item.id && (
                        <span className="ml-4 text-[10px] text-[var(--text-muted)] group-hover:text-[var(--text-main)]">
                          {getShortcutLabel(item.id)}
                        </span>
                      )}
                    </button>
                  )
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center h-full pr-2">
        <div className="flex items-center bg-[var(--bg-app)] px-3 py-1 rounded border border-[var(--border-base)] text-[12px] w-64 focus-within:border-orange-500 transition-colors">
          <Search size={14} className="text-[var(--text-muted)] mr-2" />
          <input 
            type="text" 
            placeholder="Search" 
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="bg-transparent border-none outline-none text-[12px] w-full text-[var(--text-main)] placeholder:text-[var(--text-muted)]"
            onKeyDown={handleSearchKeyDown}
          />
        </div>
      </div>
    </div>
  );
};

export default GNB;
