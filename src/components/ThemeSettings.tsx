import React from 'react';
import { X, Moon, Sun } from 'lucide-react';

interface ThemeSettingsProps {
  isDarkMode: boolean;
  onToggleTheme: (darkMode: boolean) => void;
  onClose: () => void;
}

const ThemeSettings: React.FC<ThemeSettingsProps> = ({ isDarkMode, onToggleTheme, onClose }) => {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-[2px]">
      <div className="bg-[var(--bg-sidebar)] w-[300px] border border-[var(--border-base)] shadow-2xl rounded-md flex flex-col overflow-hidden text-[var(--text-main)]">
        <div className="flex items-center justify-between px-4 py-2 bg-[var(--bg-header)] border-b border-[var(--border-base)]">
          <span className="text-[12px] font-bold">배경화면 설정</span>
          <button onClick={onClose} className="hover:bg-white/10 rounded p-1 transition-colors border-none shadow-none outline-none cursor-default bg-transparent text-[var(--text-muted)] hover:text-[var(--text-main)]">
            <X size={14} />
          </button>
        </div>

        <div className="p-4 space-y-3 bg-[var(--bg-sidebar)]">
          <button 
            onClick={() => onToggleTheme(true)}
            className={`w-full flex items-center px-4 py-2 border rounded text-[12px] transition-all ${isDarkMode ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]' : 'border-[var(--border-base)] hover:border-[var(--text-muted)] bg-[var(--bg-item-hover)] text-[var(--text-muted)]'}`}
          >
            <Moon size={14} className="mr-2" />
            다크모드
          </button>
          <button 
            onClick={() => onToggleTheme(false)}
            className={`w-full flex items-center px-4 py-2 border rounded text-[12px] transition-all ${!isDarkMode ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]' : 'border-[var(--border-base)] hover:border-[var(--text-muted)] bg-[var(--bg-item-hover)] text-[var(--text-muted)]'}`}
          >
            <Sun size={14} className="mr-2" />
            화이트모드
          </button>
        </div>

        <div className="p-4 bg-[var(--bg-header)] border-t border-[var(--border-base)] flex justify-end">
          <button 
            onClick={onClose}
            className="px-4 py-1.5 bg-[#4b5052] hover:bg-[#5a5e60] text-white rounded text-[12px] font-bold shadow-md border border-[var(--border-base)] transition-all"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
};

export default ThemeSettings;
