
import React, { useState } from 'react';
import { Copy, Check, X, Sparkles } from 'lucide-react';

interface PromptPopupProps {
  visible: boolean;
  x: number;
  y: number;
  prompt: string;
  onClose: () => void;
}

const PromptPopup: React.FC<PromptPopupProps> = ({ visible, x, y, prompt, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!visible) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div 
      className="fixed z-[9999] bg-[#0B1220]/95 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl p-4 w-72 animate-in fade-in zoom-in-95 duration-200"
      style={{ top: y + 20, left: x + 20 }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-indigo-400">
           <Sparkles size={14} />
           <span className="text-[10px] font-bold uppercase tracking-wider">AI Prompt</span>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
          <X size={14} />
        </button>
      </div>
      
      <div className="bg-black/40 rounded-lg p-2 mb-3 border border-white/5">
        <p className="text-xs text-slate-200 leading-relaxed max-h-32 overflow-y-auto custom-scrollbar">
          {prompt}
        </p>
      </div>

      <button 
        onClick={handleCopy}
        className="w-full flex items-center justify-center gap-2 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors"
      >
        {copied ? <Check size={12} /> : <Copy size={12} />}
        {copied ? 'Copied to Clipboard' : 'Copy Prompt'}
      </button>
    </div>
  );
};

export default PromptPopup;