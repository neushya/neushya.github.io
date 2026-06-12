import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, Folder, FileText, FolderOpen, RefreshCw, PanelLeftClose } from 'lucide-react';
import { fileSystemService } from '../services/FileSystemService';
import type { FileEntry as WebFileEntry } from '../services/FileSystemService';

interface SidebarProps {
  rootHandle: FileSystemDirectoryHandle | null;
  rootName: string;
  onFileOpen: (handle: FileSystemFileHandle) => void;
  onFolderOpen: () => void;
  activeFileHandle: FileSystemFileHandle | null;
  width: number;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ rootHandle, rootName, onFileOpen, onFolderOpen, activeFileHandle, width, onToggle }) => {
  const [entries, setEntries] = useState<WebFileEntry[]>([]);
  const [isRootOpen, setIsRootOpen] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      if (rootHandle) {
        const granted = await fileSystemService.verifyPermission(rootHandle, false);
        setIsAuthorized(granted);
        if (granted) {
          loadDir(rootHandle);
        }
      }
    };
    checkAuth();
  }, [rootHandle, refreshKey]);

  const loadDir = async (handle: FileSystemDirectoryHandle) => {
    try {
      const result = await fileSystemService.getDirectoryEntries(handle);
      setEntries(result);
    } catch (err) {
      console.error("Failed to read root directory:", err);
    }
  };

  const handleRefresh = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (rootHandle) {
      setRefreshKey(prev => prev + 1);
    }
  };

  const handleRootClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsRootOpen(!isRootOpen);
  };

  const handleReAuthorize = async () => {
    if (rootHandle) {
      const granted = await fileSystemService.verifyPermission(rootHandle, true);
      if (granted) {
        setIsAuthorized(true);
        loadDir(rootHandle);
      }
    }
  };

  if (width === 0) return null;

  return (
    <div 
      className="bg-[var(--bg-sidebar)] flex flex-col overflow-hidden select-none font-sans h-full border-r border-[var(--border-base)]"
      style={{ width: `${width}px` }}
    >
      <div className="flex items-center justify-between px-3 h-8 bg-[var(--bg-header)] text-[11px] shrink-0 border-b border-[var(--border-base)]">
        <div className="flex items-center text-[var(--text-main)] font-bold tracking-tight">
          <button 
            onClick={onToggle} 
            className="p-0.5 hover:bg-[var(--bg-item-hover)] rounded mr-1.5 text-[var(--text-muted)] transition-colors border-none shadow-none outline-none bg-transparent cursor-default"
            title="사이드바 확대/축소"
          >
            <PanelLeftClose size={14} strokeWidth={2.5} />
          </button>
          <span className="uppercase tracking-widest opacity-80">Project</span>
        </div>
        <div className="flex items-center space-x-3 text-[var(--text-muted)]">
          <button onClick={onFolderOpen} title="Open Folder" className="hover:text-[var(--text-main)] transition-colors border-none shadow-none outline-none bg-transparent">
            <FolderOpen size={15} strokeWidth={1.5} />
          </button>
          <button onClick={handleRefresh} title="Refresh" className="hover:text-[var(--text-main)] transition-colors border-none shadow-none outline-none bg-transparent">
            <RefreshCw size={14} strokeWidth={1.5} />
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto py-1 text-[13px] text-[var(--text-main)] custom-scrollbar">
        {!rootHandle ? (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center">
            <p className="text-[var(--text-muted)] text-[11px] mb-4">No project opened</p>
            <button 
              onClick={onFolderOpen}
              className="px-4 py-1.5 bg-[var(--bg-item-hover)] text-[var(--text-main)] rounded-sm hover:bg-[var(--bg-item-active)] text-[12px] shadow-sm border border-[var(--border-base)]"
            >
              Open Folder
            </button>
          </div>
        ) : !isAuthorized ? (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center">
            <p className="text-[var(--text-muted)] text-[11px] mb-4 font-bold">작업공간 접근 권한이 필요합니다</p>
            <button 
              onClick={handleReAuthorize}
              className="px-4 py-1.5 bg-orange-500 text-white rounded-sm hover:bg-orange-600 text-[12px] shadow-sm transition-colors"
            >
              작업공간 재 연결
            </button>
          </div>
        ) : (
          <div className="min-w-full">
            <div 
              className="flex items-center px-2 py-0.5 hover:bg-[var(--bg-item-hover)] cursor-default font-semibold transition-colors"
              onClick={handleRootClick}
            >
              <span className="w-4 flex items-center justify-center shrink-0">
                {isRootOpen ? <ChevronDown size={14} className="text-[var(--text-muted)]" /> : <ChevronRight size={14} className="text-[var(--text-muted)]" />}
              </span>
              <Folder size={14} className="mr-1.5 text-[var(--text-muted)]" />
              <span className="truncate">{rootName}</span>
            </div>
            
            {isRootOpen && (
              <div className="min-w-full" key={refreshKey}>
                {entries.map(entry => (
                  <FileTreeItem 
                    key={entry.name} 
                    entry={entry} 
                    onFileOpen={onFileOpen}
                    depth={1}
                    activeFileHandle={activeFileHandle}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

interface FileTreeItemProps {
  entry: WebFileEntry;
  onFileOpen: (handle: FileSystemFileHandle) => void;
  depth: number;
  activeFileHandle: FileSystemFileHandle | null;
}

const FileTreeItem: React.FC<FileTreeItemProps> = ({ entry, onFileOpen, depth, activeFileHandle }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [subEntries, setSubEntries] = useState<WebFileEntry[]>([]);

  const [isActive, setIsActive] = useState(false);

  // active 판정: 이름이 다르면 즉시 false(동기), 이름이 충돌할 때만
  // FileSystemHandle.isSameEntry로 핸들 동일성 정밀 비교(다른 폴더 동명 파일 구분)
  useEffect(() => {
    let cancelled = false;
    if (!activeFileHandle || entry.kind !== 'file' || entry.name !== activeFileHandle.name) {
      setIsActive(false);
      return;
    }
    (activeFileHandle as FileSystemHandle)
      .isSameEntry(entry.handle as FileSystemHandle)
      .then(same => { if (!cancelled) setIsActive(same); })
      .catch(() => { if (!cancelled) setIsActive(false); });
    return () => { cancelled = true; };
  }, [activeFileHandle, entry.handle, entry.kind, entry.name]);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (entry.kind === 'directory') {
      if (!isOpen) {
        try {
          const result = await fileSystemService.getDirectoryEntries(entry.handle as FileSystemDirectoryHandle);
          setSubEntries(result);
        } catch (err) {
          console.error("Failed to read directory:", err);
        }
      }
      setIsOpen(!isOpen);
    } else {
      onFileOpen(entry.handle as FileSystemFileHandle);
    }
  };

  return (
    <div className="w-full">
      <div 
        className={`flex items-center py-[1px] cursor-default select-none transition-colors group ${
          isActive 
            ? 'bg-[var(--bg-item-active)] text-white' 
            : 'hover:bg-[var(--bg-item-hover)] text-[var(--text-main)]'
        }`}
        style={{ paddingLeft: `${depth * 12 + 12}px`, paddingRight: '8px' }}
        onClick={handleClick}
      >
        <span className="w-4 flex items-center justify-center shrink-0">
          {entry.kind === 'directory' && (
            isOpen ? <ChevronDown size={14} className={isActive ? 'text-white' : 'text-[var(--text-muted)]'} /> : <ChevronRight size={14} className={isActive ? 'text-white' : 'text-[var(--text-muted)]'} />
          )}
        </span>
        <span className="mr-1.5 flex items-center shrink-0 scale-90">
          {entry.kind === 'directory' 
            ? <Folder size={16} className={isActive ? 'text-white' : 'text-[var(--text-muted)]'} /> 
            : <FileText size={16} className={isActive ? 'text-white' : (entry.name.endsWith('.md') ? "text-[var(--accent)]" : "text-[var(--text-muted)]")} />
          }
        </span>
        <span className="truncate flex-1 font-normal">{entry.name}</span>
      </div>
      
      {isOpen && entry.kind === 'directory' && (
        <div className="w-full">
          {subEntries.length > 0 ? (
            subEntries.map(sub => (
              <FileTreeItem 
                key={sub.name} 
                entry={sub} 
                onFileOpen={onFileOpen}
                depth={depth + 1}
                activeFileHandle={activeFileHandle}
              />
            ))
          ) : (
            <div 
              className="py-0.5 text-[11px] text-[var(--text-muted)] italic" 
              style={{ paddingLeft: `${(depth + 1) * 12 + 28}px` }}
            >
              (empty)
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Sidebar;
