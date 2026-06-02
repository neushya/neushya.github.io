import { useState, useCallback, useRef, useEffect } from "react";
import "./App.css";
import GNB from "./components/GNB";
import Sidebar from "./components/Sidebar";
import TabBar from "./components/TabBar";
import Editor from "./components/Editor";
import type { EditorHandle } from "./components/Editor";
import Preview from "./components/Preview";
import type { PreviewHandle } from "./components/Preview";
import ShortcutSettings from "./components/ShortcutSettings";
import type { ShortcutItem } from "./components/ShortcutSettings";
import ThemeSettings from "./components/ThemeSettings";
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from "react-resizable-panels";
import { fileSystemService } from "./services/FileSystemService";
import { get, set } from "idb-keyval";

export interface Tab {
  id: string;
  name: string;
  path: string | null; // Keep for legacy, but we'll use handle
  handle: FileSystemFileHandle | null;
  content: string;
  isDirty: boolean;
}

const DEFAULT_SHORTCUTS: ShortcutItem[] = [
  { id: 'new-file', name: '새 탭 만들기', windows: 'Ctrl+N', mac: 'command+N' },
  { id: 'open-file', name: '파일 열기', windows: 'Ctrl+O', mac: 'command+O' },
  { id: 'open-folder', name: '폴더 열기', windows: 'Ctrl+I', mac: 'command+I' },
  { id: 'save', name: '저장', windows: 'Ctrl+S', mac: 'command+S' },
  { id: 'save-as', name: '다른 이름으로 저장', windows: 'Ctrl+Shift+S', mac: 'command+Shift+S' },
  { id: 'close', name: '닫기', windows: 'Ctrl+Q', mac: 'command+Q' },
  { id: 'undo', name: '실행 취소', windows: 'Ctrl+Z', mac: 'command+Z' },
  { id: 'redo', name: '실행 복귀', windows: 'Ctrl+Y', mac: 'command+Y' },
  { id: 'find', name: '찾기', windows: 'Ctrl+F', mac: 'command+F' }
];

const STORAGE_KEY = "md_editor_shortcuts";
const WORKSPACE_KEY = "md_editor_workspace_handle";

