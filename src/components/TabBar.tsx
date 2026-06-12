import React, { useRef, useState, useLayoutEffect, useCallback, useEffect } from 'react';
import { FileText, X, Layout, Eye, Code, PanelLeftOpen, Sparkles, ChevronRight, ChevronDown } from 'lucide-react';

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

const DROPDOWN_BTN_W = 52;

const TabBar: React.FC<TabBarProps> = ({
  tabs, activeTabId, onTabSelect, onTabClose, viewMode, setViewMode,
  isPrettyPrint, onTogglePrettyPrint, isSidebarCollapsed, onToggleSidebar
}) => {
  const [overflowTabIds, setOverflowTabIds] = useState<Set<string>>(new Set());
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  // position:fixed 드롭다운 위치 (overflow:hidden 우회)
  const [dropdownPos, setDropdownPos] = useState({ top: 36, right: 0 });

  const tabsAreaRef    = useRef<HTMLDivElement>(null);
  const tabElRefs      = useRef<Map<string, HTMLDivElement>>(new Map());
  const dropdownRef    = useRef<HTMLDivElement>(null);
  const dropdownBtnRef = useRef<HTMLButtonElement>(null);

  // DOM 위치 기반 실시간 overflow 감지
  const recalcOverflow = useCallback(() => {
    const container = tabsAreaRef.current;
    if (!container || tabs.length === 0) {
      setOverflowTabIds(new Set());
      return;
    }

    const availableWidth = container.clientWidth - DROPDOWN_BTN_W;

    const orderedTabs = [
      ...tabs.filter(t => t.id === activeTabId),
      ...tabs.filter(t => t.id !== activeTabId),
    ];

    const overflow = new Set<string>();
    for (const tab of orderedTabs) {
      const el = tabElRefs.current.get(tab.id);
      if (!el) continue;
      if (el.offsetLeft + el.offsetWidth > availableWidth) {
        overflow.add(tab.id);
      }
    }

    setOverflowTabIds(prev => {
      if (prev.size === overflow.size && [...overflow].every(id => prev.has(id))) return prev;
      return overflow;
    });
  }, [tabs, activeTabId]);

  useLayoutEffect(() => {
    recalcOverflow();
  }, [recalcOverflow]);

  useEffect(() => {
    const container = tabsAreaRef.current;
    if (!container) return;
    const ro = new ResizeObserver(() => recalcOverflow());
    ro.observe(container);
    return () => ro.disconnect();
  }, [recalcOverflow]);

  // 드롭다운 외부 클릭 닫기
  useEffect(() => {
    if (!isDropdownOpen) return;
    const onMouseDown = (e: MouseEvent) => {
      if (
        dropdownRef.current    && !dropdownRef.current.contains(e.target as Node) &&
        dropdownBtnRef.current && !dropdownBtnRef.current.contains(e.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [isDropdownOpen]);

  const overflowTabs = tabs.filter(t => overflowTabIds.has(t.id));

  // overflow 탭이 모두 사라지면 자동 닫기
  useEffect(() => {
    if (overflowTabs.length === 0) setIsDropdownOpen(false);
  }, [overflowTabs.length]);

  // >> 버튼 클릭: viewport 좌표 계산 후 드롭다운 표시
  // position:fixed 사용으로 부모의 overflow:hidden 우회
  const handleDropdownToggle = () => {
    if (!isDropdownOpen && dropdownBtnRef.current) {
      const rect = dropdownBtnRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom,
        right: window.innerWidth - rect.right,
      });
    }
    setIsDropdownOpen(prev => !prev);
  };

  const orderedTabs = [
    ...tabs.filter(t => t.id === activeTabId),
    ...tabs.filter(t => t.id !== activeTabId),
  ];

  return (
    <div className="flex items-center justify-between bg-[var(--bg-tabbar)] border-b border-[var(--border-base)] h-9 shrink-0 select-none">
      <div className="flex items-center h-full flex-1 min-w-0 overflow-hidden">

        {isSidebarCollapsed && (
          <button
            onClick={onToggleSidebar}
            className="px-2 h-full border-r border-[var(--border-base)] hover:bg-[var(--bg-item-hover)] text-[var(--text-muted)] transition-colors border-none shadow-none outline-none bg-transparent shrink-0"
            title="사이드바 확대"
          >
            <PanelLeftOpen size={16} />
          </button>
        )}

        <div ref={tabsAreaRef} className="relative flex items-center h-full overflow-hidden flex-1">

          {/* 모든 탭 — overflow 탭은 visibility:hidden(흐름 유지)으로 offsetLeft 측정 보장 */}
          {orderedTabs.map(tab => {
            const isOverflow = overflowTabIds.has(tab.id);
            const isActive   = tab.id === activeTabId;
            return (
              <div
                key={tab.id}
                ref={el => {
                  if (el) tabElRefs.current.set(tab.id, el);
                  else    tabElRefs.current.delete(tab.id);
                }}
                onClick={() => { if (!isOverflow) onTabSelect(tab.id); }}
                className={`flex items-center px-3 h-full border-r border-[var(--border-base)] text-[11px] font-medium min-w-[120px] max-w-[200px] cursor-default group transition-colors shrink-0 ${
                  isOverflow
                    ? 'invisible pointer-events-none'
                    : isActive
                      ? 'bg-[var(--bg-app)] border-t-2 border-[var(--accent)] text-[var(--text-main)]'
                      : 'text-[var(--text-muted)] hover:bg-[var(--bg-item-hover)]'
                }`}
              >
                <FileText size={12} className={`mr-2 shrink-0 ${isActive ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'}`} />
                <span className="truncate flex-1">
                  {tab.name}{tab.isDirty ? ' *' : ''}
                </span>
                <X
                  size={12}
                  className="ml-2 opacity-0 group-hover:opacity-100 hover:bg-[var(--bg-item-active)] rounded p-0.5 shrink-0"
                  onClick={e => { e.stopPropagation(); onTabClose(tab.id); }}
                />
              </div>
            );
          })}

          {/* >> 버튼 — absolute로 우측 끝 고정 */}
          {overflowTabs.length > 0 && (
            <button
              ref={dropdownBtnRef}
              onClick={handleDropdownToggle}
              style={{ width: DROPDOWN_BTN_W }}
              className={`absolute right-0 top-0 h-full flex items-center justify-center gap-0.5 border-l border-[var(--border-base)] transition-colors shrink-0 ${
                isDropdownOpen
                  ? 'bg-[var(--bg-item-active)] text-[var(--accent)]'
                  : 'bg-[var(--bg-tabbar)] text-[var(--text-muted)] hover:bg-[var(--bg-item-hover)]'
              }`}
              title={`숨겨진 탭 ${overflowTabs.length}개 보기`}
            >
              <ChevronRight size={11} />
              <ChevronRight size={11} className="-ml-[5px]" />
              <span className="text-[10px] font-bold ml-0.5">{overflowTabs.length}</span>
              <ChevronDown size={10} className="ml-0.5" />
            </button>
          )}
        </div>
      </div>

      {/* 우측 컨트롤 */}
      <div className="flex items-center h-full px-2 space-x-2 border-l border-[var(--border-base)] shrink-0">
        <button
          onClick={onTogglePrettyPrint}
          className={`flex items-center space-x-1.5 px-3 py-1 rounded transition-all border-none shadow-none outline-none bg-transparent ${
            isPrettyPrint ? 'text-[var(--accent)]' : 'text-[var(--text-muted)] hover:bg-[var(--bg-item-hover)]'
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
          ><Code size={14} /></button>
          <button
            onClick={() => setViewMode('split')}
            className={`p-1.5 rounded transition-colors border-none shadow-none outline-none bg-transparent ${viewMode === 'split' ? 'text-[var(--accent)] bg-[var(--bg-item-active)]' : 'text-[var(--text-muted)] hover:bg-[var(--bg-item-hover)]'}`}
            title="Split View"
          ><Layout size={14} /></button>
          <button
            onClick={() => setViewMode('preview')}
            className={`p-1.5 rounded transition-colors border-none shadow-none outline-none bg-transparent ${viewMode === 'preview' ? 'text-[var(--accent)] bg-[var(--bg-item-active)]' : 'text-[var(--text-muted)] hover:bg-[var(--bg-item-hover)]'}`}
            title="Preview Only"
          ><Eye size={14} /></button>
        </div>
      </div>

      {/* 드롭다운 패널 — position:fixed로 overflow:hidden 우회 */}
      {isDropdownOpen && overflowTabs.length > 0 && (
        <div
          ref={dropdownRef}
          style={{ position: 'fixed', top: dropdownPos.top, right: dropdownPos.right }}
          className="z-[9999] min-w-[220px] bg-[var(--bg-sidebar)] border border-[var(--border-base)] shadow-lg rounded-b overflow-hidden"
        >
          {overflowTabs.map(tab => (
            <div
              key={tab.id}
              onClick={() => { onTabSelect(tab.id); setIsDropdownOpen(false); }}
              className={`flex items-center px-3 py-2 text-[11px] cursor-default group transition-colors hover:bg-[var(--bg-item-hover)] ${
                tab.id === activeTabId
                  ? 'bg-[var(--bg-item-active)] text-[var(--accent)]'
                  : 'text-[var(--text-main)]'
              }`}
            >
              <FileText size={12} className={`mr-2 shrink-0 ${tab.id === activeTabId ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'}`} />
              <span className="truncate flex-1 max-w-[180px]">
                {tab.name}{tab.isDirty ? ' *' : ''}
              </span>
              <X
                size={12}
                className="ml-3 opacity-0 group-hover:opacity-100 hover:bg-[var(--bg-item-active)] rounded p-0.5 shrink-0"
                onClick={e => { e.stopPropagation(); onTabClose(tab.id); }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TabBar;
