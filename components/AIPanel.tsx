
import React, { useState, useEffect } from 'react';
import { ModelType, Template, Task } from '../types';
import TemplateSelector from './TemplateSelector';
import { Send, Sparkles, Loader2, MousePointer2, Monitor, Minimize2, ListTodo, Library, CheckCircle2, XCircle, Clock } from 'lucide-react';

interface AIPanelProps {
  onGenerate: (prompt: string, model: ModelType) => Promise<void>;
  isGenerating: boolean;
  isAuthenticated: boolean;
  hasSelection: boolean;
}

const AIPanel: React.FC<AIPanelProps> = ({ onGenerate, isGenerating, isAuthenticated, hasSelection }) => {
  const [prompt, setPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState<ModelType>(ModelType.NANO_BANANA_1);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeView, setActiveView] = useState<'tasks' | 'library'>('tasks');
  const SHOW_VIDEO_MODELS = false;
  
  const handleTemplateSelect = (t: Template) => {
    setPrompt(t.promptTemplate);
    
    // Auto-switch model based on template type
    if (t.type === 'video') {
        if (SHOW_VIDEO_MODELS) {
            if (selectedModel !== ModelType.VEO_FAST && selectedModel !== ModelType.VEO_HQ) {
                setSelectedModel(ModelType.VEO_FAST);
            }
        } else {
            if (selectedModel === ModelType.VEO_FAST || selectedModel === ModelType.VEO_HQ) {
                setSelectedModel(ModelType.NANO_BANANA_2);
            }
        }
    } else {
        if (selectedModel === ModelType.VEO_FAST || selectedModel === ModelType.VEO_HQ) {
            setSelectedModel(ModelType.NANO_BANANA_1);
        }
    }
    
    setActiveView('tasks');
  };

  const handleSend = async () => {
    if (!prompt.trim() || isGenerating) return;

    if (!isAuthenticated) {
      const currentPrompt = prompt;
      setPrompt('');
      let taskType: 'generate' | 'edit' | 'video' = 'generate';
      if (selectedModel === ModelType.VEO_FAST || selectedModel === ModelType.VEO_HQ) taskType = 'video';
      else if (hasSelection) taskType = 'edit';

      const newTask: Task = {
        id: Date.now().toString(),
        type: taskType,
        status: 'error',
        prompt: currentPrompt,
        timestamp: Date.now(),
        model: selectedModel,
        error: '请先登录后再使用 AI 生成功能'
      };
      setTasks(prev => [newTask, ...prev]);
      return;
    }

    const currentPrompt = prompt;
    setPrompt('');
    
    // Determine task type
    let taskType: 'generate' | 'edit' | 'video' = 'generate';
    if (selectedModel === ModelType.VEO_FAST || selectedModel === ModelType.VEO_HQ) taskType = 'video';
    else if (hasSelection) taskType = 'edit';

    // Create new task
    const newTask: Task = {
      id: Date.now().toString(),
      type: taskType,
      status: 'loading',
      prompt: currentPrompt,
      timestamp: Date.now(),
      model: selectedModel
    };

    setTasks(prev => [newTask, ...prev]);

    try {
      await onGenerate(currentPrompt, selectedModel);
      
      // Update task on success
      setTasks(prev => prev.map(t => 
        t.id === newTask.id ? { ...t, status: 'success' } : t
      ));

    } catch (error) {
      // Update task on error
      setTasks(prev => prev.map(t => 
        t.id === newTask.id ? { ...t, status: 'error', error: error instanceof Error ? error.message : 'Unknown error' } : t
      ));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    const handler = (e: CustomEvent) => {
      const p = (e as any).detail?.prompt || '';
      setPrompt(p);
      setActiveView('tasks');
    };
    window.addEventListener('aiPanelSetPrompt', handler as EventListener);
    return () => {
      window.removeEventListener('aiPanelSetPrompt', handler as EventListener);
    };
  }, []);

  return (
    <div data-ai-panel="true" className={`absolute top-4 right-4 z-50 transition-all duration-300 ease-in-out flex flex-col bg-[#0B1220]/95 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl overflow-hidden ${isCollapsed ? 'w-16 h-16 rounded-full' : 'w-[400px] h-[calc(100vh-2rem)]'}`} style={{ transform: 'scale(0.9)', transformOrigin: 'top right' }}>
      
      {/* Collapsed State Toggle */}
      {isCollapsed && (
        <button 
          onClick={() => setIsCollapsed(false)}
          className="w-full h-full flex items-center justify-center text-indigo-400 hover:text-white hover:bg-white/5 transition-all rounded-full"
        >
          <Sparkles size={24} />
        </button>
      )}

      {/* Expanded Content */}
      {!isCollapsed && (
        <>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#151E2E]/50 select-none shrink-0">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-indigo-500 rounded-md shadow-lg shadow-indigo-500/20 backdrop-blur-sm">
                <Sparkles size={16} className="text-white" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white leading-none">NanoCanvas</h2>
                <p className="text-[10px] text-slate-300 mt-0.5">Gemini Powered</p>
              </div>
            </div>
            <button 
              onClick={() => setIsCollapsed(true)}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <Minimize2 size={16} />
            </button>
          </div>

          {/* Controls Section (Always Visible) */}
          <div className="px-4 pt-4 pb-2 space-y-3 shrink-0">
             {/* Unified Model Selector */}
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Model</div>
            <div className={`grid ${SHOW_VIDEO_MODELS ? 'grid-cols-4' : 'grid-cols-2'} gap-1 p-1 bg-black/40 border border-white/10 rounded-lg`}>
                <button
                    onClick={() => setSelectedModel(ModelType.NANO_BANANA_1)}
                    className={`py-1.5 text-[9px] font-semibold uppercase tracking-wide rounded-md transition-all truncate ${
                        selectedModel === ModelType.NANO_BANANA_1
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-300 hover:text-white hover:bg-white/5'
                    }`}
                    title="Image Fast"
                >
                    Image Fast
                </button>
                <button
                    onClick={() => setSelectedModel(ModelType.NANO_BANANA_2)}
                    className={`py-1.5 text-[9px] font-semibold uppercase tracking-wide rounded-md transition-all truncate ${
                        selectedModel === ModelType.NANO_BANANA_2
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'text-slate-300 hover:text-white hover:bg-white/5'
                    }`}
                    title="Image HQ"
                >
                    Image HQ
                </button>
                {SHOW_VIDEO_MODELS && (
                  <>
                    <button
                        onClick={() => setSelectedModel(ModelType.VEO_FAST)}
                        className={`py-1.5 text-[9px] font-semibold uppercase tracking-wide rounded-md transition-all truncate ${
                            selectedModel === ModelType.VEO_FAST
                            ? 'bg-rose-600 text-white shadow-sm'
                            : 'text-slate-300 hover:text-white hover:bg-white/5'
                        }`}
                        title="Video Fast"
                    >
                        Video Fast
                    </button>
                    <button
                        onClick={() => setSelectedModel(ModelType.VEO_HQ)}
                        className={`py-1.5 text-[9px] font-semibold uppercase tracking-wide rounded-md transition-all truncate ${
                            selectedModel === ModelType.VEO_HQ
                            ? 'bg-rose-800 text-white shadow-sm'
                            : 'text-slate-300 hover:text-white hover:bg-white/5'
                        }`}
                        title="Video HQ"
                    >
                        Video HQ
                    </button>
                  </>
                )}
             </div>

             {/* Context Indicator */}
             <div className={`flex items-center justify-between px-3 py-2 rounded-lg border text-xs font-medium backdrop-blur-sm ${
                hasSelection 
                ? 'bg-emerald-900/30 border-emerald-500/30 text-emerald-300' 
                : 'bg-white/5 border-white/10 text-slate-300'
             }`}>
                <div className="flex items-center gap-2">
                {hasSelection ? <MousePointer2 size={14} /> : <Monitor size={14} />}
                <span>{hasSelection ? 'Context: Active Selection' : 'Context: Full Viewport'}</span>
                </div>
                {hasSelection && <span className="text-[10px] opacity-70">Focus Mode</span>}
             </div>

             {/* View Tabs */}
             <div className="flex border-b border-white/10 mt-2">
                <button 
                   onClick={() => setActiveView('tasks')} 
                   className={`flex-1 pb-2 text-xs font-medium border-b-2 transition-all flex items-center justify-center gap-2 ${activeView === 'tasks' ? 'border-indigo-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
                >
                   <ListTodo size={12} />
                   Tasks
                </button>
                <button 
                   onClick={() => setActiveView('library')} 
                   className={`flex-1 pb-2 text-xs font-medium border-b-2 transition-all flex items-center justify-center gap-2 ${activeView === 'library' ? 'border-indigo-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
                >
                   <Library size={12} />
                   Templates
                </button>
             </div>
          </div>

          {/* Main Content Area (Scrollable) */}
          <div className="flex-1 overflow-y-auto min-h-0 custom-scrollbar relative bg-[#0B1220]/30">
             {activeView === 'tasks' ? (
                <div className="p-4 space-y-3 min-h-full">
                    {tasks.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-48 text-center opacity-60">
                            <Sparkles className="text-slate-400 mb-3" size={32} />
                            <p className="text-sm text-slate-200 font-medium">Ready to Create</p>
                            <p className="text-xs text-slate-400 mt-1">Select a template or start typing.</p>
                        </div>
                    )}
                    
                    {tasks.map((task) => (
                        <div key={task.id} className="bg-[#151E2E]/60 border border-white/5 rounded-xl p-3 hover:border-white/10 transition-colors">
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    {task.status === 'loading' && <Loader2 size={14} className="text-indigo-400 animate-spin" />}
                                    {task.status === 'success' && <CheckCircle2 size={14} className="text-emerald-400" />}
                                    {task.status === 'error' && <XCircle size={14} className="text-red-400" />}
                                    
                                    <span className={`text-[10px] font-bold uppercase tracking-wider ${
                                        task.status === 'loading' ? 'text-indigo-400' : 
                                        task.status === 'success' ? 'text-emerald-400' : 'text-red-400'
                                    }`}>
                                        {task.status}
                                    </span>
                                    {task.type === 'video' && <span className="px-1.5 py-0.5 rounded bg-rose-900/50 text-rose-300 text-[9px] border border-rose-700/30">VIDEO</span>}
                                </div>
                                <div className="flex items-center gap-1 text-[10px] text-slate-500">
                                    <Clock size={10} />
                                    <span>{new Date(task.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                </div>
                            </div>
                            
                            <p className="text-xs text-slate-200 leading-relaxed line-clamp-3">
                                {task.prompt}
                            </p>
                            
                            {task.error && (
                                <div className="mt-2 pt-2 border-t border-white/5 text-[10px] text-red-400">
                                    {task.error}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
             ) : (
                <div className="h-full">
                    <TemplateSelector onSelect={handleTemplateSelect} hasSelection={hasSelection} />
                </div>
             )}
          </div>

          {/* Input Footer (Always Visible) */}
          <div className="p-4 border-t border-white/10 bg-[#151E2E]/80 backdrop-blur-md shrink-0 z-10">
            <div className="relative group">
              {!isAuthenticated && (
                <div className="mb-2 text-[11px] text-amber-300">
                  请先登录以使用 AI 生成功能
                </div>
              )}
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={hasSelection ? "Describe change or video motion..." : "Describe what you want to imagine..."}
                className="w-full bg-black/60 text-white placeholder-slate-400 rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 border border-white/10 focus:border-indigo-500 transition-all resize-none h-20 scrollbar-hide shadow-inner"
              />
              <button
                onClick={handleSend}
                disabled={isGenerating || !prompt.trim() || !isAuthenticated}
                className="absolute bottom-2 right-2 p-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-white/10 disabled:text-slate-500 text-white rounded-lg transition-all shadow-lg shadow-indigo-900/30"
              >
                {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </button>
            </div>
          </div>

        </>
      )}
    </div>
  );
};

export default AIPanel;