function App() {
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [rootHandle, setRootHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [rootName, setRootName] = useState<string>("No Folder");
  const [viewMode, setViewMode] = useState<'split' | 'editor' | 'preview'>('split');
  const [sidebarWidth, setSidebarWidth] = useState(200);
  const [prevWidth, setPrevWidth] = useState(200);
  const [isPrettyPrint, setIsPrettyPrint] = useState(true);
  const [lastActivePanel, setLastActivePanel] = useState<'editor' | 'preview'>('editor');
  
  const [shortcuts, setShortcuts] = useState<ShortcutItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : DEFAULT_SHORTCUTS;
  });

  const [isShortcutModalOpen, setIsShortcutModalOpen] = useState(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem("isDarkMode");
    return saved !== null ? JSON.parse(saved) : true;
  });
  
  // Load workspace handle from IndexedDB on mount
  useEffect(() => {
    const loadWorkspace = async () => {
      try {
        const handle = await get(WORKSPACE_KEY);
        if (handle) {
          setRootHandle(handle);
          setRootName(handle.name);
        }
      } catch (err) {
        console.error("Failed to load workspace handle:", err);
      }
    };
    loadWorkspace();
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem("isDarkMode", JSON.stringify(isDarkMode));
  }, [isDarkMode]);
  
  const handleSaveShortcuts = (newShortcuts: ShortcutItem[]) => {
    setShortcuts(newShortcuts);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newShortcuts));
    setIsShortcutModalOpen(false);
  };
  
  const editorRef = useRef<EditorHandle>(null);
  const previewRef = useRef<PreviewHandle>(null);
  const isResizing = useRef(false);

  const activeTab = tabs.find(t => t.id === activeTabId);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modKey = isMac ? e.metaKey : e.ctrlKey;
      const checkMatch = (id: string) => {
        const item = shortcuts.find(s => s.id === id);
        if (!item) return false;
        const sc = (isMac ? item.mac : item.windows).toLowerCase();
        const keys = sc.split('+');
        const hasCtrl = keys.includes('ctrl') || keys.includes('command');
        const hasShift = keys.includes('shift');
        const mainKey = keys[keys.length - 1];
        return modKey === hasCtrl && e.shiftKey === hasShift && e.key.toLowerCase() === mainKey;
      };

      if (checkMatch('new-file')) { e.preventDefault(); handleNewFile(); }
      else if (checkMatch('open-file')) { e.preventDefault(); handleOpenFile(); }
      else if (checkMatch('open-folder')) { e.preventDefault(); handleFolderOpen(); }
      else if (checkMatch('save')) { e.preventDefault(); handleSave(); }
      else if (checkMatch('save-as')) { e.preventDefault(); handleSaveAs(); }
      else if (checkMatch('close')) { e.preventDefault(); handleClose(); }
      else if (checkMatch('undo')) { e.preventDefault(); editorRef.current?.undo(); }
      else if (checkMatch('redo')) { e.preventDefault(); editorRef.current?.redo(); }
      else if (checkMatch('find')) { 
        e.preventDefault(); 
        handleFind();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts, activeTabId, tabs, viewMode, lastActivePanel]);

  const handleFind = (query?: string) => {
    if (viewMode === 'editor') {
      editorRef.current?.focus();
      editorRef.current?.find(query);
    } else if (viewMode === 'preview') {
      previewRef.current?.find(query);
    } else {
      if (lastActivePanel === 'editor') {
        editorRef.current?.focus();
        editorRef.current?.find(query);
      } else {
        previewRef.current?.find(query);
      }
    }
  };

  const startResizing = useCallback(() => {
    isResizing.current = true;
    document.body.style.cursor = 'col-resize';
  }, []);

  const stopResizing = useCallback(() => {
    isResizing.current = false;
    document.body.style.cursor = 'default';
  }, []);

  const resize = useCallback((e: MouseEvent) => {
    if (isResizing.current) {
      setSidebarWidth(Math.max(e.clientX, 200));
    }
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', resize);
    window.addEventListener('mouseup', stopResizing);
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [resize, stopResizing]);

  const handleToggleSidebar = useCallback(() => {
    if (sidebarWidth > 0) {
      setPrevWidth(sidebarWidth);
      setSidebarWidth(0);
    } else {
      setSidebarWidth(prevWidth > 0 ? prevWidth : 200);
    }
  }, [sidebarWidth, prevWidth]);

  const handleNewFile = () => {
    const newId = Math.random().toString(36).substring(7);
    setTabs(prev => [...prev, { id: newId, name: "Untitled.md", path: null, handle: null, content: "", isDirty: false }]);
    setActiveTabId(newId);
  };

  const handleOpenFile = async () => {
    try {
      const [handle] = await window.showOpenFilePicker({
        types: [{
          description: 'Text Files',
          accept: { 'text/plain': ['.md', '.txt', '.json', '.js', '.ts', '.py'] }
        }],
        multiple: false
      });
      if (handle) {
        handleFileOpen(handle);
      }
    } catch (err) {
      console.error("File open failed:", err);
    }
  };

  const handleFolderOpen = async () => {
    try {
      const handle = await fileSystemService.openDirectory();
      if (handle) {
        setRootHandle(handle);
        setRootName(handle.name);
        await set(WORKSPACE_KEY, handle);
      }
    } catch (err) {
      console.error("Folder open failed:", err);
    }
  };

  const handleFileOpen = async (handle: FileSystemFileHandle) => {
    const existingTab = tabs.find(t => t.handle?.name === handle.name); // Simplified check
    if (existingTab) {
      setActiveTabId(existingTab.id);
      return;
    }

    try {
      const content = await fileSystemService.readFile(handle);
      const newId = Math.random().toString(36).substring(7);
      setTabs(prev => [...prev, { id: newId, name: handle.name, path: handle.name, handle, content, isDirty: false }]);
      setActiveTabId(newId);
    } catch (err) {
      alert(`'${handle.name}' 파일을 열 수 없습니다.\n\n사유: ${err}`);
    }
  };

  const handleSave = async (tabToSave?: Tab) => {
    const targetTab = tabToSave || activeTab;
    if (!targetTab) return false;
    try {
      let handle = targetTab.handle;
      if (!handle) {
        handle = await window.showSaveFilePicker({
          suggestedName: targetTab.name,
          types: [{ description: 'Markdown', accept: { 'text/markdown': ['.md'] } }]
        });
      }
      if (handle) {
        await fileSystemService.writeFile(handle, targetTab.content);
        setTabs(prev => prev.map(t => t.id === targetTab.id ? { ...t, handle, name: handle!.name, isDirty: false } : t));
        return true;
      }
      return false;
    } catch (err) {
      return false;
    }
  };

  const handleSaveAs = async () => {
    if (!activeTab) return;
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: activeTab.name,
        types: [{ description: 'Markdown', accept: { 'text/markdown': ['.md'] } }]
      });
      if (handle) {
        await fileSystemService.writeFile(handle, activeTab.content);
        setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, handle, name: handle!.name, isDirty: false } : t));
      }
    } catch (err) {
      console.error("Save As failed:", err);
    }
  };

  const handleClose = async () => {
    const hasDirty = tabs.some(t => t.isDirty);
    if (hasDirty) {
      if (confirm("작성 중인 내용이 있습니다. 저장하시겠습니까?")) {
        const dirtyTabs = tabs.filter(t => t.isDirty);
        for (const t of dirtyTabs) await handleSave(t);
        window.close();
      }
    } else {
      window.close();
    }
  };

  const handleTabClose = async (id: string) => {
    const tabToClose = tabs.find(t => t.id === id);
    if (!tabToClose) return;

    if (tabToClose.isDirty) {
      if (confirm(`'${tabToClose.name}'의 변경 내용을 저장하시겠습니까?`)) {
        const saved = await handleSave(tabToClose);
        if (!saved) return;
      }
    }

    setTabs(prev => {
      const newTabs = prev.filter(t => t.id !== id);
      if (activeTabId === id) {
        setActiveTabId(newTabs.length > 0 ? newTabs[newTabs.length - 1].id : null);
      }
      return newTabs;
    });
  };

  const updateContent = useCallback((newContent: string) => {
    if (activeTabId) {
      setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, content: newContent, isDirty: true } : t));
    }
  }, [activeTabId]);

  return (
    <div className="flex flex-col h-screen w-full bg-[var(--bg-app)] overflow-hidden text-[var(--text-main)] font-sans transition-colors duration-200">
      <GNB 
        onNewFile={handleNewFile}
        onOpenFile={handleOpenFile}
        onOpenFolder={handleFolderOpen}
        onSave={() => handleSave()}
        onSaveAs={handleSaveAs}
        onClose={handleClose}
        onUndo={() => editorRef.current?.undo()}
        onRedo={() => editorRef.current?.redo()}
        onFind={handleFind}
        onOpenShortcuts={() => setIsShortcutModalOpen(true)}
        onOpenTheme={() => setIsThemeModalOpen(true)}
        shortcuts={shortcuts}
      />
      
      <div className="flex-1 flex overflow-hidden w-full relative">
        <Sidebar 
          rootHandle={rootHandle} 
          rootName={rootName} 
          onFileOpen={handleFileOpen} 
          onFolderOpen={handleFolderOpen}
          activeFileHandle={activeTab?.handle || null}
          width={sidebarWidth}
          onToggle={handleToggleSidebar}
        />
        
        {sidebarWidth > 0 && (
          <div 
            className="w-[5px] h-full bg-[var(--border-base)] hover:bg-orange-400 active:bg-orange-600 cursor-col-resize shrink-0 transition-colors z-10"
            onMouseDown={startResizing}
          />
        )}
        
        <div className="flex-1 flex flex-col overflow-hidden min-w-0 bg-[var(--bg-app)]">
          <TabBar 
            tabs={tabs} 
            activeTabId={activeTabId} 
            onTabSelect={setActiveTabId} 
            onTabClose={handleTabClose}
            viewMode={viewMode} 
            setViewMode={setViewMode} 
            isPrettyPrint={isPrettyPrint}
            onTogglePrettyPrint={() => setIsPrettyPrint(!isPrettyPrint)}
            isSidebarCollapsed={sidebarWidth === 0}
            onToggleSidebar={handleToggleSidebar}
          />
          
          <main className="flex-1 overflow-hidden relative">
            {activeTab ? (
              <PanelGroup orientation="horizontal" key={`${activeTab.id}-${isDarkMode}-${viewMode}`}>
                {(viewMode === 'editor' || viewMode === 'split') && (
                  <Panel 
                    defaultSize={viewMode === 'split' ? 50 : 100} 
                    minSize={0} 
                    className="h-full overflow-hidden"
                  >
                    <div className="h-full w-full" onClick={() => setLastActivePanel('editor')}>
                      <Editor 
                        key={`editor-${activeTab.id}-${isDarkMode}`} 
                        ref={editorRef} 
                        value={activeTab.content} 
                        onChange={updateContent} 
                        isDarkMode={isDarkMode} 
                      />
                    </div>
                  </Panel>
                )}
                {viewMode === 'split' && (
                  <PanelResizeHandle className="w-[5px] bg-[var(--border-base)] hover:bg-orange-400 transition-colors cursor-col-resize shrink-0 z-10" />
                )}
                {(viewMode === 'preview' || viewMode === 'split') && (
                  <Panel 
                    defaultSize={viewMode === 'split' ? 50 : 100} 
                    minSize={0} 
                    className="h-full overflow-hidden"
                  >
                    <div className="h-full w-full" onClick={() => setLastActivePanel('preview')}>
                      <Preview 
                        key={`preview-${activeTab.id}-${isPrettyPrint}`} 
                        ref={previewRef}
                        content={activeTab.content} 
                        isPrettyPrint={isPrettyPrint}
                        activeTabPath={activeTab.path}
                      />
                    </div>
                  </Panel>
                )}
              </PanelGroup>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-[var(--text-muted)] space-y-4">
                <div className="text-4xl opacity-20 font-bold tracking-tighter uppercase italic select-none">Zenito's Markdown</div>
                <div className="text-[11px] opacity-40">Select a file from project to edit</div>
              </div>
            )}
          </main>
        </div>
      </div>
      
      {isShortcutModalOpen && (
        <ShortcutSettings 
          shortcuts={shortcuts} 
          defaultShortcuts={DEFAULT_SHORTCUTS}
          onSave={handleSaveShortcuts}
          onClose={() => setIsShortcutModalOpen(false)}
        />
      )}

      {isThemeModalOpen && (
        <ThemeSettings 
          isDarkMode={isDarkMode}
          onToggleTheme={setIsDarkMode}
          onClose={() => setIsThemeModalOpen(false)}
        />
      )}

      <footer className="px-4 h-6 text-[11px] text-[var(--text-muted)] bg-[var(--bg-sidebar)] border-t border-[var(--border-base)] flex items-center justify-between shrink-0 select-none">
        <div className="flex items-center space-x-4 overflow-hidden text-ellipsis whitespace-nowrap">
          <span className="truncate">{activeTab?.path || activeTab?.name || "Ready"}</span>
          {activeTab?.isDirty && <span className="text-orange-400 shrink-0">*Modified</span>}
        </div>
        <div className="flex items-center space-x-4 shrink-0 ml-4">
          <span>LF</span><span>UTF-8</span><span>4 spaces</span><span className="text-[var(--text-muted)]">Markdown</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
