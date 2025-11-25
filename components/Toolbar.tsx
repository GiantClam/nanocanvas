import React, { useState } from 'react';
import { MousePointer2, Square, Circle, Type, Pen, Image as ImageIcon, Trash2, Download, ChevronLeft, ChevronRight, Palette, Minus } from 'lucide-react';
import { SelectedProperties } from '../types';

interface ToolbarProps {
  activeTool: string;
  onSelectTool: (tool: string) => void;
  onDelete: () => void;
  onDownload: () => void;
  onUploadImage: (e: React.ChangeEvent<HTMLInputElement>) => void;
  selectedProperties: SelectedProperties;
  onUpdateProperty: (key: keyof SelectedProperties, value: any) => void;
  hasSelection: boolean;
}

const Toolbar: React.FC<ToolbarProps> = ({ 
  activeTool, 
  onSelectTool, 
  onDelete, 
  onDownload, 
  onUploadImage,
  selectedProperties,
  onUpdateProperty,
  hasSelection
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const tools = [
    { id: 'select', icon: <MousePointer2 size={20} />, label: 'Select' },
    { id: 'rect', icon: <Square size={20} />, label: 'Rectangle' },
    { id: 'circle', icon: <Circle size={20} />, label: 'Circle' },
    { id: 'text', icon: <Type size={20} />, label: 'Text' },
    { id: 'draw', icon: <Pen size={20} />, label: 'Draw' },
  ];

  // Colors for Quick Picker
  const colors = ['#ffffff', '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#6366f1', '#a855f7', '#ec4899', '#000000'];

  const showStyleEditor = activeTool === 'draw' || activeTool === 'rect' || activeTool === 'circle' || (activeTool === 'select' && selectedProperties.type !== '');
  const isTextSelected = selectedProperties.type === 'i-text';
  const isShapeOrDraw = ['rect', 'circle', 'path', 'line'].includes(selectedProperties.type) || activeTool === 'draw' || activeTool === 'rect' || activeTool === 'circle';

  return (
    <div className={`absolute top-4 left-4 z-50 flex flex-col gap-2 transition-all duration-300 ease-in-out`}>
      
      {/* Main Toolbar */}
      <div className={`flex flex-col bg-slate-950/90 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 ${isCollapsed ? 'w-12' : 'w-16'}`}>
        {/* Header / Collapse Toggle */}
        <div 
          className="h-8 flex items-center justify-center border-b border-white/10 cursor-pointer hover:bg-white/5 transition-colors"
          onClick={() => setIsCollapsed(!isCollapsed)}
          title={isCollapsed ? "Expand" : "Collapse"}
        >
          {isCollapsed ? <ChevronRight size={16} className="text-slate-300" /> : <ChevronLeft size={16} className="text-slate-300" />}
        </div>

        <div className={`flex flex-col items-center gap-2 p-2 ${isCollapsed ? 'py-2' : 'py-2'}`}>
          {!isCollapsed && (
              <div className="mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tools</div>
          )}

          {tools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => onSelectTool(tool.id)}
              className={`flex items-center justify-center rounded-xl transition-all duration-200 group relative ${
                isCollapsed ? 'w-8 h-8 p-0' : 'w-12 h-12 p-3'
              } ${
                activeTool === tool.id
                  ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                  : 'text-slate-300 hover:bg-white/10 hover:text-white'
              }`}
              title={tool.label}
            >
              {tool.icon}
              {!isCollapsed && (
                  <span className="absolute left-full ml-3 px-2 py-1 bg-slate-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity border border-white/10 shadow-xl">
                  {tool.label}
                  </span>
              )}
            </button>
          ))}

          <div className="h-px w-8 bg-white/20 my-1" />

          <label className={`flex items-center justify-center rounded-xl text-slate-300 hover:bg-white/10 hover:text-white cursor-pointer transition-all duration-200 ${isCollapsed ? 'w-8 h-8' : 'w-12 h-12'}`} title="Upload Image">
            <ImageIcon size={20} />
            <input type="file" className="hidden" accept="image/*" onChange={onUploadImage} />
          </label>

          <div className="flex-grow min-h-[1rem]" />

          <button
            onClick={onDownload}
            disabled={!hasSelection}
            className={`flex items-center justify-center rounded-xl transition-all duration-200 ${isCollapsed ? 'w-8 h-8' : 'w-12 h-12'} ${
              !hasSelection 
                ? 'text-slate-700 hover:bg-transparent cursor-not-allowed' 
                : 'text-slate-300 hover:bg-emerald-500/20 hover:text-emerald-400'
            }`}
            title={hasSelection ? "Download Selection" : "Select object to download"}
          >
            <Download size={20} />
          </button>

          <button
            onClick={onDelete}
            disabled={!hasSelection}
            className={`flex items-center justify-center rounded-xl transition-all duration-200 mb-1 ${isCollapsed ? 'w-8 h-8' : 'w-12 h-12'} ${
              !hasSelection 
                ? 'text-slate-700 hover:bg-transparent cursor-not-allowed' 
                : 'text-slate-300 hover:bg-red-500/20 hover:text-red-400'
            }`}
            title={hasSelection ? "Delete Selection" : "Select object to delete"}
          >
            <Trash2 size={20} />
          </button>
        </div>
      </div>

      {/* Style Editor Panel */}
      {showStyleEditor && !isCollapsed && (
        <div className="w-64 bg-slate-950/90 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-4 animate-in fade-in slide-in-from-left-4 duration-200">
           <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
             <Palette size={12} />
             Style Editor
           </div>

           {/* Color Picker */}
           <div className="mb-4">
             <label className="text-xs text-slate-300 mb-2 block">{isTextSelected ? 'Text Color' : 'Stroke Color'}</label>
             <div className="flex flex-wrap gap-1.5">
               {colors.map(color => (
                 <button
                    key={color}
                    onClick={() => onUpdateProperty(isTextSelected ? 'fill' : 'stroke', color)}
                    className={`w-5 h-5 rounded-full border border-slate-600/50 transition-transform hover:scale-110 ${
                      (isTextSelected ? selectedProperties.fill : selectedProperties.stroke) === color ? 'ring-2 ring-white ring-offset-1 ring-offset-slate-900' : ''
                    }`}
                    style={{ backgroundColor: color }}
                 />
               ))}
               <label className="w-5 h-5 rounded-full border border-slate-600/50 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 cursor-pointer hover:scale-110 relative overflow-hidden">
                 <input 
                    type="color" 
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    value={isTextSelected ? selectedProperties.fill : selectedProperties.stroke}
                    onChange={(e) => onUpdateProperty(isTextSelected ? 'fill' : 'stroke', e.target.value)}
                  />
               </label>
             </div>
           </div>

           {/* Stroke Width Slider (Shapes/Draw) */}
           {isShapeOrDraw && (
             <div className="mb-2">
               <div className="flex justify-between text-xs text-slate-300 mb-1">
                 <span>Stroke Width</span>
                 <span>{selectedProperties.strokeWidth}px</span>
               </div>
               <input 
                  type="range" 
                  min="1" 
                  max="20" 
                  value={selectedProperties.strokeWidth}
                  onChange={(e) => onUpdateProperty('strokeWidth', parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
               />
             </div>
           )}

           {/* Font Size (Text) */}
           {isTextSelected && (
              <div className="mb-2">
               <div className="flex justify-between text-xs text-slate-300 mb-1">
                 <span>Font Size</span>
                 <span>{selectedProperties.fontSize}px</span>
               </div>
               <input 
                  type="range" 
                  min="12" 
                  max="120" 
                  value={selectedProperties.fontSize}
                  onChange={(e) => onUpdateProperty('fontSize', parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
               />
             </div>
           )}

        </div>
      )}
    </div>
  );
};

export default Toolbar;