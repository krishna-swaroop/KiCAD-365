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

            // Define the specific folders to display in the desired order
            const orderedFolders = ['docs', 'Design-Outputs', 'Manufacturing-Outputs', 'simulation'];

            // Generate tabs based on the ordered list, only including those present in the data
            const dynamicTabs = orderedFolders
                .filter(key => data[key])
                .map(key => ({
                    id: key,
                    label: key.replace(/_/g, ' ').replace(/-/g, ' '),
                    icon: getIconForName(key),
                    hasItems: data[key] && data[key].length > 0
                }));

            setTabs(dynamicTabs);
            setProjectFiles(data);

            // Don't auto-select a tab - let Engineering View be the default
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

    // For now, set URLs to null - will implement proper detection later
    const model3DUrl = null;
    const schematicPdfUrl = null;
    const pcbLayoutPdfUrl = null;

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
                            schematicUrl={schematicPdfUrl}
                            pcbUrl={pcbLayoutPdfUrl}
                            model3DUrl={model3DUrl}
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
