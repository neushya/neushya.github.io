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
import MobileLayout from "./components/MobileLayout";
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from "react-resizable-panels";
import { fileSystemService } from "./services/FileSystemService";
import { get, set, clear } from "idb-keyval";

export interface Tab {
  id: string;
  name: string;
  path: string | null;
  handle: FileSystemFileHandle | null;
  content: string;
  isDirty: boolean;
  isPdf?: boolean;
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
const TABS_STATE_KEY = "md_editor_tabs_state"; 
const AUTO_SAVE_DELAY = 1000;

function App() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [rootHandle, setRootHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [rootName, setRootName] = useState<string>("No Folder");
  const [viewMode, setViewMode] = useState<'split' | 'editor' | 'preview'>('split');
  const [sidebarWidth, setSidebarWidth] = useState(200);
  const [isPrettyPrint, setIsPrettyPrint] = useState(true);
  const [lastActivePanel, setLastActivePanel] = useState<'editor' | 'preview'>('editor');
  const [isSaving, setIsSaving] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  
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
  
  const autoSaveTimerRef = useRef<number | null>(null);
  const editorRef = useRef<EditorHandle>(null);
  const previewRef = useRef<PreviewHandle>(null);
  const isResizing = useRef(false);

  const activeTab = tabs.find(t => t.id === activeTabId);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        const workspace = await get(WORKSPACE_KEY);
        if (workspace) { setRootHandle(workspace); setRootName(workspace.name); }
        const savedState = await get(TABS_STATE_KEY);
        if (savedState && savedState.tabs) {
            const cleanedTabs = savedState.tabs.map((t: Tab) => t.isPdf ? { ...t, content: '' } : t);
            setTabs(cleanedTabs);
            setActiveTabId(savedState.activeTabId);
        }
      } catch (err) { console.error("Initialization failed:", err); }
      finally { setIsInitialized(true); }
    };
    initializeApp();
  }, []);

  useEffect(() => {
    if (!isInitialized) return;
    set(TABS_STATE_KEY, { tabs, activeTabId });
  }, [tabs, activeTabId, isInitialized]);

  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem("isDarkMode", JSON.stringify(isDarkMode));
  }, [isDarkMode]);
  
  const handleSaveShortcuts = (newShortcuts: ShortcutItem[]) => {
    setShortcuts(newShortcuts);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newShortcuts));
    setIsShortcutModalOpen(false);
  };

  const handleFind = (query?: string, forceSource?: 'editor' | 'preview') => {
    if (activeTab?.isPdf) return;
    const targetSource = forceSource || (isMobile ? lastActivePanel : (viewMode === 'preview' ? 'preview' : 'editor'));
    if (targetSource === 'editor') { editorRef.current?.focus(); editorRef.current?.find(query); }
    else { previewRef.current?.find(query); }
  };

  const handleReset = async () => {
    if (confirm("모든 설정과 탭을 초기화하시겠습니까? (로컬 파일은 삭제되지 않습니다)")) {
      await clear();
      localStorage.clear();
      window.location.reload();
    }
  };

  const handleNewFile = () => {
    const newId = Math.random().toString(36).substring(7);
    const fileName = isMobile ? "Mobile-Draft.md" : "Untitled.md";
    const newTab: Tab = { id: newId, name: fileName, path: null, handle: null, content: "", isDirty: false };
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newId);
  };

  const handleOpenFile = async () => {
    if (activeTab?.isDirty) { if (!confirm("변경 내용을 저장하지 않고 다른 파일을 여시겠습니까?")) return; }
    try {
      const [handle] = await window.showOpenFilePicker({
        types: [{ description: '문서 및 개발 파일', accept: { 'text/plain': ['.txt', '.md', '.markdown', '.sql', '.sh', '.yaml', '.yml', '.env', '.log'], 'application/json': ['.json'], 'application/javascript': ['.js', '.jsx'], 'application/typescript': ['.ts', '.tsx'], 'text/css': ['.css'], 'text/html': ['.html'], 'application/pdf': ['.pdf'] } }],
        multiple: false
      });
      if (handle) handleFileOpen(handle);
    } catch (err) { if ((err as Error).name !== 'AbortError') console.error("File open failed:", err); }
  };

  const handleFolderOpen = async () => {
    if (isMobile) { alert("모바일 브라우저에서는 폴더 열기를 지원하지 않습니다. 파일 열기를 이용해 주세요."); return; }
    try {
      const handle = await fileSystemService.openDirectory();
      if (handle) { setRootHandle(handle); setRootName(handle.name); await set(WORKSPACE_KEY, handle); }
    } catch (err) { console.error("Folder open failed:", err); }
  };

  const handleFileOpen = async (handle: FileSystemFileHandle) => {
    const ext = handle.name.split('.').pop()?.toLowerCase() || '';
    if (ext === 'pdf') {
      try {
        const file = await handle.getFile();
        const url = URL.createObjectURL(file);
        const newId = Math.random().toString(36).substring(7);
        setTabs(prev => [...prev, { id: newId, name: handle.name, path: handle.name, handle, content: url, isDirty: false, isPdf: true }]);
        setActiveTabId(newId);
        return;
      } catch (err) { alert("PDF 파일을 불러오는 중 오류가 발생했습니다."); return; }
    }

    const mediaExtensions = ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'ico', 'svg', 'mp4', 'mov', 'avi', 'mkv', 'webm', 'flv', 'mp3', 'wav', 'ogg', 'm4a', 'flac', 'zip', 'rar', '7z', 'tar', 'gz', 'exe', 'dll', 'so', 'dylib', 'bin', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'];
    if (mediaExtensions.includes(ext)) { alert("문서 파일이 아닙니다."); return; }

    const existingTab = tabs.find(t => t.handle?.name === handle.name && !t.isPdf);
    if (existingTab) { setActiveTabId(existingTab.id); return; }

    try {
      const content = await fileSystemService.readFile(handle);
      const newId = Math.random().toString(36).substring(7);
      setTabs(prev => [...prev, { id: newId, name: handle.name, path: handle.name, handle, content, isDirty: false }]);
      setActiveTabId(newId);
    } catch (err) { alert(`'${handle.name}' 파일을 열 수 없습니다.\n\n사유: ${err}`); }
  };

  const handleExport = async () => {
    if (!activeTab || activeTab.isPdf) return;
    try {
      const blob = new Blob([activeTab.content], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = activeTab.name.endsWith('.md') ? activeTab.name : `${activeTab.name}.md`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, isDirty: false } : t));
    } catch (err) { console.error("Export failed:", err); }
  };

  const executeSave = async (tab: Tab) => {
    if (!tab.handle || tab.isPdf) return false;
    setIsSaving(true);
    try {
      await fileSystemService.writeFile(tab.handle, tab.content);
      setTabs(prev => prev.map(t => t.id === tab.id ? { ...t, isDirty: false } : t));
      return true;
    } catch (err) { console.error("Auto-save failed:", err); return false; }
    finally { setTimeout(() => setIsSaving(false), 500); }
  };

  const handleSave = async (tabToSave?: Tab) => {
    const targetTab = tabToSave || activeTab;
    if (!targetTab || targetTab.isPdf) return false;
    if (isMobile) { handleExport(); return true; }
    try {
      let handle = targetTab.handle;
      if (!handle) {
        handle = await window.showSaveFilePicker({ suggestedName: targetTab.name, types: [{ description: 'Markdown', accept: { 'text/markdown': ['.md'] } }] });
      }
      if (handle) { return await executeSave({ ...targetTab, handle, name: handle.name }); }
      return false;
    } catch (err) { return false; }
  };

  const handleSaveAs = async () => {
    if (!activeTab || activeTab.isPdf) return;
    if (isMobile) { handleExport(); return; }
    try {
      const handle = await window.showSaveFilePicker({ suggestedName: activeTab.name, types: [{ description: 'Markdown', accept: { 'text/markdown': ['.md'] } }] });
      if (handle) await executeSave({ ...activeTab, handle, name: handle.name });
    } catch (err) { console.error("Save As failed:", err); }
  };

  const handleTabClose = async (id: string) => {
    const tabToClose = tabs.find(t => t.id === id);
    if (!tabToClose) return;
    if (tabToClose.isPdf && tabToClose.content) URL.revokeObjectURL(tabToClose.content);
    if (tabToClose.isDirty && !tabToClose.handle && !isMobile) { if (!confirm(`'${tabToClose.name}'의 변경 내용을 저장하지 않고 닫으시겠습니까?`)) return; }
    setTabs(prev => {
      const newTabs = prev.filter(t => t.id !== id);
      if (activeTabId === id) setActiveTabId(newTabs.length > 0 ? newTabs[newTabs.length - 1].id : null);
      return newTabs;
    });
  };

  const updateContent = useCallback((newContent: string) => {
    if (!activeTabId || activeTab?.isPdf) return;
    setTabs(prev => prev.map(t => {
      if (t.id === activeTabId) {
        const updated = { ...t, content: newContent, isDirty: true };
        if (updated.handle && !isMobile) {
            if (autoSaveTimerRef.current) window.clearTimeout(autoSaveTimerRef.current);
            autoSaveTimerRef.current = window.setTimeout(() => executeSave(updated), AUTO_SAVE_DELAY);
        }
        return updated;
      }
      return t;
    }));
  }, [activeTabId, activeTab, isMobile]);

  const startResizing = useCallback(() => { isResizing.current = true; document.body.style.cursor = 'col-resize'; }, []);
  const stopResizing = useCallback(() => { isResizing.current = false; document.body.style.cursor = 'default'; }, []);
  const resize = useCallback((e: MouseEvent) => { if (isResizing.current) setSidebarWidth(Math.max(e.clientX, 200)); }, []);
  useEffect(() => {
    window.addEventListener('mousemove', resize); window.addEventListener('mouseup', stopResizing);
    return () => { window.removeEventListener('mousemove', resize); window.removeEventListener('mouseup', stopResizing); };
  }, [resize, stopResizing]);

  return (
    <div className="flex flex-col h-screen w-full bg-[var(--bg-app)] overflow-hidden text-[var(--text-main)] font-sans transition-colors duration-200">
      {isMobile ? (
        <MobileLayout 
          activeTab={activeTab} onContentChange={updateContent} onNewFile={handleNewFile} onOpenFile={handleOpenFile} onExport={handleExport}
          isPrettyPrint={isPrettyPrint} onTogglePrettyPrint={() => setIsPrettyPrint(!isPrettyPrint)} isDarkMode={isDarkMode}
          editorRef={editorRef} previewRef={previewRef} onFind={handleFind} onOpenTheme={() => setIsThemeModalOpen(true)}
          onPanelActive={(panel) => setLastActivePanel(panel)} onReset={handleReset}
        />
      ) : (
        <>
          <GNB 
            onNewFile={handleNewFile} onOpenFile={handleOpenFile} onOpenFolder={handleFolderOpen} onSave={() => handleSave()} onSaveAs={handleSaveAs}
            onClose={() => window.close()} onUndo={() => editorRef.current?.undo()} onRedo={() => editorRef.current?.redo()} onFind={handleFind}
            onOpenShortcuts={() => setIsShortcutModalOpen(true)} onOpenTheme={() => setIsThemeModalOpen(true)} shortcuts={shortcuts}
          />
          <div className="flex-1 flex overflow-hidden w-full relative">
            <Sidebar rootHandle={rootHandle} rootName={rootName} onFileOpen={handleFileOpen} onFolderOpen={handleFolderOpen} activeFileHandle={activeTab?.handle || null} width={sidebarWidth} onToggle={() => setSidebarWidth(0)} />
            {sidebarWidth > 0 && ( <div className="w-[5px] h-full bg-[var(--border-base)] hover:bg-orange-400 active:bg-orange-600 cursor-col-resize shrink-0 transition-colors z-10" onMouseDown={startResizing} /> )}
            <div className="flex-1 flex flex-col overflow-hidden min-w-0 bg-[var(--bg-app)]">
              <TabBar tabs={tabs} activeTabId={activeTabId} onTabSelect={setActiveTabId} onTabClose={handleTabClose} viewMode={viewMode} setViewMode={setViewMode} isPrettyPrint={isPrettyPrint} onTogglePrettyPrint={() => setIsPrettyPrint(!isPrettyPrint)} isSidebarCollapsed={sidebarWidth === 0} onToggleSidebar={() => setSidebarWidth(200)} />
              <main className="flex-1 overflow-hidden relative">
                {activeTab ? (
                  activeTab.isPdf ? (
                    <div className="h-full w-full bg-[#525659]"> <iframe src={`${activeTab.content}#view=FitH`} className="w-full h-full border-none" title={activeTab.name} /> </div>
                  ) : (
                    <PanelGroup orientation="horizontal" key={`${activeTab.id}-${isDarkMode}-${viewMode}`}>
                      {(viewMode === 'editor' || viewMode === 'split') && ( <Panel defaultSize={viewMode === 'split' ? 50 : 100} minSize={0} className="h-full overflow-hidden"> <div className="h-full w-full" onClick={() => setLastActivePanel('editor')}> <Editor key={`editor-${activeTab.id}-${isDarkMode}`} ref={editorRef} value={activeTab.content} onChange={updateContent} isDarkMode={isDarkMode} /> </div> </Panel> )}
                      {viewMode === 'split' && ( <PanelResizeHandle className="w-[5px] bg-[var(--border-base)] hover:bg-orange-400 transition-colors cursor-col-resize shrink-0 z-10" /> )}
                      {(viewMode === 'preview' || viewMode === 'split') && ( <Panel defaultSize={viewMode === 'split' ? 50 : 100} minSize={0} className="h-full overflow-hidden"> <div className="h-full w-full" onClick={() => setLastActivePanel('preview')}> <Preview key={`preview-${activeTab.id}-${isPrettyPrint}`} ref={previewRef} content={activeTab.content} isPrettyPrint={isPrettyPrint} activeTabPath={activeTab.path} /> </div> </Panel> )}
                    </PanelGroup>
                  )
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-[var(--text-muted)] space-y-4">
                    <div className="text-4xl opacity-20 font-bold tracking-tighter uppercase italic select-none">Zenito's Markdown</div>
                    <div className="text-[11px] opacity-40">Select a file from project to edit</div>
                  </div>
                )}
              </main>
            </div>
          </div>
        </>
      )}

      {/* Global Modals: Accessible from both Mobile and Desktop */}
      {isShortcutModalOpen && <ShortcutSettings shortcuts={shortcuts} defaultShortcuts={DEFAULT_SHORTCUTS} onSave={handleSaveShortcuts} onClose={() => setIsShortcutModalOpen(false)} />}
      {isThemeModalOpen && <ThemeSettings isDarkMode={isDarkMode} onToggleTheme={setIsDarkMode} onClose={() => setIsThemeModalOpen(false)} />}

      <footer className="px-4 h-6 text-[11px] text-[var(--text-muted)] bg-[var(--bg-sidebar)] border-t border-[var(--border-base)] flex items-center justify-between shrink-0 select-none">
        <div className="flex items-center space-x-4 overflow-hidden text-ellipsis whitespace-nowrap">
          <span className="truncate">{activeTab?.path || activeTab?.name || "Ready"}</span>
          {activeTab?.isDirty && <span className="text-orange-400 shrink-0">*Modified</span>}
          {isSaving && <span className="text-blue-400 animate-pulse ml-2">Saving...</span>}
          {activeTab?.isPdf && <span className="text-zinc-400 ml-2">[Read Only]</span>}
        </div>
        <div className="flex items-center space-x-4 shrink-0 ml-4"> <span>LF</span><span>UTF-8</span><span>4 spaces</span><span className="text-[var(--text-muted)]">Markdown</span> </div>
      </footer>
    </div>
  );
}

export default App;
