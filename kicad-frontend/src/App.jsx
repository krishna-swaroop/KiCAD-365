import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Github,
  Activity,
  AlertCircle,
  Loader2,
  Trash2,
  Cpu
} from 'lucide-react';

import { Button, Input, SectionHeader, Toast } from './components/ui';
import { ProjectDetailView } from './components/ProjectDetailView';

const API_BASE = `http://${window.location.hostname}:8000/api`;

export default function App() {
  const [view, setView] = useState('home');
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [newRepoUrl, setNewRepoUrl] = useState('');
  const [isAdding, setIsAdding] = useState(false);

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

  const loadProjectDetails = (project) => {
    setSelectedProject(project);
    setView('project');
  };

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  const getThumbnailSrc = (project) => project.thumbnail_url ? `${API_BASE}/projects/${project.id}/file/${project.thumbnail_url}` : null;

  if (view === 'project' && selectedProject) {

    return (
      <ProjectDetailView
        project={selectedProject}
        onBack={() => setView('home')}
      />
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