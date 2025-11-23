import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Github,
  Folder,
  File,
  RefreshCw,
  ArrowLeft,
  Download,
  Eye,
  Cpu,
  Hammer,
  BookOpen,
  Activity,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Terminal,
  X,
  Table as TableIcon,
  FileText
} from 'lucide-react';

const API_BASE = "http://192.168.1.55:8000/api";

// --- UI Components ---

const Button = ({ children, onClick, disabled, className = "", variant = "primary" }) => {
  const baseStyle = "px-4 py-3 text-xs font-bold uppercase tracking-wider border transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-mono select-none sharp-corners";
  const variants = {
    primary: "bg-black text-white border-black hover:bg-white hover:text-black active:translate-y-0.5",
    secondary: "bg-white text-black border-black hover:bg-black hover:text-white active:translate-y-0.5",
    ghost: "border-transparent hover:bg-gray-100 text-gray-600"
  };
  return (
    <button onClick={onClick} disabled={disabled} className={`${baseStyle} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
};

const Input = ({ value, onChange, placeholder, disabled }) => (
  <div className="relative w-full">
    <input
      type="text"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      className="w-full bg-white border border-black p-3 pr-10 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-black placeholder-gray-400 disabled:bg-gray-50"
    />
    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
      <Terminal size={14} className="text-gray-400" />
    </div>
  </div>
);

const SectionHeader = ({ title, icon: Icon, rightElement }) => (
  <div className="flex items-center justify-between border-b border-black pb-2 mb-6">
    <div className="flex items-center gap-2">
      {Icon && <Icon size={16} />}
      <h2 className="text-sm font-bold uppercase tracking-widest font-mono">{title}</h2>
    </div>
    {rightElement}
  </div>
);

const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);
  const bg = type === 'error' ? 'bg-white border-red-600 text-red-600' : 'bg-white border-black text-black';
  const Icon = type === 'error' ? AlertCircle : CheckCircle2;
  return (
    <div className={`fixed bottom-6 right-6 p-4 border-2 flex items-center gap-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] max-w-md animate-slide-in font-mono z-50 ${bg}`}>
      <Icon size={18} />
      <span className="text-xs font-bold uppercase">{message}</span>
    </div>
  );
};

// --- Preview Modal Component ---

const PreviewModal = ({ file, onClose }) => {
  const isPdf = file.name.toLowerCase().endsWith('.pdf');
  const isCsv = file.name.toLowerCase().endsWith('.csv');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 md:p-8">
      <div className="bg-white w-full max-w-[95vw] h-[95vh] flex flex-col border border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] animate-slide-in">
        {/* Modal Header */}
        <div className="flex justify-between items-center p-4 border-b border-black bg-gray-50">
          <div className="flex items-center gap-3">
            {isPdf ? <FileText size={20} /> : <TableIcon size={20} />}
            <div>
              <h3 className="text-sm font-bold uppercase font-mono">{file.name.split('/').pop()}</h3>
              <p className="text-[10px] text-gray-500 font-mono tracking-widest">{file.name}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <a href={file.url} download>
              <Button variant="secondary" className="!py-1.5 !px-3">Download</Button>
            </a>
            <Button onClick={onClose} variant="primary" className="!py-1.5 !px-3"><X size={16} /></Button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-auto bg-gray-100 p-4">
          {isPdf && (
            <iframe src={file.url} className="w-full h-full border border-black" title="PDF Viewer" />
          )}

          {isCsv && (
            <div className="bg-white border border-black p-4 min-h-full">
              <CsvViewer content={file.content} />
            </div>
          )}

          {!isPdf && !isCsv && (
            <div className="flex items-center justify-center h-full text-gray-400">
              Preview not available for this file type.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- CSV Parsing Logic ---
// This function properly handles quoted CSV fields
const parseCSV = (text) => {
  const rows = [];
  let currentRow = [];
  let currentCell = '';
  let inQuotes = false;

  // Normalize line endings
  const cleanText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText[i];
    const nextChar = cleanText[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Double quote inside quotes acts as an escape for a quote
        currentCell += '"';
        i++; // Skip the next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // Cell separator
      currentRow.push(currentCell);
      currentCell = '';
    } else if (char === '\n' && !inQuotes) {
      // Row separator
      currentRow.push(currentCell);
      if (currentRow.length > 1 || (currentRow.length === 1 && currentRow[0] !== '')) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentCell = '';
    } else {
      // Normal character
      currentCell += char;
    }
  }

  // Push the final row if exists
  if (currentRow.length > 0) {
    currentRow.push(currentCell);
    rows.push(currentRow);
  }

  return rows;
};

const CsvViewer = ({ content }) => {
  if (!content) return <div>Loading...</div>;

  const rows = parseCSV(content);
  if (rows.length === 0) return <div>Empty CSV</div>;

  const headers = rows[0];
  const data = rows.slice(1);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse text-xs font-mono bg-white">
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th key={i} className="border border-black bg-black text-white p-3 font-bold uppercase whitespace-nowrap sticky top-0">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="hover:bg-gray-100 transition-colors">
              {row.map((cell, j) => (
                <td key={j} className="border border-gray-300 p-2 min-w-[100px] max-w-[300px] break-words align-top">
                  {/* If the cell contains many commas (like Reference list), add spacing for readability */}
                  {cell.length > 50 && cell.includes(',') ? cell.split(',').join(', ') : cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// --- Main Application ---

export default function App() {
  // State
  const [view, setView] = useState('home');
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [newRepoUrl, setNewRepoUrl] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [projectFiles, setProjectFiles] = useState({});
  const [activeTab, setActiveTab] = useState('design_outputs');
  const [isSyncing, setIsSyncing] = useState(false);

  // Preview State
  const [previewFile, setPreviewFile] = useState(null); // { name, url, content }

  // API Call: Fetch Projects
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

  // API Call: Add Project
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

  // API Call: Load Project Details
  const loadProjectDetails = async (project) => {
    setSelectedProject(project);
    setView('project');
    setProjectFiles({});
    try {
      const res = await fetch(`${API_BASE}/projects/${project.id}/tree`);
      if (!res.ok) throw new Error("Failed to load project files");
      const data = await res.json();
      setProjectFiles(data);
    } catch (err) {
      setToast({ type: 'error', message: "Could not load file structure" });
    }
  };

  // API Call: Sync & Build
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

  // Logic: Handle Preview Request
  const handlePreview = async (filePath) => {
    const url = `${API_BASE}/projects/${selectedProject.id}/file/${filePath}`;
    const isCsv = filePath.toLowerCase().endsWith('.csv');

    if (isCsv) {
      try {
        const res = await fetch(url);
        const text = await res.text();
        setPreviewFile({ name: filePath, url, content: text });
      } catch (e) {
        setToast({ type: 'error', message: "Failed to load CSV content" });
      }
    } else {
      setPreviewFile({ name: filePath, url, content: null });
    }
  };

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  const getThumbnailSrc = (project) => project.thumbnail_url ? `${API_BASE}/projects/${project.id}/file/${project.thumbnail_url}` : null;

  const tabs = [
    { id: 'design_outputs', label: 'Design Outputs', icon: Cpu },
    { id: 'manufacturing_outputs', label: 'Manufacturing', icon: Hammer },
    { id: 'docs', label: 'Documentation', icon: BookOpen },
    { id: 'simulations', label: 'Simulations', icon: Activity },
  ];

  // --- View: Project Detail ---
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
              const count = projectFiles[tab.id]?.length || 0;
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center justify-between p-5 text-xs font-bold uppercase border-b border-gray-100 transition-all ${isActive ? 'bg-black text-white' : 'hover:bg-gray-100 text-black'}`}>
                  <div className="flex items-center gap-3"><Icon size={16} />{tab.label}</div>
                  <span className={`px-2 py-0.5 text-[10px] border ${isActive ? 'bg-white text-black border-white' : 'bg-gray-100 border-gray-200'}`}>{count.toString().padStart(2, '0')}</span>
                </button>
              );
            })}
          </nav>
          <main className="flex-1 p-8 overflow-y-auto bg-[#F4F4F4]">
            <div className="max-w-6xl mx-auto">
              <SectionHeader title={tabs.find(t => t.id === activeTab)?.label} icon={Folder} rightElement={<span className="text-[10px] text-gray-500 font-mono">/{activeTab.replace('_', '-')}</span>} />
              <div className="bg-white border border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]">
                {!projectFiles[activeTab] || projectFiles[activeTab].length === 0 ? (
                  <div className="p-16 text-center text-gray-400 flex flex-col items-center">
                    <Folder size={48} className="mb-4 opacity-20" strokeWidth={1} />
                    <p className="text-xs uppercase tracking-widest font-bold">Directory Empty</p>
                    <p className="text-[10px] mt-2 max-w-xs text-center">Run "Sync & Build" to generate outputs if this is an output directory.</p>
                  </div>
                ) : (
                  <ul className="divide-y divide-gray-100">
                    {projectFiles[activeTab].map((filePath, idx) => {
                      const isPreviewable = filePath.endsWith('.pdf') || filePath.endsWith('.csv');
                      const downloadUrl = `${API_BASE}/projects/${selectedProject.id}/file/${filePath}`;
                      return (
                        <li key={idx} className="group flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex items-center gap-4 overflow-hidden">
                            <div className="w-8 h-8 flex items-center justify-center bg-gray-100 border border-gray-200 text-gray-500"><File size={14} /></div>
                            <div className="flex flex-col"><span className="text-sm font-bold truncate">{filePath.split('/').pop()}</span><span className="text-[10px] text-gray-400 font-mono tracking-tight hidden sm:inline-block">{filePath}</span></div>
                          </div>
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                            {isPreviewable && (
                              <Button onClick={() => handlePreview(filePath)} variant="secondary" className="!py-1.5 !px-3 !text-[10px]">
                                <Eye size={12} className="mr-1" /> VIEW
                              </Button>
                            )}
                            <a href={downloadUrl} target="_blank" rel="noopener noreferrer">
                              <Button variant="secondary" className="!py-1.5 !px-3 !text-[10px]">
                                <Download size={12} className="mr-1" /> DL
                              </Button>
                            </a>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          </main>
        </div>

        {/* Modals & Toasts */}
        {previewFile && <PreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />}
        {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      </div>
    );
  }

  // --- View: Home / Gallery ---
  return (
    <div className="min-h-screen bg-[#F4F4F4] text-black font-mono selection:bg-black selection:text-white">
      <div className="border-b border-black bg-white">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="flex items-start justify-between">
            <div><h1 className="text-5xl font-bold uppercase tracking-tighter mb-4">KiCAD Registry</h1><p className="text-xs text-gray-500 font-mono tracking-[0.2em] uppercase border-l-2 border-black pl-3 ml-1">Centralized Design & Fabrication Database</p></div>
            <div className="hidden md:block text-right"><div className="text-[10px] font-bold uppercase tracking-widest mb-1">System Status</div><div className="flex items-center justify-end gap-2 text-green-600"><div className="w-2 h-2 bg-green-600 rounded-full animate-pulse" /><span className="text-xs font-bold">ONLINE</span></div></div>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-16">
          <SectionHeader title="Ingest New Repository" icon={Plus} />
          <div className="bg-white border border-black p-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex flex-col md:flex-row gap-4 p-6">
              <div className="flex-1"><label className="block text-[10px] font-bold uppercase tracking-widest mb-2 text-gray-500">GitHub Repository URL</label><Input value={newRepoUrl} onChange={(e) => setNewRepoUrl(e.target.value)} placeholder="https://github.com/organization/project-repo" disabled={isAdding} /></div>
              <div className="flex items-end"><Button onClick={handleAddProject} disabled={isAdding || !newRepoUrl} className="h-[46px] w-full md:w-auto justify-center">{isAdding ? <Loader2 className="animate-spin" size={16} /> : <Github size={16} />}{isAdding ? "CLONING REPO..." : "INITIATE CLONE"}</Button></div>
            </div>
          </div>
        </div>
        <SectionHeader title="Active Projects" icon={Cpu} />
        {loading ? (
          <div className="flex justify-center p-24 border border-dashed border-gray-300"><Loader2 className="animate-spin text-black" size={32} /></div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {projects.map((project) => (
              <div key={project.id} onClick={() => loadProjectDetails(project)} className="group bg-white border border-black cursor-pointer hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all duration-200 flex flex-col h-full">
                <div className="aspect-[4/3] bg-gray-100 border-b border-black relative overflow-hidden flex items-center justify-center">
                  <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-multiply pointer-events-none"></div>
                  {project.thumbnail_url ? (
                    <img src={getThumbnailSrc(project)} alt={project.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                  ) : null}
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-300 bg-white" style={{ display: project.thumbnail_url ? 'none' : 'flex' }}><Activity size={48} strokeWidth={1} /><span className="text-[10px] uppercase tracking-widest mt-2 text-gray-400">No Preview</span></div>
                </div>
                <div className="p-5 flex flex-col flex-1 justify-between">
                  <div><h3 className="font-bold text-lg leading-tight mb-2 truncate uppercase">{project.name}</h3><div className="flex items-center gap-2 mb-4"><span className="text-[10px] font-bold text-white bg-black px-1.5 py-0.5">GIT</span><span className="text-[10px] font-mono text-gray-500 truncate" title={project.id}>{project.id.substring(0, 8)}...</span></div></div>
                  <div className="pt-4 border-t border-gray-100 flex justify-between items-center"><span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 group-hover:text-black transition-colors">Open Project &rarr;</span>{project.sync_status === 'error' && (<AlertCircle size={14} className="text-red-500" />)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      <footer className="mt-24 border-t border-black bg-white py-12 text-center"><p className="text-[10px] uppercase tracking-[0.3em] text-gray-400 font-bold">KiCAD Database Interface • V1.0.0 • Localhost</p></footer>
    </div>
  );
}