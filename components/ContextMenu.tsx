import React from 'react';
import { Layers, Scissors, Trash2, Combine } from 'lucide-react';

interface ContextMenuProps {
  x: number;
  y: number;
  visible: boolean;
  onClose: () => void;
  onCompose: () => void;
  onMatting: () => void;
  onFlatten: () => void;
  onDelete: () => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, visible, onClose, onCompose, onMatting, onFlatten, onDelete }) => {
  if (!visible) return null;

  return (
    <>
      {/* Backdrop to close menu on click outside */}
      <div className="fixed inset-0 z-[9998]" onClick={onClose} onContextMenu={(e) => { e.preventDefault(); onClose(); }} />
      
      {/* Menu */}
      <div 
        className="fixed z-[9999] bg-slate-900 border border-slate-700 rounded-lg shadow-2xl py-1 min-w-[200px] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-100"
        style={{ top: y, left: x }}
      >
        <div className="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-800 mb-1">
          Selection Actions
        </div>

        <button 
          onClick={onCompose}
          className="flex items-center gap-3 px-3 py-2 hover:bg-indigo-600/10 hover:text-indigo-400 text-slate-300 text-sm transition-colors text-left"
        >
          <Combine size={16} />
          <span>Compose (AI)</span>
        </button>

         <button 
          onClick={onMatting}
          className="flex items-center gap-3 px-3 py-2 hover:bg-purple-600/10 hover:text-purple-400 text-slate-300 text-sm transition-colors text-left"
        >
          <Scissors size={16} />
          <span>Remove Background</span>
        </button>

         <button 
          onClick={onFlatten}
          className="flex items-center gap-3 px-3 py-2 hover:bg-slate-800 text-slate-300 text-sm transition-colors text-left"
        >
          <Layers size={16} />
          <span>Flatten to Image</span>
        </button>

        <div className="h-px bg-slate-800 my-1" />

        <button 
          onClick={onDelete}
          className="flex items-center gap-3 px-3 py-2 hover:bg-red-900/20 hover:text-red-400 text-slate-300 text-sm transition-colors text-left"
        >
          <Trash2 size={16} />
          <span>Delete</span>
        </button>
      </div>
    </>
  );
};

export default ContextMenu;
