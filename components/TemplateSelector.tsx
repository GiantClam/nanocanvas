
import React, { useState, useMemo } from 'react';
import { TEMPLATES } from '../constants';
import { Template } from '../types';
import { Layout, Zap, PenTool, Layers, Palette, Sparkles, Blend, BoxSelect, Scissors, Search, Eraser, ImageIcon, Type, Film, Video, Camera } from 'lucide-react';

interface TemplateSelectorProps {
  onSelect: (template: Template) => void;
  hasSelection: boolean;
}

const TemplateSelector: React.FC<TemplateSelectorProps> = ({ onSelect, hasSelection }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // --- Icon Helper ---
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Layout': return <Layout size={14} />;
      case 'Zap': return <Zap size={14} />;
      case 'PenTool': return <PenTool size={14} />;
      case 'Layers': return <Layers size={14} />;
      case 'Palette': return <Palette size={14} />;
      case 'Sparkles': return <Sparkles size={14} />;
      case 'Blend': return <Blend size={14} />;
      case 'BoxSelect': return <BoxSelect size={14} />;
      case 'Scissors': return <Scissors size={14} />;
      case 'Eraser': return <Eraser size={14} />;
      case 'Film': return <Film size={14} />;
      case 'Video': return <Video size={14} />;
      case 'Camera': return <Camera size={14} />;
      default: return <Zap size={14} />;
    }
  };

  // --- Filtering Logic ---
  const filteredTemplates = useMemo(() => {
    return TEMPLATES.filter(t => {
      // 1. Filter by Search
      const matchesSearch = 
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.category.toLowerCase().includes(searchQuery.toLowerCase());

      // 2. Filter by Category
      const matchesCategory = selectedCategory === 'All' || t.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  // --- Extract Unique Categories from ALL templates ---
  const categories = useMemo(() => {
    const cats = Array.from(new Set(TEMPLATES.map(t => t.category))).sort();
    return ['All', ...cats];
  }, []);

  // --- Render ---
  return (
    <div className="flex flex-col h-full overflow-hidden px-4 pt-4 pb-0">
      
      {/* Search Input */}
      <div className="relative mb-3 shrink-0">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={14} />
        <input 
          type="text" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search templates..." 
          className="w-full bg-black/60 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
        />
      </div>

      {/* Horizontal Category Scroll */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 mb-2 scrollbar-hide mask-fade-right shrink-0">
        <style>{`.scrollbar-hide::-webkit-scrollbar { display: none; } .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-2.5 py-1 rounded-full text-[10px] font-medium whitespace-nowrap transition-colors border ${
              selectedCategory === cat
                ? 'bg-indigo-500/30 text-indigo-300 border-indigo-500/40'
                : 'bg-white/10 text-slate-300 border-white/5 hover:bg-white/20'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid Results - Compact List View */}
      <div className="grid grid-cols-2 gap-2 overflow-y-auto pb-4 scrollbar-hide min-h-0 flex-1 content-start">
        {filteredTemplates.length === 0 ? (
          <div className="col-span-2 text-center py-12 text-slate-400 text-xs flex flex-col items-center">
            <Search size={24} className="mb-2 opacity-30" />
            No templates found.
          </div>
        ) : (
          filteredTemplates.map(t => (
            <button
              key={t.id}
              onClick={() => onSelect(t)}
              disabled={t.requiresImage && !hasSelection}
              title={t.description} // Tooltip for description
              className={`group flex flex-row items-center gap-3 p-2 rounded-xl border transition-all text-left relative overflow-hidden h-12 ${
                t.requiresImage && !hasSelection
                  ? 'bg-[#151E2E]/40 border-white/5 opacity-50 cursor-not-allowed'
                  : 'bg-[#151E2E]/60 border-white/5 hover:bg-[#151E2E]/80 hover:border-white/20 hover:shadow-lg'
              }`}
            >
              <div className={`w-8 h-8 flex items-center justify-center rounded-lg shrink-0 transition-transform group-hover:scale-105 ${
                 t.type === 'create' 
                 ? 'bg-indigo-500/20 text-indigo-300' 
                 : t.type === 'edit' 
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'bg-rose-500/20 text-rose-300'
              }`}>
                {getIcon(t.icon)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-slate-200 truncate group-hover:text-white transition-colors">
                    {t.name}
                </div>
              </div>

              {/* Selection Indicator on Hover */}
               {!(t.requiresImage && !hasSelection) && (
                   <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
               )}
            </button>
          ))
        )}
      </div>
    </div>
  );
};

export default TemplateSelector;