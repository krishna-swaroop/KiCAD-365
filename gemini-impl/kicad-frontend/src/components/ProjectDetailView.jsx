import React, { useState, useEffect, useCallback } from 'react';
import { ProjectHeader } from './ProjectHeader';
import { ProjectSidebar } from './ProjectSidebar';
import { EngineeringView } from './EngineeringView';
import { FileBrowserView } from './FileBrowserView';
import { PreviewModal } from './viewers';
import { Toast } from './ui';
import { getIconForName } from '../utils';

const API_BASE = `http://${window.location.hostname}:8000/api`;

export const ProjectDetailView = ({ project, onBack }) => {
    const [projectFiles, setProjectFiles] = useState({});
    const [activeTab, setActiveTab] = useState(null);
    const [tabs, setTabs] = useState([]);
    const [isSyncing, setIsSyncing] = useState(false);
    const [previewFile, setPreviewFile] = useState(null);
    const [toast, setToast] = useState(null);

    const loadProjectDetails = useCallback(async () => {
        setProjectFiles({});
        setTabs([]);
        try {
            const res = await fetch(`${API_BASE}/projects/${project.id}/tree`);
            if (!res.ok) throw new Error("Failed to load project files");
            const data = await res.json();

            // Static side tabs for JTYU-OBC project (Engineering View handled separately)
            const staticTabs = [
                // Engineering View is the default when activeTab is null, so we omit it here
                { id: 'docs', label: 'Docs', icon: getIconForName('docs') },
                { id: 'design_outputs', label: 'Design Outputs', icon: getIconForName('design_outputs') },
                { id: 'manufacturing_outputs', label: 'Manufacturing Outputs', icon: getIconForName('manufacturing_outputs') },
                { id: 'simulation', label: 'Simulation', icon: getIconForName('simulation') },
            ];
            setTabs(staticTabs);

            // Keep project files for file discovery
            setProjectFiles(data);

            // Do NOT auto-select any schematic or PCB file – let user choose
            // (selectedSchematic and selectedPcb remain null initially)

        } catch (err) {
            setToast({ type: 'error', message: "Could not load file structure" });
        }
    }, [project.id]);

    const handleSyncAndBuild = async () => {
        setIsSyncing(true);
        try {
            const res = await fetch(`${API_BASE}/projects/${project.id}/build`, { method: 'POST' });
            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.detail || "Build failed");
            }
            await loadProjectDetails();
            setToast({ type: 'success', message: 'Sync & Jobset Execution Complete' });
        } catch (err) {
            setToast({ type: 'error', message: err.message });
        } finally {
            setIsSyncing(false);
        }
    };

    const handlePreview = async (filePath) => {
        const url = `${API_BASE}/projects/${project.id}/file/${filePath}`;
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

    useEffect(() => {
        loadProjectDetails();
    }, [loadProjectDetails]);

    // Helper to collect files of a given extension anywhere in the project tree
    const collectFilesByExtension = (tree, extension) => {
        const results = [];
        const walk = (node) => {
            if (Array.isArray(node)) {
                node.forEach(item => {
                    if (item.type === 'file' && item.name && item.name.endsWith(extension)) {
                        results.push({ name: item.name, path: item.path });
                    } else if (item.type === 'directory' && item.children) {
                        walk(item.children);
                    }
                });
            } else if (node && typeof node === 'object') {
                // When node is the top-level object mapping folder names to arrays
                Object.values(node).forEach(child => walk(child));
            }
        };
        walk(tree);
        return results;
    };

    // Gather schematic and PCB files
    const schematicFiles = collectFilesByExtension(projectFiles, '.kicad_sch');
    const pcbFiles = collectFilesByExtension(projectFiles, '.kicad_pcb');

    // Selection state (default to null, user must pick)
    const [selectedSchematic, setSelectedSchematic] = useState(null);
    const [selectedPcb, setSelectedPcb] = useState(null);

    // No auto-select effect – user chooses file via dropdown


    const schematicUrl = selectedSchematic ? `${API_BASE}/projects/${project.id}/file/${selectedSchematic}` : null;
    const pcbUrl = selectedPcb ? `${API_BASE}/projects/${project.id}/file/${selectedPcb}` : null;

    // For now, set 3D model URL to null - will implement later
    const model3DUrl = null;

    return (
        <div className="min-h-screen bg-[#F4F4F4] text-black flex flex-col font-mono selection:bg-black selection:text-white">
            <ProjectHeader
                project={project}
                onBack={onBack}
                onSyncAndBuild={handleSyncAndBuild}
                isSyncing={isSyncing}
            />

            <div className="flex flex-1 overflow-hidden">
                <ProjectSidebar
                    tabs={tabs}
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                />

                <main className="flex-1 overflow-hidden bg-[#F4F4F4]">
                    {activeTab ? (
                        <FileBrowserView
                            activeTab={activeTab}
                            tabs={tabs}
                            projectFiles={projectFiles}
                            onPreview={handlePreview}
                            projectId={project.id}
                        />
                    ) : (
                        <EngineeringView
                            projectName={project.name}
                            schematicUrl={schematicUrl}
                            pcbUrl={pcbUrl}
                            model3DUrl={model3DUrl}
                            schematicPath={selectedSchematic}
                            pcbPath={selectedPcb}
                            schematicFiles={schematicFiles}
                            pcbFiles={pcbFiles}
                            setSelectedSchematic={setSelectedSchematic}
                            setSelectedPcb={setSelectedPcb}
                        />
                    )}
                </main>
            </div>

            {previewFile && (
                <PreviewModal
                    file={previewFile}
                    onClose={() => setPreviewFile(null)}
                    baseFileUrl={`${API_BASE}/projects/${project.id}/file`}
                />
            )}
            {toast && <Toast {...toast} onClose={() => setToast(null)} />}
        </div>
    );
};
