import React, { useState, useEffect } from 'react';
import { X, RefreshCw } from 'lucide-react';

export interface ShortcutItem {
  id: string;
  name: string;
  windows: string;
  mac: string;
}

interface ShortcutSettingsProps {
  shortcuts: ShortcutItem[];
  defaultShortcuts: ShortcutItem[];
  onSave: (newShortcuts: ShortcutItem[]) => void;
  onClose: () => void;
}

const ShortcutSettings: React.FC<ShortcutSettingsProps> = ({ shortcuts, defaultShortcuts, onSave, onClose }) => {
  const [localShortcuts, setLocalShortcuts] = useState<ShortcutItem[]>([...shortcuts]);

  useEffect(() => {
    setLocalShortcuts([...shortcuts]);
  }, [shortcuts]);

  const handleChange = (id: string, platform: 'windows' | 'mac', value: string) => {
    setLocalShortcuts(prev => prev.map(s => 
      s.id === id ? { ...s, [platform]: value } : s
    ));
  };

  const handleReset = () => {
    setLocalShortcuts([...defaultShortcuts]);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-[2px]">
      <div className="bg-[var(--bg-sidebar)] w-[500px] border border-[var(--border-base)] shadow-2xl rounded-md flex flex-col overflow-hidden text-[var(--text-main)]">
        <div className="flex items-center justify-between px-4 py-2 bg-[var(--bg-header)] border-b border-[var(--border-base)]">
          <span className="text-[12px] font-bold">단축키 설정</span>
          <button onClick={onClose} className="hover:bg-white/10 rounded p-1 transition-colors border-none shadow-none outline-none cursor-default bg-transparent text-[var(--text-muted)] hover:text-[var(--text-main)]">
            <X size={14} />
          </button>
        </div>

        <div className="p-4 overflow-y-auto max-h-[400px] space-y-3 bg-[var(--bg-sidebar)]">
          <div className="grid grid-cols-3 text-[11px] font-bold text-[var(--text-muted)] uppercase px-2">
            <span>기능명</span>
            <span>Windows (Ctrl)</span>
            <span>MacOS (Cmd)</span>
          </div>
          
          {localShortcuts.map(s => (
            <div key={s.id} className="grid grid-cols-3 items-center gap-2 p-2 hover:bg-[var(--bg-item-hover)] rounded transition-colors group">
              <span className="text-[11px] truncate">{s.name}</span>
              <input 
                value={s.windows}
                onChange={(e) => handleChange(s.id, 'windows', e.target.value)}
                className="bg-[var(--bg-tabbar)] border border-[var(--border-base)] rounded px-2 py-1 text-[11px] outline-none focus:border-[var(--accent)]/50 text-[var(--text-main)]"
              />
              <input 
                value={s.mac}
                onChange={(e) => handleChange(s.id, 'mac', e.target.value)}
                className="bg-[var(--bg-tabbar)] border border-[var(--border-base)] rounded px-2 py-1 text-[11px] outline-none focus:border-[var(--accent)]/50 text-[var(--text-main)]"
              />
            </div>
          ))}
        </div>

        <div className="p-4 bg-[var(--bg-header)] border-t border-[var(--border-base)] flex justify-between items-center">
          <button 
            onClick={handleReset}
            className="flex items-center px-3 py-1.5 text-[11px] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors border-none shadow-none outline-none bg-transparent"
          >
            <RefreshCw size={12} className="mr-1.5" />
            초기화
          </button>
          
          <div className="flex space-x-2">
            <button 
              onClick={onClose}
              className="px-4 py-1.5 border border-[var(--border-base)] rounded text-[12px] hover:bg-[#3c3f41] bg-transparent text-[var(--text-main)]"
            >
              취소
            </button>
            <button 
              onClick={() => onSave(localShortcuts)}
              className="px-4 py-1.5 bg-[#4b5052] hover:bg-[#5a5e60] text-white rounded text-[12px] font-bold shadow-md border border-[var(--border-base)] transition-all"
            >
              저장하기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShortcutSettings;
