import React from 'react';
import { Settings, Maximize2, X, Minus, Menu } from 'lucide-react';

interface ToolbarProps {
  viewMode: 'split' | 'editor' | 'preview';
  setViewMode: (mode: 'split' | 'editor' | 'preview') => void;
}

const Toolbar: React.FC<ToolbarProps> = () => {
  return (
    <div className="flex items-center justify-between px-2 bg-[#3c3f41] text-zinc-300 border-b border-[#323232] h-7 select-none shrink-0">
      <div className="flex items-center space-x-3 h-full">
        <Menu size={14} className="text-zinc-400" />
        <div className="flex items-center space-x-3 text-[11px]">
          <span className="hover:bg-[#4e5254] px-1.5 py-0.5 rounded cursor-default">File</span>
          <span className="hover:bg-[#4e5254] px-1.5 py-0.5 rounded cursor-default">Edit</span>
          <span className="hover:bg-[#4e5254] px-1.5 py-0.5 rounded cursor-default">View</span>
          <span className="hover:bg-[#4e5254] px-1.5 py-0.5 rounded cursor-default">Navigate</span>
          <span className="hover:bg-[#4e5254] px-1.5 py-0.5 rounded cursor-default">Code</span>
          <span className="hover:bg-[#4e5254] px-1.5 py-0.5 rounded cursor-default">Analyze</span>
          <span className="hover:bg-[#4e5254] px-1.5 py-0.5 rounded cursor-default">Refactor</span>
        </div>
      </div>

      <div className="flex items-center space-x-1 h-full">
        <div className="flex items-center bg-[#2d2f30] px-2 py-0.5 rounded mr-2 border border-zinc-700 text-[11px]">
          <span className="text-zinc-400 mr-2">Search</span>
          <span className="text-zinc-600 font-mono">⌘K</span>
        </div>
        <button className="p-1 hover:bg-[#4e5254] rounded transition-colors"><Settings size={14} /></button>
        <button className="p-1 hover:bg-[#4e5254] rounded transition-colors"><Minus size={14} /></button>
        <button className="p-1 hover:bg-[#4e5254] rounded transition-colors"><Maximize2 size={12} /></button>
        <button className="p-1 hover:bg-[#e81123] hover:text-white rounded transition-colors"><X size={14} /></button>
      </div>
    </div>
  );
};

export default Toolbar;
