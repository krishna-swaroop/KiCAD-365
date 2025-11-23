import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Github,
  Folder,
  RefreshCw,
  ArrowLeft,
  Activity,
  AlertCircle,
  Loader2,
  Trash2,
  Cpu
} from 'lucide-react';

import { Button, Input, SectionHeader, Toast } from './components/ui';
import { PreviewModal } from './components/viewers';
import { FileTree } from './components/FileTree';
import { getIconForName } from './utils';

const API_BASE = `http://${window.location.hostname}:8000/api`;

export default function App() {
  const [view, setView] = useState('home');
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [newRepoUrl, setNewRepoUrl] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [projectFiles, setProjectFiles] = useState({});
  const [activeTab, setActiveTab] = useState(null);
  const [tabs, setTabs] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/projects`);
      if (!res.ok) throw new Error("Failed to fetch projects");
      const data = await res.json();
      setProjects(data.projects);
    } catch (err) {
      setToast({ type: 'error', message: "Backend Offline: " + err.message });
    } finally {
      setLoading(false);
    }
  }, []);

  const handleAddProject = async () => {
    if (!newRepoUrl) return;
    setIsAdding(true);
    try {
      const res = await fetch(`${API_BASE}/projects/link?url=${encodeURIComponent(newRepoUrl)}`, { method: 'POST' });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to clone repository");
      }
      await fetchProjects();
      setNewRepoUrl('');
      setToast({ type: 'success', message: 'Repository Cloned Successfully' });
    } catch (err) {
      setToast({ type: 'error', message: err.message });
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteProject = async (project) => {
    if (!confirm(`Are you sure you want to delete the project "${project.name}"? This cannot be undone.`)) return;

    try {
      const res = await fetch(`${API_BASE}/projects/${project.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to delete project");
      }
      setToast({ type: 'success', message: 'Project Deleted Successfully' });
      await fetchProjects();
    } catch (err) {
      setToast({ type: 'error', message: err.message });
    }
  };

  const loadProjectDetails = async (project) => {
    setSelectedProject(project);
    setView('project');
    setProjectFiles({});
    setTabs([]);
    try {
      const res = await fetch(`${API_BASE}/projects/${project.id}/tree`);
      if (!res.ok) throw new Error("Failed to load project files");
      const data = await res.json();

      // Define the specific folders to display in the desired order
      const orderedFolders = ['docs', 'Design-Outputs', 'Manufacturing-Outputs', 'simulation'];

      // Generate tabs based on the ordered list, only including those present in the data
      const dynamicTabs = orderedFolders
        .filter(key => data[key])
        .map(key => ({
          id: key,
          label: key.replace(/_/g, ' ').replace(/-/g, ' '), // "Design-Outputs" -> "Design Outputs"
          icon: getIconForName(key)
        }));

      setTabs(dynamicTabs);
      setProjectFiles(data);

      // Default to the first tab if available
      if (dynamicTabs.length > 0) {
        setActiveTab(dynamicTabs[0].id);
      }
    } catch (err) {
      setToast({ type: 'error', message: "Could not load file structure" });
    }
  };

  const handleSyncAndBuild = async () => {
    if (!selectedProject) return;
    setIsSyncing(true);
    try {
      const res = await fetch(`${API_BASE}/projects/${selectedProject.id}/build`, { method: 'POST' });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Build failed");
      }
      await loadProjectDetails(selectedProject);
      setToast({ type: 'success', message: 'Sync & Jobset Execution Complete' });
    } catch (err) {
      setToast({ type: 'error', message: err.message });
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePreview = async (filePath) => {
    const url = `${API_BASE}/projects/${selectedProject.id}/file/${filePath}`;
    const lowerPath = filePath.toLowerCase();
    const isTextBased = lowerPath.endsWith('.csv') || lowerPath.endsWith('.md');

    if (isTextBased) {
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to download file");
        const text = await res.text();
        setPreviewFile({ name: filePath, url, content: text });
      } catch (e) {
        setToast({ type: 'error', message: "Failed to load file content" });
      }
    } else {
      setPreviewFile({ name: filePath, url, content: null });
    }
  };

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  const getThumbnailSrc = (project) => project.thumbnail_url ? `${API_BASE}/projects/${project.id}/file/${project.thumbnail_url}` : null;

  if (view === 'project' && selectedProject) {
    return (
      <div className="min-h-screen bg-[#F4F4F4] text-black flex flex-col font-mono selection:bg-black selection:text-white">
        <header className="bg-white border-b border-black px-6 py-4 flex justify-between items-center sticky top-0 z-20 shadow-sm">
          <div className="flex items-center gap-6">
            <Button variant="ghost" onClick={() => setView('home')} className="!px-0 hover:!bg-transparent">
              <ArrowLeft size={16} /> <span className="underline decoration-1 underline-offset-4">BACK TO GALLERY</span>
            </Button>
            <div className="h-8 w-px bg-gray-300" />
            <div>
              <h1 className="text-xl font-bold uppercase tracking-tighter leading-none">{selectedProject.name}</h1>
              <p className="text-[10px] text-gray-500 font-mono tracking-widest mt-1">ID: {selectedProject.id}</p>
            </div>
          </div>
          <Button onClick={handleSyncAndBuild} disabled={isSyncing}>
            {isSyncing ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />}
            {isSyncing ? "PROCESSING..." : "SYNC & BUILD"}
          </Button>
        </header>

        <div className="flex flex-1 overflow-hidden">
          <nav className="w-72 bg-white border-r border-black flex flex-col overflow-y-auto">
            <div className="p-4 border-b border-gray-100">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Project Directories</div>
            </div>
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const hasItems = projectFiles[tab.id] && projectFiles[tab.id].length > 0;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center justify-between p-5 text-xs font-bold uppercase border-b border-gray-100 transition-all
                    ${isActive ? 'bg-black text-white' : 'hover:bg-gray-100 text-black'}
                  `}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={16} />
                    {tab.label}
                  </div>
                  <span className={`w-2 h-2 rounded-full ${hasItems ? 'bg-green-500' : 'bg-gray-300'}`} />
                </button>
              );
            })}
          </nav>

          <main className="flex-1 p-8 overflow-y-auto bg-[#F4F4F4]">
            <div className="max-w-6xl mx-auto">
              {activeTab && (
                <>
                  <SectionHeader
                    title={tabs.find(t => t.id === activeTab)?.label || activeTab}
                    icon={Folder}
                    rightElement={
                      <span className="text-[10px] text-gray-500 font-mono">
                        /{activeTab}
                      </span>
                    }
                  />

                  <div className="bg-white border border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]">
                    {!projectFiles[activeTab] || projectFiles[activeTab].length === 0 ? (
                      <div className="p-16 text-center text-gray-400 flex flex-col items-center">
                        <Folder size={48} className="mb-4 opacity-20" strokeWidth={1} />
                        <p className="text-xs uppercase tracking-widest font-bold">Directory Empty</p>
                        <p className="text-[10px] mt-2 max-w-xs text-center">Run "Sync & Build" to generate outputs if this is an output directory.</p>
                      </div>
                    ) : (
                      <div className="p-4">
                        <FileTree
                          items={projectFiles[activeTab]}
                          onPreview={handlePreview}
                          projectId={selectedProject.id}
                        />
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </main>
        </div>
        {previewFile && (
          <PreviewModal
            file={previewFile}
            onClose={() => setPreviewFile(null)}
            baseFileUrl={`${API_BASE}/projects/${selectedProject.id}/file`}
          />
        )}
        {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F4F4] text-black font-mono selection:bg-black selection:text-white">
      <div className="border-b border-black bg-white">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-4 mb-4">
                <h1 className="text-5xl font-bold uppercase tracking-tighter">KiCAD-365</h1>
              </div>
              <p className="text-xs text-gray-500 font-mono tracking-[0.2em] uppercase border-l-2 border-black pl-3 ml-1">
                KiCAD Centralized Design & Fabrication Output Database
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">

        {/* Import Interface */}
        <div className="mb-16">
          <SectionHeader title="Ingest New Repository" icon={Plus} />
          <div className="bg-white border border-black p-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex flex-col md:flex-row gap-4 p-6">
              <div className="flex-1">
                <label className="block text-[10px] font-bold uppercase tracking-widest mb-2 text-gray-500">
                  GitHub Repository URL
                </label>
                <Input
                  value={newRepoUrl}
                  onChange={(e) => setNewRepoUrl(e.target.value)}
                  placeholder="https://github.com/organization/project-repo"
                  disabled={isAdding}
                />
              </div>
              <div className="flex items-end">
                <Button onClick={handleAddProject} disabled={isAdding || !newRepoUrl} className="h-[46px] w-full md:w-auto justify-center">
                  {isAdding ? <Loader2 className="animate-spin" size={16} /> : <Github size={16} />}
                  {isAdding ? "CLONING REPO..." : "INITIATE CLONE"}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Project Grid */}
        <SectionHeader title="Active Projects" icon={Cpu} />

        {loading ? (
          <div className="flex justify-center p-24 border border-dashed border-gray-300">
            <Loader2 className="animate-spin text-black" size={32} />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {projects.map((project) => (
              <div
                key={project.id}
                onClick={() => loadProjectDetails(project)}
                className="group bg-white border border-black cursor-pointer hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all duration-200 flex flex-col h-full relative"
              >
                {/* Thumbnail Frame */}
                <div className="aspect-[4/3] bg-gray-100 border-b border-black relative overflow-hidden flex items-center justify-center">
                  {/* Grid Pattern Overlay */}
                  <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-multiply pointer-events-none"></div>

                  {project.thumbnail_url ? (
                    <img
                      src={getThumbnailSrc(project)}
                      alt={project.name}
                      className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}

                  {/* Fallback Icon */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-300 bg-white" style={{ display: project.thumbnail_url ? 'none' : 'flex' }}>
                    <Activity size={48} strokeWidth={1} />
                    <span className="text-[10px] uppercase tracking-widest mt-2 text-gray-400">No Preview</span>
                  </div>
                </div>

                {/* Card Data */}
                <div className="p-5 flex flex-col flex-1 justify-between">
                  <div>
                    <h3 className="font-bold text-lg leading-tight mb-2 truncate uppercase">{project.name}</h3>
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-[10px] font-bold text-white bg-black px-1.5 py-0.5">GIT</span>
                      <span className="text-[10px] font-mono text-gray-500 truncate" title={project.id}>
                        {project.id.substring(0, 8)}...
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 group-hover:text-black transition-colors">
                      Open Project &rarr;
                    </span>
                    {project.sync_status === 'error' && (
                      <AlertCircle size={14} className="text-red-500" />
                    )}
                  </div>
                </div>

                {/* Delete Button (Absolute Positioned) */}
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent opening the project
                    handleDeleteProject(project);
                  }}
                  className="absolute top-2 right-2 p-2 bg-white border border-black text-gray-400 hover:text-red-600 hover:border-red-600 transition-colors z-10 shadow-sm"
                  title="Delete Project"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      {/* Footer */}
      <footer className="mt-24 border-t border-black bg-white py-12 text-center">
        <p className="text-[10px] uppercase tracking-[0.3em] text-gray-400 font-bold">
          KiCAD Database Interface • V1.0.0 • Localhost
        </p>
      </footer>
    </div>
  );
}