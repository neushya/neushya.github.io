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

  const tabsAreaRef    = useRef<HTMLDivElement>(null);
  const tabElRefs      = useRef<Map<string, HTMLDivElement>>(new Map());
  const tabWidthCache  = useRef<Map<string, number>>(new Map());
  const dropdownRef    = useRef<HTMLDivElement>(null);
  const dropdownBtnRef = useRef<HTMLButtonElement>(null);

  const recalcOverflow = useCallback(() => {
    const container = tabsAreaRef.current;
    if (!container || tabs.length === 0) {
      setOverflowTabIds(new Set());
      return;
    }

    const containerWidth = container.clientWidth;

    // 활성 탭을 항상 맨 앞에 배치 (우선 표시 보장)
    const orderedTabs = [
      ...tabs.filter(t => t.id === activeTabId),
      ...tabs.filter(t => t.id !== activeTabId),
    ];

    // 전체 탭 너비 합산
    let totalWidth = 0;
    for (const tab of orderedTabs) {
      totalWidth += tabWidthCache.current.get(tab.id) ?? 150;
    }

    // 모든 탭이 들어가면 overflow 없음
    if (totalWidth <= containerWidth) {
      setOverflowTabIds(new Set());
      return;
    }

    // 드롭다운 버튼 너비를 제외하고 가능한 만큼 표시
    const availableWidth = containerWidth - DROPDOWN_BTN_W;
    let usedWidth = 0;
    const overflow = new Set<string>();

    for (const tab of orderedTabs) {
      const tabWidth = tabWidthCache.current.get(tab.id) ?? 150;
      if (usedWidth + tabWidth <= availableWidth) {
        usedWidth += tabWidth;
      } else {
        overflow.add(tab.id);
      }
    }

    setOverflowTabIds(overflow);
  }, [tabs, activeTabId]);

  // tabs 변경 또는 activeTabId 변경 시 — 브라우저 페인트 전에 계산 (깜빡임 방지)
  useLayoutEffect(() => {
    recalcOverflow();
  }, [recalcOverflow]);

  // 컨테이너 너비 변경 감지 (창 크기 조절 등)
  useEffect(() => {
    const container = tabsAreaRef.current;
    if (!container) return;
    const observer = new ResizeObserver(() => recalcOverflow());
    observer.observe(container);
    return () => observer.disconnect();
  }, [recalcOverflow]);

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    if (!isDropdownOpen) return;
    const handleMouseDown = (e: MouseEvent) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        dropdownBtnRef.current && !dropdownBtnRef.current.contains(e.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [isDropdownOpen]);

  const visibleTabs  = tabs.filter(t => !overflowTabIds.has(t.id));
  const overflowTabs = tabs.filter(t =>  overflowTabIds.has(t.id));

  return (
    <div className="flex items-center justify-between bg-[var(--bg-tabbar)] border-b border-[var(--border-base)] h-9 shrink-0 select-none">
      <div className="flex items-center h-full flex-1 min-w-0 overflow-hidden">

        {/* 사이드바 접혔을 때 토글 버튼 */}
        {isSidebarCollapsed && (
          <button
            onClick={onToggleSidebar}
            className="px-2 h-full border-r border-[var(--border-base)] hover:bg-[var(--bg-item-hover)] text-[var(--text-muted)] transition-colors border-none shadow-none outline-none bg-transparent shrink-0"
            title="사이드바 확대"
          >
            <PanelLeftOpen size={16} />
          </button>
        )}

        {/* 탭 목록 + 드롭다운 버튼 */}
        <div ref={tabsAreaRef} className="flex items-center h-full overflow-hidden flex-1">

          {/* 보이는 탭들 */}
          {visibleTabs.map(tab => (
            <div
              key={tab.id}
              ref={(el) => {
                if (el) {
                  tabElRefs.current.set(tab.id, el);
                  tabWidthCache.current.set(tab.id, el.offsetWidth);
                } else {
                  tabElRefs.current.delete(tab.id);
                }
              }}
              onClick={() => onTabSelect(tab.id)}
              className={`flex items-center px-3 h-full border-r border-[var(--border-base)] text-[11px] font-medium min-w-[120px] max-w-[200px] cursor-default group transition-colors shrink-0 ${
                activeTabId === tab.id
                  ? 'bg-[var(--bg-app)] border-t-2 border-[var(--accent)] text-[var(--text-main)]'
                  : 'text-[var(--text-muted)] hover:bg-[var(--bg-item-hover)]'
              }`}
            >
              <FileText size={12} className={`mr-2 shrink-0 ${activeTabId === tab.id ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'}`} />
              <span className="truncate flex-1">
                {tab.name}{tab.isDirty ? ' *' : ''}
              </span>
              <X
                size={12}
                className="ml-2 opacity-0 group-hover:opacity-100 hover:bg-[var(--bg-item-active)] rounded p-0.5 shrink-0"
                onClick={(e) => { e.stopPropagation(); onTabClose(tab.id); }}
              />
            </div>
          ))}

          {/* 드롭다운 버튼 — 숨겨진 탭이 있을 때만 노출 */}
          {overflowTabs.length > 0 && (
            <div className="relative shrink-0 h-full">
              <button
                ref={dropdownBtnRef}
                onClick={() => setIsDropdownOpen(prev => !prev)}
                className={`flex items-center justify-center gap-0.5 px-2 h-full text-[11px] font-bold border-r border-[var(--border-base)] transition-colors ${
                  isDropdownOpen
                    ? 'bg-[var(--bg-item-active)] text-[var(--accent)]'
                    : 'text-[var(--text-muted)] hover:bg-[var(--bg-item-hover)]'
                }`}
                title={`숨겨진 탭 ${overflowTabs.length}개 보기`}
              >
                <ChevronRight size={11} />
                <ChevronRight size={11} className="-ml-[5px]" />
                <span className="text-[10px] font-bold ml-0.5">{overflowTabs.length}</span>
                <ChevronDown size={10} className="ml-0.5" />
              </button>

              {/* 드롭다운 패널 */}
              {isDropdownOpen && (
                <div
                  ref={dropdownRef}
                  className="absolute top-full left-0 z-50 min-w-[220px] bg-[var(--bg-sidebar)] border border-[var(--border-base)] shadow-lg rounded-b overflow-hidden"
                >
                  {overflowTabs.map(tab => (
                    <div
                      key={tab.id}
                      onClick={() => { onTabSelect(tab.id); setIsDropdownOpen(false); }}
                      className={`flex items-center px-3 py-2 text-[11px] cursor-default group transition-colors hover:bg-[var(--bg-item-hover)] ${
                        activeTabId === tab.id
                          ? 'bg-[var(--bg-item-active)] text-[var(--accent)]'
                          : 'text-[var(--text-main)]'
                      }`}
                    >
                      <FileText size={12} className={`mr-2 shrink-0 ${activeTabId === tab.id ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'}`} />
                      <span className="truncate flex-1 max-w-[180px]">
                        {tab.name}{tab.isDirty ? ' *' : ''}
                      </span>
                      <X
                        size={12}
                        className="ml-3 opacity-0 group-hover:opacity-100 hover:bg-[var(--bg-item-active)] rounded p-0.5 shrink-0"
                        onClick={(e) => { e.stopPropagation(); onTabClose(tab.id); }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 우측 컨트롤 영역 */}
      <div className="flex items-center h-full px-2 space-x-2 border-l border-[var(--border-base)] shrink-0">
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
