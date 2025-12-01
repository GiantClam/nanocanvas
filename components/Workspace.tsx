
import React, { useState, useEffect } from 'react';
import { Project, GalleryItem, Template } from '../types';
import { TEMPLATES } from '../constants';
import { Plus, Layout, Image as ImageIcon, History, Trash2, Download, Search, FolderOpen, ArrowRight, Video, Sparkles } from 'lucide-react';

interface WorkspaceProps {
  onOpenProject: (project: Project) => void;
  onCreateNew: (template?: Template) => void;
  gallery: GalleryItem[];
}

const Workspace: React.FC<WorkspaceProps> = ({ onOpenProject, onCreateNew, gallery }) => {
  const [activeTab, setActiveTab] = useState<'projects' | 'templates' | 'gallery'>('projects');
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Load projects from localStorage on mount
  useEffect(() => {
    try {
      const savedProjects = localStorage.getItem('nc_projects');
      if (savedProjects) {
        setProjects(JSON.parse(savedProjects));
      }
    } catch (e) {
      console.error("Failed to load projects", e);
    }
  }, []);

  const handleDeleteProject = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this project?")) {
      const updated = projects.filter(p => p.id !== id);
      setProjects(updated);
      localStorage.setItem('nc_projects', JSON.stringify(updated));
    }
  };

  const filteredTemplates = TEMPLATES.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex w-full h-full bg-slate-50 text-slate-800 font-sans">
      {/* Sidebar */}
      <div className="w-64 shrink-0 border-r border-slate-200 bg-white flex flex-col">
        <div className="p-6">
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Sparkles size={18} className="text-white" />
            </div>
            NanoCanvas
          </h1>
          <p className="text-xs text-slate-400 mt-1 pl-10 font-medium">AI Workspace</p>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          <button 
            onClick={() => setActiveTab('projects')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'projects' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
          >
            <FolderOpen size={18} />
            Projects
          </button>
          <button 
            onClick={() => setActiveTab('templates')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'templates' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
          >
            <Layout size={18} />
            Templates
          </button>
          <button 
            onClick={() => setActiveTab('gallery')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'gallery' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
          >
            <History size={18} />
            History Gallery
          </button>
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
            <div className="text-xs font-medium text-slate-500 mb-2">Storage Used</div>
            <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
               <div className="h-full bg-indigo-500 w-[15%]" />
            </div>
            <div className="text-[10px] text-slate-400 mt-2 text-right">Local Storage</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/50">
        {/* Header */}
        <header className="h-16 border-b border-slate-200 flex items-center justify-between px-8 bg-white/80 backdrop-blur-md sticky top-0 z-10">
          <div className="text-lg font-bold text-slate-800 capitalize">{activeTab}</div>
          <div className="flex items-center gap-4">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={16} />
              <input 
                type="text" 
                placeholder="Search..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-100 border-none rounded-full pl-10 pr-4 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:bg-white transition-all w-64 shadow-sm"
              />
            </div>
            {activeTab === 'projects' && (
              <button 
                onClick={() => onCreateNew()}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-full text-sm font-medium flex items-center gap-2 transition-all shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/30 active:scale-95"
              >
                <Plus size={18} />
                New Canvas
              </button>
            )}
          </div>
        </header>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          
          {/* Projects View */}
          {activeTab === 'projects' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {/* New Project Card */}
              <button 
                onClick={() => onCreateNew()}
                className="group aspect-video rounded-xl border-2 border-dashed border-slate-300 hover:border-indigo-500 hover:bg-indigo-50/50 flex flex-col items-center justify-center gap-3 transition-all bg-white"
              >
                <div className="w-12 h-12 rounded-full bg-slate-100 group-hover:bg-indigo-100 text-slate-400 group-hover:text-indigo-600 flex items-center justify-center transition-colors">
                  <Plus size={24} />
                </div>
                <span className="text-sm font-medium text-slate-500 group-hover:text-indigo-600">Create Blank Canvas</span>
              </button>

              {filteredProjects.map(project => (
                <div key={project.id} onClick={() => onOpenProject(project)} className="group bg-white border border-slate-200 rounded-xl overflow-hidden hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 cursor-pointer relative flex flex-col">
                   <div className="aspect-video bg-slate-100 relative overflow-hidden border-b border-slate-100">
                      {project.thumbnail ? (
                        <img src={project.thumbnail} alt={project.name} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                          <Layout size={32} />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
                   </div>
                   <div className="p-4 bg-white">
                     <h3 className="text-sm font-bold text-slate-800 group-hover:text-indigo-600 truncate transition-colors">{project.name}</h3>
                     <p className="text-[11px] text-slate-400 mt-1 font-medium">Last edited {new Date(project.updatedAt).toLocaleDateString()}</p>
                   </div>
                   <button 
                      onClick={(e) => handleDeleteProject(project.id, e)}
                      className="absolute top-2 right-2 p-2 bg-white/90 text-slate-400 hover:text-red-500 hover:bg-white rounded-lg opacity-0 group-hover:opacity-100 transition-all shadow-sm"
                      title="Delete Project"
                   >
                     <Trash2 size={14} />
                   </button>
                </div>
              ))}
            </div>
          )}

          {/* Templates View */}
          {activeTab === 'templates' && (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {filteredTemplates.map(template => (
                  <div key={template.id} className="bg-white border border-slate-200 rounded-xl p-5 hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-500/5 transition-all flex flex-col h-full group">
                     <div className="flex items-start justify-between mb-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${template.type === 'video' ? 'bg-rose-50 text-rose-500 group-hover:bg-rose-100' : 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100'}`}>
                           {template.type === 'video' ? <Video size={20} /> : <ImageIcon size={20} />}
                        </div>
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 bg-slate-100 rounded text-slate-500">{template.category}</span>
                     </div>
                     <h3 className="font-bold text-slate-800 mb-1 group-hover:text-indigo-600 transition-colors">{template.name}</h3>
                     <p className="text-xs text-slate-500 leading-relaxed mb-5 flex-1">{template.description}</p>
                     
                     <button 
                        onClick={() => { 
                          onCreateNew(template);
                          try {
                            sessionStorage.setItem('nc_initial_prompt', template.promptTemplate || '');
                          } catch {}
                          try {
                            window.dispatchEvent(new CustomEvent('useTemplateCreateCanvas', { detail: { prompt: template.promptTemplate, name: template.name } }));
                          } catch {}
                          try {
                            window.location.href = '/standard-editor';
                          } catch {}
                        }}
                        className="w-full py-2.5 bg-slate-50 hover:bg-indigo-600 hover:text-white text-slate-600 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2 group/btn border border-slate-200 hover:border-indigo-600"
                     >
                        Use Template
                        <ArrowRight size={12} className="group-hover/btn:translate-x-1 transition-transform" />
                     </button>
                  </div>
                ))}
             </div>
          )}

          {/* Gallery View */}
          {activeTab === 'gallery' && (
             <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
                {gallery.length === 0 ? (
                  <div className="col-span-full text-center py-24 text-slate-400">
                    <History size={48} className="mx-auto mb-4 opacity-20 text-slate-300" />
                    <p className="font-medium">No generation history yet.</p>
                    <p className="text-xs mt-1">Start creating to see your history here.</p>
                  </div>
                ) : (
                  gallery.map(item => (
                    <div key={item.id} className="break-inside-avoid bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-xl hover:shadow-black/5 transition-all group">
                       <div className="relative">
                         {item.type === 'video' ? (
                            <video src={item.url} className="w-full auto" muted loop onMouseOver={e => e.currentTarget.play()} onMouseOut={e => e.currentTarget.pause()} />
                         ) : (
                            <img src={item.url} alt="Generated" className="w-full auto" />
                         )}
                         <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[1px]">
                            <a href={item.url} download={`nano-gen-${item.id}.${item.type === 'video' ? 'mp4' : 'png'}`} className="p-2.5 bg-white text-slate-900 rounded-full hover:scale-110 transition-transform shadow-lg">
                               <Download size={18} />
                            </a>
                         </div>
                       </div>
                       <div className="p-3 border-t border-slate-100">
                          <div className="flex items-center justify-between mb-1.5">
                             <span className="text-[10px] font-mono text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded font-medium">{item.model}</span>
                             <span className="text-[10px] text-slate-400">{new Date(item.timestamp).toLocaleDateString()}</span>
                          </div>
                          <p className="text-xs text-slate-600 line-clamp-2 font-medium leading-relaxed" title={item.prompt}>{item.prompt}</p>
                       </div>
                    </div>
                  ))
                )}
             </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Workspace;
